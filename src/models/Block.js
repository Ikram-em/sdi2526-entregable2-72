const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startAt: {
      type: Date,
      required: true
    },
    endAt: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["ACTIVO", "CANCELADO"],
      default: "ACTIVO",
      required: true
    }
  },
  {
    timestamps: true
  }
);

blockSchema.index({ space: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("Block", blockSchema);
