const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

const pool = mysql.createPool({
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: '',
  database: 'artesanias_wayuu',
  waitForConnections: true,
  connectionLimit: 10,
});

app.get('/', (req, res) => {
  res.json({ mensaje: 'API de artesanias wayuu funcionando' });
});

// GET - todas las artesanias wayuu
app.get('/artesanias-wayuu', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM artesanias_wayuu ORDER BY id DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al listar artesanias wayuu' });
  }
});

// GET - una artesania wayuu
app.get('/artesanias-wayuu/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Artesania wayuu no encontrada' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener artesania wayuu' });
  }
});

// POST - crear artesania wayuu
app.post('/artesanias-wayuu', async (req, res) => {
  try {
    const { nombre, artesana, precio, categoria } = req.body;

    if (!nombre || !artesana || !precio || !categoria) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }

    const [result] = await pool.query(
      'INSERT INTO artesanias_wayuu (nombre, artesana, precio, categoria) VALUES (?, ?, ?, ?)',
      [nombre, artesana, precio, categoria]
    );

    const [nueva] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      mensaje: 'Artesania wayuu creada',
      artesania: nueva[0],
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear artesania wayuu' });
  }
});

// PUT - actualizar artesania wayuu
app.put('/artesanias-wayuu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, artesana, precio, categoria } = req.body;

    if (!nombre || !artesana || !precio || !categoria) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }

    const [existe] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ error: 'Artesania wayuu no encontrada' });
    }

    await pool.query(
      'UPDATE artesanias_wayuu SET nombre = ?, artesana = ?, precio = ?, categoria = ? WHERE id = ?',
      [nombre, artesana, precio, categoria, id]
    );

    const [actualizada] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [id]
    );

    res.json({
      mensaje: 'Artesania wayuu actualizada',
      artesania: actualizada[0],
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar artesania wayuu' });
  }
});

// DELETE - eliminar artesania wayuu
app.delete('/artesanias-wayuu/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [existe] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [id]
    );

    if (existe.length === 0) {
      return res.status(404).json({ error: 'Artesania wayuu no encontrada' });
    }

    await pool.query('DELETE FROM artesanias_wayuu WHERE id = ?', [id]);
    res.json({ mensaje: 'Artesania wayuu eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar artesania wayuu' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
