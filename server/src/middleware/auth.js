const {HttpError} = require('../utils/http');
const {verifyToken} = require('../utils/auth');

const requireAuth = (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Unauthorized: missing Bearer token'));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch (error) {
    return next(new HttpError(401, 'Unauthorized: invalid or expired token'));
  }
};

module.exports = {
  requireAuth,
};
