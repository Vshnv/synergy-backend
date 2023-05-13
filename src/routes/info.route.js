var ChatGPTAPI = null
var api = null
import('chatgpt').then((cgpt) => {
    ChatGPTAPI = cgpt.ChatGPTUnofficialProxyAPI
    api = new ChatGPTAPI({
        accessToken: process.env.OPENAI_API_KEY,
        apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation'
    })
})
const fs = require('fs')
const Contacts = require('../models/contacts.model')

const prompt = fs.readFileSync('./res/prompt/safety_score.txt','utf8')

const express = require('express')
const router = express.Router()

router.post("/location_safety_index", (async (req, res, next) => {
    const latitude = req.body.latitude
    const longitude = req.body.longitude
    const chatGptResult = await api.sendMessage(
        prompt
            .replace("\{\@Longitude\}", longitude)
            .replace("\{\@Latitude\}", latitude)
    )
    const result = JSON.parse(chatGptResult.text)
    const safetyScore = result["safety_score"]
    return res.status(200).json(safetyScore)
}));

router.post("/contacts", (async (req, res, next) => {
    const username = req.user.username
    const addedContacts = await Contacts.findAll({
        where: {
            username: username
        }
    })
    console.log(addedContacts)
    return res.status(200).json(addedContacts)
}));

router.post("/contacts/add", (async (req, res, next) => {
    const username = req.user.username
    const name = req.body.name
    const number = req.body.number
    await Contacts.create({
        username: username,
        contact_name: name,
        contact_number: number
    })
    return res.status(200).json("Added contact!")
}));

router.post("/contacts/delete", (async (req, res, next) => {
    const username = req.user.username
    const name = req.body.name
    const number = req.body.number
    await Contacts.destroy({
        where: {
            username: username,
            contact_name: name,
            contact_number: number
        }
    })
    return res.status(200).json(addedContacts)
}));

module.exports = router