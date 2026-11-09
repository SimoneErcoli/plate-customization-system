import { forwardRef } from "react";
import { PLATE_GROUPS, PLATE_PATTERN } from "@/lib/plate/config";

/** Proporzioni della targa posteriore a una riga (formato A): 520 × 110 mm. */
export const PLATE_WIDTH = 520;
export const PLATE_HEIGHT = 110;
const BAND_WIDTH = 46;
const EU_BLUE = "#003399";
const EU_YELLOW = "#FFCC00";
export const PLATE_FONT_FAMILY = "TargaFont";

interface PlateSvgProps {
  slots: readonly string[];
  /** Posizioni da sottolineare in rosso. */
  errorPositions?: readonly number[];
  activeIndex?: number | null;
  province?: string;
  /** Anno di immatricolazione a due cifre, es. "26". */
  year?: string;
  className?: string;
  title?: string;
}

/** Centri orizzontali dei 7 caratteri, con lo stacco tra i gruppi AA · 000 · AA. */
function charCenters(): number[] {
  const charW = 51;
  const gap = 24;
  const total = charW * PLATE_PATTERN.length + gap * (PLATE_GROUPS.length - 1);
  const start = BAND_WIDTH + (PLATE_WIDTH - 2 * BAND_WIDTH - total) / 2;
  const centers: number[] = [];
  PLATE_GROUPS.forEach(([s, e], g) => {
    for (let i = s; i < e; i++) centers.push(start + g * gap + i * charW + charW / 2);
  });
  return centers;
}

const CENTERS = charCenters();

function euStars(cx: number, cy: number, r: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    const pts = Array.from({ length: 10 }, (_, k) => {
      const rr = k % 2 === 0 ? 2.6 : 1.05;
      const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
      return `${(x + rr * Math.cos(ang)).toFixed(2)},${(y + rr * Math.sin(ang)).toFixed(2)}`;
    }).join(" ");
    return <polygon key={i} points={pts} fill={EU_YELLOW} />;
  });
}

export const PlateSvg = forwardRef<SVGSVGElement, PlateSvgProps>(function PlateSvg(
  { slots, errorPositions = [], activeIndex = null, province, year, className, title },
  ref,
) {
  const rightX = PLATE_WIDTH - BAND_WIDTH;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${PLATE_WIDTH} ${PLATE_HEIGHT}`}
      className={className}
      role="img"
      aria-label={title ?? `Targa ${slots.join("")}`}
    >
      <defs>
        <clipPath id="plate-clip">
          <rect x="1" y="1" width={PLATE_WIDTH - 2} height={PLATE_HEIGHT - 2} rx="9" />
        </clipPath>
        <linearGradient id="plate-sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef0f3" />
        </linearGradient>
      </defs>

      <g clipPath="url(#plate-clip)">
        <rect width={PLATE_WIDTH} height={PLATE_HEIGHT} fill="url(#plate-sheen)" />

        {/* Banda sinistra: stelle UE + I */}
        <rect width={BAND_WIDTH} height={PLATE_HEIGHT} fill={EU_BLUE} />
        {euStars(BAND_WIDTH / 2, 34, 13)}
        <text
          x={BAND_WIDTH / 2}
          y={96}
          textAnchor="middle"
          fill="#fff"
          fontFamily={PLATE_FONT_FAMILY}
          fontSize="36"
        >
          I
        </text>

        {/* Banda destra: anno (opzionale) + sigla provincia (opzionale) */}
        <rect x={rightX} width={BAND_WIDTH} height={PLATE_HEIGHT} fill={EU_BLUE} />
        {year ? (
          <g>
            <circle cx={rightX + BAND_WIDTH / 2} cy={32} r={15} fill="none" stroke={EU_YELLOW} strokeWidth="2" />
            <text
              x={rightX + BAND_WIDTH / 2}
              y={40}
              textAnchor="middle"
              fill={EU_YELLOW}
              fontFamily={PLATE_FONT_FAMILY}
              fontSize="22"
            >
              {year}
            </text>
          </g>
        ) : null}
        {province ? (
          <text
            x={rightX + BAND_WIDTH / 2}
            y={96}
            textAnchor="middle"
            fill="#fff"
            fontFamily={PLATE_FONT_FAMILY}
            fontSize="28"
          >
            {province}
          </text>
        ) : null}

        {/* Caratteri */}
        {CENTERS.map((cx, i) => {
          const char = slots[i];
          const isError = errorPositions.includes(i);
          const placeholder = PLATE_PATTERN[i] === "letter" ? "A" : "0";
          return (
            <g key={i}>
              {activeIndex === i ? (
                <rect data-export-hide x={cx - 24} y={14} width={48} height={82} rx={4} fill={EU_BLUE} opacity={0.08} />
              ) : null}
              <text
                x={cx}
                y={89}
                textAnchor="middle"
                fontFamily={PLATE_FONT_FAMILY}
                fontSize="106"
                fill={char ? (isError ? "#c81e1e" : "#111") : "#d4d7dd"}
              >
                {char || placeholder}
              </text>
              {isError ? <rect x={cx - 20} y={98} width={40} height={4} rx={2} fill="#c81e1e" /> : null}
            </g>
          );
        })}
      </g>

      <rect
        x="1"
        y="1"
        width={PLATE_WIDTH - 2}
        height={PLATE_HEIGHT - 2}
        rx="9"
        fill="none"
        stroke="#1f2937"
        strokeWidth="2"
      />
    </svg>
  );
});
