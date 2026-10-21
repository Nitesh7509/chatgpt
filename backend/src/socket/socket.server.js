const { Server } = require("socket.io")
const cookie = require("cookie");
const jwt = require("jsonwebtoken")
const usermodel = require("../models/usermodel")
const {generateResponse} = require("../service/ai.service")

const connectedserver = (httpserver) => {
    const io = new Server(httpserver, {})
    io.use(async (socket, next) => {
        const cookies = cookie.parseCookie(socket.handshake.headers?.cookie || "");
        if (!cookies.token) {
           return next(new Error("authentication error : token is not provide"))
        }
        try {
            const decode = jwt.verify(cookies.token, process.env.JWT_SCERET)
            const user = await usermodel.findById(decode.id)
            socket.user = user
            next()
        } catch (error) {
            next(new Error("authentication error : token is not correct"))
        }

    })
    io.on("connection", (socket) => {
        

        socket.on("ai-message",async(messageplayload)=>{
            const response = await generateResponse(messageplayload.content)
             console.log(response)
            socket.emit("ai-respose",{
              content:response,
              chat:messageplayload?.chat
            })

        })
    });
}
module.exports = connectedserver