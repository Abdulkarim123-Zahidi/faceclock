import { useMemo, useRef, useState } from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";

import type { CropRect } from "@/image/geometry";

/**
 * Draggable/resizable crop rectangle over a contain-fitted image.
 * Works in display coordinates and reports image-pixel coordinates
 * (null while the selection still covers the whole image).
 *
 * PanResponder instead of a gesture library: four corner drags and a
 * move don't justify a dependency, and it behaves the same on web.
 */

type Props = {
  imageWidth: number;
  imageHeight: number;
  onRectChange: (rect: CropRect | null) => void;
};

type DisplayRect = { x: number; y: number; w: number; h: number };
type Box = DisplayRect & { scale: number };

const MIN_SIZE = 48; // display px
const HANDLE = 28;

export function CropOverlay({ imageWidth, imageHeight, onRectChange }: Props) {
  const [rect, setRectState] = useState<DisplayRect | null>(null);
  const rectRef = useRef<DisplayRect | null>(null);
  const startRef = useRef<DisplayRect | null>(null);
  // The contain-fitted image box within this overlay (letterbox math —
  // must match EditPreview's fit="contain"/objectFit: contain).
  const boxRef = useRef<Box | null>(null);

  function onLayout(e: LayoutChangeEvent) {
    const { width: cw, height: ch } = e.nativeEvent.layout;
    if (cw === 0 || ch === 0) return;
    const scale = Math.min(cw / imageWidth, ch / imageHeight);
    const w = imageWidth * scale;
    const h = imageHeight * scale;
    const box: Box = { x: (cw - w) / 2, y: (ch - h) / 2, w, h, scale };
    boxRef.current = box;
    setRect({ x: box.x, y: box.y, w: box.w, h: box.h });
  }

  function setRect(r: DisplayRect) {
    rectRef.current = r;
    setRectState(r);
    onRectChange(toImageRect(r, boxRef.current));
  }

  function toImageRect(r: DisplayRect, box: Box | null): CropRect | null {
    if (!box) return null;
    // Full-image selection (within a pixel of slop) means "no crop".
    if (
      Math.abs(r.x - box.x) < 1 &&
      Math.abs(r.y - box.y) < 1 &&
      Math.abs(r.w - box.w) < 1 &&
      Math.abs(r.h - box.h) < 1
    ) {
      return null;
    }
    const originX = Math.max(0, Math.round((r.x - box.x) / box.scale));
    const originY = Math.max(0, Math.round((r.y - box.y) / box.scale));
    return {
      originX,
      originY,
      width: Math.min(imageWidth - originX, Math.round(r.w / box.scale)),
      height: Math.min(imageHeight - originY, Math.round(r.h / box.scale)),
    };
  }

  const responders = useMemo(() => {
    const clamp = (v: number, lo: number, hi: number) =>
      Math.min(Math.max(v, lo), hi);

    function make(kind: "move" | "tl" | "tr" | "bl" | "br") {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          startRef.current = rectRef.current;
        },
        onPanResponderMove: (_e, g) => {
          const s = startRef.current;
          const b = boxRef.current;
          if (!s || !b) return;
          let { x, y, w, h } = s;

          if (kind === "move") {
            x = clamp(s.x + g.dx, b.x, b.x + b.w - s.w);
            y = clamp(s.y + g.dy, b.y, b.y + b.h - s.h);
          } else {
            const left = kind === "tl" || kind === "bl";
            const top = kind === "tl" || kind === "tr";
            if (left) {
              const nx = clamp(s.x + g.dx, b.x, s.x + s.w - MIN_SIZE);
              w = s.w + (s.x - nx);
              x = nx;
            } else {
              w = clamp(s.w + g.dx, MIN_SIZE, b.x + b.w - s.x);
            }
            if (top) {
              const ny = clamp(s.y + g.dy, b.y, s.y + s.h - MIN_SIZE);
              h = s.h + (s.y - ny);
              y = ny;
            } else {
              h = clamp(s.h + g.dy, MIN_SIZE, b.y + b.h - s.y);
            }
          }
          setRect({ x, y, w, h });
        },
      });
    }

    return {
      move: make("move"),
      tl: make("tl"),
      tr: make("tr"),
      bl: make("bl"),
      br: make("br"),
    };
    // Refs keep these closures current; nothing reactive to depend on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {rect && (
        <>
          <View style={[styles.shade, shadeTop(rect)]} pointerEvents="none" />
          <View
            style={[styles.shade, shadeBottom(rect)]}
            pointerEvents="none"
          />
          <View style={[styles.shade, shadeLeft(rect)]} pointerEvents="none" />
          <View
            style={[styles.shade, shadeRight(rect)]}
            pointerEvents="none"
          />

          <View
            style={[
              styles.frame,
              {
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h,
              },
            ]}
            {...responders.move.panHandlers}
          />

          <Handle x={rect.x} y={rect.y} responder={responders.tl} />
          <Handle x={rect.x + rect.w} y={rect.y} responder={responders.tr} />
          <Handle x={rect.x} y={rect.y + rect.h} responder={responders.bl} />
          <Handle
            x={rect.x + rect.w}
            y={rect.y + rect.h}
            responder={responders.br}
          />
        </>
      )}
    </View>
  );
}

function Handle({
  x,
  y,
  responder,
}: {
  x: number;
  y: number;
  responder: { panHandlers: object };
}) {
  return (
    <View
      style={[styles.handle, { left: x - HANDLE / 2, top: y - HANDLE / 2 }]}
      {...responder.panHandlers}
    >
      <View style={styles.handleDot} />
    </View>
  );
}

const shadeTop = (r: DisplayRect) => ({
  left: 0,
  right: 0,
  top: 0,
  height: r.y,
});
const shadeBottom = (r: DisplayRect) => ({
  left: 0,
  right: 0,
  top: r.y + r.h,
  bottom: 0,
});
const shadeLeft = (r: DisplayRect) => ({
  left: 0,
  width: r.x,
  top: r.y,
  height: r.h,
});
const shadeRight = (r: DisplayRect) => ({
  left: r.x + r.w,
  right: 0,
  top: r.y,
  height: r.h,
});

const styles = StyleSheet.create({
  shade: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frame: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  handle: {
    position: "absolute",
    width: HANDLE,
    height: HANDLE,
    alignItems: "center",
    justifyContent: "center",
  },
  handleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFF",
  },
});
