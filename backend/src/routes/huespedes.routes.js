const express = require("express");
const router = express.Router();
const huespedesController = require("../controllers/huespedes.controller");

router.get("/", huespedesController.getAll);
router.get("/reserva/:idReserva", huespedesController.getByReserva);
router.post("/", huespedesController.create);
router.delete("/:idReserva/:docId", huespedesController.remove);

module.exports = router;