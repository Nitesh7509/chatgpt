
const jwt = require("jsonwebtoken");

const authmiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Please login or register"
      });
    }

    const decode = jwt.verify(
      token,
      process.env.JWT_SCERET
    );

    req.user = decode;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

module.exports = authmiddleware;
