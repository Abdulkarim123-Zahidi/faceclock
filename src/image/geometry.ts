import {
  FlipType,
  ImageManipulator,
  SaveFormat,
  type ImageManipulatorContext,
} from "expo-image-manipulator";

// Geometry ops run through expo-image-manipulator on every platform.
// Each op renders a new working file/URL; the editor chains them.

async function renderToUri(context: ImageManipulatorContext): Promise<string> {
  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: 0.95,
    format: SaveFormat.JPEG,
  });
  return saved.uri;
}

export async function rotate(uri: string, degrees: 90 | -90): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.rotate(degrees);
  return renderToUri(context);
}

export async function flip(
  uri: string,
  direction: "horizontal" | "vertical",
): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.flip(
    direction === "horizontal" ? FlipType.Horizontal : FlipType.Vertical,
  );
  return renderToUri(context);
}

/** Center-square crop — v1's "crop" (no draggable handles yet). */
export async function cropCenterSquare(uri: string): Promise<string> {
  // First render just to learn the dimensions.
  const probe = await ImageManipulator.manipulate(uri).renderAsync();
  const side = Math.min(probe.width, probe.height);
  const originX = Math.floor((probe.width - side) / 2);
  const originY = Math.floor((probe.height - side) / 2);

  const context = ImageManipulator.manipulate(uri);
  context.crop({ originX, originY, width: side, height: side });
  return renderToUri(context);
}
