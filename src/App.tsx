//import { useState } from "react";
import "./App.css";
import Madorizu from "./myp/myp002/components/Madorizu/Madorizu/Madorizu";
import { useMadorizuImageAndMarkers } from "./hooks/useMadorizuImageAndMarkers";
import { MarkerListPanel } from "./components/MarkerListPanel/MarkerListPanel";
//import { LoginForm } from "./components/LoginForm/LoginForm";

function App() {
  //const [loggedIn, setLoggedIn] = useState(false);
  const {
    imageData,
    markers,
    madorizuRef,
    handleMarkerAdd,
    onMarkersChange,
    removeMarkerById,
  } = useMadorizuImageAndMarkers("madorizu.gif");

  //if (!loggedIn) {
  //  return <LoginForm onSuccess={() => setLoggedIn(true)} />;
  //}

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
          onMarkersChange={onMarkersChange}
        />
      </div>
      <div className="zoom-inspection">〔指2本で拡大／縮小できます〕</div>

      <MarkerListPanel markers={markers} onRemoveMarker={removeMarkerById} />
    </>
  );
}

export default App;
