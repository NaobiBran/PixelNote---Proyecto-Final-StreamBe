import { useState, useEffect } from 'react';

function NoteEditor({ item, onUpdate, onDelete }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title || '');
      setContent(item.content || '');
      setDate(item.date || '');
    }
  }, [item]);

  const save = () => {
    if (item) onUpdate({ ...item, title, content, date });
  };

  const remove = () => {
    if (item) onDelete(item.id);
  };

  if (!item) return <div className="editor"><p>Seleccione una nota o recordatorio</p></div>;

  return (
    <div className="editor">
      <h3>{item.type === 'nota' ? 'Editar Nota' : 'Editar Recordatorio'}</h3>
      <input
        type="text"
        placeholder="Título"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      {item.type === 'recordatorio' && (
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      )}
      <textarea
        placeholder={item.type === 'nota' ? 'Contenido' : 'Detalles del recordatorio'}
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <button onClick={save}>Guardar</button>
      <button onClick={remove} style={{ marginLeft: '10px', backgroundColor: '#f88' }}>Eliminar</button>
    </div>
  );
}

export default NoteEditor;