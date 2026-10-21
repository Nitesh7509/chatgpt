const userModel = require(".././models/usermodel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { email, name, password } = req.body;
  const user = await userModel.findOne({
    email: email.trim().toLowerCase(),
  });
  if (user) {
    return res.status(404).send({
      message: "user is already register",
    });
  }
  const hashpassword = await bcrypt.hash(password, 10);
  const users = await userModel.create({
    email,
    password: hashpassword,
    name,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SCERET, {
    expiresIn: "2d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 24 * 60 * 60 * 1000
  });
  res.status(201).send({
    message: "user is register",
    users,
  });
};
const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({
    email: email.trim().toLowerCase(),
  });
  if (!user) {
    return res.status(404).send({
      message: "user is not register",
    });
  }
  const comparepassword = await bcrypt.compare(password, user.password);
  if (!comparepassword) {
    return res.status(404).send({
      message: "email & password are invaild",
    });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SCERET, {
    expiresIn: "2d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 2 * 24 * 60 * 60 * 1000
  });
  res.status(201).send({
    message: "user is login",
    user,
  });
};
const profile = async (req, res) => {
  res.status(200).json({
    message: "Hello",
    user: req.user
  });
};


module.exports = { register, login, profile };
