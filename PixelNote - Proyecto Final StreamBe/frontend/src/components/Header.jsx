function Header({ setView, currentView }) {
  return (
    <div className="header">
      <h1>PixelNote</h1>
      <nav>
        <button 
          onClick={() => setView('notes')}
          style={{ 
            backgroundColor: currentView === 'notes' ? '#6a5cc0' : '#b2a6d9' 
          }}
        >
          Notas
        </button>
        <button 
          onClick={() => setView('draw')}
          style={{ 
            backgroundColor: currentView === 'draw' ? '#6a5cc0' : '#b2a6d9' 
          }}
        >
          Dibujar
        </button>
      </nav>
    </div>
  );
}

export default Header;