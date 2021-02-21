if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

const db = require('./models');
const app = express();

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3000/itil-events'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

const checkIfUserSubscribed = (subscriptions) => {
    const CURRENT_DATE = new Date().toISOString().slice(0, 10);
    if(subscriptions){
        let subscriptionActive = subscriptions.reduce((activeSubscriptionDetails, subscription) => {
            if(subscription.endDate > CURRENT_DATE){
                activeSubscriptionDetails = {endDate: subscription.endDate, active: true}
            }
            return activeSubscriptionDetails;
        }, {endDate: null, active: false} )
        return subscriptionActive
    } else {
        return {endDate: null, active: false}
    }
}

app.use(
    session({
      key: "user",
      secret: "event-management",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
          checkPeriod: 86400000
      }),
      cookie: {
        expires: 60 * 60 * 24,
        maxAge: 86400000,
        SameSite: 'Strict'
      },
    })
  );

  db.sequelize.sync().then(() => {
    app.listen(8000, () => {
        console.log('server running...')
    })
})

//REJESTRACJA
app.post('/userCreate', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    const team = req.body.team;

    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = await db.User.create({
            username: username,
            password: hashedPassword,
            role: role,
            team: team
        })
        if(role === "system"){
            await db.Subscription.create({
                name: "infinite",
                endDate: "9999-01-01",
                UserId: user.get({plain: true}).id
            })
        }
        res.status(201).send({message: "Successfully registered"})
    } catch (error) {
        res.send({message: "Username already exists"});
        console.log(error)
    }
})

app.delete('/users/:id', async (req, res) => {
    db.User.destroy({
        where: {id: req.params.id}
    })
    .then(res.status(202).send('Sucessfully deleted user and his subscriptions'))
    .catch(err => console.log(err));
})

//LOGOWANIE
app.post('/user', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const user = await db.User.findAll({
            where: {
              username: username
            }
        });
        if(user && user.length > 0) {
            await bcrypt.compare(password, user[0].get({plain: true}).password, (error, response) => {
                if(response) {
                        db.User.findAll({
                            where: {
                                username: username
                            },
                            include: [db.Subscription]
                        }).then(response => {

                            const subscriptionActive = checkIfUserSubscribed(response[0].Subscriptions)
                            const loggedUser = {
                                id: response[0].id,
                                username: response[0].username,
                                role: response[0].role,
                                team: response[0].team,
                                Subscriptions: response[0].Subscriptions,
                                subscriptionActive: subscriptionActive
                            }
                            req.session.user = loggedUser;
                            res.send({message: 'User Authenticated', isLoggedIn: true, user: loggedUser});
                        }).catch(err => console.log(err))

                } else {
                    res.send({ message: "Invalid Password", isLoggedIn: false});
                }
            });
        } else {
            res.send({message: "Invalid Username", isLoggedIn: false});
        }

    } catch (error) {
        res.send({message: "Invalid Username", isLoggedIn: false});
        console.log(error)
    }
   
})

//SESJA
app.get('/user', async (req, res) => {
        if(req.session.user) {
            res.send({isLoggedIn: true, user: req.session.user})
        } else {
            res.send({isLoggedIn: false})
        }
    
})

app.get('/users', (req, res) => {
    db.User.findAll({
        include: [db.Subscription]
    }).then(users => res.send(users));
})

//SUBSKRYPCJA
app.post('/subscriptions', (req, res) => {
    db.Subscription.create({
        name: req.body.name,
        UserId: req.body.UserId,
        endDate: req.body.endDate
    }).then(newSubscription => res.send(newSubscription))
    .catch(err => console.log(err))
})

app.get('/subscriptions/:id', (req, res) => {
        db.Subscription.findAll({
            where: {id: req.params.id},
            include: [db.User]
        }).then(susbscriptions => res.send(susbscriptions))
        .catch(err => {
            console.log(err);
            res.send("UserId doesn't exist")
        })    
})


//WYLOGOWANIE
app.get('/logout', (req, res) => {
    req.session.destroy();
    const cookie = req.cookies
    for (var prop in cookie) {
        if (!cookie.hasOwnProperty(prop)) {
            continue;
        }    
        res.cookie(prop, '', {expires: new Date(0)});
    }
    res.status(200).send({message: 'User logged out'})
})

//PLATNOSC
app.post('/payment', (req, res) => {

    const {product, token} = req.body;
    const idempotencyKey = uuidv4();
    console.log(product)
    let endDate = new Date()
    endDate.setDate(endDate.getDate() + product.duration);
    endDate = endDate.toISOString().slice(0,10);

    return stripe.customers.create({
        email: token.email,
        source: token.id
    }).then(customer => {
        stripe.charges.create({
            amount: product.price * 100,
            currency: 'usd',
            customer: customer.id
        }, {idempotencyKey})
    })
    .then(res.status(200).send({paymentSuccess: true, subscription: {
        name: product.name,
        endDate: endDate
    }}))
    .catch(err => {
        console.log(err)
        res.status(400).send({paymentSuccess: false, message: "Payment Failed"})
    })

})
