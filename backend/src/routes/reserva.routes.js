//GET    /api/reservas
//GET    /api/reservas/activas
//GET    /api/reservas/:id
//POST   /api/reservas
//PATCH  /api/reservas/:id/checkin
//PATCH  /api/reservas/:id/checkout
//PATCH  /api/reservas/:id/cancelar
//DELETE /api/reservas/:id


// src/routes/reservas.routes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/reserva.controller");

router.get("/", controller.getAll);
router.get("/activas", controller.getActivas);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id/checkin", controller.checkin);
router.patch("/:id/checkout", controller.checkout);
router.patch("/:id/cancelar", controller.cancelar);
router.delete("/:id", controller.remove);

module.exports = router;