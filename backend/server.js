require("dotenv").config()
const app = require("./src/app")
const connectedDB = require("./src/database/db.js")

connectedDB()



app.listen(process.env.PORT,()=>{
    console.log("server is connected")
})



