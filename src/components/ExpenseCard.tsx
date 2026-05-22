import type { Expense, Participant } from '../domain/types';
import { formatKRW } from '../utils/format';

interface Props {
  expense: Expense;
  participants: Participant[];
  index: number;
  onChange: (patch: Partial<Expense>) => void;
  onRemove: () => void;
}

export default function ExpenseCard({
  expense,
  participants,
  index,
  onChange,
  onRemove,
}: Props) {
  const perPerson =
    expense.sharerIds.length > 0 && expense.amount > 0
      ? Math.round(expense.amount / expense.sharerIds.length)
      : 0;

  const toggleSharer = (id: string) => {
    const next = expense.sharerIds.includes(id)
      ? expense.sharerIds.filter((s) => s !== id)
      : [...expense.sharerIds, id];
    onChange({ sharerIds: next });
  };

  const allSelected = participants.every((p) => expense.sharerIds.includes(p.id));

  const toggleAll = () => {
    if (allSelected) {
      onChange({ sharerIds: [] });
    } else {
      onChange({ sharerIds: participants.map((p) => p.id) });
    }
  };

  return (
    <article className="rounded-xl bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800">🍲 경비 {index + 1}</h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 hover:underline"
        >
          삭제
        </button>
      </header>

      {/* 항목 설명 + 금액 */}
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          placeholder="항목 (예: 저녁식사, 커피)"
          value={expense.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
        <div className="relative">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="금액"
            value={expense.amount === 0 ? '' : expense.amount}
            onChange={(e) => {
              const v = e.target.value === '' ? 0 : Number(e.target.value);
              onChange({ amount: Number.isNaN(v) ? 0 : v });
            }}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-8 text-sm focus:border-amber-500 focus:outline-none sm:w-36"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
            원
          </span>
        </div>
      </div>

      {/* 지불자 */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-stone-600">지불자</label>
        {participants.length === 0 ? (
          <p className="text-xs text-stone-400">먼저 참가자를 추가하세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const selected = expense.payerId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onChange({ payerId: p.id })}
                  className={
                    'rounded-full border px-3 py-1 text-xs transition ' +
                    (selected
                      ? 'border-amber-600 bg-amber-600 text-white'
                      : 'border-stone-300 bg-white text-stone-700 hover:border-amber-400')
                  }
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 분배 대상 */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <label className="text-xs font-medium text-stone-600">
            분배 대상{' '}
            <span className="text-stone-400">({expense.sharerIds.length}명)</span>
          </label>
          <button
            type="button"
            onClick={toggleAll}
            className="text-[11px] text-amber-700 hover:underline"
          >
            {allSelected ? '전체 해제' : '전체 선택'}
          </button>
        </div>
        {participants.length === 0 ? (
          <p className="text-xs text-stone-400">먼저 참가자를 추가하세요.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const selected = expense.sharerIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSharer(p.id)}
                  className={
                    'rounded-full border px-3 py-1 text-xs transition ' +
                    (selected
                      ? 'border-stone-700 bg-stone-700 text-white'
                      : 'border-stone-300 bg-white text-stone-500 hover:border-stone-500')
                  }
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 메모 */}
      <input
        type="text"
        placeholder="메모 (선택)"
        value={expense.memo ?? ''}
        onChange={(e) => onChange({ memo: e.target.value || undefined })}
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-xs text-stone-600 focus:border-amber-400 focus:outline-none"
      />

      {/* 미리보기 배지 */}
      {expense.amount > 0 && expense.sharerIds.length > 0 && (
        <div className="mt-3 flex justify-end">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            💰 1인당 {formatKRW(perPerson)} × {expense.sharerIds.length}명
          </span>
        </div>
      )}
    </article>
  );
}
