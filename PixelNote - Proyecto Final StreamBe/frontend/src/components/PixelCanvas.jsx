import { useRef, useEffect, useState } from 'react';

const COLORS = ['#ffb3ba', '#ffffba', '#baffc9', '#bae1ff', '#d7bfff', '#ffffff', '#000000', '#ffb7b2'];

function PixelCanvas({ onAddDrawing }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState(COLORS[0]);
  const [isErasing, setIsErasing] = useState(false);
  const pixelSize = 12;
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

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
    onAddDrawing(dataURL);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="pixel-canvas-container">
      <h2>Dibuja Pixel Art</h2>
      <div>
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); setIsErasing(false); }} style={{ backgroundColor: c, width: 30, height: 30, border: c === color && !isErasing ? '3px solid #333' : '1px solid #ccc', marginRight: 5, cursor: 'pointer' }} />
        ))}
        <button onClick={() => setIsErasing(true)} style={{ border: isErasing ? '3px solid #333' : '1px solid #ccc', marginLeft: 10, cursor: 'pointer', padding: '5px 10px', fontWeight: '700' }}>
          Borrar
        </button>
        <button onClick={saveDrawing} style={{ marginLeft: 10, padding: '5px 10px' }}>
          Guardar Dibujo
        </button>
      </div>
      <canvas ref={canvasRef} width={400} height={400} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onMouseMove={handleMouseMove} style={{ border: '2px solid #8ac926', marginTop: 10, cursor: isErasing ? 'crosshair' : 'pointer' }} />
    </div>
  );
}

export default PixelCanvas;
