const mongoose = require("mongoose");
const Reservation = require("../models/Reservation");
const Block = require("../models/Block");

function buildOverlapQuery(startAt, endAt) {
  return {
    startAt: { $lt: endAt },
    endAt: { $gt: startAt }
  };
}

async function findReservationConflicts(spaceId, startAt, endAt, excludeReservationId = null) {
  const query = {
    space: spaceId,
    status: "ACTIVA",
    ...buildOverlapQuery(startAt, endAt)
  };

  if (excludeReservationId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeReservationId) };
  }

  return Reservation.find(query).populate("user", "dni firstName lastName");
}

async function findBlockConflicts(spaceId, startAt, endAt, excludeBlockId = null) {
  const query = {
    space: spaceId,
    status: "ACTIVO",
    ...buildOverlapQuery(startAt, endAt)
  };

  if (excludeBlockId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeBlockId) };
  }

  return Block.find(query);
}

async function getAvailabilityItems(spaceId, from, to) {
  const [reservations, blocks] = await Promise.all([
    Reservation.find({
      space: spaceId,
      status: "ACTIVA",
      ...buildOverlapQuery(from, to)
    }).populate("user", "dni"),
    Block.find({
      space: spaceId,
      status: "ACTIVO",
      ...buildOverlapQuery(from, to)
    })
  ]);

  const reservationItems = reservations.map((reservation) => ({
    id: reservation._id.toString(),
    type: "Reserva",
    startAt: reservation.startAt,
    endAt: reservation.endAt,
    label: `Reserva activa - ${reservation.user.dni}`
  }));

  const blockItems = blocks.map((block) => ({
    id: block._id.toString(),
    type: "Bloqueo",
    startAt: block.startAt,
    endAt: block.endAt,
    label: block.reason
  }));

  return [...reservationItems, ...blockItems].sort((left, right) => left.startAt - right.startAt);
}

module.exports = {
  findBlockConflicts,
  findReservationConflicts,
  getAvailabilityItems
};
