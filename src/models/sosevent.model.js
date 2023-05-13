const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database.config')

const SosEvent = sequelize.define('SosEvent', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: DataTypes.STRING,
    timestamp: DataTypes.BIGINT,
    locations: DataTypes.STRING,
    active: DataTypes.BOOLEAN
});

const SosCallLog = sequelize.define('SosCallLog', {
    sos_id: DataTypes.INTEGER,
    phone_number: DataTypes.STRING
});

sequelize.sync()

module.exports = {
    sos_event: SosEvent,
    sos_call_log: SosCallLog
}