import { useState, useEffect } from 'react';

function ReminderEditor({ reminder, onUpdate, onClose }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setDate(reminder.date);
      setContent(reminder.content);
    }
  }, [reminder]);

  const handleSave = () => {
    onUpdate({ ...reminder, title, date, content });
  };

  return (
    <div className="editor-card">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Contenido" />
      <button onClick={handleSave}>Guardar</button>
      <button onClick={onClose}>Cerrar</button>
    </div>
  );
}

export default ReminderEditor;
