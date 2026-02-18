const {ZodError} = require('zod');
const {HttpError} = require('../utils/http');

const notFoundHandler = (_req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      message: 'Route not found',
    },
  });
};

const errorHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: {
        message: 'Invalid request payload',
        details: error.flatten(),
      },
    });
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      ok: false,
      error: {
        message: error.message,
        details: error.details,
      },
    });
  }

  console.error('[UNHANDLED_ERROR]', error);
  return res.status(500).json({
    ok: false,
    error: {
      message: 'Internal server error',
    },
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
