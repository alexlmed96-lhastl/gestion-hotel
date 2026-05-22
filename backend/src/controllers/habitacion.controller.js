const pool = require("../config/db");

/* LISTAR TODAS */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, s.nombre AS sucursal
      FROM Habitacion h
      INNER JOIN Sucursal s ON h.idSucursal = s.id
      ORDER BY h.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* DISPONIBLES */
exports.getDisponibles = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, s.nombre AS sucursal
      FROM Habitacion h
      INNER JOIN Sucursal s ON h.idSucursal = s.id
      WHERE h.estado = 'DISPONIBLE'
      ORDER BY h.id
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
      SELECT h.*, s.nombre AS sucursal
      FROM Habitacion h
      INNER JOIN Sucursal s ON h.idSucursal = s.id
      WHERE h.id = ?
    `, [id]);
    if (rows.length === 0)
      return res.status(404).json({ message: "Habitación no encontrada" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* REGISTRAR — usa sp_registrar_habitacion */
exports.create = async (req, res) => {
  try {
    const { id, tipo, piso, camas, precioNoche, idSucursal } = req.body;

    if (!id || !tipo || piso === undefined || !camas || precioNoche === undefined || !idSucursal)
      return res.status(400).json({ message: "Faltan campos: id, tipo, piso, camas, precioNoche, idSucursal" });

    await pool.query(
      "CALL sp_registrar_habitacion(?, ?, ?, ?, ?, ?)",
      [id, tipo, piso, camas, precioNoche, idSucursal]
    );
    res.status(201).json({ message: "Habitación registrada correctamente" });
  } catch (error) {
    if (error.sqlState === "45000")
      return res.status(409).json({ message: error.message });
    res.status(500).json({ error: error.message });
  }
};

/* ACTUALIZAR — usa sp_actualizar_habitacion */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, piso, camas, precioNoche, idSucursal } = req.body;

    await pool.query(
      "CALL sp_actualizar_habitacion(?, ?, ?, ?, ?, ?)",
      [id, tipo, piso, camas, precioNoche, idSucursal]
    );
    res.json({ message: "Habitación actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* CAMBIAR ESTADO */
exports.changeEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const validos = ["DISPONIBLE", "OCUPADA", "MANTENIMIENTO", "RESERVADA"];
    if (!validos.includes(estado?.toUpperCase()))
      return res.status(400).json({ message: `Estado inválido. Use: ${validos.join(", ")}` });

    await pool.query("UPDATE Habitacion SET estado = ? WHERE id = ?", [estado, id]);
    res.json({ message: "Estado actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ELIMINAR */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM Habitacion WHERE id = ?", [id]);
    res.json({ message: "Habitación eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* SUCURSALES — helper para el formulario Angular */
exports.getSucursales = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre FROM Sucursal ORDER BY nombre");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};