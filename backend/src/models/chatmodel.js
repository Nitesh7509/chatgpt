const mongoose = require("mongoose")
const chatSchema = new  mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    lastactive: {
        type: Date,
        default: Date.now
    }

},{timestamps:true})

const chatmodel = mongoose.model("chat",chatSchema)
module.exports = chatmodel