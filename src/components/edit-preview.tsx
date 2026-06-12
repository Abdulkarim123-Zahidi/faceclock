import {
  Canvas,
  ColorMatrix,
  Image as SkiaImage,
  useImage,
} from "@shopify/react-native-skia";
import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";

import type { ColorMatrix as Matrix } from "@/image/color-matrix";

/**
 * Native editor preview: Skia renders the working image with the
 * current color matrix, so what you see is exactly what gets baked.
 */
export function EditPreview({ uri, matrix }: { uri: string; matrix: Matrix }) {
  const image = useImage(uri);
  const [size, setSize] = useState({ width: 0, height: 0 });

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayout}>
      {image && size.width > 0 && (
        <Canvas style={{ width: size.width, height: size.height }}>
          <SkiaImage
            image={image}
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fit="contain"
          >
            <ColorMatrix matrix={matrix} />
          </SkiaImage>
        </Canvas>
      )}
    </View>
  );
}
