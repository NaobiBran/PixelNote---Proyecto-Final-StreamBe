import { useRef, useEffect, useState } from 'react';

const COLORS = ['#ffb3ba', '#ffffba', '#baffc9', '#bae1ff', '#d7bfff', '#ffffff', '#000000', '#ffb7b2'];

function PixelCanvas({ onAddDrawing, existingDrawing }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [isErasing, setIsErasing] = useState(false);
  const pixelSize = 12;
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Limpiar canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Si hay un dibujo existente, cargarlo
    if (existingDrawing && existingDrawing.image) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = existingDrawing.image;
    }
  }, [existingDrawing]);

  const drawPixel = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const px = Math.floor(x / pixelSize) * pixelSize;
    const py = Math.floor(y / pixelSize) * pixelSize;
    ctx.fillStyle = isErasing ? '#ffffff' : color;
    ctx.fillRect(px, py, pixelSize, pixelSize);
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    drawPixel(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleMouseMove = (e) => {
    if (isDrawing) {
      drawPixel(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    onAddDrawing(dataURL, existingDrawing); // Pasar el dibujo existente si hay
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="pixel-canvas-container">
      <h2>{existingDrawing ? 'Editar Dibujo' : 'Crear Dibujo'}</h2>
      <div style={{ marginBottom: '15px' }}>
        {COLORS.map(c => (
          <button 
            key={c} 
            onClick={() => { setColor(c); setIsErasing(false); }} 
            style={{ 
              backgroundColor: c, 
              width: 30, 
              height: 30, 
              border: c === color && !isErasing ? '3px solid #333' : '1px solid #ccc', 
              marginRight: 5, 
              cursor: 'pointer' 
            }} 
          />
        ))}
        <button 
          onClick={() => setIsErasing(true)} 
          style={{ 
            border: isErasing ? '3px solid #333' : '1px solid #ccc', 
            marginLeft: 10, 
            cursor: 'pointer', 
            padding: '5px 10px', 
            fontWeight: '700' 
          }}
        >
          Borrar
        </button>
        <button onClick={clearCanvas} style={{ marginLeft: 10, padding: '5px 10px' }}>
          Limpiar
        </button>
      </div>
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={400} 
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ 
          border: '2px solid #8ac926', 
          marginTop: 10, 
          cursor: isErasing ? 'crosshair' : 'pointer' 
        }} 
      />
      <div style={{ marginTop: '15px' }}>
        <button onClick={saveDrawing} style={{ padding: '10px 20px', fontSize: '1rem' }}>
          {existingDrawing ? 'Actualizar Dibujo' : 'Guardar Dibujo'}
        </button>
      </div>
    </div>
  );
}

export default PixelCanvas;