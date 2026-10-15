const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Please correct the highlighted fields.',
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg }))
    });
  }
  return next();
}

module.exports = validateRequest;
