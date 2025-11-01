function ReminderList({ reminders, onSelect, onDelete }) {
  return (
    <div className="item-grid">
      {reminders.map(rem => (
        <div key={rem.id} className="item-card reminder-card" onClick={() => onSelect(rem)}>
          <h3>{rem.title}</h3>
          <p>{rem.date} - {rem.content.substring(0, 100)}...</p>
          <button onClick={(e) => { e.stopPropagation(); onDelete(rem.id); }} className="delete-button">
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}

export default ReminderList;
