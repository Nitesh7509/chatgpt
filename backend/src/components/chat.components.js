const chatmodel = require("../models/chatmodel");

const createchat = async (req, res) => {
  const { title } = req.body;
  const user = req.user;
  const chats = await chatmodel.create({
    title,
    user: user.id,
  });
 return res.status(201).send({
    message:"chat is created",
    chats: {
      id: chats.id,
      user: user.id,
      lastactive: chats.lastactive,
    },
  });
};
module.exports = createchat;
