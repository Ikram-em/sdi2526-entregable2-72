function json(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function sendError(res, statusCode, code, message, details) {
  return json(res, statusCode, {
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  });
}

module.exports = {
  json,
  sendError
};
