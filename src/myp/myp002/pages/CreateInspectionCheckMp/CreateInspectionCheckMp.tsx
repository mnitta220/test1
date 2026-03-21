import { useState, useRef, useEffect } from "react";
import Madorizu from "../../components/Madorizu/Madorizu/Madorizu";
import type {
  MarkerInfo,
  MadorizuRef,
} from "../../components/Madorizu/Madorizu/Madorizu";
import { fetchImageAsDataUrl } from "../../../../utils/fetchImageAsDataUrl";
import "./CreateInspectionCheckMp.css";

const CreateInspectionCheckMp = () => {
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [imageData, setImageData] = useState<string>("");
  const madorizuRef = useRef<MadorizuRef>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchImageAsDataUrl("madorizu.jpg");
      if (!cancelled) setImageData(data);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMarkerAdd = (x: number, y: number) => {
    setMarkers((prev) => {
      const newMarker: MarkerInfo = {
        id: prev.length + 1,
        x,
        y,
      };
      return [...prev, newMarker];
    });
  };

  const handleMarkersChange = (newMarkers: MarkerInfo[]) => {
    setMarkers(newMarkers);
  };

  const handleRemoveMarker = (markerId: number) => {
    madorizuRef.current?.removeMarker(markerId);
  };

  return (
    <>
      <div>Hello</div>
      <div className="inspection">
        <Madorizu
          isMarkable={true}
          ref={madorizuRef}
          imageData={imageData}
          markers={markers}
          onMarkerAdd={handleMarkerAdd}
          onMarkersChange={handleMarkersChange}
        />
      </div>

      {markers.length > 0 && (
        <div className="inspection">
          <h3>マーカー一覧</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
              marginTop: "10px",
            }}
          >
            {markers.map((marker) => (
              <div
                key={marker.id}
                style={{
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#f9f9f9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong>マーカー {marker.id}</strong>
                  <br />
                  座標: ({marker.x.toFixed(1)}%, {marker.y.toFixed(1)}%)
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMarker(marker.id)}
                  style={{
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default CreateInspectionCheckMp;
