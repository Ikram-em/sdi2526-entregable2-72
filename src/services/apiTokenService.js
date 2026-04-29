const crypto = require("crypto");

const tokens = new Map();

function issueToken(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, userId.toString());
  return token;
}

function getUserIdByToken(token) {
  return tokens.get(token) || null;
}

module.exports = {
  getUserIdByToken,
  issueToken
};
