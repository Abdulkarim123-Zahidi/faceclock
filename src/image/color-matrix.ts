/**
 * Shared color math for the editor. The same 4x5 row-major RGBA matrix
 * (offsets normalized to 0..1) drives all three consumers: Skia's
 * ColorMatrix on native, SVG feColorMatrix for the web preview, and the
 * canvas pixel loop for the web bake — so the preview is the result.
 */

export type ColorMatrix = number[]; // 20 values, 4 rows x 5 cols

export type FilterPreset = "none" | "bw" | "warm" | "cool";

export type EditAdjustments = {
  /** -50..50, 0 = neutral. */
  brightness: number;
  /** -50..50, 0 = neutral. */
  contrast: number;
  preset: FilterPreset;
};

export const NEUTRAL_ADJUSTMENTS: EditAdjustments = {
  brightness: 0,
  contrast: 0,
  preset: "none",
};

const IDENTITY: ColorMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

const PRESETS: Record<FilterPreset, ColorMatrix> = {
  none: IDENTITY,
  // ITU-R BT.709 luma weights.
  bw: [
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0.2126, 0.7152, 0.0722, 0, 0,
    0, 0, 0, 1, 0,
  ],
  warm: [
    1.1, 0, 0, 0, 0.01,
    0, 1.03, 0, 0, 0,
    0, 0, 0.88, 0, 0,
    0, 0, 0, 1, 0,
  ],
  cool: [
    0.9, 0, 0, 0, 0,
    0, 1.0, 0, 0, 0,
    0, 0, 1.12, 0, 0.01,
    0, 0, 0, 1, 0,
  ],
};

/**
 * outer ∘ inner — the matrix that applies `inner` first, then `outer`.
 * Treating each as an affine map M(v) = A·v + b:
 * outer(inner(v)) = (A₂A₁)·v + (A₂·b₁ + b₂).
 */
export function composeMatrices(
  outer: ColorMatrix,
  inner: ColorMatrix,
): ColorMatrix {
  const out = new Array<number>(20).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      let v = 0;
      for (let k = 0; k < 4; k++) {
        v += outer[r * 5 + k] * inner[k * 5 + c];
      }
      if (c === 4) v += outer[r * 5 + 4];
      out[r * 5 + c] = v;
    }
  }
  return out;
}

export function buildColorMatrix(adj: EditAdjustments): ColorMatrix {
  // Map -50..50 to a 0.5..1.5 multiplier.
  const b = 1 + adj.brightness / 100;
  const c = 1 + adj.contrast / 100;

  const brightnessM: ColorMatrix = [
    b, 0, 0, 0, 0,
    0, b, 0, 0, 0,
    0, 0, b, 0, 0,
    0, 0, 0, 1, 0,
  ];
  // Contrast scales around mid-gray: v' = c·(v − 0.5) + 0.5.
  const o = 0.5 * (1 - c);
  const contrastM: ColorMatrix = [
    c, 0, 0, 0, o,
    0, c, 0, 0, o,
    0, 0, c, 0, o,
    0, 0, 0, 1, 0,
  ];

  return composeMatrices(
    contrastM,
    composeMatrices(brightnessM, PRESETS[adj.preset]),
  );
}

export function isNeutral(adj: EditAdjustments): boolean {
  return adj.brightness === 0 && adj.contrast === 0 && adj.preset === "none";
}
