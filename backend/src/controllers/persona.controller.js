const pool = require("../config/db");

/* LISTAR CON ROLES INFERIDOS DE LA BASE DE DATOS ACTUAL */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        CASE
          WHEN EXISTS (SELECT 1 FROM Recepcionista r WHERE r.docId = p.docId) THEN 'RECEPCIONISTA'
          WHEN EXISTS (SELECT 1 FROM Reserva res WHERE res.docIdCliente = p.docId) THEN 'CLIENTE'
          WHEN EXISTS (SELECT 1 FROM ReservaHuesped rh WHERE rh.docId = p.docId) THEN 'HUESPED'
          ELSE 'NUEVO' 
        END AS rol
      FROM Persona p
      ORDER BY p.apellidos, p.nombres
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* BUSCAR POR ID */
exports.getById = async (req, res) => {
  try {
    const { docId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM Persona WHERE docId = ?",
      [docId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Registro no encontrado" });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* REGISTRAR (Ignoramos el rol del frontend porque la BD lo deduce luego) */
exports.create = async (req, res) => {
  try {
    const { docId, nombres, apellidos, correo, nacionalidad, fechaNac, sexo } = req.body;

    await pool.query(
      `INSERT INTO Persona (docId, nombres, apellidos, correo, nacionalidad, fechaNac, sexo)
       VALUES (?,?,?,?,?,?,?)`,
      [docId, nombres, apellidos, correo, nacionalidad, fechaNac, sexo]
    );

    res.status(201).json({ message: "Registro creado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ACTUALIZAR */
exports.update = async (req, res) => {
  try {
    const { docId } = req.params;
    const { nombres, apellidos, correo, nacionalidad, fechaNac, sexo } = req.body;

    await pool.query(
      `UPDATE Persona
       SET nombres=?, apellidos=?, correo=?, nacionalidad=?, fechaNac=?, sexo=?
       WHERE docId=?`,
      [nombres, apellidos, correo, nacionalidad, fechaNac, sexo, docId]
    );

    res.json({ message: "Registro actualizado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ELIMINAR */
exports.remove = async (req, res) => {
  try {
    const { docId } = req.params;
    await pool.query("DELETE FROM Persona WHERE docId = ?", [docId]);
    res.json({ message: "Registro eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};