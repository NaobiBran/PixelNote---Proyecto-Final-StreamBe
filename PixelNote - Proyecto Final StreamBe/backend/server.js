// backend/server.js - VERSIÓN SQLITE
require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const morgan = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'pixelnote_secret';
const DB_PATH = path.join(__dirname, 'pixelnote.db');

// Conectar a SQLite (archivo de base de datos)
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err);
  } else {
    console.log('Conectado a SQLite database');
    initDatabase();
  }
});

// Crear tablas si no existen
function initDatabase() {
  db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de notas
    db.run(`CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Tabla de recordatorios
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Tabla de dibujos
    db.run(`CREATE TABLE IF NOT EXISTS drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    console.log('Tablas creadas/verificadas correctamente');
  });
}

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
    
    db.run('INSERT INTO users (email, password_hash) VALUES (?, ?)', 
      [email, hashedPassword], 
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email ya existe' });
          }
          return res.status(500).json({ error: 'Error en registro' });
        }
        res.status(201).json({ message: 'Usuario registrado', userId: this.lastID });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Error en registro' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  // ✅ AGREGAR ESTOS CONSOLE.LOG
  console.log('🔑 INTENTANDO LOGIN con email:', email);
  console.log('🔑 Password recibida:', password);
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.log('❌ ERROR en la consulta DB:', err);
      return res.status(500).json({ error: 'Error en login' });
    }
    
    // ✅ AGREGAR ESTOS CONSOLE.LOG
    console.log('👤 Usuario encontrado en DB:', user);
    
    if (!user) {
      console.log('❌ Usuario NO encontrado en DB');
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }
    
    try {
      // ✅ AGREGAR ESTOS CONSOLE.LOG
      console.log('🔐 Comparando contraseñas...');
      console.log('🔐 Hash en DB:', user.password_hash);
      console.log('🔐 Password recibida:', password);
      
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      // ✅ AGREGAR ESTOS CONSOLE.LOG
      console.log('🔐 Resultado de comparación:', validPassword);
      
      if (!validPassword) {
        console.log('❌ CONTRASEÑA INCORRECTA');
        return res.status(400).json({ error: 'Password incorrecta' });
      }
      
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
      console.log('✅ LOGIN EXITOSO - Token generado');
      
      res.json({ 
        token, 
        user: { id: user.id, email: user.email } 
      });
    } catch (err) {
      console.log('❌ ERROR en bcrypt.compare:', err);
      res.status(500).json({ error: 'Error en login' });
    }
  });
});

/* ---------- RUTAS PROTEGIDAS ---------- */

// Obtener todos los items de un tipo
const getAllItems = (type, userId, callback) => {
  db.all(`SELECT * FROM ${type} WHERE user_id = ? ORDER BY created_at DESC`, [userId], callback);
};

// Obtener item por ID
const getItemById = (type, id, userId, callback) => {
  db.get(`SELECT * FROM ${type} WHERE id = ? AND user_id = ?`, [id, userId], callback);
};

// Crear item
const createItem = (type, item, userId, callback) => {
  const { title, content, date, image } = item;
  const columns = ['user_id', 'title', 'content'];
  const values = [userId, title || '', content || ''];
  
  if (type === 'reminders') {
    columns.push('date');
    values.push(date || '');
  }
  if (type === 'drawings') {
    columns.push('image');
    values.push(image || '');
  }
  
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${type} (${columns.join(', ')}) VALUES (${placeholders})`;
  
  db.run(sql, values, function(err) {
    if (err) return callback(err);
    
    // Devolver el item creado
    db.get(`SELECT * FROM ${type} WHERE id = ?`, [this.lastID], (err, row) => {
      callback(err, row);
    });
  });
};

// Actualizar item
const updateItem = (type, id, updates, userId, callback) => {
  const { title, content, date, image } = updates;
  const updatesArr = [];
  const values = [];
  
  if (title !== undefined) { updatesArr.push('title = ?'); values.push(title); }
  if (content !== undefined) { updatesArr.push('content = ?'); values.push(content); }
  if (date !== undefined) { updatesArr.push('date = ?'); values.push(date); }
  if (image !== undefined) { updatesArr.push('image = ?'); values.push(image); }
  
  if (updatesArr.length === 0) {
    return callback(new Error('No hay campos para actualizar'));
  }
  
  values.push(id, userId);
  const sql = `UPDATE ${type} SET ${updatesArr.join(', ')} WHERE id = ? AND user_id = ?`;
  
  db.run(sql, values, function(err) {
    if (err) return callback(err);
    
    if (this.changes === 0) {
      return callback(new Error('No encontrado'));
    }
    
    // Devolver el item actualizado
    db.get(`SELECT * FROM ${type} WHERE id = ?`, [id], (err, row) => {
      callback(err, row);
    });
  });
};

// Eliminar item
const deleteItem = (type, id, userId, callback) => {
  db.run(`DELETE FROM ${type} WHERE id = ? AND user_id = ?`, [id, userId], function(err) {
    if (err) return callback(err);
    callback(null, this.changes > 0);
  });
};

// Rutas para notes, reminders, drawings
['notes', 'reminders', 'drawings'].forEach(type => {
  // GET todos los items
  app.get(`/api/${type}`, authenticateToken, (req, res) => {
    getAllItems(type, req.user.id, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener items' });
      res.json(rows);
    });
  });

  // GET item por ID
  app.get(`/api/${type}/:id`, authenticateToken, (req, res) => {
    getItemById(type, req.params.id, req.user.id, (err, row) => {
      if (err) return res.status(500).json({ error: 'Error al obtener item' });
      if (!row) return res.status(404).json({ error: 'No encontrado' });
      res.json(row);
    });
  });

  // POST crear item
  app.post(`/api/${type}`, authenticateToken, (req, res) => {
    createItem(type, req.body, req.user.id, (err, created) => {
      if (err) return res.status(500).json({ error: 'Error al crear item' });
      res.status(201).json(created);
    });
  });

  // PUT actualizar item
  app.put(`/api/${type}/:id`, authenticateToken, (req, res) => {
    updateItem(type, req.params.id, req.body, req.user.id, (err, updated) => {
      if (err) {
        if (err.message === 'No encontrado') {
          return res.status(404).json({ error: 'No encontrado' });
        }
        return res.status(500).json({ error: 'Error al actualizar' });
      }
      res.json(updated);
    });
  });

  // DELETE eliminar item
  app.delete(`/api/${type}/:id`, authenticateToken, (req, res) => {
    deleteItem(type, req.params.id, req.user.id, (err, deleted) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar' });
      if (!deleted) return res.status(404).json({ error: 'No encontrado' });
      res.json({ ok: true });
    });
  });
});

// Ruta de prueba
app.get('/api', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'PixelNote API con SQLite', 
    version: '2.0',
    database: 'SQLite' 
  });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  console.log('✅ Token verificado para usuario:', req.user);
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 PixelNote API con SQLite en http://localhost:${PORT}/api`);
  console.log(`📁 Base de datos: ${DB_PATH}`);
});