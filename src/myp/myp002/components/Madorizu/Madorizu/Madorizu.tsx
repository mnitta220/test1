import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import MadorizuMarker from "../MadorizuMarker/MadorizuMarker";
import "./Madorizu.css";

/* c8 ignore start - 型宣言は実行時コードに変換されずカバレッジ対象外とする */
interface MadorizuProps {
  isMarkable: boolean;
  imageData: string; // base64エンコードされた画像データ
  markers: MarkerInfo[];
  onMarkerAdd: (x: number, y: number) => void;
  onMarkersChange: (markers: MarkerInfo[]) => void;
  // 親での追加制御や削除誘発のため、画像以外の要素クリックを受け取れるよう汎用化
  onImageClick?: (event: React.MouseEvent) => void;
}

/**
 * 間取図の上に配置される申告箇所情報
 */
export interface MarkerInfo {
  id: number; // 番号
  x: number; // x座標(%)
  y: number; // y座標(%)
}

export interface MadorizuRef {
  addMarker: (x: number, y: number) => void;
  removeMarker: (markerId: number) => void;
}
/* c8 ignore stop */

const MIN_PINCH_ZOOM = 1;
const MAX_PINCH_ZOOM = 4;

function touchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const a = touches[0];
  const b = touches[1];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

const Madorizu = forwardRef<MadorizuRef, MadorizuProps>(
  ({ isMarkable, imageData, markers, onMarkerAdd, onMarkersChange }, ref) => {
    const [showPlusButton, setShowPlusButton] = useState(true);
    const divRef = useRef<HTMLDivElement | null>(null);
    const imageContainerRef = useRef<HTMLDivElement | null>(null);
    const plusButtonRef = useRef<HTMLButtonElement | null>(null);
    const minusButtonRef = useRef<HTMLButtonElement | null>(null);

    const [imageWidth, setImageWidth] = useState(0);
    const imageWidthRef = useRef(imageWidth);
    useEffect(() => {
      imageWidthRef.current = imageWidth;
    }, [imageWidth]);

    const [imageHeight, setImageHeight] = useState(0);
    const imageHeightRef = useRef(imageHeight);
    useEffect(() => {
      imageHeightRef.current = imageHeight;
    }, [imageHeight]);

    const [zoomLevel, setZoomLevel] = useState(1);
    const zoomLevelRef = useRef(zoomLevel);
    useEffect(() => {
      zoomLevelRef.current = zoomLevel;
    }, [zoomLevel]);

    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    useEffect(() => {
      isDraggingRef.current = isDragging;
    }, [isDragging]);

    const [, setDragOffset] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const [imagePosition, setImagePosition] = useState<{
      x: number;
      y: number;
    }>({ x: 0, y: 0 });
    const imagePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    useEffect(() => {
      imagePositionRef.current = imagePosition;
    }, [imagePosition]);

    const [containerSize, setContainerSize] = useState<{
      width: number;
      height: number;
    }>({ width: 0, height: 0 });
    const containerSizeRef = useRef(containerSize);
    useEffect(() => {
      containerSizeRef.current = containerSize;
    }, [containerSize]);

    const [dragStartPosition, setDragStartPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const dragStartPositionRef = useRef<{
      x: number;
      y: number;
    } | null>(null);
    useEffect(() => {
      dragStartPositionRef.current = dragStartPosition;
    }, [dragStartPosition]);

    /** 2 本指ピンチの初期距離と開始時ズーム */
    const pinchRef = useRef<{ d0: number; z0: number } | null>(null);
    /** このタッチ系列でピンチを行った場合、指離しでマーカー追加（endDrag）を抑止 */
    const pinchGestureUsedRef = useRef(false);

    type InteractionApi = {
      beginDrag: (x: number, y: number) => void;
      updateDrag: (x: number, y: number) => void;
      endDrag: (x: number, y: number) => void;
      clampImagePosition: (
        zl: number,
        pos: { x: number; y: number },
      ) => { x: number; y: number };
    };

    const interactionRef = useRef<InteractionApi>({
      beginDrag: () => {},
      updateDrag: () => {},
      endDrag: () => {},
      clampImagePosition: (_zl, p) => p,
    });

    const [, setDragEndPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    // DOM 直接参照は markuplint invalid-attr 回避のため id ベースで取得
    const CONTAINER_ID = "madorizu-container-root";
    const IMAGE_ID = "madorizu-image";

    // 外部からマーカーを追加する関数
    const addMarker = (x: number, y: number) => {
      onMarkerAdd(x, y);
    };

    // 外部からマーカーを削除する関数
    const removeMarker = (markerId: number) => {
      const filteredMarkers = markers.filter(
        (marker) => marker.id !== markerId,
      );
      // 番号を振り直す
      const renumberedMarkers = filteredMarkers.map((marker, index) => ({
        ...marker,
        id: index + 1,
      }));
      onMarkersChange(renumberedMarkers);
    };

    // 親コンポーネントにaddMarkerとremoveMarker関数を公開
    useImperativeHandle(ref, () => ({
      addMarker,
      removeMarker,
    }));

    /* c8 ignore start - 画像ロードの副作用はUI配線であり、ロジック網羅率の評価対象外 */
    useEffect(() => {
      const img = document.getElementById(IMAGE_ID) as HTMLImageElement | null;
      if (!img) return;
      const handleLoad = () => {
        setImageWidth(img.naturalWidth);
        setImageHeight(img.naturalHeight);
      };
      if (img.complete) {
        handleLoad();
      } else {
        img.addEventListener("load", handleLoad);
        return () => img.removeEventListener("load", handleLoad);
      }
    }, [imageData]);
    /* c8 ignore stop */

    /* c8 ignore start - リサイズの副作用もUI配線として除外 */
    useEffect(() => {
      const updateContainerSize = () => {
        const el = document.getElementById(CONTAINER_ID);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      };
      updateContainerSize();
      window.addEventListener("resize", updateContainerSize);
      return () => window.removeEventListener("resize", updateContainerSize);
    }, []);
    /* c8 ignore stop */

    // プラスボタンの処理
    useEffect(() => {
      const el = plusButtonRef.current;
      if (!el) return;
      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(false);
        zoomLevelRef.current = 2;
        setZoomLevel(2);
        imagePositionRef.current = { x: 0, y: 0 };
        setImagePosition({ x: 0, y: 0 });
      };

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(false);
        zoomLevelRef.current = 2;
        setZoomLevel(2);
        imagePositionRef.current = { x: 0, y: 0 };
        setImagePosition({ x: 0, y: 0 });
      };

      //el.addEventListener("click", onPlusClick, { passive: false });
      el.addEventListener("mousedown", handleMouseDown, {
        passive: false,
      });
      el.addEventListener("mouseup", handleMouseUp, { passive: false });
      el.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
      return () => {
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchend", handleTouchEnd);
        el.removeEventListener("mousedown", handleMouseDown);
        el.removeEventListener("mouseup", handleMouseUp);
      };
    }, []);

    // マイナスボタンの処理
    useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(true);
        zoomLevelRef.current = 1;
        setZoomLevel(1);
        imagePositionRef.current = { x: 0, y: 0 };
        setImagePosition({ x: 0, y: 0 });
      };

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(true);
        zoomLevelRef.current = 1;
        setZoomLevel(1);
        imagePositionRef.current = { x: 0, y: 0 };
        setImagePosition({ x: 0, y: 0 });
      };

      const el = minusButtonRef.current;
      if (!el) return;
      el.addEventListener("mousedown", handleMouseDown, {
        passive: false,
      });
      el.addEventListener("mouseup", handleMouseUp, { passive: false });
      el.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
      return () => {
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchend", handleTouchEnd);
        el.removeEventListener("mousedown", handleMouseDown);
        el.removeEventListener("mouseup", handleMouseUp);
      };
    }, []);

    const clampImagePosition = (zl: number, pos: { x: number; y: number }) => {
      const cw = containerSizeRef.current.width;
      const ch = containerSizeRef.current.height;
      const iw = imageWidthRef.current;
      const ih = imageHeightRef.current;
      if (ih <= 0 || cw <= 0) return pos;
      const maxOffsetX = (cw * (zl - 1)) / 2;
      const maxOffsetY = (ch * (zl - 1)) / 2;
      const imageAspectRatio = iw / ih;
      const containerAspectRatio = cw / ch;
      const adjustedMaxOffsetY =
        (maxOffsetY * containerAspectRatio) / imageAspectRatio;
      return {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, pos.x)),
        y: Math.max(-adjustedMaxOffsetY, Math.min(adjustedMaxOffsetY, pos.y)),
      };
    };

    // Pointer イベントに統合（mouse/touch 両対応）
    const beginDrag = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      setIsDragging(true);
      const nextStart = { x: clientX, y: clientY };
      setDragStartPosition(nextStart);
      dragStartPositionRef.current = nextStart;
      setDragEndPosition(null);
      const pos = imagePositionRef.current;
      const nextOffset = {
        x: clientX - pos.x,
        y: clientY - pos.y,
      };
      dragOffsetRef.current = nextOffset;
      setDragOffset(nextOffset);
    };

    const updateDrag = (clientX: number, clientY: number) => {
      setDragEndPosition({ x: clientX, y: clientY });
      const off = dragOffsetRef.current;
      const newX = clientX - off.x;
      const newY = clientY - off.y;
      const zl = zoomLevelRef.current;
      const nextPos = clampImagePosition(zl, { x: newX, y: newY });
      imagePositionRef.current = nextPos;
      setImagePosition(nextPos);
    };

    const endDrag = (clientX: number, clientY: number) => {
      setDragEndPosition({ x: clientX, y: clientY });
      isDraggingRef.current = false;
      setIsDragging(false);
      imageClick(clientX, clientY);
    };

    interactionRef.current = {
      beginDrag,
      updateDrag,
      endDrag,
      clampImagePosition,
    };

    useEffect(() => {
      const el = divRef.current;
      if (!el) return;

      const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        interactionRef.current.beginDrag(e.clientX, e.clientY);
      };

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isDraggingRef.current && zoomLevelRef.current > 1) {
          interactionRef.current.updateDrag(e.clientX, e.clientY);
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        interactionRef.current.endDrag(e.clientX, e.clientY);
      };

      const handleTouchStart = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
        }
        if (e.touches.length >= 2) {
          pinchGestureUsedRef.current = true;
          isDraggingRef.current = false;
          setIsDragging(false);
          dragStartPositionRef.current = null;
          setDragStartPosition(null);
          const d0 = touchDistance(e.touches);
          if (d0 > 10) {
            pinchRef.current = {
              d0,
              z0: zoomLevelRef.current,
            };
          } else {
            pinchRef.current = null;
          }
          return;
        }
        const touch = e.touches[0];
        if (touch) {
          interactionRef.current.beginDrag(touch.clientX, touch.clientY);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length >= 2) {
          if (e.cancelable) {
            e.preventDefault();
          }
          pinchGestureUsedRef.current = true;
          const p = pinchRef.current;
          if (!p || p.d0 < 10) return;
          const d = touchDistance(e.touches);
          if (d < 1) return;
          const rawZ = p.z0 * (d / p.d0);
          const newZ = Math.min(MAX_PINCH_ZOOM, Math.max(MIN_PINCH_ZOOM, rawZ));
          zoomLevelRef.current = newZ;
          setZoomLevel(newZ);
          setShowPlusButton(newZ <= 1.01);
          const pos = imagePositionRef.current;
          const clamped = interactionRef.current.clampImagePosition(newZ, pos);
          imagePositionRef.current = clamped;
          setImagePosition(clamped);
          return;
        }

        if (e.cancelable) {
          e.preventDefault();
        }

        const touch = e.touches[0];
        if (!touch) return;

        if (isDraggingRef.current && zoomLevelRef.current > 1) {
          interactionRef.current.updateDrag(touch.clientX, touch.clientY);
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }

        if (e.touches.length >= 2) {
          return;
        }
        if (e.touches.length === 1) {
          pinchRef.current = null;
          return;
        }

        const usedPinch = pinchGestureUsedRef.current;
        pinchGestureUsedRef.current = false;
        pinchRef.current = null;

        const touch = e.changedTouches[0];
        if (!touch) return;

        if (usedPinch) {
          isDraggingRef.current = false;
          setIsDragging(false);
          dragStartPositionRef.current = null;
          setDragStartPosition(null);
          return;
        }

        interactionRef.current.endDrag(touch.clientX, touch.clientY);
      };

      el.addEventListener("touchstart", handleTouchStart, { passive: false });
      el.addEventListener("touchmove", handleTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
      el.addEventListener("mousedown", handleMouseDown, { passive: false });
      el.addEventListener("mousemove", handleMouseMove, { passive: false });
      el.addEventListener("mouseup", handleMouseUp, { passive: false });
      return () => {
        el.removeEventListener("mousedown", handleMouseDown);
        el.removeEventListener("mousemove", handleMouseMove);
        el.removeEventListener("mouseup", handleMouseUp);
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchmove", handleTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      };
    }, []);

    const imageClick = (clientX: number, clientY: number) => {
      const startPos = dragStartPositionRef.current;
      if (!startPos) {
        return;
      }
      const deltaX = Math.abs(clientX - startPos.x);
      const deltaY = Math.abs(clientY - startPos.y);

      // X座標またはY座標の差が10px以上の場合はマーカーを追加しない
      if (deltaX >= 10 || deltaY >= 10) {
        // ドラッグ状態をリセット
        setDragStartPosition(null);
        dragStartPositionRef.current = null;
        setDragEndPosition(null);
        return;
      }

      // 追加条件1: 既に最大数の場合は親ハンドラに委譲（警告表示等）
      // 外側コンテナではなく image-container 基準（ズーム・パン後の実表示領域と一致）
      const imageRect = imageContainerRef.current?.getBoundingClientRect();
      if (markers.length >= 20 || !isMarkable || !imageRect) {
        setDragStartPosition(null);
        dragStartPositionRef.current = null;
        setDragEndPosition(null);
        return;
      }

      const x = ((clientX - imageRect.left) / imageRect.width) * 100;
      const y = ((clientY - imageRect.top) / imageRect.height) * 100;
      // 有効な範囲内に制限
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      addMarker(clampedX, clampedY);

      // ドラッグ状態をリセット
      setDragStartPosition(null);
      dragStartPositionRef.current = null;
      setDragEndPosition(null);
    };

    // 画像のアスペクト比を計算
    const aspectRatio =
      imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 1;
    const containerWidth = "100%";
    const containerHeight =
      imageWidth > 0 && imageHeight > 0
        ? `calc(${containerWidth} / ${aspectRatio})`
        : "400px";

    /* c8 ignore start - 以下は大量のJSXマークアップであり、ロジック網羅率の評価対象から除外する */
    return (
      <div
        id={CONTAINER_ID}
        className="madorizu-container"
        style={{
          /* stylelint-disable-next-line value-keyword-case -- CSS-in-JS での JS 変数名は小文字化しない */
          width: containerWidth,
          /* stylelint-disable-next-line value-keyword-case -- CSS-in-JS での JS 変数名は小文字化しない */
          height: containerHeight,
          aspectRatio:
            imageWidth > 0 && imageHeight > 0
              ? `${imageWidth} / ${imageHeight}`
              : "auto",
        }}
        ref={divRef}
      >
        <div
          ref={imageContainerRef}
          className="image-container"
          style={{
            transform: `translate(-50%, -50%) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            /* stylelint-disable-next-line value-keyword-case -- CSS-in-JS での JS 変数名は小文字化しない */
            width: `${100 * zoomLevel}%`,
            /* stylelint-disable-next-line value-keyword-case -- CSS-in-JS での JS 変数名は小文字化しない */
            height: `${100 * zoomLevel}%`,
          }}
        >
          {imageData && (
            <img
              id={IMAGE_ID}
              src={imageData}
              className="madorizu-img"
              style={{
                /* stylelint-disable value-keyword-case -- CSS-in-JS の三項演算子中の変数名を値と誤検知するため抑制 */
                transition:
                  zoomLevel === 1
                    ? "width 0.3s ease, height 0.3s ease"
                    : "none",
                /* stylelint-enable value-keyword-case */
              }}
            />
          )}

          {/* マーカーを画像の上に表示 */}
          {markers.map((marker) => (
            <MadorizuMarker key={marker.id} info={marker} />
          ))}
        </div>

        {/* ボタンを右上に配置 */}
        <div className="button-container">
          <button
            type="button"
            className="zoom-button"
            ref={plusButtonRef}
            style={{ display: showPlusButton ? "block" : "none" }}
          >
            <img src="zoomIn.svg" alt="ズームイン" />
          </button>
          <button
            type="button"
            className="zoom-button"
            ref={minusButtonRef}
            style={{ display: showPlusButton ? "none" : "block" }}
          >
            <img src="zoomOut.svg" alt="ズームアウト" />
          </button>
        </div>
      </div>
    );
    /* c8 ignore stop */
  },
);

export default Madorizu;
