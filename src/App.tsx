import { useState, useRef, useEffect } from "react";
//import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
//import MadorizuComponent from "./components/MadorizuComponent";
//import CreateInspectionCheckMp from "./myp/myp002/pages/CreateInspectionCheckMp/CreateInspectionCheckMp";
import Madorizu from "./myp/myp002/components/Madorizu/Madorizu/Madorizu";
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

  // 画像ファイルをbase64エンコードする
  useEffect(() => {
    const loadImageAsBase64 = async () => {
      try {
        const response = await fetch("madorizu.gif");
        const blob = await response.blob();

        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("画像の読み込みに失敗しました:", error);
        return "";
      }
    };

    loadImageAsBase64().then((base64Data) => {
      setImageData(base64Data);
    });
  }, []);

  const handleMarkerAdd = (x: number, y: number) => {
    //console.log(`handleMarkerAdd: x: ${x}, y: ${y}`);
    // クロージャの markers が古いと [...markers, new] で直前の追加が消えるため、常に最新へ追加する
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
    //console.log(`handleMarkersChange: ${JSON.stringify(newMarkers)}`);
    setMarkers(newMarkers);

    /*
    const latestMarker = newMarkers[newMarkers.length - 1];
    if (latestMarker) {
      const newId = crypto.randomUUID();
      dispatch({
        type: "ADD_ACCORDION",
        id: newId,
        markerId: latestMarker.id,
        x: Math.ceil(latestMarker.x),
        y: Math.ceil(latestMarker.y),
      });
      // TODO:
      setOpenIssueLocation(true);
      setLatestItemId(newId);
    }
    */
  };

  const handleRemoveMarker = (markerId: number) => {
    if (madorizuRef.current) {
      madorizuRef.current.removeMarker(markerId);
    }
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
