interface GuideModalProps {
  onClose: () => void;
}

import { useEffect } from 'react';

const sections = [
  {
    title: '📅 모임 정보',
    content: [
      '모임 이름·날짜·연료비 단가(원/km) 입력.',
      '기본 단가: 170원/km.',
    ],
  },
  {
    title: '👥 참가자',
    content: [
      '이름 입력 후 + 또는 Enter로 추가.',
      '카풀 탑승자는 "카풀" 체크박스 선택.',
      '벙주는 "벙주" 체크박스 선택 → 정산이 2단계(수금→지급)로 표시.',
    ],
  },
  {
    title: '🚗 카풀 탭',
    content: [
      '운전자·왕복거리·수고비·탑승자 입력.',
      '유류비 = (거리 × 단가 + 톨비 + 주차비) ÷ 카풀 인원',
      '수고비 = 수고비 ÷ 탑승자 인원',
    ],
  },
  {
    title: '🚐 렌트 탭',
    content: [
      '렌트비·수고비·탑승자 입력.',
      '(렌트비 + 수고비) ÷ 탑승자 수.',
    ],
  },
  {
    title: '🧾 경비 탭',
    content: [
      '항목별 공동 경비 추가.',
      '참가자 미선택 시 전체 균등 부담.',
    ],
  },
  {
    title: '💰 최종 정산',
    content: [
      '① 각자 → 벙주에게 입금 (수금 내역)',
      '② 벙주 → 운전자/지출자에게 전달 (지급 내역)',
    ],
  },
  {
    title: '📤 공유하기',
    content: [
      '"공유" 버튼 → 클립보드 복사.',
      '카카오톡·문자에 붙여넣기.',
    ],
  },
  {
    title: '💾 데이터 관리',
    content: [
      '브라우저에 자동 저장 (DB 미사용).',
      'JSON 백업/불러오기/전체 초기화 지원.',
    ],
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
      <div className="flex w-full max-h-screen flex-col overflow-hidden bg-white sm:max-h-[85vh] sm:max-w-xl sm:rounded-2xl sm:shadow-xl">
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
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            {sections.map((sec) => (
              <div key={sec.title} className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-2.5">
                <h3 className="mb-1.5 text-[11px] font-bold text-stone-700">{sec.title}</h3>
                <ul className="space-y-0.5">
                  {sec.content.map((line, i) => (
                    <li key={i} className="text-[11px] leading-relaxed text-stone-500">
                      • {line}
                    </li>
                  ))}
                </ul>
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
