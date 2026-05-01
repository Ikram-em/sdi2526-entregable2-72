const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Space = require("../models/Space");
const Reservation = require("../models/Reservation");
const Block = require("../models/Block");
const { buildDniFromNumber } = require("../utils/validation");

function buildDate(daysFromToday, hour, minute = 0, durationMinutes = 60) {
  const start = new Date();
  start.setSeconds(0, 0);
  start.setDate(start.getDate() + daysFromToday);
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start.getTime() + durationMinutes * 60000);
  return { start, end };
}

async function buildUsers() {
  const standardProfiles = [
    ["Lucia", "Fernandez Suarez"],
    ["Pablo", "Garcia Alonso"],
    ["Nora", "Lopez Vega"],
    ["Sergio", "Martin Diaz"],
    ["Clara", "Iglesias Perez"],
    ["Diego", "Sanchez Coto"],
    ["Ariadna", "Perez Tuero"],
    ["Mateo", "Gonzalez Riestra"],
    ["Sara", "Menendez Prado"],
    ["Daniel", "Ortega Suarez"],
    ["Leire", "Diaz Granda"],
    ["Mario", "Suarez Pumar"],
    ["Alba", "Vega Cabal"],
    ["Irene", "Alonso Arias"],
    ["Javier", "Crespo Blanco"]
  ];

  const adminHash = await bcrypt.hash("@Dm1n1str@D0r", 10);
  const users = [
    {
      dni: "12345678Z",
      firstName: "Admin",
      lastName: "Sistema",
      passwordHash: adminHash,
      role: "admin"
    }
  ];

  for (let index = 0; index < standardProfiles.length; index += 1) {
    const [firstName, lastName] = standardProfiles[index];
    const dni = buildDniFromNumber(10000001 + index);
    const passwordHash = await bcrypt.hash(`Us3r@${index + 1}-PASSW`, 10);

    users.push({
      dni,
      firstName,
      lastName,
      passwordHash,
      role: "standard"
    });
  }

  return users;
}

function buildSpaces() {
  return [
    {
      name: "Sala Naranco",
      type: "Sala de reuniones",
      location: "Edificio A, Planta 1",
      capacity: 8,
      active: true,
      description: "Sala pensada para reuniones cortas con equipo híbrido.",
      amenities: ["Pantalla 4K", "Videoconferencia", "Pizarra"]
    },
    {
      name: "Aula Covadonga",
      type: "Aula",
      location: "Edificio B, Planta 2",
      capacity: 24,
      active: true,
      description: "Aula con proyector, audio y distribución flexible.",
      amenities: ["Proyector", "Audio", "Mesas moviles"]
    },
    {
      name: "Cowork Costa Verde",
      type: "Coworking",
      location: "Edificio C, Zona abierta",
      capacity: 12,
      active: true,
      description: "Zona silenciosa para trabajo individual o pequeños equipos.",
      amenities: ["Taquillas", "Wifi 6", "Impresora"]
    },
    {
      name: "Sala Picos",
      type: "Sala de reuniones",
      location: "Edificio A, Planta 3",
      capacity: 14,
      active: true,
      description: "Sala para reuniones ampliadas y presentaciones internas.",
      amenities: ["Pantalla tactil", "Streaming", "Pizarra"]
    },
    {
      name: "Aula Laboral",
      type: "Aula",
      location: "Edificio D, Planta baja",
      capacity: 32,
      active: true,
      description: "Espacio docente orientado a sesiones grupales.",
      amenities: ["Proyector", "Ordenador docente", "Red cableada"]
    },
    {
      name: "Cowork Puerto",
      type: "Coworking",
      location: "Edificio C, Ala norte",
      capacity: 10,
      active: false,
      description: "Zona de apoyo actualmente fuera de servicio.",
      amenities: ["Wifi 6", "Monitor externo"]
    }
  ];
}

function buildReservations(users, spaces) {
  const activeSpaces = spaces.filter((space) => space.active);
  const standardUsers = users.filter((user) => user.role === "standard");
  const reservations = [];
  let reservationDayOffset = 1;

  standardUsers.forEach((user, userIndex) => {
    for (let slot = 0; slot < 5; slot += 1) {
      const { start, end } = buildDate(reservationDayOffset, 9 + (slot % 4) * 2, 0, 90);
      const space = activeSpaces[(userIndex + slot) % activeSpaces.length];
      const status = slot === 4 && userIndex % 3 === 0 ? "CANCELADA" : "ACTIVA";

      reservations.push({
        user: user._id,
        space: space._id,
        startAt: start,
        endAt: end,
        reason: `Reserva de prueba ${slot + 1} para ${user.firstName}`,
        status
      });

      reservationDayOffset += 1;
    }
  });

  return reservations;
}

function buildGuaranteedNarancoReservation(users, spaces) {
  const space = spaces.find((candidate) => candidate.name === "Sala Naranco" && candidate.active);
  const user = users.find((candidate) => candidate.dni === buildDniFromNumber(10000001));
  if (!space || !user) {
    return null;
  }

  const { start, end } = buildDate(1, 10, 0, 60);
  return {
    user: user._id,
    space: space._id,
    startAt: start,
    endAt: end,
    reason: "Reserva garantizada Sala Naranco",
    status: "ACTIVA"
  };
}

