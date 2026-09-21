import { useId } from "react";
import type { DeviceRender } from "@/lib/types";
import { cn } from "@/lib/utils";

type Face = "front" | "back";

type Props = {
  spec: DeviceRender;
  face?: Face;
  className?: string;
  /** Drawn behind the device. Turn off inside dense grids to save paint. */
  shadow?: boolean;
  /** Decorative by default; pass a label when the device IS the content. */
  label?: string;
};

/**
 * Vector stand-in for studio product photography.
 *
 * Built from the same ingredients a product photographer works with —
 * a key light from the upper left, a soft fill from the right, an
 * anisotropic sheen along the metal rails, and a contact shadow that
 * grounds the object. It is resolution-independent, so it stays sharp on a
 * 4K display, and weighs a few kilobytes instead of a few hundred.
 *
 * This is scaffolding, not a destination: the moment a product has real
 * photography in `photos`, `<ProductImage>` uses that instead.
 */
export function DeviceRender({
  spec,
  face = "front",
  className,
  shadow = true,
  label,
}: Props) {
  // Gradient ids must be unique per instance or the first one on the page
  // wins for every device — the classic reason vector renders look flat.
  const uid = useId().replace(/:/g, "");
  const id = (name: string) => `${name}-${uid}`;

  const [bodyLight, bodyDark] = spec.body;
  const [frameLight, frameDark] = spec.frame;
  const [screenTop, screenBottom] = spec.screen;

  return (
    <svg
      viewBox="0 0 440 900"
      className={cn("h-full w-full", className)}
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        {/* Back panel: key light upper-left, falloff to lower-right. */}
        <linearGradient id={id("body")} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor={bodyLight} />
          <stop offset="48%" stopColor={bodyDark} />
          <stop offset="100%" stopColor={bodyLight} stopOpacity="0.82" />
        </linearGradient>

        {/*
          The rail gradient runs across the device, not along it. Metal
          reads as metal because of the tight bright-dark-bright banding
          at the chamfers — a single soft ramp always looks like plastic.
        */}
        <linearGradient id={id("frame")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={frameDark} />
          <stop offset="4%" stopColor={frameLight} />
          <stop offset="14%" stopColor={frameDark} />
          <stop offset="50%" stopColor={frameLight} />
          <stop offset="86%" stopColor={frameDark} />
          <stop offset="96%" stopColor={frameLight} />
          <stop offset="100%" stopColor={frameDark} />
        </linearGradient>

        {/* OLED panel: never pure black — it carries the wallpaper's cast. */}
        <linearGradient id={id("screen")} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={screenTop} />
          <stop offset="100%" stopColor={screenBottom} />
        </linearGradient>

        {/* Two wallpaper blooms give the panel depth without an image. */}
        <radialGradient id={id("bloomA")} cx="0.28" cy="0.24" r="0.62">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("bloomB")} cx="0.76" cy="0.78" r="0.58">
          <stop offset="0%" stopColor="#a26b38" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#a26b38" stopOpacity="0" />
        </radialGradient>

        {/* The studio softbox, reflected diagonally across the glass. */}
        <linearGradient id={id("glass")} x1="0" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.20" />
          <stop offset="34%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="46%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Lens glass: dark iris, bright rim, one specular pinpoint. */}
        <radialGradient id={id("lens")} cx="0.36" cy="0.30" r="0.85">
          <stop offset="0%" stopColor="#5d6474" />
          <stop offset="22%" stopColor="#252a36" />
          <stop offset="62%" stopColor="#0b0d14" />
          <stop offset="100%" stopColor="#1d2230" />
        </radialGradient>

        <linearGradient id={id("lensRing")} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor={frameLight} />
          <stop offset="50%" stopColor={frameDark} />
          <stop offset="100%" stopColor={frameLight} />
        </linearGradient>

        {/* Raised camera plateau casts a short shadow onto the panel. */}
        <filter id={id("plateau")} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="8"
            floodColor="#000000"
            floodOpacity="0.28"
          />
        </filter>

        {/* Contact shadow: tight and dark under the device, soft at the edges. */}
        <radialGradient id={id("contact")} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#0a0a0b" stopOpacity="0.36" />
          <stop offset="55%" stopColor="#0a0a0b" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#0a0a0b" stopOpacity="0" />
        </radialGradient>

        <clipPath id={id("screenClip")}>
          <rect x="52" y="42" width="336" height="816" rx="50" />
        </clipPath>
        <clipPath id={id("bodyClip")}>
          <rect x="44" y="34" width="352" height="832" rx="58" />
        </clipPath>
      </defs>

      {shadow && (
        <ellipse
          cx="220"
          cy="872"
          rx="176"
          ry="30"
          fill={`url(#${id("contact")})`}
        />
      )}

      {/* Frame ---------------------------------------------------------- */}
      <rect
        x="44"
        y="34"
        width="352"
        height="832"
        rx="58"
        fill={`url(#${id("frame")})`}
      />

      {face === "front" ? (
        <>
          <rect
            x="52"
            y="42"
            width="336"
            height="816"
            rx="50"
            fill={`url(#${id("screen")})`}
          />
          <g clipPath={`url(#${id("screenClip")})`}>
            <rect x="52" y="42" width="336" height="816" fill={`url(#${id("bloomA")})`} />
            <rect x="52" y="42" width="336" height="816" fill={`url(#${id("bloomB")})`} />
            <rect x="52" y="42" width="336" height="816" fill={`url(#${id("glass")})`} />
          </g>

          {spec.cutout === "island" && (
            <rect x="170" y="66" width="100" height="30" rx="15" fill="#08080b" />
          )}
          {spec.cutout === "punch" && (
            <circle cx="220" cy="80" r="11" fill="#08080b" />
          )}

          {/* Inner chamfer: the bright hairline where glass meets metal. */}
          <rect
            x="52.5"
            y="42.5"
            width="335"
            height="815"
            rx="50"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.16"
            strokeWidth="1"
          />
        </>
      ) : (
        <>
          <rect
            x="52"
            y="42"
            width="336"
            height="816"
            rx="50"
            fill={`url(#${id("body")})`}
          />
          <g clipPath={`url(#${id("screenClip")})`}>
            <rect x="52" y="42" width="336" height="816" fill={`url(#${id("glass")})`} />
          </g>
          <CameraModule spec={spec} idFor={id} />
        </>
      )}

      {/* Side controls: small, but their absence is what makes a render
          read as a drawing rather than an object. */}
      <g clipPath={`url(#${id("bodyClip")})`} opacity="0.55">
        <rect x="41" y="220" width="5" height="46" rx="2.5" fill={frameDark} />
        <rect x="41" y="290" width="5" height="76" rx="2.5" fill={frameDark} />
        <rect x="41" y="386" width="5" height="76" rx="2.5" fill={frameDark} />
        <rect x="394" y="300" width="5" height="108" rx="2.5" fill={frameDark} />
      </g>

      {/* Outer edge darkening — keeps the silhouette from dissolving into
          a white background. */}
      <rect
        x="44.5"
        y="34.5"
        width="351"
        height="831"
        rx="58"
        fill="none"
        stroke="#0a0a0b"
        strokeOpacity="0.16"
        strokeWidth="1"
      />
    </svg>
  );
}

