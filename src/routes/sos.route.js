const express = require('express')
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
    }
});

const router = express.Router()
const SosObjects = require('../models/sosevent.model')
const SosEvents = SosObjects.sos_event
const SosCallLogs = SosObjects.sos_call_log
const Contacts = require('../models/contacts.model')
const Pings = require('../models/ping.model')
const Users = require('../models/user.model')

const sequelize = require("../config/database.config");
const {Op} = require("sequelize");
const delay = time => new Promise(res => setTimeout(res, time));

router.post("/start", (async (req, res, next) => {
    const username = req.user.username
    const pings = (await Pings.findAll({
        where: {
            username: username
        },
        order: [
            ['timestamp', 'DESC']
        ]
    })).map((ping) => ping.dataValues)
    const locations = pings.map((ping) => ping.latitude + "," + ping.longitude).join(";")
    const time = Math.round(Date.now() / 1000)
    let event = SosEvents.findOne({
        where: {
            username: username,
            active: true
        }
    })
    if (event == null) {
        event = await SosEvents.create({
            username: username,
            timestamp: time,
            locations: locations,
            active: true
        })
    }
    return res.status(200).json({
        id: event.id
    })
}));

router.post("/end", (async (req, res, next) => {
    const username = req.user.username
    const sosId = req.body.sos_id
    await SosEvents.update(
        {active: false},
        {
            where: {
                id: sosId,
                username: username
            }
        }
    )
    return res.status(200).json({
        id: event.id
    })
}));

router.post("/fetch_active", (async (req, res, next) => {
    const username = req.user.username
    const activeEvent = await SosEvents.findOne({
        where: {
            username: username,
            active: true
        }
    })
    return res.status(200).json({
        id: activeEvent?.id
    })
}));

router.post("/recent", (async (req, res, next) => {
    const username = req.user.username
    const user = await Users.findOne({
        where: {
            username: username
        }
    })
    const number = user.phone_no
    const callLogs = await SosCallLogs.findAll({
        where: {
            phone_number: number
        }
    })
    const callSosIds = [...new Set(callLogs.map((soslog) => soslog.sos_id))]
    const callEvents = await SosEvents.findAll({
        where: {
            id: {
                [Op.in]: callSosIds
            }
        },
        order: [
            ['timestamp', 'DESC']
        ]
    })
    return res.status(200).json(callEvents)
}));

router.post("/alert_contacts", (async (req, res, next) => {
    const username = req.user.username
    const sosId = req.body.sos_id
    const addedContacts = await Contacts.findAll({
        where: {
            username: username
        }
    })
    if (addedContacts.length < 1) {
        return res.status(200).json()
    }
    const pings = (await Pings.findAll({
        where: {
            username: username
        },
        order: [
            ['timestamp', 'DESC']
        ]
    })).map((ping) => ping.dataValues)
    const numbers = addedContacts.map((contact) => contact.dataValues.contact_number)
    await sendAlert(username, numbers, pings)
    if (addedContacts.length > 0) {
        await SosCallLogs.bulkCreate(numbers.map((no) => ({
            sos_id: sosId,
            username: username
        })))
    }
    return res.status(200).json()
}));


async function sendAlert(username, numbers, locations) {
    const message =
        "TO: " + JSON.stringify(numbers) + "\n" +
        "SOS! " + username + "\n" +
        "Last Ping Locations\n" +
        locations.slice(0, 10).map((loc) => loc.latitude + ", " + loc.longitude + " | " + loc.timestamp).join("\n")
    //const options = {authorization : process.env.FAST2SMS_API_KEY , message : message ,  numbers : numbers}
    await transporter.sendMail({
        from: 'synergy23team@gmail.com',
        to: 'synergy23team@gmail.com',
        subject: 'SOS Alert - ' + username,
        text: message
    });
}

async function sendEmergencyServicesCall(username, locations) {
    const message =
        "Requesting EMERGENCY SERVICES!\n" +
        "User's prior locations in descending order\n" +
        locations.slice(0, 10).map((loc) => loc.latitude + ", " + loc.longitude + " | " + loc.timestamp).join("\n")
    //const options = {authorization : process.env.FAST2SMS_API_KEY , message : message ,  numbers : numbers}
    await transporter.sendMail({
        from: 'synergy23team@gmail.com',
        to: 'synergy23team@gmail.com',
        subject: 'SOS Alert - ' + username,
        text: message
    });
}

router.post("/alert_emergency_services", (async (req, res, next) => {
    const username = req.user.username
    const pings = (await Pings.findAll({
        where: {
            username: username
        },
        order: [
            ['timestamp', 'DESC']
        ]
    })).map((ping) => ping.dataValues)
    await sendEmergencyServicesCall(username, pings)
    return res.status(200).json()
}));

router.post("/alert_nearby_users", (async (req, res, next) => {
    const username = req.user.username
    const sosId = req.body.sos_id
    let latitude = req.body.latitude
    let longitude = req.body.longitude
    if (latitude === undefined || longitude === undefined) {
        const lastPing = await Pings.findOne({
            where: {
                username: username
            },
            order: [
                ['timestamp', 'DESC']
            ]
        })
        if (lastPing != null) {
            latitude = latitude ?? lastPing.latitude
            longitude = longitude ?? lastPing.longitude
        }
    }

    const pings = await Pings.findAll({
        group: "username",
        attributes: [
            "id"
                [sequelize.fn("max", sequelize.col('timestamp')), 'timestamp']
        ]
    }).then(async (results) => {
        let ids = results.map(result => {
            return result.id;
        });

        return await Pings.findAll({
            where: {
                id: {
                    [Op.in]: ids
                }
            }
        })
    });
    let nearbyPings = []
    if (latitude != null && longitude != null) {
        nearbyPings = pings.filter((ping) => {
            let distance = geodistance(ping, latitude, longitude)
            return distance < 10 && ping.username !== username
        })
    }
    let nearbyUserNames = nearbyPings.map((ping) => ping.username)
    let users = await Users.findAll({
        where: {
            username: {
                [Op.in]: nearbyUserNames
            }
        }
    })
    let numbers = users.map((user) => user.phone_no)
    if (numbers.length > 0) {
        await SosCallLogs.bulkCreate(numbers.map((no) => ({
            sos_id: sosId,
            username: username
        })))
    }
    const userPings = (await Pings.findAll({
        where: {
            username: username
        },
        order: [
            ['timestamp', 'DESC']
        ]
    })).map((ping) => ping.dataValues)
    await sendAlert(username, numbers, userPings)
    return res.status(200).json()
}));

function geodistance(pingPointA, lat2, lon2) {
    let lat1 = pingPointA.latitude
    let lon1 = pingPointA.longitude
    const R = 6371e3;
    const f1 = lat1 * Math.PI / 180;
    const f2 = lat2 * Math.PI / 180;
    const ds = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(ds / 2) * Math.sin(ds / 2) +
        Math.cos(f1) * Math.cos(f2) *
        Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d / 1000.0
}

module.exports = router


