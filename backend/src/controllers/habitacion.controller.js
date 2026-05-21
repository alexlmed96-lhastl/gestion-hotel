const pool = require("../config/db");

/* LISTAR TODAS */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT h.*, s.nombre AS sucursal
      FROM Habitacion h
      INNER JOIN Sucursal s
        ON h.idSucursal = s.id
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
      INNER JOIN Sucursal s
        ON h.idSucursal = s.id
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
      INNER JOIN Sucursal s
        ON h.idSucursal = s.id
      WHERE h.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Habitación no encontrada"
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
      id,
      tipo,
      piso,
      idSucursal
    } = req.body;

    await pool.query(`
      INSERT INTO Habitacion
      (id,tipo,piso,estado,idSucursal)
      VALUES (?,?,?,'DISPONIBLE',?)
    `, [id, tipo, piso, idSucursal]);

    res.status(201).json({
      message: "Habitación registrada"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ACTUALIZAR */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      tipo,
      piso,
      idSucursal
    } = req.body;

    await pool.query(`
      UPDATE Habitacion
      SET tipo=?,
          piso=?,
          idSucursal=?
      WHERE id=?
    `, [tipo, piso, idSucursal, id]);

    res.json({
      message: "Habitación actualizada"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* CAMBIAR ESTADO */
exports.changeEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    await pool.query(`
      UPDATE Habitacion
      SET estado=?
      WHERE id=?
    `, [estado, id]);

    res.json({
      message: "Estado actualizado"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ELIMINAR */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM Habitacion WHERE id=?",
      [id]
    );

    res.json({
      message: "Habitación eliminada"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};