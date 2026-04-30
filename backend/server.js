const cors = require('cors');
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = 3001;
const uploadsDir = path.join(__dirname, 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);
app.use('/uploads', express.static(uploadsDir));

const pool = mysql.createPool({
  host: 'localhost',
  port: 3308,
  user: 'root',
  password: '',
  database: 'artesanias_wayuu',
  waitForConnections: true,
  connectionLimit: 10,
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten archivos de imagen'));
      return;
    }

    cb(null, true);
  },
});

function buildImagePath(file) {
  if (!file) {
    return null;
  }

  return `/uploads/${file.filename}`;
}

function toAbsoluteImageUrl(req, storedValue) {
  if (!storedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(storedValue)) {
    return storedValue;
  }

  const normalizedPath = storedValue.startsWith('/') ? storedValue : `/${storedValue}`;
  return `${req.protocol}://${req.get('host')}${normalizedPath}`;
}

function normalizeArtesania(req, row) {
  return {
    ...row,
    imagen_url: toAbsoluteImageUrl(req, row.imagen_url),
  };
}

function getLocalUploadPath(storedValue) {
  if (!storedValue) {
    return null;
  }

  try {
    const pathname = /^https?:\/\//i.test(storedValue)
      ? new URL(storedValue).pathname
      : storedValue;

    if (!pathname.startsWith('/uploads/')) {
      return null;
    }

    return path.join(uploadsDir, path.basename(pathname));
  } catch {
    return null;
  }
}

function removeImageFile(storedValue) {
  const filePath = getLocalUploadPath(storedValue);

  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

app.get('/', (_req, res) => {
  res.json({ mensaje: 'API de artesanias wayuu funcionando' });
});

app.get('/artesanias-wayuu', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM artesanias_wayuu ORDER BY id DESC'
    );
    res.json(rows.map((row) => normalizeArtesania(req, row)));
  } catch (error) {
    console.error('Error listando artesanias:', error);
    res.status(500).json({ error: 'Error al listar artesanias wayuu' });
  }
});

app.get('/artesanias-wayuu/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Artesania wayuu no encontrada' });
    }

    return res.json(normalizeArtesania(req, rows[0]));
  } catch (error) {
    console.error('Error obteniendo artesania:', error);
    return res.status(500).json({ error: 'Error al obtener artesania wayuu' });
  }
});

app.post('/artesanias-wayuu', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, artesana, precio, categoria } = req.body;
    const imagenUrl = buildImagePath(req.file);

    if (!nombre || !artesana || !precio || !categoria) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }

    if (!imagenUrl) {
      return res.status(400).json({ error: 'La imagen es obligatoria' });
    }

    const [result] = await pool.query(
      'INSERT INTO artesanias_wayuu (nombre, artesana, precio, categoria, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, artesana, precio, categoria, imagenUrl]
    );

    const [nueva] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      mensaje: 'Artesania wayuu creada',
      artesania: normalizeArtesania(req, nueva[0]),
    });
  } catch (error) {
    console.error('Error creando artesania:', error);
    if (req.file) {
      removeImageFile(buildImagePath(req.file));
    }

    return res.status(500).json({
      error:
        error instanceof Error
          ? `Error al crear artesania wayuu: ${error.message}`
          : 'Error al crear artesania wayuu',
    });
  }
});

app.put('/artesanias-wayuu/:id', upload.single('imagen'), async (req, res) => {
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
      if (req.file) {
        removeImageFile(buildImagePath(req.file));
      }

      return res.status(404).json({ error: 'Artesania wayuu no encontrada' });
    }

    const imagenAnterior = existe[0].imagen_url;
    const nuevaImagen = buildImagePath(req.file) || imagenAnterior || null;

    await pool.query(
      'UPDATE artesanias_wayuu SET nombre = ?, artesana = ?, precio = ?, categoria = ?, imagen_url = ? WHERE id = ?',
      [nombre, artesana, precio, categoria, nuevaImagen, id]
    );

    const [actualizada] = await pool.query(
      'SELECT * FROM artesanias_wayuu WHERE id = ?',
      [id]
    );

    if (req.file && imagenAnterior && imagenAnterior !== nuevaImagen) {
      removeImageFile(imagenAnterior);
    }

    return res.json({
      mensaje: 'Artesania wayuu actualizada',
      artesania: normalizeArtesania(req, actualizada[0]),
    });
  } catch (error) {
    console.error('Error actualizando artesania:', error);
    if (req.file) {
      removeImageFile(buildImagePath(req.file));
    }

    return res.status(500).json({
      error:
        error instanceof Error
          ? `Error al actualizar artesania wayuu: ${error.message}`
          : 'Error al actualizar artesania wayuu',
    });
  }
});

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
    removeImageFile(existe[0].imagen_url);

    return res.json({ mensaje: 'Artesania wayuu eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando artesania:', error);
    return res.status(500).json({ error: 'Error al eliminar artesania wayuu' });
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'La imagen no puede superar 5 MB' });
  }

  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
