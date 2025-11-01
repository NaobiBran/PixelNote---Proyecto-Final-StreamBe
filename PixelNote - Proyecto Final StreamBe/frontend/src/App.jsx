import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaTrash } from 'react-icons/fa';
import Header from './components/Header';
import NoteEditor from './components/NoteEditor';
import PixelCanvas from './components/PixelCanvas';
import Auth from './components/Auth';

const API_BASE = 'http://localhost:4000/api';  // Cambia a tu URL de producción, ej: https://tu-backend.onrender.com/api

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [view, setView] = useState('notes');
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const tracks = ['/lofi1.mp3', '/lofi2.mp3', '/lofi3.mp3'];
  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    if (token) {
      setUser(JSON.parse(localStorage.getItem('user')));
      loadItems();
    }
  }, [token]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    audio.src = tracks[currentTrack];
    if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    else audio.pause();
    const endedHandler = () => setCurrentTrack((prev) => (prev + 1) % tracks.length);
    audio.addEventListener('ended', endedHandler);
    return () => audio.removeEventListener('ended', endedHandler);
  }, [currentTrack, isPlaying]);

  const loadItems = async () => {
    try {
      const [notesRes, remindersRes, drawingsRes] = await Promise.all([
        fetch(`${API_BASE}/notes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/reminders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/drawings`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const notes = await notesRes.json();
      const reminders = await remindersRes.json();
      const drawings = await drawingsRes.json();
      setItems([...notes, ...reminders, ...drawings]);
    } catch (err) {
      console.error('Error cargando items:', err);
    }
  };

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setItems([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const addItem = async (type) => {
    const newItem = { title: '', content: '', date: type === 'reminders' ? '' : null, image: type === 'drawings' ? null : undefined };
    try {
      const res = await fetch(`${API_BASE}/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newItem),
      });
      const created = await res.json();
      setItems([...items, created]);
      setSelectedItem(created);
    } catch (err) {
      console.error('Error creando item:', err);
    }
  };

  const updateItem = async (updatedItem) => {
    const type = updatedItem.image ? 'drawings' : (updatedItem.date ? 'reminders' : 'notes');
    try {
      const res = await fetch(`${API_BASE}/${type}/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedItem),
      });
      const updated = await res.json();
      setItems(items.map(item => item.id === updated.id ? updated : item));
    } catch (err) {
      console.error('Error actualizando item:', err);
    }
  };

  const deleteItem = async (id) => {
    const item = items.find(i => i.id === id);
    const type = item.image ? 'drawings' : (item.date ? 'reminders' : 'notes');
    try {
      await fetch(`${API_BASE}/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      console.error('Error eliminando item:', err);
    }
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="app">
      <audio ref={audioRef} loop />
      <button className="play-music" onClick={() => setIsPlaying(!isPlaying)} aria-label="Reproducir / pausar música">
        {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
      </button>
      <button onClick={handleLogout} style={{ position: 'fixed', top: 20, left: 20, background: '#f88', color: 'white', border: 'none', padding: '10px', borderRadius: '8px' }}>Logout</button>

      <Header setView={setView} />

      {view === "notes" && (
        <div>
          <div className="buttons-add">
            <button onClick={() => addItem('notes')}>Agregar Nota</button>
            <button onClick={() => addItem('reminders')}>Agregar Recordatorio</button>
          </div>

          <div className="grid-container">
            {items.length === 0 && <p>No hay items. ¡Agrega uno!</p>}
            {items.map((item) => (
              <div
                key={item.id}
                className={`grid-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                {item.image ? (
                  <img src={item.image} alt="dibujo" style={{ width: '100%', borderRadius: '8px' }} />
                ) : (
                  <>
                    <h4>{item.title || 'Sin título'}</h4>
                    {item.date && <p className="date-text">{item.date}</p>}
                    <p>{item.content?.substring(0, 120)}{item.content?.length > 120 ? '...' : ''}</p>
                  </>
                )}
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem(item.id);
                  }}
                  aria-label="Eliminar item"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>

          <div className="editor-area">
            {selectedItem ? (
              <NoteEditor item={selectedItem} onUpdate={updateItem} onDelete={deleteItem} />
            ) : (
              <p>Selecciona una nota, recordatorio o dibujo para editar</p>
            )}
          </div>
        </div>
      )}

      {view === 'draw' && <PixelCanvas onAddDrawing={async (dataURL) => {
        const newDrawing = {
          title: 'Dibujo guardado',
          content: '',
          date: null,
          image: dataURL,
        };
        try {
          const res = await fetch(`${API_BASE}/drawings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(newDrawing),
          });
          const created = await res.json();
          setItems([...items, created]);
        } catch (err) {
          console.error('Error guardando dibujo:', err);
        }
      }} />}
    </div>
  );
}

export default App;