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
  //const [canAdd, setCanAdd] = useState(true);
  const [markers, setMarkers] = useState<MarkerInfo[]>([]);
  const [imageData, setImageData] = useState<string>("");
  const madorizuRef = useRef<MadorizuRef>(null);

  // 画像ファイルをbase64エンコードする
  useEffect(() => {
    const loadImageAsBase64 = async () => {
      try {
        const response = await fetch("madorizu.jpg");
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

  const handleMarkersChange = (newMarkers: MarkerInfo[]) => {
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

  return (
    <>
      <div>Hello</div>
      <div className="inspection">
        <Madorizu
          isMarkable={true}
          ref={madorizuRef}
          imageData={imageData}
          markers={markers}
          onMarkersChange={handleMarkersChange}
          onImageClick={() => {
            console.log("Image clicked");
            /*
              // 提出後は反応しない
              if (isApplied) {
                return;
              }
              // 追加条件: まだ保存されていない入力が存在する状態で再クリックされた場合、
              // 直近の未保存項目(= isSaved=false)を削除しマーカーも除去
              const unsavedItems = state.filter((it) => !it.isSaved);
              if (unsavedItems.length > 0) {
                const latestUnsaved = unsavedItems[unsavedItems.length - 1];
                if (latestUnsaved.markerId !== undefined) {
                  if (hasFloorPlan) {
                    handleDelete(latestUnsaved.id, latestUnsaved.markerId);
                  } else {
                    handleDeleteNoFloorPlan(
                      latestUnsaved.id,
                      latestUnsaved.markerId,
                    );
                  }
                }
              } else {
                // まだ未保存が無い(=最大数到達など)の場合は従来の警告モーダル
                setOpenWarningModal(true);
              }
              */
          }}
        />
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
