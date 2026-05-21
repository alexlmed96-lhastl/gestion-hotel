const pool = require("../config/db");

/* LISTAR TODAS */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.*,
        CONCAT(p.nombres,' ',p.apellidos) AS cliente,
        h.tipo AS tipoHabitacion
      FROM Reserva r
      INNER JOIN Persona p
        ON r.docIdCliente = p.docId
      INNER JOIN Habitacion h
        ON r.idHabitacion = h.id
      ORDER BY r.id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ACTIVAS */
exports.getActivas = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM vw_reservas_activas
      ORDER BY id DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* BUSCAR POR ID */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT * FROM Reserva
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Reserva no encontrada"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* REGISTRAR */
exports.create = async (req, res) => {
  try {
    const {
      fechaEntrada,
      fechaSalida,
      precio,
      idEmpleado,
      docIdCliente,
      idHabitacion
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO Reserva(
        fecha,
        fechaEntrada,
        fechaSalida,
        estado,
        precio,
        idEmpleado,
        docIdCliente,
        idHabitacion
      )
      VALUES(
        NOW(),
        ?, ?, 'CONFIRMADA',
        ?, ?, ?, ?
      )
    `, [
      fechaEntrada,
      fechaSalida,
      precio,
      idEmpleado,
      docIdCliente,
      idHabitacion
    ]);

    res.status(201).json({
      message: "Reserva registrada",
      idReserva: result.insertId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* CHECKIN */
exports.checkin = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE Reserva
      SET estado='CHECKIN'
      WHERE id=?
    `, [id]);

    await pool.query(`
      UPDATE Habitacion h
      INNER JOIN Reserva r
        ON h.id = r.idHabitacion
      SET h.estado='OCUPADA'
      WHERE r.id=?
    `, [id]);

    res.json({
      message: "Check-in realizado"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* CHECKOUT */
exports.checkout = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE Reserva
      SET estado='FINALIZADA'
      WHERE id=?
    `, [id]);

    res.json({
      message: "Checkout realizado"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* CANCELAR */
exports.cancelar = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      UPDATE Reserva
      SET estado='CANCELADA'
      WHERE id=?
    `, [id]);

    res.json({
      message: "Reserva cancelada"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   ELIMINAR RESERVA
========================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Primero borramos los hijos (el historial de consumos de esta reserva)
    await pool.query(`DELETE FROM DetalleServicio WHERE idReserva = ?`, [id]);

    // 2. NUEVO: Borramos los registros de pago asociados a la reserva
    await pool.query(`DELETE FROM Pago WHERE idReserva = ?`, [id]);

    // 2. Ahora sí, borramos al padre (la reserva)
    await pool.query(`DELETE FROM Reserva WHERE id = ?`, [id]);

    res.json({
      message: "Reserva y sus detalles eliminados correctamente"
    });

  } catch (error) {
    console.error("💥 ERROR SQL AL ELIMINAR:", error);
    res.status(500).json({ error: error.message });
  }
};
/* EJECUTAR CHECK-IN */
exports.doCheckIn = async (req, res) => {
  try {
    const { idReserva } = req.params;
    // Llamamos al procedimiento almacenado que cambia estados de Reserva y Habitación
    await pool.query("CALL sp_checkin_reserva(?)", [idReserva]);
    res.json({ message: "Check-in realizado con éxito. Habitación ocupada." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* AGREGAR ACOMPAÑANTE (Huésped) */
exports.addHuesped = async (req, res) => {
  try {
    const { idReserva } = req.params;
    const { docId } = req.body;
    // Inserta en la tabla ReservaHuesped
    await pool.query("CALL sp_agregar_huesped_reserva(?, ?)", [idReserva, docId]);
    res.json({ message: "Acompañante registrado en la reserva." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Obtener el catálogo completo de servicios (para llenar el desplegable)
exports.getCatalogoServicios = async (req, res) => {
  try {
    const [rows] = await pool.query("CALL sp_listar_servicios()");
    res.json(rows[0]); // Retornamos el catálogo real de la DB
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener los servicios que YA CONSUMIÓ una reserva específica
exports.getServiciosConsumidos = async (req, res) => {
  try {
    const { idReserva } = req.params;
    const [rows] = await pool.query("CALL sp_detalle_servicios_reserva(?)", [idReserva]);
    res.json(rows[0]); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Agregar un nuevo cargo/servicio a la cuenta de la habitación
exports.addServicioAReserva = async (req, res) => {
  try {
    const { idReserva, idServicio, cantidad } = req.body;
    // Ejecutamos el SP que hace la magia matemática y validaciones
    await pool.query("CALL sp_agregar_servicio_reserva(?, ?, ?)", [idReserva, idServicio, cantidad]);
    res.status(201).json({ message: "Servicio cargado a la habitación correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};