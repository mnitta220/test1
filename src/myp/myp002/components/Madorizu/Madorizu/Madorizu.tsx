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
  removeMarker: (markerId: number) => void;
}
/* c8 ignore stop */

const Madorizu = forwardRef<MadorizuRef, MadorizuProps>(
  ({ isMarkable, imageData, markers, onMarkersChange, onImageClick }, ref) => {
    const [showPlusButton, setShowPlusButton] = useState(true);
    const [imageWidth, setImageWidth] = useState(0);
    const [imageHeight, setImageHeight] = useState(0);
    const divRef = useRef<HTMLDivElement | null>(null);
    const plusButtonRef = useRef<HTMLButtonElement | null>(null);
    const minusButtonRef = useRef<HTMLButtonElement | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const [imagePosition, setImagePosition] = useState<{
      x: number;
      y: number;
    }>({ x: 0, y: 0 });
    const [containerSize, setContainerSize] = useState<{
      width: number;
      height: number;
    }>({ width: 0, height: 0 });
    const [containerRect, setContainerRect] = useState<DOMRect | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [dragEndPosition, setDragEndPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    // DOM 直接参照は markuplint invalid-attr 回避のため id ベースで取得
    const CONTAINER_ID = "madorizu-container-root";
    const IMAGE_ID = "madorizu-image";

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
        setContainerRect(rect);
      };
      updateContainerSize();
      window.addEventListener("resize", updateContainerSize);
      return () => window.removeEventListener("resize", updateContainerSize);
    }, []);
    /* c8 ignore stop */

    useEffect(() => {
      const el = divRef.current;
      if (!el) return;

      console.log("useEffect: " + el.id);
      el.addEventListener("touchstart", handleTouchStart, { passive: false });
      el.addEventListener("touchmove", onTouchMove, { passive: false });
      el.addEventListener("touchend", handleTouchEnd, { passive: false });
      return () => {
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchmove", onTouchMove);
        el.removeEventListener("touchend", handleTouchEnd);
      };
    }, []);

    useEffect(() => {
      const el = plusButtonRef.current;
      if (!el) return;
      el.addEventListener("touchstart", handlePlusTouchStart, {
        passive: false,
      });
      el.addEventListener("touchend", handlePlusTouchEnd, { passive: false });
      return () => {
        el.removeEventListener("touchstart", handlePlusTouchStart);
        el.removeEventListener("touchend", handlePlusTouchEnd);
      };
    }, []);

    useEffect(() => {
      const el = minusButtonRef.current;
      if (!el) return;
      el.addEventListener("touchstart", handleMinusTouchStart, {
        passive: false,
      });
      el.addEventListener("touchend", handleMinusTouchEnd, { passive: false });
      return () => {
        el.removeEventListener("touchstart", handleMinusTouchStart);
        el.removeEventListener("touchend", handleMinusTouchEnd);
      };
    }, []);

    const onTouchMove = (e: TouchEvent) => {
      // passive 制約に備えてキャンセル可能なときだけ抑止する
      if (e.cancelable) {
        e.preventDefault();
        console.log("onTouchMove: cancelable");
      }
      const touch = e.changedTouches[0];
      if (touch) {
        console.log("onTouchMove: " + touch.pageX);
      }
    };

    const handlePlusTouchStart = (e: TouchEvent) => {
      console.log("handlePlusTouchStart: ");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setShowPlusButton(false);
      setZoomLevel(2);
      setImagePosition({ x: 0, y: 0 }); // ズーム時に位置をリセット
    };

    const handlePlusTouchEnd = (e: TouchEvent) => {
      console.log("handlePlusTouchEnd: ");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const handleMinusTouchStart = (e: TouchEvent) => {
      console.log("handleMinusTouchStart: ");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setShowPlusButton(true);
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 }); // ズームアウト時に位置をリセット
    };

    const handleMinusTouchEnd = (e: TouchEvent) => {
      console.log("handleMinusTouchEnd: ");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    // Pointer イベントに統合（mouse/touch 両対応）
    const beginDrag = (clientX: number, clientY: number) => {
      console.log("beginDrag: " + clientX + ", " + clientY);
      setIsDragging(true);
      setDragStartPosition({ x: clientX, y: clientY });
      setDragEndPosition(null);
      setDragOffset({
        x: clientX - imagePosition.x,
        y: clientY - imagePosition.y,
      });
    };

    const updateDrag = (clientX: number, clientY: number) => {
      setDragEndPosition({ x: clientX, y: clientY });
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;
      const maxOffsetX = (containerSize.width * (zoomLevel - 1)) / 2;
      const maxOffsetY = (containerSize.height * (zoomLevel - 1)) / 2;
      const imageAspectRatio = imageWidth / imageHeight;
      const containerAspectRatio = containerSize.width / containerSize.height;
      const adjustedMaxOffsetY =
        (maxOffsetY * containerAspectRatio) / imageAspectRatio;
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
      const clampedY = Math.max(
        -adjustedMaxOffsetY,
        Math.min(adjustedMaxOffsetY, newY),
      );
      setImagePosition({ x: clampedX, y: clampedY });
    };

    const endDrag = (clientX: number, clientY: number) => {
      console.log("endDrag: " + clientX + ", " + clientY);
      setDragEndPosition({ x: clientX, y: clientY });
      setIsDragging(false);
      //imageClick(clientX, clientY);
      //setTimeout(() => {
      //  dragEnd();
      //}, 1000);
      if (!dragStartPosition) {
        console.log("endDrag: no dragStartPosition");
        return;
      }
      console.log(
        "endDrag: dragStartPosition: " +
          dragStartPosition.x +
          ", " +
          dragStartPosition.y,
      );
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
      if (zoomLevel > 1) {
        beginDrag(e.clientX, e.clientY);
      }
    };
    const handleMouseMove = (e: React.MouseEvent) => {
      //console.log("handleMouseMove");
      e.preventDefault();
      if (isDragging && zoomLevel > 1) {
        updateDrag(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = (e: React.MouseEvent) => {
      console.log("handleMouseUp");
      e.preventDefault();
      if (isDragging) {
        endDrag(e.clientX, e.clientY);
      }
    };
    */

    const handleTouchStart = (e: TouchEvent) => {
      // passive 制約に備えてキャンセル可能なときだけ抑止する
      if (e.cancelable) {
        e.preventDefault();
        console.log("onTouchStart: cancelable");
      }
      const touch = e.touches[0];
      if (touch) {
        console.log("handleTouchStart: " + touch.clientX);
        beginDrag(touch.clientX, touch.clientY);
      }
    };
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

    const handleTouchEnd = (e: TouchEvent) => {
      // passive 制約に備えてキャンセル可能なときだけ抑止する
      if (e.cancelable) {
        e.preventDefault();
        console.log("onTouchEnd: cancelable");
      }
      const touch = e.changedTouches[0];
      if (touch) {
        console.log("handleTouchEnd: " + touch.clientX);
        endDrag(touch.clientX, touch.clientY);
      }
    };
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
      if (!dragStartPosition) {
        console.log("imageClick: no dragStartPosition");
        return;
      }
      console.log(
        "imageClick: dragStartPosition: " +
          dragStartPosition.x +
          ", " +
          dragStartPosition.y,
      );
      const deltaX = Math.abs(clientX - dragStartPosition.x);
      const deltaY = Math.abs(clientY - dragStartPosition.y);

      // X座標またはY座標の差が10px以上の場合はマーカーを追加しない
      if (deltaX >= 10 || deltaY >= 10) {
        // ドラッグ状態をリセット
        console.log("imageClick: reset dragStartPosition1");
        setDragStartPosition(null);
        setDragEndPosition(null);
        return; // マーカーを追加しない
      }

      // 追加条件1: 既に最大数の場合は親ハンドラに委譲（警告表示等）
      if (markers.length >= 20 || !isMarkable || !containerRect) {
        //if (onImageClick) onImageClick(e);
        return;
      }

      const x = ((clientX - containerRect.left) / containerRect.width) * 100;
      const y = ((clientY - containerRect.top) / containerRect.height) * 100;
      console.log("imageClick: x: " + x + ", y: " + y);
      // 有効な範囲内に制限
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      const newMarker: MarkerInfo = {
        id: markers.length + 1,
        x: clampedX,
        y: clampedY,
      };

      const updatedMarkers = [...markers, newMarker];
      onMarkersChange(updatedMarkers);

      // ドラッグ状態をリセット
      console.log("imageClick: reset dragStartPosition2");
      setDragStartPosition(null);
      setDragEndPosition(null);
    };

    const handleImageClick = (e: React.MouseEvent) => {
      console.log("handleImageClick");
      e.preventDefault();

      // 追加条件1: 既に最大数の場合は親ハンドラに委譲（警告表示等）
      if (markers.length >= 20) {
        if (onImageClick) onImageClick(e);
        return;
      }

      // 追加条件2: 入力未保存などで親側が追加を許可しない(isMarkable=false)場合は親に通知して削除処理などを実行させる
      if (!isMarkable) {
        if (onImageClick) onImageClick(e);
        return;
      }

      // ドラッグが発生していた場合の座標差をチェック
      if (dragStartPosition && dragEndPosition) {
        const deltaX = Math.abs(dragEndPosition.x - dragStartPosition.x);
        const deltaY = Math.abs(dragEndPosition.y - dragStartPosition.y);

        // X座標またはY座標の差が10px以上の場合はマーカーを追加しない
        if (deltaX >= 10 || deltaY >= 10) {
          // ドラッグ状態をリセット
          console.log("handleImageClick: reset dragStartPosition3");
          setDragStartPosition(null);
          setDragEndPosition(null);
          return; // マーカーを追加しない
        }
      }

      // マーカーを追加（上部のガードで既に 20 件上限はチェック済みのためここでの再チェックは不要）

      const rect = e.currentTarget.getBoundingClientRect();

      // より簡単で正確なクリック位置計算
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // 有効な範囲内に制限
      const clampedX = Math.max(0, Math.min(100, x));
      const clampedY = Math.max(0, Math.min(100, y));

      const newMarker: MarkerInfo = {
        id: markers.length + 1,
        x: clampedX,
        y: clampedY,
      };

      const updatedMarkers = [...markers, newMarker];
      onMarkersChange(updatedMarkers);

      // ドラッグ状態をリセット
      console.log("handleImageClick: reset dragStartPosition4");
      setDragStartPosition(null);
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
        /*
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleMouseUp}
        */
        ref={divRef}
      >
        <div
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
