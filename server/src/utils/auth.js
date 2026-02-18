const jwt = require('jsonwebtoken');
const {env} = require('../config');

const signToken = user =>
  jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    env.jwtSecret,
    {expiresIn: '7d'},
  );

const verifyToken = token => jwt.verify(token, env.jwtSecret);

module.exports = {
  signToken,
  verifyToken,
};
