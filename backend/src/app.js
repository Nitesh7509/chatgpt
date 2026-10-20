const express = require("express")
const  route  = require("./routes/user.routes")
const app = express()


app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.use("/",route)
module.exports = app