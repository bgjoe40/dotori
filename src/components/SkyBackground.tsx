/**
 * 뷰포트에 고정된 산/하늘/구름 배경.
 * - position: fixed로 스크롤과 무관하게 표시
 * - SVG 인라인 + Tailwind dark: 변형으로 라이트/다크 모두 지원
 * - pointer-events-none + -z-10 으로 입력 차단 및 항상 후면 배치
 */
export default function SkyBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 하늘 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-sky-100 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-stone-900" />

      {/* 태양 / 달 */}
      <div className="absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-yellow-200/80 blur-sm dark:bg-slate-200/30" />

      {/* 구름 */}
      <svg
        className="absolute left-0 top-[6%] w-full opacity-90 dark:opacity-25"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMin slice"
      >
        <g className="fill-white dark:fill-slate-400">
          <ellipse cx="120" cy="80" rx="60" ry="22" />
          <ellipse cx="170" cy="70" rx="45" ry="20" />
          <ellipse cx="80" cy="90" rx="40" ry="18" />
          <ellipse cx="640" cy="50" rx="70" ry="20" />
          <ellipse cx="700" cy="42" rx="50" ry="18" />
          <ellipse cx="590" cy="56" rx="40" ry="16" />
          <ellipse cx="980" cy="100" rx="65" ry="22" />
          <ellipse cx="1040" cy="92" rx="48" ry="20" />
          <ellipse cx="930" cy="108" rx="38" ry="18" />
        </g>
      </svg>

      {/* 산 — 원경 */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 300"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          className="fill-violet-200/70 dark:fill-slate-700/60"
          d="M0,220 L120,140 L220,200 L340,100 L460,180 L580,120 L700,190 L820,110 L940,170 L1060,130 L1200,200 L1200,300 L0,300 Z"
        />
      </svg>

      {/* 산 — 중경 */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 280"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          className="fill-emerald-300/80 dark:fill-slate-800/80"
          d="M0,220 L100,160 L200,210 L320,140 L420,200 L540,150 L660,220 L780,160 L900,210 L1040,170 L1200,220 L1200,280 L0,280 Z"
        />
      </svg>

      {/* 산 — 근경 */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax slice"
      >
        <path
          className="fill-emerald-700/85 dark:fill-stone-900/90"
          d="M0,180 L80,120 L180,170 L280,100 L400,160 L520,120 L640,180 L760,130 L880,170 L1000,120 L1120,170 L1200,140 L1200,220 L0,220 Z"
        />
      </svg>
    </div>
  );
}
