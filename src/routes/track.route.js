const express = require('express')
const router = express.Router()
const Ping = require('../models/ping.model')

const {IP2Location} = require("ip2location-nodejs");
const ip2Location = new IP2Location()

router.post("/ping", (async (req, res, next) => {
    const lat = req.body.latitude
    const long = req.body.longitude
    const time = Math.round(Date.now() / 1000)
    const locationData = {
        username: req.user.username,
        latitude: lat,
        longitude: long,
        timestamp: time,
        ip: req.ip
    }
    await Ping.create({
        username: req.user.username,
        latitude: lat,
        longitude: long,
        timestamp: time,
        ip: req.ip
    })
    res.status(200).json({
        message: "Ping Successful"
    })
}))

module.exports = router