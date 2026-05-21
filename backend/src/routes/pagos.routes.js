const express = require("express");
const router = express.Router();
const pagosController = require("../controllers/pagos.controller");

router.get("/estado-cuenta/:idReserva", pagosController.getEstadoCuenta);
router.get("/", pagosController.getAll);
router.get("/reserva/:idReserva", pagosController.getByReserva);
router.post("/", pagosController.create);

module.exports = router;