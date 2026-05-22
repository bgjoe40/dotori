import type { Expense, ExpenseSettlement, Participant } from '../domain/types';
import { formatKRW } from '../utils/format';

interface Props {
  result: ExpenseSettlement;
  expenses: Expense[];
  participants: Participant[];
}

export default function ExpenseResult({ result, expenses, participants }: Props) {
  const nameOf = (id: string) =>
    participants.find((p) => p.id === id)?.name ?? '?';

  if (expenses.length === 0) {
    return (
      <section className="rounded-xl border-2 border-amber-400 bg-white p-4 shadow">
        <h2 className="text-base font-bold text-amber-700">📊 경비 정산 결과</h2>
        <p className="mt-2 text-xs text-stone-400">경비 항목을 추가하세요.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border-2 border-amber-400 bg-white p-4 shadow">
      <h2 className="mb-1 text-base font-bold text-amber-700">📊 경비 정산 결과</h2>
      <p className="mb-3 text-xs text-stone-500">
        총 {expenses.length}건 · 합계 {formatKRW(result.totalAmount)}
      </p>

      {/* 항목별 1인당 */}
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold text-stone-600">🧾 항목별 내역</h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {result.items.map((item) => {
            const exp = expenses.find((e) => e.id === item.expenseId);
            if (!exp) return null;
            return (
              <li
                key={item.expenseId}
                className="flex flex-col gap-0.5 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-800">
                    {exp.description || '(이름 없음)'}
                  </span>
                  <span className="text-stone-700">{formatKRW(exp.amount)}</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  지불: {nameOf(exp.payerId)} · 1인당 {formatKRW(item.perPerson)} ×{' '}
                  {item.sharerCount}명
                  {exp.memo && ` · ${exp.memo}`}
                </div>
              </li>
            );
          })}
          {result.items.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">정산 대상 없음</li>
          )}
        </ul>
      </div>

      {/* 송금 명세 */}
      <div className="mb-4">
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          📤 송금 명세
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {result.transfers.map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="text-stone-800">
                {nameOf(t.fromId)}{' '}
                <span className="text-stone-400">→</span>{' '}
                {nameOf(t.toId)}
              </span>
              <span className="font-semibold text-stone-900">
                {formatKRW(t.amount)}
              </span>
            </li>
          ))}
          {result.transfers.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">송금 내역 없음</li>
          )}
        </ul>
      </div>

      {/* 지불자별 수령 합계 */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          💰 지불자별 수령 합계
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {result.payerReceipts.map((r) => (
            <li
              key={r.payerId}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="text-stone-800">{nameOf(r.payerId)}</span>
              <span className="font-semibold text-green-700">
                +{formatKRW(r.totalReceived)}
              </span>
            </li>
          ))}
          {result.payerReceipts.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">수령 내역 없음</li>
          )}
        </ul>
      </div>
    </section>
  );
}
