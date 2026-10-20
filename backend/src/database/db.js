const mongoose = require("mongoose")

const connectedDB = async ()=>{
    try {
       await mongoose.connect(process.env.MONGO_URL)
        console.log("connected database ")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectedDB