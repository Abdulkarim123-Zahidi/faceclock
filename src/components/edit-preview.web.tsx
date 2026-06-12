import { useId } from "react";
import { View } from "react-native";

import type { ColorMatrix as Matrix } from "@/image/color-matrix";

/**
 * Web editor preview: an SVG feColorMatrix (GPU-accelerated) applied
 * via CSS filter — the same matrix the bake uses, so preview = result.
 */
export function EditPreview({ uri, matrix }: { uri: string; matrix: Matrix }) {
  const filterId = `edit-matrix-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={filterId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={matrix.join(" ")} />
        </filter>
      </svg>
      <img
        src={uri}
        alt="Photo being edited"
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          filter: `url(#${filterId})`,
        }}
      />
    </View>
  );
}
