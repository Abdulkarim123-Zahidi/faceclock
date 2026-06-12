import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const THUMB_WIDTH = 320;

/**
 * Renders a small JPEG for gallery tiles. Works on native (file URIs)
 * and web (data URLs) alike; returns whatever URI form the platform
 * produces — callers persist it appropriately.
 */
export async function renderThumbnail(sourceUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(sourceUri);
  // Omit height so it's derived from the aspect ratio. Don't pass
  // height: null — the web resize action checks `!== undefined`, so
  // null gets used as a literal 0-pixel height and createImageData throws.
  context.resize({ width: THUMB_WIDTH });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  return saved.uri;
}
