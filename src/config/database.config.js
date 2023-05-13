const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('sqlite::memory:', {
    sync: true
});

module.exports = sequelize