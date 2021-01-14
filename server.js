const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const db = require('./database');
const User = require('./User');

db.authenticate()
    .then(() => console.log('Database connected'))
    .catch(error => console.log(error))

const app = express();

app.use(express.json());
app.use(cors());


app.post('/users', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role;
    const team = req.body.team;
    const id = uuidv4();

    console.log([id, username, password, role, team]);


    try {
        const salt = await bcrypt.genSalt();
        console.log('gituwa')
        const hashedPassword = await bcrypt.hash(password, salt)
        console.log('gituwa123')
        const user = await User.create({
            id: 350,
            username: username,
            password: hashedPassword,
            role: role,
            team: team
        })
        console.log('gituwa1234')
        // user.redirect('/users')
        console.log(user);
        res.status(201).send()
    } catch (error) {
        console.log(error)
    }

})

// app.post("/users", (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;

//     pool.query(
//         "SELECT * FROM user WHERE username = ?;",
//         username,
//         (err, result) => {
//             if (err) {
//                 res.send({ err: err});
//             }

//             if(result.length > 0) {
//                 bcrypt.compare(password, result[0].password, (error, response) => {
//                     if(response){
//                         res.send(result)
//                     } else {
//                         res.send({ message: "Invalid username/password"})
//                     }
//                 })
//             } else {
//                 res.send({ message: "User doesn't exist"})
//             }
//             pool.end() 
//         }
//     )

// })




app.listen(8000, () => {
    console.log('server running...')
})