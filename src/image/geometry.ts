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

export type CropRect = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export async function cropRect(uri: string, rect: CropRect): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  context.crop(rect);
  return renderToUri(context);
}

/** One-tap centered square crop. */
export async function cropCenterSquare(uri: string): Promise<string> {
  const { width, height } = await getImageSize(uri);
  const side = Math.min(width, height);
  return cropRect(uri, {
    originX: Math.floor((width - side) / 2),
    originY: Math.floor((height - side) / 2),
    width: side,
    height: side,
  });
}

export async function getImageSize(
  uri: string,
): Promise<{ width: number; height: number }> {
  const probe = await ImageManipulator.manipulate(uri).renderAsync();
  return { width: probe.width, height: probe.height };
}
