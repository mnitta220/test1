import Madorizu from "../../components/Madorizu/Madorizu/Madorizu";
import { useMadorizuImageAndMarkers } from "../../../../hooks/useMadorizuImageAndMarkers";
import { MarkerListPanel } from "../../../../components/MarkerListPanel/MarkerListPanel";
import "./CreateInspectionCheckMp.css";

const CreateInspectionCheckMp = () => {
  const {
    imageData,
    markers,
    madorizuRef,
    handleMarkerAdd,
    onMarkersChange,
    removeMarkerById,
  } = useMadorizuImageAndMarkers("madorizu.jpg");

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
          onMarkersChange={onMarkersChange}
        />
      </div>

      <MarkerListPanel markers={markers} onRemoveMarker={removeMarkerById} />
    </>
  );
};

export default CreateInspectionCheckMp;
