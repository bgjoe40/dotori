// 도토리가 배경에서 사선으로 떨어지는 CSS 애니메이션 컴포넌트
// pointer-events: none + z-index: -1 이므로 UI에 전혀 영향 없음
// keyframes 가 우측 위 → 좌측 아래로 -30vw 이동하므로
// 시작 left 는 우측 위주(30% ~ 120%)에 분포시켜 화면 전체를 골고루 덮는다.

const ACORNS: {
  left: string;
  delay: string;
  duration: string;
  size: string;
  opacity: number;
}[] = [
  { left: '30%',  delay: '-4s',   duration: '9s',  size: '22px', opacity: 0.55 },
  { left: '38%',  delay: '-3s',   duration: '12s', size: '18px', opacity: 0.45 },
  { left: '45%',  delay: '-6s',   duration: '8s',  size: '26px', opacity: 0.70 },
  { left: '52%',  delay: '-2s',   duration: '11s', size: '16px', opacity: 0.50 },
  { left: '58%',  delay: '-7s',   duration: '10s', size: '20px', opacity: 0.60 },
  { left: '65%',  delay: '-5s',   duration: '13s', size: '24px', opacity: 0.48 },
  { left: '72%',  delay: '-8s',   duration: '9s',  size: '18px', opacity: 0.65 },
  { left: '80%',  delay: '-4s',   duration: '14s', size: '22px', opacity: 0.52 },
  { left: '88%',  delay: '-9s',   duration: '10s', size: '20px', opacity: 0.70 },
  { left: '95%',  delay: '-2s',   duration: '8s',  size: '26px', opacity: 0.55 },
  { left: '102%', delay: '-6s',   duration: '12s', size: '16px', opacity: 0.45 },
  { left: '108%', delay: '-9s',   duration: '11s', size: '24px', opacity: 0.60 },
  { left: '115%', delay: '-3s',   duration: '9s',  size: '18px', opacity: 0.50 },
  { left: '78%',  delay: '-7s',   duration: '13s', size: '22px', opacity: 0.65 },
  { left: '42%',  delay: '-5s',   duration: '10s', size: '20px', opacity: 0.58 },
];

export default function AcornRain() {
  return (
    <>
      {ACORNS.map((a, i) => (
        <span
          key={i}
          className="acorn"
          style={{
            left: a.left,
            animationDelay: a.delay,
            animationDuration: a.duration,
            fontSize: a.size,
            opacity: a.opacity,
          }}
        >
          🌰
        </span>
      ))}
    </>
  );
}
