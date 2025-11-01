// backend/server.js
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;

// Configurar PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Acceso denegado' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Token inválido' });
  }
};

/* ---------- RUTAS DE AUTENTICACIÓN ---------- */
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password requeridos' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id', [email, hashedPassword]);
    res.status(201).json({ message: 'Usuario registrado', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') res.status(400).json({ error: 'Email ya existe' });
    else res.status(500).json({ error: 'Error en registro' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Usuario no encontrado' });
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Password incorrecta' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Error en login' });
  }
});

/* ---------- RUTAS PROTEGIDAS PARA ITEMS ---------- */
const getAll = async (type, userId) => {
  const result = await pool.query(`SELECT * FROM ${type} WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);
  return result.rows;
};

const getById = async (type, id, userId) => {
  const result = await pool.query(`SELECT * FROM ${type} WHERE id = $1 AND user_id = $2`, [id, userId]);
  return result.rows[0] || null;
};

const createItem = async (type, item, userId) => {
  const { title, content, date, image } = item;
  const result = await pool.query(
    `INSERT INTO ${type} (user_id, title, content, date, image) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, title, content, date, image]
  );
  return result.rows[0];
};

const updateItem = async (type, id, updates, userId) => {
  const { title, content, date, image } = updates;
  const result = await pool.query(
    `UPDATE ${type} SET title = $1, content = $2, date = $3, image = $4 WHERE id = $5 AND user_id = $6 RETURNING *`,
    [title, content, date, image, id, userId]
  );
  return result.rows[0] || null;
};

const deleteItem = async (type, id, userId) => {
  await pool.query(`DELETE FROM ${type} WHERE id = $1 AND user_id = $2`, [id, userId]);
  return true;
};

['notes', 'reminders', 'drawings'].forEach(type => {
  app.get(`/api/${type}`, authenticateToken, async (req, res) => {
    try {
      const list = await getAll(type, req.user.id);
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener items' });
    }
  });

  app.get(`/api/${type}/:id`, authenticateToken, async (req, res) => {
    try {
      const item = await getById(type, req.params.id, req.user.id);
      if (!item) return res.status(404).json({ error: 'No encontrado' });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener item' });
    }
  });

  app.post(`/api/${type}`, authenticateToken, async (req, res) => {
    try {
      const created = await createItem(type, req.body, req.user.id);
      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: 'Error al crear item' });
    }
  });

  app.put(`/api/${type}/:id`, authenticateToken, async (req, res) => {
    try {
      const updated = await updateItem(type, req.params.id, req.body, req.user.id);
      if (!updated) return res.status(404).json({ error: 'No encontrado' });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar' });
    }
  });

  app.delete(`/api/${type}/:id`, authenticateToken, async (req, res) => {
    try {
      await deleteItem(type, req.params.id, req.user.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar' });
    }
  });
});

app.get('/api', (req, res) => {
  res.json({ ok: true, message: 'PixelNote API con PostgreSQL y auth', version: '2.0' });
});

app.listen(PORT, () => {
  console.log(`PixelNote API con PostgreSQL escuchando en http://localhost:${PORT}/api`);
});