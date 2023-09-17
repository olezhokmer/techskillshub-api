const mongoose = require('mongoose');
const User = require("../models/user.model");

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

module.exports = async (req, res, next) => {
  const authHeader = req.get("Authorization");
  if(authHeader) {
    const token = authHeader.replace("Bearer ", "");

    try {
      const decoded = jwt.verify(token, process.env.tokenSecret);
      const user = await User.findById(decoded._id);
      if (user) {
        req.user = user;
      }
    } catch (error) {
    }
  }

  return next();
}