/** Camera plateau and lens stack, laid out per the product's spec. */
function CameraModule({
  spec,
  idFor,
}: {
  spec: DeviceRender;
  idFor: (name: string) => string;
}) {
  const lens = (cx: number, cy: number, r: number, key: string) => (
    <g key={key}>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${idFor("lensRing")})`} />
      <circle cx={cx} cy={cy} r={r - 5} fill={`url(#${idFor("lens")})`} />
      {/* Specular pinpoint: the softbox, reflected in the front element. */}
      <ellipse
        cx={cx - r * 0.3}
        cy={cy - r * 0.34}
        rx={r * 0.22}
        ry={r * 0.15}
        fill="#ffffff"
        fillOpacity="0.45"
        transform={`rotate(-28 ${cx - r * 0.3} ${cy - r * 0.34})`}
      />
      {/* Coating flare — the faint amber-green cast on multicoated glass. */}
      <circle cx={cx + r * 0.22} cy={cy + r * 0.26} r={r * 0.16} fill="#4b6b5a" fillOpacity="0.35" />
    </g>
  );

  const plateauFill = `url(#${idFor("body")})`;

  if (spec.cameraLayout === "square") {
    const lenses: [number, number][] = [
      [136, 152],
      [212, 152],
      [136, 228],
      [212, 228],
    ];
    return (
      <g filter={`url(#${idFor("plateau")})`}>
        <rect x="86" y="102" width="176" height="176" rx="48" fill={plateauFill} />
        <rect
          x="86.5"
          y="102.5"
          width="175"
          height="175"
          rx="48"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
        />
        {lenses
          .slice(0, spec.cameraCount)
          .map(([cx, cy], i) => lens(cx, cy, 30, `sq-${i}`))}
      </g>
    );
  }

  if (spec.cameraLayout === "vertical") {
    return (
      <g filter={`url(#${idFor("plateau")})`}>
        {Array.from({ length: spec.cameraCount }).map((_, i) =>
          lens(128, 132 + i * 74, 26, `v-${i}`),
        )}
      </g>
    );
  }

  if (spec.cameraLayout === "circle") {
    const lenses: [number, number][] = [
      [176, 142],
      [236, 176],
      [176, 210],
    ];
    return (
      <g filter={`url(#${idFor("plateau")})`}>
        <circle cx="200" cy="176" r="86" fill={plateauFill} />
        <circle
          cx="200"
          cy="176"
          r="85.5"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.22"
        />
        {lenses
          .slice(0, spec.cameraCount)
          .map(([cx, cy], i) => lens(cx, cy, 25, `c-${i}`))}
      </g>
    );
  }

  // pill
  return (
    <g filter={`url(#${idFor("plateau")})`}>
      <rect x="96" y="104" width="86" height="156" rx="43" fill={plateauFill} />
      <rect
        x="96.5"
        y="104.5"
        width="85"
        height="155"
        rx="43"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.22"
      />
      {Array.from({ length: Math.min(spec.cameraCount, 2) }).map((_, i) =>
        lens(139, 146 + i * 72, 28, `p-${i}`),
      )}
    </g>
  );
}
