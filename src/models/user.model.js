const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database.config')

const User = sequelize.define('User', {
    username: DataTypes.STRING,
    password_hash: DataTypes.STRING,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    phone_no: DataTypes.STRING
});

sequelize.sync()

module.exports = User