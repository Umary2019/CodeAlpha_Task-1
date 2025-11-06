const { validationResult } = require('express-validator');

// Validation result handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Custom validators
const validateObjectId = (value) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    throw new Error('Invalid ID format');
  }
  return true;
};

module.exports = {
  handleValidationErrors,
  validateObjectId
};