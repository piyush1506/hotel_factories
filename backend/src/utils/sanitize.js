function pick(source, allowed) {
  return allowed.reduce((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source || {}, key)) result[key] = source[key];
    return result;
  }, {});
}

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

module.exports = { pick, httpError };
