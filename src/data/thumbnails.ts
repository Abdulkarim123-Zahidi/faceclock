import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

const THUMB_WIDTH = 320;

/**
 * Renders a small JPEG for gallery tiles. Works on native (file URIs)
 * and web (data URLs) alike; returns whatever URI form the platform
 * produces — callers persist it appropriately.
 */
export async function renderThumbnail(sourceUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(sourceUri);
  context.resize({ width: THUMB_WIDTH, height: null });
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
  });
  return saved.uri;
}
