require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

/* RUTAS */
const personaRoutes = require("./routes/persona.routes");
const habitacionRoutes = require("./routes/habitacion.routes");
const reservaRoutes = require("./routes/reserva.routes");
const servicioRoutes = require("./routes/servicio.routes");
const pagosRoutes = require('./routes/pagos.routes');
const huespedesRoutes = require('./routes/huespedes.routes');

const app = express();

/* MIDDLEWARES */
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* RUTA PRINCIPAL */
app.get("/", (req, res) => {
  res.json({
    message: "API HotelDB funcionando correctamente"
  });
});

/* ENDPOINTS */
app.use("/api/personas", personaRoutes);
app.use("/api/habitaciones", habitacionRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/servicios", servicioRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/huespedes', huespedesRoutes);

/* MANEJO 404 */
app.use((req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada"
  });
});

module.exports = app;