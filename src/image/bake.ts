import { ImageFormat, Skia } from "@shopify/react-native-skia";
import { File, Paths } from "expo-file-system";

import type { ColorMatrix } from "@/image/color-matrix";

/**
 * Native bake: draw the image through a Skia color filter on an
 * offscreen CPU surface and encode to JPEG. (bake.web.ts does the same
 * with a canvas pixel loop.)
 */
export async function bakeColorMatrix(
  uri: string,
  matrix: ColorMatrix,
): Promise<string> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error(`Could not decode image: ${uri}`);

  const surface = Skia.Surface.Make(image.width(), image.height());
  if (!surface) throw new Error("Could not create Skia surface");

  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(matrix));
  surface.getCanvas().drawImage(image, 0, 0, paint);

  const bytes = surface.makeImageSnapshot().encodeToBytes(ImageFormat.JPEG, 90);
  if (!bytes) throw new Error("Could not encode edited image");

  const out = new File(Paths.cache, `baked-${Date.now()}.jpg`);
  out.write(bytes);
  return out.uri;
}
