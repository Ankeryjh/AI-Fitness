class HttpError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const sendSuccess = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    ok: true,
    data,
  });
};

module.exports = {
  HttpError,
  asyncHandler,
  sendSuccess,
};
