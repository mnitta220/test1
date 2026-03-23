import type { MarkerInfo } from "../Madorizu/Madorizu";
import "./MadorizuMarker.css";

interface MadorizuMarkerProps {
  info: MarkerInfo;
}

/**
 * 間取図上のマーカーコンポーネント
 */
function MadorizuMarker({ info }: MadorizuMarkerProps) {
  return (
    <div
      className="madorizu-marker"
      style={{
        left: `${info.x}%`,
        top: `${info.y}%`,
      }}
    >
      <div className="marker-num" id={`marker-desc-${info.id}`}>
        {info.id}
      </div>
    </div>
  );
}

export default MadorizuMarker;
