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
}, {
    freezeTableName: true
})

module.exports = User;