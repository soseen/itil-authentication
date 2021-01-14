const Sequelize = require('sequelize');
const db = require('./database');

const User = db.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true
    },
    username: {
        type: Sequelize.STRING
    },
    password: {
        type: Sequelize.STRING
    },
    role: {
        type: Sequelize.STRING
    },
    team: {
        type: Sequelize.INTEGER
    },
});

// User.sync().then(() => {
//     console.log('table created');
//   })

User.sync().then(() => {
    console.log('Table created');
})

module.exports = User;