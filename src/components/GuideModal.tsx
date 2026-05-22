interface GuideModalProps {
  onClose: () => void;
}

import { useEffect } from 'react';

interface StepSection {
  step: string;
  title: string;
  intro?: string;
  items: { label: string; desc: string }[];
  note?: string;
}

const sections: StepSection[] = [
  {
    step: '1',
    title: '📅 모임 정보 입력',
    items: [
      { label: '모임 이름', desc: '공유 텍스트 상단에 표시됩니다. (선택)' },
      { label: '날짜', desc: '정산 날짜. 공유 텍스트에 함께 표시됩니다. (선택)' },
      { label: '연료비 단가 (원/km)', desc: '기본값 170원/km. 카풀 유류비 계산에 사용됩니다.' },
    ],
  },
  {
    step: '2',
    title: '👥 참가자 등록',
    intro: '이름 입력 후 + 버튼 또는 Enter 키로 추가합니다.',
    items: [
      { label: '카풀 체크박스', desc: '유류비·수고비를 분담할 인원에 체크합니다. 카풀을 이용하지 않는 참가자는 해제하세요.' },
      { label: '벙주 선택', desc: '모임 총무 역할. 선택 시 정산이 2단계 방식(① 모두 → 벙주 입금, ② 벙주 → 운전자/지출자 전달)으로 표시됩니다.' },
    ],
    note: '벙주는 반드시 1명 선택을 권장합니다.',
  },
  {
    step: '3',
    title: '🚗 카풀 탭 — 차량별 유류비·수고비',
    intro: '"+ 차량 추가" 버튼으로 차량을 등록합니다.',
    items: [
      { label: '운전자', desc: '이 차량을 운전한 참가자를 선택합니다.' },
      { label: '왕복 거리 (km)', desc: '총 주행 거리. 유류비 = 거리 × 단가로 계산됩니다.' },
      { label: '톨비 (원)', desc: '왕복 통행료 합계. 유류비에 합산됩니다.' },
      { label: '주차비 (원)', desc: '주차료 합계. 유류비에 합산됩니다.' },
      { label: '수고비 (원)', desc: '운전자에게 지급하는 사례비. 탑승자 인원으로 나눕니다.' },
      { label: '탑승자', desc: '이 차량에 탑승한 참가자를 선택합니다. (운전자 제외)' },
    ],
    note: '유류비 = (거리×단가 + 톨비 + 주차비) ÷ (운전자+탑승자 수)\n수고비 = 입력한 수고비 ÷ 탑승자 수',
  },
  {
    step: '4',
    title: '🚐 렌트 탭 — 렌트 비용 정산',
    intro: '"+ 렌트 차량 추가" 버튼으로 차량을 등록합니다.',
    items: [
      { label: '운전자', desc: '이 렌트 차량을 운전한 참가자. 여러 명 선택 가능합니다.' },
      { label: '왕복 거리 (km)', desc: '총 주행 거리 (참고용).' },
      { label: '렌트비 (원)', desc: '총 렌트 비용. 전체 탑승 인원으로 균등 분담됩니다.' },
      { label: '톨비·주차비 (원)', desc: '렌트비에 합산되어 계산됩니다.' },
      { label: '수고비 (원)', desc: '운전자 사례비. 탑승자 인원으로 나눕니다.' },
      { label: '탑승자', desc: '이 차량에 탑승한 참가자를 선택합니다.' },
    ],
    note: '1인당 부담 = (렌트비 + 톨비 + 주차비) ÷ 전체 탑승 인원\n수고비는 탑승자만 분담합니다.',
  },
  {
    step: '5',
    title: '🧾 경비 탭 — 공동 경비 정산',
    intro: '"+ 경비 항목 추가" 버튼으로 항목을 등록합니다.',
    items: [
      { label: '항목명', desc: '경비 내용 (예: 점심식사, 숙박비).' },
      { label: '지불자', desc: '먼저 돈을 낸 참가자. 다른 인원에게 돈을 받습니다.' },
      { label: 'N빵 모드', desc: '총 금액을 선택 인원 수로 균등 분할합니다.' },
      { label: '인원추가 모드', desc: '1인당 금액을 먼저 입력하면 총액이 자동 계산됩니다.' },
      { label: '분담자 선택', desc: '이 경비를 함께 부담할 참가자를 선택합니다. 미선택 시 전체 참가자가 균등 부담합니다.' },
    ],
  },
  {
    step: '6',
    title: '💰 최종 정산 요약 확인',
    items: [
      { label: '참가자별 납부·수령', desc: '각 인원이 얼마를 납부하거나 수령하는지 표시됩니다. 이름을 누르면 항목별 상세 내역을 볼 수 있습니다.' },
      { label: '벙주 있을 때', desc: '① 모든 참가자 → 벙주에게 입금 ② 벙주 → 운전자·지출자에게 전달합니다.' },
      { label: '벙주 없을 때', desc: '최소 이체 방식으로 직접 송금할 상대와 금액이 표시됩니다.' },
    ],
  },
  {
    step: '7',
    title: '📤 공유 및 데이터 관리',
    items: [
      { label: '텍스트로 복사', desc: '최종 정산 요약 하단 버튼. 카카오톡·문자에 바로 붙여넣기 할 수 있습니다.' },
      { label: 'JSON 백업', desc: '현재 데이터를 파일로 저장합니다. 다른 기기에서 불러올 수 있습니다.' },
      { label: 'JSON 불러오기', desc: '백업 파일을 불러와 데이터를 복원합니다.' },
      { label: '전체 초기화', desc: '모든 데이터를 삭제합니다. 되돌릴 수 없으니 주의하세요.' },
    ],
    note: '데이터는 이 브라우저에만 저장됩니다. 앱 삭제나 브라우저 데이터 삭제 시 사라집니다.',
  },
];

export default function GuideModal({ onClose }: GuideModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 sm:items-center sm:px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-h-screen flex-col overflow-hidden bg-white sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl sm:shadow-xl">
        {/* 헤더 — sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-3">
          <h2 className="text-sm font-bold text-stone-900">📖 사용 가이드</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* 본문 — 내부 스크롤 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {sections.map((sec) => (
              <div key={sec.step} className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
                {/* 섹션 헤더 */}
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-[10px] font-extrabold text-white">
                    {sec.step}
                  </span>
                  <h3 className="text-[12px] font-bold text-stone-800">{sec.title}</h3>
                </div>
                {sec.intro && (
                  <p className="mb-2 text-[11px] leading-relaxed text-stone-500">{sec.intro}</p>
                )}
                {/* 항목 목록 */}
                <ul className="space-y-1.5">
                  {sec.items.map((item) => (
                    <li key={item.label} className="flex gap-2 text-[11px] leading-relaxed">
                      <span className="mt-0.5 shrink-0 font-semibold text-stone-700">{item.label}</span>
                      <span className="text-stone-400">—</span>
                      <span className="text-stone-500">{item.desc}</span>
                    </li>
                  ))}
                </ul>
                {sec.note && (
                  <div className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-[10px] leading-relaxed text-amber-700 whitespace-pre-line">
                    💡 {sec.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-stone-100 px-5 py-2.5">
          <p className="text-center text-[10px] text-stone-400">
            🌰 도토리 산행 정산 · 데이터는 내 브라우저에만 저장됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
