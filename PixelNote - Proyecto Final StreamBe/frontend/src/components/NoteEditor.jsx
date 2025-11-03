import { useState, useEffect } from 'react';

function NoteEditor({ item, onUpdate, onDelete, onEditDrawing }) {
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
    if (item) {
      onUpdate({ ...item, title, content, date });
    }
  };

  const remove = () => {
    if (item) onDelete(item.id);
  };

  const editDrawing = () => {
    if (item && onEditDrawing) {
      onEditDrawing(item);
    }
  };

  if (!item) return <div className="editor"><p>Seleccione una nota o recordatorio</p></div>;

  const itemType = item.image ? 'dibujo' : 
                   item.date ? 'recordatorio' : 'nota';

  return (
    <div className="editor">
      <h3>
        {item.isTemp ? 'Crear ' : 'Editar '}
        {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
        {item.isTemp && ' (No guardado)'}
      </h3>
      
      {itemType !== 'dibujo' && (
        <>
          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          
          {itemType === 'recordatorio' && (
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          )}
          
          <textarea
            placeholder={itemType === 'nota' ? 'Contenido' : 'Detalles del recordatorio'}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows="6"
          />
          
          <button onClick={save}>
            {item.isTemp ? 'Guardar' : 'Actualizar'}
          </button>
          <button onClick={remove} style={{ marginLeft: '10px', backgroundColor: '#f88' }}>
            {item.isTemp ? 'Cancelar' : 'Eliminar'}
          </button>
        </>
      )}
      
      {itemType === 'dibujo' && item.image && (
        <div>
          <p>¿Quieres modificar este dibujo?</p>
          <img 
            src={item.image} 
            alt="Dibujo" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '200px', 
              borderRadius: '8px',
              border: '2px solid #867dc9',
              marginBottom: '15px'
            }} 
          />
          <button onClick={editDrawing} style={{ backgroundColor: '#8ac926' }}>
            Editar Dibujo
          </button>
          <button onClick={remove} style={{ marginLeft: '10px', backgroundColor: '#f88' }}>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default NoteEditor;