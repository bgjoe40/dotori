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
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-stone-800">
        <span className="mr-1.5 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-bold text-stone-500">02</span>
        👥 참가자 명단
        <span className="ml-2 text-xs font-normal text-stone-500">
          {participants.length}명
        </span>
        {banjangId && (
          <span className="ml-2 text-xs font-normal text-amber-600">
            · 벙주: {participants.find((p) => p.id === banjangId)?.name}
          </span>
        )}
      </h2>

      <div className="flex gap-2">
        <input
          className="min-h-11 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-base focus:border-green-500 focus:outline-none"
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
          className="min-h-11 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          추가
        </button>
      </div>

      {participants.length === 0 ? (
        <p className="mt-3 text-xs text-stone-400">
          참가자를 먼저 추가하세요. 카풀 미참여(개인참석)는 토글로 표시할 수
          있어요.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {participants.map((p) => {
            const isBanjang = banjangId === p.id;
            return (
              <li
                key={p.id}
                className={
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition ' +
                  (isBanjang
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-stone-200')
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
                  <label className="flex min-h-11 items-center gap-1 text-sm text-stone-600">
                    <input
                      type="checkbox"
                      checked={isBanjang}
                      onChange={() => onSetBanjang(isBanjang ? null : p.id)}
                      className="h-4 w-4 accent-amber-500"
                    />
                    벙주
                  </label>
                  <label className="flex min-h-11 items-center gap-1 text-sm text-stone-600">
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
