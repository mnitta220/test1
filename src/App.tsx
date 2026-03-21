import { useState, useRef, useEffect } from "react";
import "./App.css";
import Madorizu from "./myp/myp002/components/Madorizu/Madorizu/Madorizu";
import { fetchImageAsDataUrl } from "./utils/fetchImageAsDataUrl";
import type {
  MarkerInfo,
  MadorizuRef,
} from "./myp/myp002/components/Madorizu/Madorizu/Madorizu";

function App() {
  const [logedIn, setLogedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [imageData, setImageData] = useState<string>("");
  const madorizuRef = useRef<MadorizuRef>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const data = await fetchImageAsDataUrl("madorizu.gif");
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

  if (!logedIn) {
    return (
      <div style={{ margin: "20px" }}>
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          style={{ marginLeft: "10px" }}
          onClick={() => {
            if (password === "nexus") {
              setLogedIn(true);
            }
          }}
        >
          ログイン
        </button>
      </div>
    );
  }

  return (
    <>
      <h3>間取り図</h3>
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
      <div className="zoom-inspection">
        〔指2本でズームイン／ズームアウトできます〕
      </div>

      {/* マーカー一覧を表示 */}
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
}

export default App;
