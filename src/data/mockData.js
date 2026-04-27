const users = [
  {
    dni: "12345678Z",
    firstName: "Admin",
    lastName: "Sistema",
    password: "@Dm1n1str@D0r",
    role: "admin"
  },
  {
    dni: "10000001S",
    firstName: "Lucia",
    lastName: "Fernandez Suarez",
    password: "Us3r@1-PASSW",
    role: "standard"
  },
  {
    dni: "10000002Q",
    firstName: "Pablo",
    lastName: "Garcia Alonso",
    password: "Us3r@2-PASSW",
    role: "standard"
  },
  {
    dni: "10000003V",
    firstName: "Nora",
    lastName: "Lopez Vega",
    password: "Us3r@3-PASSW",
    role: "standard"
  },
  {
    dni: "10000004H",
    firstName: "Sergio",
    lastName: "Martin Diaz",
    password: "Us3r@4-PASSW",
    role: "standard"
  },
  {
    dni: "10000005L",
    firstName: "Clara",
    lastName: "Iglesias Perez",
    password: "Us3r@5-PASSW",
    role: "standard"
  }
];

const spaces = [
  {
    id: "space-1",
    name: "Sala Naranco",
    type: "Sala de reuniones",
    location: "Edificio A, Planta 1",
    capacity: 8,
    active: true,
    description: "Sala pensada para reuniones cortas con equipo hibrido.",
    amenities: ["Pantalla 4K", "Videoconferencia", "Pizarra"]
  },
  {
    id: "space-2",
    name: "Aula Covadonga",
    type: "Aula",
    location: "Edificio B, Planta 2",
    capacity: 24,
    active: true,
    description: "Aula con proyector, audio y distribucion flexible.",
    amenities: ["Proyector", "Audio", "Mesas moviles"]
  },
  {
    id: "space-3",
    name: "Cowork Costa Verde",
    type: "Coworking",
    location: "Edificio C, Zona abierta",
    capacity: 12,
    active: true,
    description: "Zona silenciosa para trabajo individual o pequeños equipos.",
    amenities: ["Taquillas", "Wifi 6", "Impresora"]
  },
  {
    id: "space-4",
    name: "Sala Picos",
    type: "Sala de reuniones",
    location: "Edificio A, Planta 3",
    capacity: 14,
    active: true,
    description: "Sala para reuniones ampliadas y presentaciones internas.",
    amenities: ["Pantalla tactil", "Streaming", "Pizarra"]
  },
  {
    id: "space-5",
    name: "Aula Laboral",
    type: "Aula",
    location: "Edificio D, Planta baja",
    capacity: 32,
    active: true,
    description: "Espacio docente orientado a sesiones grupales.",
    amenities: ["Proyector", "Ordenador docente", "Red cableada"]
  },
  {
    id: "space-6",
    name: "Cowork Puerto",
    type: "Coworking",
    location: "Edificio C, Ala norte",
    capacity: 10,
    active: false,
    description: "Zona de apoyo actualmente fuera de servicio.",
    amenities: ["Wifi 6", "Monitor externo"]
  }
];

const reservations = [
  {
    id: "res-1",
    userDni: "10000001S",
    spaceId: "space-1",
    start: "2026-04-28T09:00",
    end: "2026-04-28T10:30",
    status: "ACTIVA"
  },
  {
    id: "res-2",
    userDni: "10000002Q",
    spaceId: "space-1",
    start: "2026-04-28T12:00",
    end: "2026-04-28T13:00",
    status: "ACTIVA"
  },
  {
    id: "res-3",
    userDni: "10000003V",
    spaceId: "space-2",
    start: "2026-04-29T10:00",
    end: "2026-04-29T12:00",
    status: "ACTIVA"
  },
  {
    id: "res-4",
    userDni: "10000004H",
    spaceId: "space-3",
    start: "2026-04-30T16:00",
    end: "2026-04-30T18:00",
    status: "CANCELADA"
  },
  {
    id: "res-5",
    userDni: "10000005L",
    spaceId: "space-4",
    start: "2026-05-02T11:00",
    end: "2026-05-02T12:30",
    status: "ACTIVA"
  }
];

const blocks = [
  {
    id: "blk-1",
    spaceId: "space-1",
    start: "2026-04-29T15:00",
    end: "2026-04-29T17:00",
    reason: "Mantenimiento del sistema de videoconferencia",
    status: "ACTIVO"
  },
  {
    id: "blk-2",
    spaceId: "space-3",
    start: "2026-05-01T09:00",
    end: "2026-05-01T11:00",
    reason: "Revision electrica",
    status: "ACTIVO"
  },
  {
    id: "blk-3",
    spaceId: "space-2",
    start: "2026-04-27T08:00",
    end: "2026-04-27T10:00",
    reason: "Bloqueo historico cancelado",
    status: "CANCELADO"
  }
];

module.exports = {
  users,
  spaces,
  reservations,
  blocks
};
