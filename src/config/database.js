const mongoose = require("mongoose");

const defaultUri = "mongodb://127.0.0.1:27017/sdi2526-entrega2-72";

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || defaultUri;
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  return uri;
}

module.exports = {
  connectDatabase,
  defaultUri
};
