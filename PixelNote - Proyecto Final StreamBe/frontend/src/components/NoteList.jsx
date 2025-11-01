function NoteList({ notes, onSelect, onDelete, onAdd }) {
  return (
    <div className="note-list">
      <h2>Mis Notas</h2>
      <button onClick={onAdd}>Agregar Nota</button>
      {notes.map(note => (
        <div key={note.id} className="note-item" onClick={() => onSelect(note)}>
          <h3>{note.title}</h3>
          <p>{note.content.substring(0, 50)}...</p>
          <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}

export default NoteList;