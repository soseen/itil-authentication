const Sequelize = require('sequelize')

module.exports = new Sequelize('itil-events', 'postgres', 'sa', {
    host: 'localhost',
    dialect: 'postgres',
    operatorsAliases: 0,
    port: 3001,

    pool: {
        max: 5,
        min: 0,
        acquire: 3000,
        idle: 10000
    }
});