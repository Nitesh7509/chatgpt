const express = require("express")
const { register } = require("../components/user.components")
const route = express.Router()

route.post("/register",register)

module.exports = route