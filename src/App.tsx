import { useState, useRef, useEffect } from 'react';
import './App.css';
import MadorizuComponent from './components/MadorizuComponent';
import type { Marker, MadorizuComponentRef } from './components/MadorizuComponent';

function App() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [imageData, setImageData] = useState<string>('');
  const madorizuRef = useRef<MadorizuComponentRef>(null);

  // 画像ファイルをbase64エンコードする
  useEffect(() => {
    const loadImageAsBase64 = async () => {
      try {
        const response = await fetch('/madorizu.jpg');
        const blob = await response.blob();
        
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('画像の読み込みに失敗しました:', error);
        return '';
      }
    };

    loadImageAsBase64().then(base64Data => {
      setImageData(base64Data);
    });
  }, []);

  const handleMarkersChange = (newMarkers: Marker[]) => {
    setMarkers(newMarkers);
  };

  const handleRemoveMarker = (markerId: number) => {
    if (madorizuRef.current) {
      madorizuRef.current.removeMarker(markerId);
    }
  };

  return (
    <>
      <h1>Vite + React</h1>
      <div className="card">
        <MadorizuComponent 
          ref={madorizuRef}
          imageData={imageData}
          markers={markers}
          onMarkersChange={handleMarkersChange}
        />
      </div>
      
      {/* マーカー一覧を表示 */}
      {markers.length > 0 && (
        <div className="card">
          <h3>マーカー一覧</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '10px',
            marginTop: '10px'
          }}>
            {markers.map((marker) => (
              <div 
                key={marker.id}
                style={{
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>マーカー {marker.id}</strong>
                  <br />
                  座標: ({marker.x.toFixed(1)}%, {marker.y.toFixed(1)}%)
                </div>
                <button
                  onClick={() => handleRemoveMarker(marker.id)}
                  style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
