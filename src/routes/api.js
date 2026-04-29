const express = require("express");
const apiController = require("../controllers/apiController");
const { requireApiAuth, requireApiStandard } = require("../middleware/apiAuth");

const router = express.Router();

router.get("/health", apiController.health);
router.post("/auth/login", apiController.login);
router.get("/spaces", apiController.listSpaces);

router.use(requireApiAuth, requireApiStandard);
router.post("/reservations", apiController.createReservation);
router.get("/reservations/me", apiController.listOwnReservations);
router.patch("/reservations/:id/cancel", apiController.cancelReservation);
router.put("/reservations/:id", apiController.updateReservation);
router.post("/reservations/:id/recurrence", apiController.createRecurrence);

module.exports = router;
