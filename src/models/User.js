const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    dni: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["admin", "standard"],
      default: "standard",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
