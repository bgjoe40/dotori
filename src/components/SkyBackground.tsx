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

      {/* 별 (다크모드 전용) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-0 dark:opacity-100"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMin slice"
      >
        <g fill="white">
          {/* 크기별 별 — 각 circle는 cx, cy, r */}
          <circle className="star" style={{'--star-opacity':'0.9','animationDuration':'3.2s','animationDelay':'0s'} as React.CSSProperties} cx="60"  cy="40"  r="1.2" opacity="0.9" />
          <circle className="star" style={{'--star-opacity':'0.7','animationDuration':'4.5s','animationDelay':'-1.1s'} as React.CSSProperties} cx="150" cy="20"  r="0.8" opacity="0.7" />
          <circle className="star" style={{'--star-opacity':'0.85','animationDuration':'2.8s','animationDelay':'-2.3s'} as React.CSSProperties} cx="240" cy="55"  r="1.5" opacity="0.85" />
          <circle className="star" style={{'--star-opacity':'0.8','animationDuration':'5.1s','animationDelay':'-0.7s'} as React.CSSProperties} cx="310" cy="15"  r="0.9" opacity="0.8" />
          <circle className="star" style={{'--star-opacity':'0.75','animationDuration':'3.7s','animationDelay':'-3.4s'} as React.CSSProperties} cx="400" cy="35"  r="1.1" opacity="0.75" />
          <circle className="star" style={{'--star-opacity':'0.9','animationDuration':'2.5s','animationDelay':'-1.8s'} as React.CSSProperties} cx="480" cy="10"  r="1.4" opacity="0.9" />
          <circle className="star" style={{'--star-opacity':'0.6','animationDuration':'4.9s','animationDelay':'-4.2s'} as React.CSSProperties} cx="555" cy="50"  r="0.7" opacity="0.6" />
          <circle className="star" style={{'--star-opacity':'0.85','animationDuration':'3.3s','animationDelay':'-0.5s'} as React.CSSProperties} cx="630" cy="22"  r="1.2" opacity="0.85" />
          <circle className="star" style={{'--star-opacity':'0.7','animationDuration':'5.6s','animationDelay':'-2.9s'} as React.CSSProperties} cx="700" cy="42"  r="0.9" opacity="0.7" />
          <circle className="star" style={{'--star-opacity':'0.9','animationDuration':'2.1s','animationDelay':'-1.4s'} as React.CSSProperties} cx="770" cy="12"  r="1.6" opacity="0.9" />
          <circle className="star" style={{'--star-opacity':'0.75','animationDuration':'4.2s','animationDelay':'-3.7s'} as React.CSSProperties} cx="850" cy="38"  r="1.0" opacity="0.75" />
          <circle className="star" style={{'--star-opacity':'0.65','animationDuration':'6.0s','animationDelay':'-0.2s'} as React.CSSProperties} cx="920" cy="18"  r="0.7" opacity="0.65" />
          <circle className="star" style={{'--star-opacity':'0.8','animationDuration':'3.9s','animationDelay':'-2.1s'} as React.CSSProperties} cx="990" cy="48"  r="1.3" opacity="0.8" />
          <circle className="star" style={{'--star-opacity':'0.7','animationDuration':'4.7s','animationDelay':'-4.8s'} as React.CSSProperties} cx="1060" cy="25" r="0.9" opacity="0.7" />
          <circle className="star" style={{'--star-opacity':'0.85','animationDuration':'3.1s','animationDelay':'-1.6s'} as React.CSSProperties} cx="1130" cy="55" r="1.1" opacity="0.85" />
          <circle className="star" style={{'--star-opacity':'0.6','animationDuration':'5.3s','animationDelay':'-3.0s'} as React.CSSProperties} cx="1180" cy="15" r="0.8" opacity="0.6" />
          <circle className="star" style={{'--star-opacity':'0.55','animationDuration':'4.4s','animationDelay':'-1.3s'} as React.CSSProperties} cx="200"  cy="90"  r="0.7" opacity="0.55" />
          <circle className="star" style={{'--star-opacity':'0.65','animationDuration':'2.9s','animationDelay':'-5.2s'} as React.CSSProperties} cx="350"  cy="80"  r="1.0" opacity="0.65" />
          <circle className="star" style={{'--star-opacity':'0.6','animationDuration':'5.8s','animationDelay':'-0.9s'} as React.CSSProperties} cx="500"  cy="95"  r="0.8" opacity="0.6" />
          <circle className="star" style={{'--star-opacity':'0.7','animationDuration':'3.5s','animationDelay':'-3.3s'} as React.CSSProperties} cx="660"  cy="75"  r="1.2" opacity="0.7" />
          <circle className="star" style={{'--star-opacity':'0.55','animationDuration':'4.1s','animationDelay':'-2.6s'} as React.CSSProperties} cx="810"  cy="88"  r="0.7" opacity="0.55" />
          <circle className="star" style={{'--star-opacity':'0.65','animationDuration':'6.2s','animationDelay':'-4.5s'} as React.CSSProperties} cx="960"  cy="82"  r="1.0" opacity="0.65" />
          <circle className="star" style={{'--star-opacity':'0.6','animationDuration':'3.6s','animationDelay':'-1.9s'} as React.CSSProperties} cx="1100" cy="90"  r="0.8" opacity="0.6" />
          {/* 반짝이는 별 (r이 약간 큰 것들) */}
          <circle className="star" style={{'--star-opacity':'0.5','animationDuration':'2.3s','animationDelay':'-0.6s'} as React.CSSProperties} cx="110" cy="110" r="1.8" opacity="0.5" />
          <circle className="star" style={{'--star-opacity':'0.45','animationDuration':'1.9s','animationDelay':'-2.4s'} as React.CSSProperties} cx="430" cy="120" r="1.5" opacity="0.45" />
          <circle className="star" style={{'--star-opacity':'0.5','animationDuration':'2.6s','animationDelay':'-1.0s'} as React.CSSProperties} cx="740" cy="105" r="1.7" opacity="0.5" />
          <circle className="star" style={{'--star-opacity':'0.45','animationDuration':'2.2s','animationDelay':'-3.8s'} as React.CSSProperties} cx="1050" cy="115" r="1.6" opacity="0.45" />
        </g>
      </svg>

      {/* 태양 (라이트모드) */}
      <div className="absolute right-[12%] top-[8%] block dark:hidden">
        <div className="h-20 w-20 rounded-full bg-yellow-200/80 blur-sm" />
      </div>

      {/* 달 (다크모드) — 초승달: 큰 원에서 작은 원을 clipPath로 빼기 */}
      <div className="absolute right-[12%] top-[8%] hidden dark:block">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <defs>
            <clipPath id="crescent-clip">
              {/* 큰 원이 달 본체, 작은 원이 가리는 영역 */}
              <path d="M0 0 H72 V72 H0 Z" />
            </clipPath>
            <mask id="crescent-mask">
              <rect width="72" height="72" fill="white" />
              {/* 오른쪽으로 살짝 치우친 원으로 가려서 초승달 연출 */}
              <circle cx="46" cy="30" r="26" fill="black" />
            </mask>
          </defs>
          {/* 달 본체 */}
          <circle cx="34" cy="36" r="28" fill="rgb(226,232,240)" opacity="0.85" mask="url(#crescent-mask)" />
          {/* 달 테두리 글로우 */}
          <circle cx="34" cy="36" r="29" fill="none" stroke="rgb(248,250,252)" strokeWidth="1.5" opacity="0.3" mask="url(#crescent-mask)" />
        </svg>
      </div>

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
