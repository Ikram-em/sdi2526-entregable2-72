const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Space",
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
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["ACTIVA", "CANCELADA"],
      default: "ACTIVA",
      required: true
    }
  },
  {
    timestamps: true
  }
);

reservationSchema.index({ space: 1, startAt: 1, endAt: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);
