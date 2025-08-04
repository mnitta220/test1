import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface MadorizuComponentProps {
  imagePath: string;
  onMarkersChange?: (markers: Marker[]) => void;
}

interface Marker {
  id: number;
  x: number;
  y: number;
}

export interface MadorizuComponentRef {
  removeMarker: (markerId: number) => void;
}

const MadorizuComponent = forwardRef<MadorizuComponentRef, MadorizuComponentProps>(({ 
  imagePath, 
  onMarkersChange
}, ref) => {
  const [showPlusButton, setShowPlusButton] = useState(true);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [markers, setMarkers] = useState<Marker[]>([]);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // マーカーが変更された時に親コンポーネントに通知
  useEffect(() => {
    if (onMarkersChange) {
      onMarkersChange(markers);
    }
  }, [markers, onMarkersChange]);

  // 外部からマーカーを削除する関数
  const removeMarker = (markerId: number) => {
    setMarkers(prevMarkers => {
      const filteredMarkers = prevMarkers.filter(marker => marker.id !== markerId);
      // 番号を振り直す
      return filteredMarkers.map((marker, index) => ({
        ...marker,
        id: index + 1
      }));
    });
  };

  // 親コンポーネントにremoveMarker関数を公開
  useImperativeHandle(ref, () => ({
    removeMarker
  }));

  useEffect(() => {
    const img = imageRef.current;
    if (img) {
      const handleLoad = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setImageWidth(width);
        setImageHeight(height);
        console.log('画像サイズ:', { width, height });
      };

      if (img.complete) {
        handleLoad();
      } else {
        img.addEventListener('load', handleLoad);
        return () => img.removeEventListener('load', handleLoad);
      }
    }
  }, [imagePath]);

  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  const handlePlusClick = () => {
    setShowPlusButton(false);
    setZoomLevel(2);
    setImagePosition({ x: 0, y: 0 }); // ズーム時に位置をリセット
  };

  const handleMinusClick = () => {
    setShowPlusButton(true);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 }); // ズームアウト時に位置をリセット
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 移動範囲を制限（画像の端まで移動可能）
      // コンテナサイズとズームレベルを考慮して計算
      const maxOffsetX = containerSize.width * (zoomLevel - 1) / 2;
      const maxOffsetY = containerSize.height * (zoomLevel - 1) / 2;
      
      // 画像のアスペクト比を考慮して縦方向の移動範囲を調整
      const imageAspectRatio = imageWidth / imageHeight;
      const containerAspectRatio = containerSize.width / containerSize.height;
      
      // アスペクト比の差に基づいて縦方向の移動範囲を調整
      const aspectRatioFactor = imageAspectRatio > containerAspectRatio ? 1.5 : 2.0;
      const adjustedMaxOffsetY = maxOffsetY * aspectRatioFactor;
      
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
      const clampedY = Math.max(-adjustedMaxOffsetY, Math.min(adjustedMaxOffsetY, newY));
      
      setImagePosition({
        x: clampedX,
        y: clampedY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (markers.length >= 20) return; // 最大20個まで

    const rect = e.currentTarget.getBoundingClientRect();
    
    // より簡単で正確なクリック位置計算
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // 有効な範囲内に制限
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    console.log('クリック位置:', {
      clientX: e.clientX,
      clientY: e.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      rectWidth: rect.width,
      rectHeight: rect.height,
      x,
      y,
      clampedX,
      clampedY
    });

    const newMarker: Marker = {
      id: markers.length + 1,
      x: clampedX,
      y: clampedY
    };

    setMarkers([...markers, newMarker]);
  };

  // 画像のアスペクト比を計算
  const aspectRatio = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
  const containerWidth = '100%';
  const containerHeight = imageWidth > 0 && imageHeight > 0 ? `calc(${containerWidth} / ${aspectRatio})` : '400px';

  return (
    <div className="madorizu-container">
      <div 
        ref={containerRef}
        id="image-container" 
        className="madorizu-image-container"
        style={{
          overflow: 'hidden',
          position: 'relative',
          width: containerWidth,
          maxWidth: '100%',
          height: containerHeight,
          aspectRatio: imageWidth > 0 && imageHeight > 0 ? `${imageWidth} / ${imageHeight}` : 'auto',
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            width: `${100 * zoomLevel}%`,
            height: `${100 * zoomLevel}%`,
            pointerEvents: 'auto'
          }}
          onClick={handleImageClick}
        >
          <img 
            ref={imageRef}
            src={imagePath} 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: zoomLevel === 1 ? 'width 0.3s ease, height 0.3s ease' : 'none',
              userSelect: 'none',
              pointerEvents: 'auto'
            }}
          />
          
          {/* マーカーを画像の上に表示 */}
          {markers.map((marker) => (
            <div
              key={marker.id}
              style={{
                position: 'absolute',
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                transform: 'translate(-50%, -50%)',
                width: '18px',
                height: '18px',
                pointerEvents: 'none',
                zIndex: 10
              }}
            >
              <img
                src="/circle.png"
                alt="marker"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textShadow: '1px 1px 1px rgba(0,0,0,0.8)',
                  lineHeight: '1',
                  pointerEvents: 'none'
                }}
              >
                {marker.id}
              </div>
            </div>
          ))}
        </div>
        
        {/* ボタンを右上に配置 */}
        <div className="button-container" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          display: 'flex',
          gap: '5px',
          zIndex: 20
        }}>
          {showPlusButton && (
            <button 
              onClick={handlePlusClick}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              +
            </button>
          )}
          {!showPlusButton && (
            <button 
              onClick={handleMinusClick}
              style={{
                padding: '6px 12px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              -
            </button>
          )}
        </div>
      </div>
      <div>
      {imageWidth > 0 && imageHeight > 0 && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: '10px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            画像サイズ: {imageWidth} × {imageHeight} ピクセル (ズーム: {zoomLevel}x) - マーカー: {markers.length}/20
          </p>
        )}
 
      </div>
    </div>
  );
});

export default MadorizuComponent; 