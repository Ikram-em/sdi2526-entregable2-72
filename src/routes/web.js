const express = require("express");
const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
const spaceController = require("../controllers/spaceController");
const { requireAdmin, requireAuth, requireGuest, requireStandard } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  return res.redirect(req.session.user.role === "admin" ? "/admin/reservations" : "/spaces");
});

router.get("/register", requireGuest, authController.showRegister);
router.post("/register", requireGuest, authController.register);
router.get("/login", requireGuest, authController.showLogin);
router.post("/login", requireGuest, authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/account/profile", requireAuth, authController.showProfile);

router.get("/spaces", requireStandard, spaceController.listSpaces);
router.get("/spaces/:spaceId", requireStandard, spaceController.showSpace);
router.get("/spaces/:spaceId/availability", requireStandard, spaceController.showAvailability);
router.get("/account/password", requireStandard, authController.showChangePassword);
router.post("/account/password", requireStandard, authController.changePassword);
router.get("/reservations/mine", requireStandard, spaceController.showMyReservations);
router.post("/reservations/:reservationId/cancel", requireStandard, spaceController.cancelOwnReservation);

router.get("/admin", requireAdmin, (req, res) => res.redirect("/admin/reservations"));
router.get("/admin/reservations", requireAdmin, adminController.showReservations);
router.get("/admin/reservations/export.csv", requireAdmin, adminController.exportReservationsCsv);
router.get("/admin/spaces", requireAdmin, adminController.showSpaceManagement);
router.get("/admin/spaces/new", requireAdmin, adminController.showCreateSpace);
router.post("/admin/spaces", requireAdmin, adminController.createSpace);
router.get("/admin/spaces/:spaceId/edit", requireAdmin, adminController.showEditSpace);
router.post("/admin/spaces/:spaceId/edit", requireAdmin, adminController.updateSpace);
router.post("/admin/spaces/:spaceId/toggle", requireAdmin, adminController.toggleSpace);
router.get("/admin/spaces/:spaceId/blocks", requireAdmin, adminController.showBlocks);
router.post("/admin/spaces/:spaceId/blocks", requireAdmin, adminController.createBlock);
router.post("/admin/blocks/:blockId/cancel", requireAdmin, adminController.cancelBlock);
router.get("/admin/users", requireAdmin, adminController.showUsers);

module.exports = router;
