const express = require("express");
const apiController = require("../controllers/apiController");
const { requireApiAuth, requireApiStandard } = require("../middleware/apiAuth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Sistema
 *     description: Endpoints de estado de la API
 *   - name: Autenticacion
 *     description: Login y obtencion de token Bearer
 *   - name: Espacios
 *     description: Consulta publica de espacios y bloqueos activos
 *   - name: Reservas
 *     description: Gestion de reservas del usuario autenticado
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: Bearer token
 *   schemas:
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *     LoginRequest:
 *       type: object
 *       required:
 *         - dni
 *         - password
 *       properties:
 *         dni:
 *           type: string
 *           example: 12345678A
 *         password:
 *           type: string
 *           example: password123
 *     UserSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d001
 *         dni:
 *           type: string
 *           example: 12345678A
 *         name:
 *           type: string
 *           example: Ana Perez
 *         role:
 *           type: string
 *           example: STANDARD
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: 9c2f2b4ef8c95b5f17fe8f4749e6f456da53e75483dcf6c0
 *         user:
 *           $ref: '#/components/schemas/UserSummary'
 *     SpaceSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d010
 *         name:
 *           type: string
 *           example: Aula 1.2
 *         active:
 *           type: boolean
 *           example: true
 *     BlockSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d020
 *         spaceId:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d010
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-03T08:00:00.000Z
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-03T10:00:00.000Z
 *         status:
 *           type: string
 *           example: ACTIVO
 *         reason:
 *           type: string
 *           example: Mantenimiento
 *     SpacesResponse:
 *       type: object
 *       properties:
 *         spaces:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpaceSummary'
 *         activeBlocks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BlockSummary'
 *     ReservationRequest:
 *       type: object
 *       required:
 *         - spaceId
 *         - startDateTime
 *         - endDateTime
 *       properties:
 *         spaceId:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d010
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-10T09:00:00.000Z
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-10T11:00:00.000Z
 *         purpose:
 *           type: string
 *           example: Reunion de proyecto
 *     ReservationSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d030
 *         spaceId:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d010
 *         spaceName:
 *           type: string
 *           example: Aula 1.2
 *         startDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-10T09:00:00.000Z
 *         endDateTime:
 *           type: string
 *           format: date-time
 *           example: 2026-05-10T11:00:00.000Z
 *         purpose:
 *           type: string
 *           example: Reunion de proyecto
 *         status:
 *           type: string
 *           example: ACTIVA
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2026-05-02T09:00:00.000Z
 *     ReservationResponse:
 *       type: object
 *       properties:
 *         reservation:
 *           $ref: '#/components/schemas/ReservationSummary'
 *     ReservationsResponse:
 *       type: object
 *       properties:
 *         reservations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReservationSummary'
 *     RecurrenceRequest:
 *       type: object
 *       required:
 *         - frequency
 *         - count
 *       properties:
 *         frequency:
 *           type: string
 *           enum: [DAILY, WEEKLY, MONTHLY, YEARLY]
 *           example: WEEKLY
 *         count:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *     RecurrenceResponse:
 *       type: object
 *       properties:
 *         baseReservationId:
 *           type: string
 *           example: 6814f1bb0b98d7f2f3f5d030
 *         frequency:
 *           type: string
 *           example: WEEKLY
 *         createdReservations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReservationSummary'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: VALIDATION_ERROR
 *             message:
 *               type: string
 *               example: Revisa los datos de la reserva.
 *             details:
 *               type: object
 *               additionalProperties:
 *                 type: string
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Comprueba el estado de la API
 *     tags: [Sistema]
 *     responses:
 *       200:
 *         description: API operativa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/health", apiController.health);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesion y devuelve un token Bearer
 *     tags: [Autenticacion]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Autenticacion correcta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Error de validacion
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Credenciales invalidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/auth/login", apiController.login);

/**
 * @swagger
 * /api/spaces:
 *   get:
 *     summary: Lista espacios y bloqueos activos
 *     tags: [Espacios]
 *     responses:
 *       200:
 *         description: Datos de espacios recuperados correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SpacesResponse'
 */
router.get("/spaces", apiController.listSpaces);

router.use(requireApiAuth, requireApiStandard);

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Crea una reserva para el usuario autenticado
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservationRequest'
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Error de validacion o fechas invalidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token ausente o invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Espacio no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Solape o espacio no reservable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reservations", apiController.createReservation);

/**
 * @swagger
 * /api/reservations/me:
 *   get:
 *     summary: Lista las reservas del usuario autenticado
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reservas recuperadas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationsResponse'
 *       401:
 *         description: Token ausente o invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Usuario sin permisos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/reservations/me", apiController.listOwnReservations);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   patch:
 *     summary: Cancela una reserva propia
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la reserva
 *     responses:
 *       200:
 *         description: Reserva cancelada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       401:
 *         description: Token ausente o invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: La reserva no pertenece al usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La reserva ya estaba cancelada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/reservations/:id/cancel", apiController.cancelReservation);

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Edita una reserva propia
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReservationRequest'
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       400:
 *         description: Error de validacion o fechas invalidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token ausente o invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: La reserva no pertenece al usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reserva o espacio no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La reserva no puede editarse por cancelacion o solape
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/reservations/:id", apiController.updateReservation);

/**
 * @swagger
 * /api/reservations/{id}/recurrence:
 *   post:
 *     summary: Genera recurrencias a partir de una reserva propia
 *     tags: [Reservas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identificador de la reserva base
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecurrenceRequest'
 *     responses:
 *       201:
 *         description: Recurrencias creadas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecurrenceResponse'
 *       400:
 *         description: Frecuencia o numero de recurrencias invalidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Token ausente o invalido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: La reserva no pertenece al usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Reserva no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: La recurrencia genera un conflicto o parte de una reserva cancelada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reservations/:id/recurrence", apiController.createRecurrence);

module.exports = router;
