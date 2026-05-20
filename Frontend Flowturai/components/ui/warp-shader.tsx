"use client";
import { Warp } from "@paper-design/shaders-react";

export default function WarpShaderBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <Warp
        style={{ height: "100%", width: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={0.8}
        colors={[
          "hsl(222, 90%, 8%)",
          "hsl(214, 95%, 65%)",
          "hsl(218, 85%, 25%)",
          "hsl(210, 100%, 78%)",
        ]}
      />
    </div>
  );
}
