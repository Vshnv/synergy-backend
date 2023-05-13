const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database.config')

const Contact = sequelize.define('Contact', {
    username: DataTypes.STRING,
    contact_name: DataTypes.STRING,
    contact_number: DataTypes.STRING
});

sequelize.sync()

module.exports = Contact