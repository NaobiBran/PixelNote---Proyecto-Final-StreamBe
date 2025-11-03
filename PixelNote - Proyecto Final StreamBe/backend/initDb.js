// backend/initDb.js
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

const initial = {
  notes: [
    {
      id: Date.now(),
      title: "Bienvenida a PixelNote",
      content: "Nota",
      image: null, 
      createdAt: new Date().toISOString()
    }
  ],
  reminders: [
    {
      id: Date.now() + 1,
      title: "Recordatorio",
      date: "",
      content: "recordatorio",
      createdAt: new Date().toISOString()
    }
  ]
};

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2), 'utf8');
  console.log('db.json creado con datos iniciales en:', dbPath);
} else {
  console.log('db.json ya existe en:', dbPath);
}
