const pool = require("../config/db");

/* 1. LISTAR TODOS LOS PAGOS */
exports.getAll = async (req, res) => {
  try {
    // Nota: Como en hotel.sql no existe un SP específico como "sp_listar_pagos", 
    // mantenemos la consulta SQL nativa para llenar la tabla principal del dashboard.
    const [rows] = await pool.query(`
      SELECT p.*, r.docIdCliente 
      FROM Pago p
      JOIN Reserva r ON p.idReserva = r.id
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 2. BUSCAR PAGOS POR ID DE RESERVA (USANDO SP) */
exports.getByReserva = async (req, res) => {
  try {
    const { idReserva } = req.params;
    
    // Llamamos al procedimiento del profesor
    const [rows] = await pool.query("CALL sp_historial_pagos_reserva(?)", [idReserva]);
    
    // Los SP devuelven un arreglo dentro de otro arreglo
    res.json(rows[0]); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 3. REGISTRAR UN PAGO (USANDO SP) */
/* 3. REGISTRAR UN PAGO (CORREGIDO Y MÁS ROBUSTO) */
/* 3. REGISTRAR UN PAGO */
exports.create = async (req, res) => {
  try {
    // Asegúrate de que coincida con el nombre del parámetro del SP
    const { idReserva, monto, metodo, observacion } = req.body;
    
    await pool.query("CALL sp_registrar_pago(?, ?, ?, ?)", [
      idReserva, 
      monto, 
      metodo || 'Efectivo', // Asegura que no sea NULL
      observacion || ''
    ]);

    res.status(201).json({ message: "Pago registrado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* 4. ESTADO DE CUENTA TOTAL (USANDO SP) */
exports.getEstadoCuenta = async (req, res) => {
  try {
    const { idReserva } = req.params;
    
    // Este SP es la joya de la corona: calcula hospedaje + servicios - pagos
    const [rows] = await pool.query("CALL sp_estado_cuenta_reserva(?)", [idReserva]);
    
    const estadoCuenta = rows[0][0];
    
    if (!estadoCuenta) {
      return res.status(404).json({ message: "No se pudo generar el estado de cuenta" });
    }

    res.json(estadoCuenta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};