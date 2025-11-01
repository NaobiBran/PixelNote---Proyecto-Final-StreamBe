// backend/initDb.js
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

const initial = {
  notes: [
    {
      id: Date.now(),
      title: "Bienvenida a PixelNote",
      content: "Esta es una nota de ejemplo. Podés editarla o eliminarla.",
      image: null, // dataURL si tenés dibujo
      createdAt: new Date().toISOString()
    }
  ],
  reminders: [
    {
      id: Date.now() + 1,
      title: "Recordatorio de ejemplo",
      date: "",
      content: "Este es un recordatorio de prueba.",
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
