const pool = require("../config/db");

/* =========================
   LISTAR SERVICIOS
========================= */
exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM Servicio
      ORDER BY descripcion
    `);

    res.json(rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   BUSCAR POR ID
========================= */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT *
      FROM Servicio
      WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Servicio no encontrado"
      });
    }

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   CREAR SERVICIO
========================= */
exports.create = async (req, res) => {
  try {
    const { tipo, descripcion, precio } = req.body; // <-- Cambiado 'nombre' por 'tipo' y 'descripcion'

    const [result] = await pool.query(`
      INSERT INTO Servicio(tipo, descripcion, precio, estado)
      VALUES(?, ?, ?, 'ACTIVO')
    `, [tipo, descripcion, precio]);

    res.status(201).json({
      message: "Servicio creado",
      id: result.insertId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   ACTUALIZAR
========================= */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo, descripcion, precio, estado } = req.body; // <-- Cambiado

    await pool.query(`
      UPDATE Servicio
      SET tipo=?,
          descripcion=?,
          precio=?,
          estado=?
      WHERE id=?
    `, [tipo, descripcion, precio, estado, id]);

    res.json({
      message: "Servicio actualizado"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/* =========================
   ELIMINAR
========================= */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`
      DELETE FROM Servicio
      WHERE id=?
    `, [id]);

    res.json({
      message: "Servicio eliminado"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   1. HISTORIAL DE CONSUMOS
========================= */
exports.getByReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT
        s.descripcion,
        s.descripcion AS nombre, /* Alias doble para asegurar compatibilidad con Angular */
        ds.cantidad,
        ds.precio,     
        ds.subTotal    
      FROM DetalleServicio ds
      INNER JOIN Servicio s
        ON ds.idServicio = s.id
      WHERE ds.idReserva = ?
    `, [id]);

    res.json(rows);

  } catch (error) {
    console.error("💥 ERROR EN GET HISTORIAL:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   2. REGISTRAR CONSUMO (Corregido)
========================= */
exports.consumo = async (req, res) => {
  try {
    const { idReserva, idServicio, cantidad } = req.body;

    // A. Buscar el precio base en el catálogo de servicios
    const [servicio] = await pool.query(`SELECT precio FROM Servicio WHERE id = ?`, [idServicio]);
    
    if (servicio.length === 0) {
      return res.status(404).json({ message: "Servicio no existe" });
    }

    const precioBase = servicio[0].precio;

    // B. Control de llave primaria compuesta (Evita ER_DUP_ENTRY)
    const [existente] = await pool.query(`
      SELECT cantidad 
      FROM DetalleServicio 
      WHERE idReserva = ? AND idServicio = ?
    `, [idReserva, idServicio]);

    // ¡AQUÍ ESTABA EL ERROR! Ya dice 'existente' correctamente
    if (existente.length > 0) {
      const nuevaCantidad = existente[0].cantidad + cantidad;
      const nuevoSubTotal = nuevaCantidad * precioBase;

      await pool.query(`
        UPDATE DetalleServicio 
        SET cantidad = ?, subTotal = ? 
        WHERE idReserva = ? AND idServicio = ?
      `, [nuevaCantidad, nuevoSubTotal, idReserva, idServicio]);

      return res.status(200).json({
        message: "Cantidad de servicio actualizada correctamente"
      });
    }

    // C. Si es la primera vez que solicita este servicio, se inserta normalmente
    const totalCalculado = precioBase * cantidad;
    await pool.query(`
      INSERT INTO DetalleServicio (
        idReserva, 
        idServicio, 
        cantidad, 
        precio, 
        subTotal
      ) 
      VALUES (?, ?, ?, ?, ?)
    `, [idReserva, idServicio, cantidad, precioBase, totalCalculado]);

    res.status(201).json({
      message: "Consumo registrado"
    });

  } catch (error) {
    console.error("💥 ERROR SQL AL REGISTRAR:", error);
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   TOTAL SERVICIOS RESERVA
========================= */
exports.totalReserva = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT IFNULL(SUM(subTotal),0) AS total /* <-- 'subTotal' con T mayúscula */
      FROM DetalleServicio
      WHERE idReserva = ?
    `, [id]);

    res.json(rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};