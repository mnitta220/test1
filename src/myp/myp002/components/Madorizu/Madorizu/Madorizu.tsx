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

const Madorizu = forwardRef<MadorizuRef, MadorizuProps>(
  ({ isMarkable, imageData, markers, onMarkerAdd, onMarkersChange }, ref) => {
    const [showPlusButton, setShowPlusButton] = useState(true);
    const divRef = useRef<HTMLDivElement | null>(null);
    /** マーカーはこの要素内で left/top % 配置される。クリック座標もこの矩形基準にする */
    const imageContainerRef = useRef<HTMLDivElement | null>(null);
    const plusButtonRef = useRef<HTMLButtonElement | null>(null);
    const minusButtonRef = useRef<HTMLButtonElement | null>(null);

    const [imageWidth, setImageWidth] = useState(0);
    // zoomLevel も native リスナーからは stale になるため、最新値を ref に同期する
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

    // isDragging は UI 用の state。native addEventListener からは stale になるため
    // 同一値を isDraggingRef にも保持し、touchmove 等は ref を参照する。
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);
    useEffect(() => {
      isDraggingRef.current = isDragging;
    }, [isDragging]);

    const [, setDragOffset] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    // native の mousemove は初回レンダーのクロージャのままなので、state の dragOffset は常に古い。
    // ドラッグ中の計算は dragOffsetRef を使う。
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

    //const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    // native の addEventListener から呼ばれる関数は state が stale になりやすいので、
    // dragStartPosition を ref でも保持して参照元を ref.current に揃える
    const dragStartPositionRef = useRef<{
      x: number;
      y: number;
    } | null>(null);
    useEffect(() => {
      dragStartPositionRef.current = dragStartPosition;
    }, [dragStartPosition]);

    const [, setDragEndPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    // DOM 直接参照は markuplint invalid-attr 回避のため id ベースで取得
    const CONTAINER_ID = "madorizu-container-root";
    const IMAGE_ID = "madorizu-image";

    // 外部からマーカーを追加する関数
    const addMarker = (x: number, y: number) => {
      //console.log(`addMarker: x: ${x}, y: ${y}`);
      /*
      const newMarker: MarkerInfo = {
        id: markers.length + 1,
        x: x,
        y: y,
      };
      const updatedMarkers = [...markers, newMarker];
      */
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

    // 親コンポーネントにremoveMarker関数を公開
    useImperativeHandle(ref, () => ({
      addMarker,
      removeMarker,
    }));

    /* c8 ignore start - 画像ロードの副作用はUI配線であり、ロジック網羅率の評価対象外 */
    useEffect(() => {
      const img = document.getElementById(IMAGE_ID) as HTMLImageElement | null;
      if (!img) return;
      const handleLoad = () => {
        //console.log(
        //  "handleLoad: " + img.naturalWidth + ", " + img.naturalHeight,
        //);
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
        //console.log("updateContainerSize: 1");
        const el = document.getElementById(CONTAINER_ID);
        if (!el) return;
        //console.log("updateContainerSize: 2");
        const rect = el.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
        //console.log(
        //  `updateContainerSize: 3 width: ${rect.width} height: ${rect.height}`,
        //);
        //setContainerRect(rect);
      };
      updateContainerSize();
      window.addEventListener("resize", updateContainerSize);
      return () => window.removeEventListener("resize", updateContainerSize);
    }, []);
    /* c8 ignore stop */

    useEffect(() => {
      const el = divRef.current;
      if (!el) return;
      const handleMouseDown = (e: MouseEvent) => {
        //console.log("handleMouseDown: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        beginDrag(e.clientX, e.clientY);
      };

      const handleMouseMove = (e: MouseEvent) => {
        //console.log("handleMouseMove: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isDraggingRef.current && zoomLevelRef.current > 1) {
          updateDrag(e.clientX, e.clientY);
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        console.log("handleMouseUp: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        endDrag(e.clientX, e.clientY);
      };

      const handleTouchStart = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
          //console.log("onTouchStart: cancelable");
        }
        const touch = e.touches[0];
        if (touch) {
          //console.log("handleTouchStart: " + touch.clientX);
          beginDrag(touch.clientX, touch.clientY);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.cancelable) {
          e.preventDefault();
        }

        const touch = e.touches[0];
        if (!touch) return;

        if (isDraggingRef.current && zoomLevelRef.current > 1) {
          updateDrag(touch.clientX, touch.clientY);
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        console.log("handleTouchEnd: ");
        // passive 制約に備えてキャンセル可能なときだけ抑止する
        if (e.cancelable) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          //console.log("onTouchEnd: cancelable");
        }
        const touch = e.changedTouches[0];
        if (touch) {
          console.log("handleTouchEnd: " + touch.clientX);
          endDrag(touch.clientX, touch.clientY);
        }
      };

      el.addEventListener("touchmove", handleTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
      el.addEventListener("touchstart", handleTouchStart, { passive: false });
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

    // プラスボタンの処理
    useEffect(() => {
      const el = plusButtonRef.current;
      if (!el) return;
      const handleMouseDown = (e: MouseEvent) => {
        //console.log("handleMouseDown: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      const handleMouseUp = (e: MouseEvent) => {
        //console.log("handleMouseUp: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(false);
        zoomLevelRef.current = 2;
        setZoomLevel(2);
        setImagePosition({ x: 0, y: 0 }); // ズームアウト時に位置をリセット
      };
      const handleTouchStart = (e: TouchEvent) => {
        //console.log("handlePlusTouchStart: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      const handleTouchEnd = (e: TouchEvent) => {
        //console.log("handlePlusTouchEnd: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(false);
        zoomLevelRef.current = 2;
        setZoomLevel(2);
        setImagePosition({ x: 0, y: 0 }); // ズーム時に位置をリセット
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
        //el.removeEventListener("click", onPlusClick);
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchend", handleTouchEnd);
        el.removeEventListener("mousedown", handleMouseDown);
        el.removeEventListener("mouseup", handleMouseUp);
      };
    }, []);

    // マイナスボタンの処理
    useEffect(() => {
      const handleMouseDown = (e: MouseEvent) => {
        //console.log("handleMouseDown: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };
      const handleMouseUp = (e: MouseEvent) => {
        //console.log("handleMouseUp: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(true);
        zoomLevelRef.current = 1;
        setZoomLevel(1);
        setImagePosition({ x: 0, y: 0 }); // ズームアウト時に位置をリセット
      };
      const handleTouchStart = (e: TouchEvent) => {
        //console.log("handleMinusTouchStart: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      };

      const handleTouchEnd = (e: TouchEvent) => {
        //console.log("handleMinusTouchEnd: ");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setShowPlusButton(true);
        zoomLevelRef.current = 1;
        setZoomLevel(1);
        setImagePosition({ x: 0, y: 0 }); // ズームアウト時に位置をリセット
      };

      const el = minusButtonRef.current;
      if (!el) return;
      //el.addEventListener("click", onMinusClick, { passive: false });
      el.addEventListener("mousedown", handleMouseDown, {
        passive: false,
      });
      el.addEventListener("mouseup", handleMouseUp, { passive: false });
      el.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
      return () => {
        //el.removeEventListener("click", onMinusClick);
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchend", handleTouchEnd);
        el.removeEventListener("mousedown", handleMouseDown);
        el.removeEventListener("mouseup", handleMouseUp);
      };
    }, []);

    // Pointer イベントに統合（mouse/touch 両対応）
    const beginDrag = (clientX: number, clientY: number) => {
      //console.log("beginDrag: " + clientX + ", " + clientY);
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
      const maxOffsetX = (containerSizeRef.current.width * (zl - 1)) / 2;
      const maxOffsetY = (containerSizeRef.current.height * (zl - 1)) / 2;
      /*
      console.log(
        `imageWidth: ${imageWidthRef.current} imageHeight: ${imageHeightRef.current}`,
      );
      */
      const imageAspectRatio = imageWidthRef.current / imageHeightRef.current;
      const containerAspectRatio =
        containerSizeRef.current.width / containerSizeRef.current.height;
      const adjustedMaxOffsetY =
        (maxOffsetY * containerAspectRatio) / imageAspectRatio;
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
      const clampedY = Math.max(
        -adjustedMaxOffsetY,
        Math.min(adjustedMaxOffsetY, newY),
      );
      //console.log(
      //  "updateDrag: clampedX: " + clampedX + ", clampedY: " + clampedY,
      //);
      const nextPos = { x: clampedX, y: clampedY };
      imagePositionRef.current = nextPos;
      setImagePosition(nextPos);
    };

    const endDrag = (clientX: number, clientY: number) => {
      console.log("endDrag: " + clientX + ", " + clientY);
      setDragEndPosition({ x: clientX, y: clientY });
      isDraggingRef.current = false;
      setIsDragging(false);
      imageClick(clientX, clientY);
      /*
      const startPos = dragStartPositionRef.current;
      if (!startPos) {
        console.log("endDrag: no dragStartPosition");
        return;
      }
      console.log(
        "endDrag: dragStartPosition: " +
          startPos.x +
          ", " +
          startPos.y,
      );
      imageClick(clientX, clientY);
      */
    };

    /*
    const dragEnd = () => {
      console.log("dragEnd: ");
      if (!dragStartPosition) {
        console.log("imageClick2: no dragStartPosition");
        return;
      }
      console.log(
        "imageClick2: dragStartPosition: " +
          dragStartPosition.x +
          ", " +
          dragStartPosition.y,
      );
    };
    */
    // Mouse イベント（markuplint の invalid-attr 回避: onTouch*/onPointer* 非使用）

    /*
    const handleMouseDown = (e: React.MouseEvent) => {
      console.log("handleMouseDown");
      e.preventDefault();
      //if (zoomLevel > 1) {
      beginDrag(e.clientX, e.clientY);
      //}
    };
    const handleMouseMove = (e: React.MouseEvent) => {
      //console.log("handleMouseMove");
      e.preventDefault();
      if (isDragging && zoomLevel > 1) {
        updateDrag(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = (e: React.MouseEvent) => {
      console.log("handleMouseUp: " + isDragging);
      e.preventDefault();
      if (isDragging) {
        endDrag(e.clientX, e.clientY);
      }
    };
    */

    /*
    const handleTouchStart = (e: React.TouchEvent) => {
      console.log("handleTouchStart");
      if (e.cancelable) {
        e.preventDefault();
      }
      if (zoomLevel > 1) {
        const touch = e.touches[0];
        if (!touch) return;
        beginDrag(touch.clientX, touch.clientY);
      }
    };
    */
    /*
    const handleTouchMove = (e: React.TouchEvent) => {
      console.log("handleTouchMove");
      if (e.cancelable) {
        e.preventDefault();
      }
      if (isDragging && zoomLevel > 1) {
        const touch = e.touches[0];
        if (!touch) return;
        updateDrag(touch.clientX, touch.clientY);
      }
    };
    */
    /*
    const handleTouchEnd = (e: React.TouchEvent) => {
      console.log("handleTouchEnd");
      if (e.cancelable) {
        e.preventDefault();
      }
      if (isDragging) {
        const touch = e.changedTouches[0];
        if (touch) {
          endDrag(touch.clientX, touch.clientY);
          return;
        }
      }
      setIsDragging(false);
    };
    */

    const imageClick = (clientX: number, clientY: number) => {
      console.log("imageClick: " + clientX + ", " + clientY);
      const startPos = dragStartPositionRef.current;
      if (!startPos) {
        console.log("imageClick: no dragStartPosition");
        return;
      }
      console.log(
        "imageClick: dragStartPosition: " + startPos.x + ", " + startPos.y,
      );
      const deltaX = Math.abs(clientX - startPos.x);
      const deltaY = Math.abs(clientY - startPos.y);

      // X座標またはY座標の差が10px以上の場合はマーカーを追加しない
      if (deltaX >= 10 || deltaY >= 10) {
        // ドラッグ状態をリセット
        //console.log("imageClick: reset dragStartPosition1");
        setDragStartPosition(null);
        dragStartPositionRef.current = null;
        setDragEndPosition(null);
        return; // マーカーを追加しない
      }

      //console.log("imageClick: markers.length: " + markers.length);
      // 追加条件1: 既に最大数の場合は親ハンドラに委譲（警告表示等）
      // 外側コンテナではなく image-container 基準（ズーム・パン後の実表示領域と一致）
      const imageRect = imageContainerRef.current?.getBoundingClientRect();
      if (markers.length >= 20 || !isMarkable || !imageRect) {
        //if (onImageClick) onImageClick(e);
        //console.log(
        //  `imageClick: return 1 markers.length: ${markers.length} isMarkable: ${isMarkable} containerRect: ${containerRect}`,
        //);
        setDragStartPosition(null);
        dragStartPositionRef.current = null;
        setDragEndPosition(null);
        return;
      }

      /*
      console.log(
        "imageClick: containerRect: " +
          containerRect.left +
          ", " +
          containerRect.width +
          ", " +
          containerRect.top +
          ", " +
          containerRect.height,
      );
      */
      const x = ((clientX - imageRect.left) / imageRect.width) * 100;
      const y = ((clientY - imageRect.top) / imageRect.height) * 100;
      //console.log("imageClick: x: " + x + ", y: " + y);
      // 有効な範囲内に制限
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      /*
      const newMarker: MarkerInfo = {
        id: markers.length + 1,
        x: clampedX,
        y: clampedY,
      };

      const updatedMarkers = [...markers, newMarker];
      onMarkersChange(updatedMarkers);
      */
      addMarker(clampedX, clampedY);

      // ドラッグ状態をリセット
      //console.log("imageClick: reset dragStartPosition2");
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
        //onMouseDown={handleMouseDown}
        //onMouseMove={handleMouseMove}
        //onTouchStart={handleTouchStart}
        //onTouchMove={handleTouchMove}
        //onMouseUp={handleMouseUp}
        //onTouchEnd={handleTouchEnd}
        //onMouseLeave={handleMouseUp}
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
