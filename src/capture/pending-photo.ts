import type { CameraCapturedPicture } from "expo-camera";

/**
 * In-memory handoff from the camera screen to the preview screen.
 *
 * Why not a route param: on web the captured photo is a multi-megabyte
 * base64 data URL, and expo-router puts params in the page URL — which
 * would blow past browser URL limits. A module-level slot is enough for
 * a strictly camera → preview flow.
 */
let pending: CameraCapturedPicture | null = null;

export function setPendingPhoto(photo: CameraCapturedPicture) {
  pending = photo;
}

export function getPendingPhoto(): CameraCapturedPicture | null {
  return pending;
}

export function clearPendingPhoto() {
  pending = null;
}
