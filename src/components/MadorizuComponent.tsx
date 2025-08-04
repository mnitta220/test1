import React, { useState, useEffect, useRef } from 'react';

interface MadorizuComponentProps {
  imagePath: string;
  title?: string;
}

const MadorizuComponent: React.FC<MadorizuComponentProps> = ({ 
  imagePath, 
  title = "間取り図" 
}) => {
  const [showPlusButton, setShowPlusButton] = useState(true);
  const [imageWidth, setImageWidth] = useState<number>(0);
  const [imageHeight, setImageHeight] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 画像のアスペクト比を計算
  const aspectRatio = imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
  const containerWidth = '100%';
  const containerHeight = imageWidth > 0 && imageHeight > 0 ? `calc(${containerWidth} / ${aspectRatio})` : '400px';

  return (
    <div className="madorizu-container">
      <h2>{title}</h2>
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
          cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imageRef}
          src={imagePath} 
          alt={title} 
          style={{
            width: `${100 * zoomLevel}%`,
            height: `${100 * zoomLevel}%`,
            objectFit: 'cover',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: zoomLevel === 1 ? 'width 0.3s ease, height 0.3s ease' : 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      </div>
      <div className="button-container" style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        marginTop: '15px'
      }}>
        {showPlusButton && (
          <button 
            onClick={handlePlusClick}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            +
          </button>
        )}
        {!showPlusButton && (
          <button 
            onClick={handleMinusClick}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            -
          </button>
        )}
      </div>
      <div>
      {imageWidth > 0 && imageHeight > 0 && (
          <p style={{ 
            textAlign: 'center', 
            marginTop: '10px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            画像サイズ: {imageWidth} × {imageHeight} ピクセル (ズーム: {zoomLevel}x)
          </p>
        )}
 
      </div>
    </div>
  );
};

export default MadorizuComponent; 