import WebGPUCanvas from "./Canvas/Canvas";
import { LiquidMercuryBlob } from "./LiquidMercuryBlob";

export default function LandingPage() {
  return (
    <div
      style={{ width: "100vw", height: "100vh", position: "fixed", inset: 0 }}
    >
      <WebGPUCanvas style={{ width: "100%", height: "100%" }}>
        <LiquidMercuryBlob />
      </WebGPUCanvas>
    </div>
  );
}
