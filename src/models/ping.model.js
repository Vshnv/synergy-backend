const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database.config')

const Ping = sequelize.define('Ping', {
    username: DataTypes.STRING,
    latitude: DataTypes.DOUBLE,
    longitude: DataTypes.DOUBLE,
    timestamp: DataTypes.BIGINT,
    ip: DataTypes.STRING
});

sequelize.sync()

module.exports = Ping