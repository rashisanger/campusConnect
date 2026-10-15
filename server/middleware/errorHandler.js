function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, _req, res, _next) {
  let statusCode = error.statusCode || 500;
  let message = error.message;
  let errors = error.errors;

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Please correct the highlighted fields.';
    errors = Object.entries(error.errors).map(([field, item]) => ({
      field,
      message: item.message
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'A supplied identifier or value is invalid.';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = 'A record with those unique values already exists.';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  const response = { message: statusCode >= 500 ? 'An unexpected server error occurred.' : message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
}

module.exports = { notFound, errorHandler };
