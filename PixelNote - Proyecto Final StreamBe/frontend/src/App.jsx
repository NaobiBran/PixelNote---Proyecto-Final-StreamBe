import { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaTrash } from 'react-icons/fa';
import Header from './components/Header';
import NoteEditor from './components/NoteEditor';
import PixelCanvas from './components/PixelCanvas';
import Auth from './components/Auth';

const API_BASE = 'http://localhost:4000/api';

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
  const [editingDrawing, setEditingDrawing] = useState(null);

  // Verificar token al cargar
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
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
    if (!token) return;
    
    try {
      console.log('🔄 Cargando items...');
      
      const [notesRes, remindersRes, drawingsRes] = await Promise.all([
        fetch(`${API_BASE}/notes`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${API_BASE}/reminders`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
        fetch(`${API_BASE}/drawings`, { 
          headers: { Authorization: `Bearer ${token}` } 
        }),
      ]);

      if (notesRes.ok && remindersRes.ok && drawingsRes.ok) {
        const notes = await notesRes.json();
        const reminders = await remindersRes.json();
        const drawings = await drawingsRes.json();
        
        console.log('✅ Items cargados:', { notes, reminders, drawings });
        
        // Agregar tipo a cada item para identificarlos
        const notesWithType = notes.map(item => ({ ...item, type: 'note' }));
        const remindersWithType = reminders.map(item => ({ ...item, type: 'reminder' }));
        const drawingsWithType = drawings.map(item => ({ ...item, type: 'drawing' }));
        
        setItems([...notesWithType, ...remindersWithType, ...drawingsWithType]);
      } else {
        console.error('❌ Error cargando items');
        if (notesRes.status === 401 || remindersRes.status === 401 || drawingsRes.status === 401) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error('❌ Error cargando items:', err);
    }
  };

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    loadItems();
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setItems([]);
    setSelectedItem(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

const addItem = async (type) => {
  if (!token) return;
  
  // Si es dibujar, cambiar a la vista de dibujo
  if (type === 'drawings') {
    setView('draw');
    return;
  }
  
  // Crear un item temporal LOCAL (no en la base de datos aún)
  const tempId = 'temp-' + Date.now(); // ID temporal
  
  const newItem = { 
    id: tempId, // ID temporal
    title: type === 'notes' ? 'Nueva Nota' : 'Nuevo Recordatorio', 
    content: '', 
    date: type === 'reminders' ? new Date().toISOString().split('T')[0] : '', 
    type: type === 'notes' ? 'note' : 'reminder',
    isTemp: true // Marcar como temporal
  };
  
  console.log('➕ Preparando nuevo item:', type);
  
  // Agregar a la lista localmente (no hacer fetch aún)
  setItems([...items, newItem]);
  setSelectedItem(newItem);
};

const updateItem = async (updatedItem) => {
  if (!token) return;
  
  console.log('✏️ Intentando actualizar:', updatedItem);
  
  // Si es un item temporal, CREARLO en la base de datos
  if (updatedItem.isTemp) {
    const type = updatedItem.date ? 'reminders' : 'notes';
    
    try {
      console.log('💾 Guardando NUEVO item en BD:', type);
      
      const res = await fetch(`${API_BASE}/${type}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: updatedItem.title || 'Sin título',
          content: updatedItem.content || '',
          date: updatedItem.date || ''
        }),
      });
      
      if (res.ok) {
        const created = await res.json();
        console.log('✅ Nuevo item guardado:', created);
        
        // Reemplazar el item temporal con el real
        setItems(items.map(item => 
          item.id === updatedItem.id ? { ...created, type: type.slice(0, -1) } : item
        ));
        setSelectedItem({ ...created, type: type.slice(0, -1) });
        loadItems();
      } else {
        console.error('❌ Error guardando nuevo item:', res.status);
      }
    } catch (err) {
      console.error('❌ Error guardando nuevo item:', err);
    }
  } else {
    // Item existente - ACTUALIZAR en la base de datos
    const type = updatedItem.image ? 'drawings' : 
                 updatedItem.date ? 'reminders' : 'notes';
    
    try {
      console.log('🔄 Actualizando item existente:', updatedItem.id, type);
      
      // Preparar datos para enviar (solo los campos necesarios)
      const updateData = {
        title: updatedItem.title || '',
        content: updatedItem.content || ''
      };
      
      // Solo agregar date si es un recordatorio
      if (type === 'reminders') {
        updateData.date = updatedItem.date || '';
      }
      
      // Solo agregar image si es un drawing
      if (type === 'drawings') {
        updateData.image = updatedItem.image || '';
      }
      
      const res = await fetch(`${API_BASE}/${type}/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(updateData),
      });
      
      console.log('📨 Response status:', res.status);
      
      if (res.ok) {
        const updated = await res.json();
        console.log('✅ Item actualizado en BD:', updated);
        
        // Actualizar en el estado local
        setItems(items.map(item => 
          item.id === updated.id ? { ...updated, type: item.type } : item
        ));
        
        // También actualizar el item seleccionado
        setSelectedItem({ ...updated, type: updatedItem.type });
        
        // Recargar para asegurar
        setTimeout(() => loadItems(), 100);
        
      } else {
        const errorText = await res.text();
        console.error('❌ Error actualizando item:', res.status, errorText);
        if (res.status === 401) handleLogout();
      }
    } catch (err) {
      console.error('❌ Error en updateItem:', err);
    }
  }
};

 const deleteItem = async (id) => {
  if (!token) return;
  
  const item = items.find(i => i.id === id);
  if (!item) return;
  
  // Si es un item temporal, solo eliminarlo localmente
  if (item.isTemp) {
    console.log('🗑️ Eliminando item temporal:', id);
    setItems(items.filter(item => item.id !== id));
    if (selectedItem?.id === id) setSelectedItem(null);
    return;
  }
  
  // Item de la BD, eliminarlo normalmente
  const type = item.image ? 'drawings' : 
               item.date ? 'reminders' : 'notes';
  
  try {
    console.log('🗑️ Eliminando item de BD:', id, type);
    
    const res = await fetch(`${API_BASE}/${type}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (res.ok) {
      console.log('✅ Item eliminado de BD');
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      loadItems();
    } else {
      console.error('❌ Error eliminando item:', res.status);
      if (res.status === 401) handleLogout();
    }
  } catch (err) {
    console.error('❌ Error eliminando item:', err);
  }
};
  const handleEditDrawing = (drawingItem) => {
    console.log('🎨 Editando dibujo:', drawingItem);
    setEditingDrawing(drawingItem);
    setView('draw');
  };

  const handleAddDrawing = async (dataURL, existingDrawing = null) => {
  if (!token) return;
  
  if (existingDrawing) {
    // ACTUALIZAR dibujo existente
    console.log('🔄 Actualizando dibujo existente:', existingDrawing.id);
    try {
      const res = await fetch(`${API_BASE}/drawings/${existingDrawing.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: existingDrawing.title || 'Dibujo Actualizado',
          content: existingDrawing.content || '',
          image: dataURL
        }),
      });
      
      if (res.ok) {
        const updated = await res.json();
        console.log('✅ Dibujo actualizado:', updated);
        setItems(items.map(item => item.id === existingDrawing.id ? { ...updated, type: 'drawing' } : item));
        setEditingDrawing(null); // Limpiar
        setView('notes'); // Volver a notas
        loadItems();
      }
    } catch (err) {
      console.error('❌ Error actualizando dibujo:', err);
    }
  } else {
    // CREAR nuevo dibujo (código existente)
    const tempId = 'temp-' + Date.now();
    const newDrawing = {
      id: tempId,
      title: 'Mi Dibujo',
      content: 'Dibujo creado en PixelCanvas',
      image: dataURL,
      type: 'drawing',
      isTemp: true
    };
    
    console.log('🎨 Preparando nuevo dibujo temporal');
    setItems([...items, newDrawing]);
    setSelectedItem(newDrawing);
    setView('notes');
  }
};

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="app">
      <audio ref={audioRef} loop />
      <button className="play-music" onClick={() => setIsPlaying(!isPlaying)} aria-label="Reproducir / pausar música">
        {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
      </button>
      
      <button onClick={handleLogout} className="logout-button">
        Cerrar Sesión
      </button>

      <Header setView={setView} currentView={view} />

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
                {item.image && item.type === 'drawing' ? (
                  <img src={item.image} alt="dibujo" style={{ width: '100%', borderRadius: '8px', maxHeight: '150px', objectFit: 'cover' }} />
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
              <NoteEditor item={selectedItem} onUpdate={updateItem} onDelete={deleteItem} onEditDrawing={handleEditDrawing} />
            ) : (
              <p>Selecciona una nota, recordatorio o dibujo para editar</p>
            )}
          </div>
        </div>
      )}

      {view === 'draw' && (
        <PixelCanvas onAddDrawing={handleAddDrawing} existingDrawing={editingDrawing} />
      )}
    </div>
  );
}

export default App;