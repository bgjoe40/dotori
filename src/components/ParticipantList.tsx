import { useState } from 'react';
import type { Participant } from '../domain/types';

interface Props {
  participants: Participant[];
  banjangId?: string | null;
  onAdd: (name: string) => void;
  onUpdate: (id: string, patch: Partial<Participant>) => void;
  onRemove: (id: string) => void;
  onSetBanjang: (id: string | null) => void;
}

export default function ParticipantList({
  participants,
  banjangId,
  onAdd,
  onUpdate,
  onRemove,
  onSetBanjang,
}: Props) {
  const [name, setName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name);
    setName('');
  };

  return (
    <section className="app-surface p-5 sm:p-6">
      <h2 className="app-section-title mb-4">
        <span className="app-step">02</span>
        <span>참가자 명단</span>
        <span className="text-base">👥</span>
        <span className="ml-1 text-xs font-medium text-stone-500">
          {participants.length}명
        </span>
        {banjangId && (
          <span className="ml-2 text-xs font-semibold text-amber-600">
            · 벙주: {participants.find((p) => p.id === banjangId)?.name}
          </span>
        )}
      </h2>

      <div className="flex gap-2.5">
        <input
          className="app-input flex-1"
          placeholder="이름 입력 후 엔터"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-xl bg-green-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 active:scale-[0.98]"
        >
          추가
        </button>
      </div>

      {participants.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-xs leading-relaxed text-stone-500">
          참가자를 먼저 추가하세요. 카풀 미참여자는 ‘개인참석’으로 표시할 수 있어요.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {participants.map((p) => {
            const isBanjang = banjangId === p.id;
            return (
              <li
                key={p.id}
                className={
                  'flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition ' +
                  (isBanjang
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-stone-200 bg-white hover:border-stone-300')
                }
              >
                <div className="flex items-center gap-2">
                  {isBanjang && (
                    <span className="text-base leading-none">👑</span>
                  )}
                  <span
                    className={
                      'text-sm font-medium ' +
                      (isBanjang ? 'text-amber-800' : 'text-stone-800')
                    }
                  >
                    {p.name}
                  </span>
                  {isBanjang && (
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white">
                      벙주
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1 text-xs text-stone-600">
                    <input
                      type="checkbox"
                      checked={isBanjang}
                      onChange={() => onSetBanjang(isBanjang ? null : p.id)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    벙주
                  </label>
                  <label className="flex items-center gap-1 text-xs text-stone-600">
                    <input
                      type="checkbox"
                      checked={p.isCarpool}
                      onChange={(e) =>
                        onUpdate(p.id, { isCarpool: e.target.checked })
                      }
                      className="h-4 w-4 accent-green-600"
                    />
                    카풀
                  </label>
                  {!p.isCarpool && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      개인참석
                    </span>
                  )}
                  {confirmDeleteId === p.id ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-500">삭제할까요?</span>
                      <button
                        type="button"
                        onClick={() => { onRemove(p.id); setConfirmDeleteId(null); }}
                        className="text-xs font-bold text-red-600 hover:underline"
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-stone-500 hover:underline"
                      >
                        취소
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
