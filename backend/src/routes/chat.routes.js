const express = require("express")
const authmiddleware = require("../middlewares/authmiddleware")
const createchat = require("../components/chat.components")
const route = express.Router()

route.post("/",authmiddleware,createchat)


module.exports = route