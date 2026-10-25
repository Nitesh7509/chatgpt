const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
         required: true

    },
    chat:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"chat"
    },
    content:{
        type:String,
        require:true
    },
    role:{
        type:String,
        enum:["user","model"],
        default:"user"
    }
},{timestamps:true})
const messagemodel = mongoose.model("message",messageSchema)
module.exports =messagemodel