function buildBlocks(adminUser, spaces) {
  const activeSpaces = spaces.filter((space) => space.active);
  const firstBlock = buildDate(2, 17, 0, 120);
  const secondBlock = buildDate(7, 18, 0, 90);
  const cancelledBlock = buildDate(1, 18, 0, 60);

  return [
    {
      space: activeSpaces[0]._id,
      createdBy: adminUser._id,
      startAt: firstBlock.start,
      endAt: firstBlock.end,
      reason: "Mantenimiento del sistema de videoconferencia",
      status: "ACTIVO"
    },
    {
      space: activeSpaces[2]._id,
      createdBy: adminUser._id,
      startAt: secondBlock.start,
      endAt: secondBlock.end,
      reason: "Revisión eléctrica programada",
      status: "ACTIVO"
    },
    {
      space: activeSpaces[1]._id,
      createdBy: adminUser._id,
      startAt: cancelledBlock.start,
      endAt: cancelledBlock.end,
      reason: "Bloqueo histórico cancelado",
      status: "CANCELADO"
    }
  ];
}

async function seedDatabase() {
  const shouldReset = process.env.RESET_DB_ON_START === "true";
  const existingUsers = await User.countDocuments();

  async function resetAndSeed() {
    await Promise.all([
      mongoose.connection.collection("sessions").deleteMany({}),
      Block.deleteMany({}),
      Reservation.deleteMany({}),
      Space.deleteMany({}),
      User.deleteMany({})
    ]);

    const users = await User.insertMany(await buildUsers());
    const spaces = await Space.insertMany(buildSpaces());
    const reservations = buildReservations(users, spaces);
    const adminUser = users.find((user) => user.role === "admin");
    const blocks = buildBlocks(adminUser, spaces);

    await Reservation.insertMany(reservations);
    await Block.insertMany(blocks);
  }

  async function ensureBaselineSeed() {
    // Ensure baseline users/spaces exist (with expected credentials) without deleting existing data.
    const usersSpec = await buildUsers();
    await Promise.all(
      usersSpec.map((spec) =>
        User.updateOne(
          { dni: spec.dni },
          {
            $set: {
              dni: spec.dni,
              firstName: spec.firstName,
              lastName: spec.lastName,
              passwordHash: spec.passwordHash,
              role: spec.role
            }
          },
          { upsert: true }
        )
      )
    );

    const spacesSpec = buildSpaces();
    await Promise.all(
      spacesSpec.map((spec) =>
        Space.updateOne(
          { name: spec.name },
          {
            $set: {
              name: spec.name,
              type: spec.type,
              location: spec.location,
              capacity: spec.capacity,
              active: spec.active,
              description: spec.description,
              amenities: spec.amenities
            }
          },
          { upsert: true }
        )
      )
    );

    // Ensure there's at least some reservations/blocks for overlap tests & admin screens.
    const reservationCount = await Reservation.countDocuments();
    const users = await User.find().lean();
    const spaces = await Space.find().lean();

    if (reservationCount === 0) {
      const reservations = buildReservations(users, spaces);
      await Reservation.insertMany(reservations);
    }

    // Ensure there is at least one ACTIVA reservation for Sala Naranco on day +1
    // so overlap tests are stable even if data existed previously.
    const guaranteed = buildGuaranteedNarancoReservation(users, spaces);
    if (guaranteed) {
      const overlap = await Reservation.countDocuments({
        space: guaranteed.space,
        status: "ACTIVA",
        startAt: { $lt: guaranteed.endAt },
        endAt: { $gt: guaranteed.startAt }
      });
      if (overlap === 0) {
        await Reservation.create(guaranteed);
      }
    }

    // Keep Aula Covadonga free at the time slots used by Selenium block tests.
    // Prueba 19: day +5 10:00-12:00 must allow creating a block.
    // Prueba 20: day +6 10:00-12:00 must allow creating a base block.
    const covadonga = spaces.find((candidate) => candidate.name === "Aula Covadonga");
    if (covadonga) {
      const slot19 = buildDate(5, 10, 0, 120);
      const slot20 = buildDate(6, 10, 0, 180); // cover 10:00-13:00 to avoid any reservation overlap
      await Reservation.updateMany(
        {
          space: covadonga._id,
          status: "ACTIVA",
          $or: [
            { startAt: { $lt: slot19.end }, endAt: { $gt: slot19.start } },
            { startAt: { $lt: slot20.end }, endAt: { $gt: slot20.start } }
          ]
        },
        { $set: { status: "CANCELADA" } }
      );

      // Also cancel any existing ACTIVO blocks in those slots so re-running tests is stable.
      await Block.updateMany(
        {
          space: covadonga._id,
          status: "ACTIVO",
          $or: [
            { startAt: { $lt: slot19.end }, endAt: { $gt: slot19.start } },
            { startAt: { $lt: slot20.end }, endAt: { $gt: slot20.start } }
          ]
        },
        { $set: { status: "CANCELADO" } }
      );
    }

    const blockCount = await Block.countDocuments();
    if (blockCount === 0) {
      const adminUser = await User.findOne({ role: "admin" }).lean();
      const spaces = await Space.find().lean();
      if (adminUser) {
        const blocks = buildBlocks(adminUser, spaces);
        await Block.insertMany(blocks);
      }
    }
  }

  if (shouldReset || existingUsers === 0) {
    await resetAndSeed();
    return;
  }

  await ensureBaselineSeed();
}

module.exports = {
  seedDatabase
};
