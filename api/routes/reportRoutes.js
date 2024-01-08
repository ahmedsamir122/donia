const express = require("express");
const authController = require("../controllers/authController");
const reportController = require("../controllers/reportController");

const router = express.Router();

router
  .route("/")
  .get(authController.protect, reportController.getReports)
  .post(authController.protect, reportController.createReport)
  .patch(authController.protect, reportController.updateReport);

router
  .route("/:id")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    reportController.getOneReport
  );

module.exports = router;
