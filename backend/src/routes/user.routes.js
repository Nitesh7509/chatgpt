const express = require("express")
const { register,login,profile } = require("../components/user.components")
const authmiddleware = require("../middlewares/authmiddleware")
const route = express.Router()

route.post("/register",register)
route.post("/login",login)
route.get("/profile",authmiddleware,profile)

module.exports = route