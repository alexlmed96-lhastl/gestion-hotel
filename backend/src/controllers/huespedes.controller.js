const pool = require("../config/db");

/* LISTAR TODOS LOS HUÉSPEDES HISTÓRICOS */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rh.idReserva, p.* FROM ReservaHuesped rh
      JOIN Persona p ON rh.docId = p.docId
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* LISTAR HUÉSPEDES DE UNA RESERVA ESPECÍFICA */
exports.getByReserva = async (req, res) => {
  try {
    const { idReserva } = req.params;
    // Llamamos a tu procedimiento almacenado que ya existe en tu BD
    const [rows] = await pool.query("CALL sp_listar_huespedes_reserva(?)", [idReserva]);
    // Los procedimientos almacenados devuelven un array de arrays, tomamos el primero
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* AGREGAR HUÉSPED A UNA RESERVA */
exports.create = async (req, res) => {
  try {
    const { idReserva, docId } = req.body;
    await pool.query("CALL sp_agregar_huesped_reserva(?, ?)", [idReserva, docId]);
    res.status(201).json({ message: "Huésped vinculado a la reserva con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* QUITAR UN HUÉSPED DE UNA RESERVA (Pasado a SP) */
exports.remove = async (req, res) => {
  try {
    const { idReserva, docId } = req.params;
    
    // Usamos el procedimiento exacto que tienes en hotel.sql
    await pool.query("CALL sp_quitar_huesped_reserva(?, ?)", [idReserva, docId]);
    
    res.json({ message: "Huésped removido de la reserva" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};