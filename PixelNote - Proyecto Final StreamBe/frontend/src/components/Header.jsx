function Header({ setView }) {
  return (
    <header className="header">
      <h1>PixelNote</h1>
      <nav>
        <button onClick={() => setView('notes')}>Notas y Recordatorios</button>
        <button onClick={() => setView('draw')}>Dibujar</button>
      </nav>
    </header>
  );
}

export default Header;