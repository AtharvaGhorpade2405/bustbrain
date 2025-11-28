const User = require("../models/User");

async function requireAuth(req, res, next) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).send("Login required");

  const user = await User.findById(userId);
  if (!user) return res.status(401).send("Invalid user");

  req.user = user;
  next();
}

module.exports = requireAuth;
