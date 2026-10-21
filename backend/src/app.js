const express = require("express")
const  authroute  = require("./routes/user.routes")
const chatroute = require("./routes/chat.routes")
const cookiesparser = require("cookie-parser")
const app = express()


app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cookiesparser())

app.use("/user",authroute)
app.use("/chat",chatroute)
module.exports = app