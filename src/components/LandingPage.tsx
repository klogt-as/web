import WebGPUCanvas from "./Canvas/Canvas";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";
import LoadingOverlay from "./LoadingOverlay";

export default function LandingPage() {
  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "fixed", inset: 0 }}
    >
      <LoadingOverlay />
      <WebGPUCanvas style={{ width: "100%", height: "100%" }}>
        <LiquidMercuryBlob />
      </WebGPUCanvas>
    </div>
  );
}
