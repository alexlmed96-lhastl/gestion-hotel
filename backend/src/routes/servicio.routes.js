//GET    /api/servicios
//GET    /api/servicios/:id
//POST   /api/servicios
//PUT    /api/servicios/:id
//DELETE /api/servicios/:id

//POST   /api/servicios/consumo
//GET    /api/reservas/:id/servicios
//GET    /api/reservas/:id/total-servicios

const express = require("express");
const router = express.Router();
const controller = require("../controllers/servicio.controller");

router.get("/", controller.getAll);
router.post("/consumo", controller.consumo); 

// ESTA ES LA LÍNEA QUE FALTA PARA EL HISTORIAL (DEBE IR ANTES DEL /:id)
router.get("/reserva/:id", controller.getByReserva); 

router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;