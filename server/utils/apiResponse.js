const success = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    ...data
  });
};

const created = (res, data = {}) => {
  return success(res, data, 201);
};

const error = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
  const payload = {
    success: false,
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  success,
  created,
  error
};