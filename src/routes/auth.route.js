const {DataTypes} = require("sequelize");

const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/user.model')

const SALT_ROUNDS = 10

// Registration End-point
router.post("/register", (async (req, res, next) => {
    const username = req.body.username

    if (await doesUserExist(username)) {
        return res.status(409).json({
            message: "User Already Exists!"
        })
    }

    const email = req.body.email

    if (await isEmailUsed(email)) {
        return res.status(409).json({
            message: "Email already used to create an account!"
        })
    }

    const phoneNumber = req.body.phone_number

    if (await isPhoneUsed(phoneNumber)) {
        return res.status(409).json({
            message: "Phone number already used to create an account!"
        })
    }

    const password = req.body.password
    const name = req.body.name
    bcrypt.hash(password, SALT_ROUNDS, async (err, hash) => {
        await User.create({
            username: username,
            password_hash: hash,
            name: name,
            email: email,
            phone_no: phoneNumber
        })
        res.status(200).json({
            message: "Account created!"
        })
    })
}))

router.post("/refresh", ((req, res, next) => {
    const refreshToken = req.body.token
    if (refreshToken == null) {
        return req.sendStatus(401)
    }
    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const accessToken = generateAccessToken(user, '10m')
        res.json({
            access_token: accessToken,
        })
    })
}))

router.post("/login", (async (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    if (!await isUserValid(username, password)) {
        return res.sendStatus(401)
    }
    const jwtUser = {
        username: username
    }
    const accessToken = generateAccessToken(jwtUser, '10m')
    const refreshToken = jwt.sign(jwtUser, process.env.REFRESH_SECRET)
    res.json({
        access_token: accessToken,
        refresh_token: refreshToken
    })
}))

function authenticateToken(req, res, next) {
    const bearer = req.headers["authorization"]
    const token = bearer && bearer.split(' ')[1]
    if (token == null) {
        return res.sendStatus(401)
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        req.user = user
        next()
    })
}

function generateAccessToken(user, expiry) {
    return jwt.sign(user, process.env.JWT_SECRET, {expiresIn: expiry})
}

async function isUserValid(username, password) {
    const userRows = (await User.findOne({
        where: {
            username: username
        }
    }))
    if (userRows == null) {
        return false
    }
    const user = userRows.dataValues
    console.log("isUserValid", user)
    if (user == null) return false
    return await new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password_hash, function(err, res) {
            console.log("isUserValidHash", res === true)
            resolve(res === true)
        })
    })
}

async function doesUserExist(username) {
    const user = (await User.findOne({
        where: {
            username: username
        }
    }))
    console.log("TEstTEST", user)
    return user != null
}

async function isEmailUsed(email) {
    return (await User.findOne({
        where: {
            email: email
        }
    })) != null
}

async function isPhoneUsed(phone) {
    return (await User.findOne({
        where: {
            phone_no: phone
        }
    })) != null
}


module.exports = {
    router: router,
    authMiddleware: authenticateToken
}