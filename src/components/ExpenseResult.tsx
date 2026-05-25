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
            const isEven = !exp.splitMode || exp.splitMode === 'even';
            const displayTotal = isEven ? exp.amount : item.perPerson * item.sharerCount;
            return (
              <li
                key={item.expenseId}
                className="flex flex-col gap-0.5 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-medium text-stone-800">
                    {exp.description || '(이름 없음)'}
                    <span
                      className={
                        'rounded-full px-1.5 py-0.5 text-xs font-semibold ' +
                        (isEven
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-orange-100 text-orange-700')
                      }
                    >
                      {isEven ? 'N빵' : '인원추가'}
                    </span>
                  </span>
                  <span className="text-stone-700">{formatKRW(displayTotal)}</span>
                </div>
                <div className="text-xs text-stone-500">
                  지불: {nameOf(exp.payerId)} · 1인당 {formatKRW(item.perPerson)} ×{' '}
                  {item.sharerCount}명
                  {exp.memo && ` · ${exp.memo}`}
                </div>
                <div className="text-xs text-stone-400">
                  참여: {exp.sharerIds.map(nameOf).join(', ')}
                </div>
              </li>
            );
          })}
          {result.items.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">정산 대상 없음</li>
          )}
        </ul>
      </div>

      {/* 지불자별 수령 합계 */}
      <div>
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          💰 지불자별 수령 합계
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {result.payerReceipts.map((r) => {
            const paidItems = expenses.filter((e) => e.payerId === r.payerId);
            // 본인이 sharer이지만 직접 내지 않은 항목 (지출 항목)
            const owedItems = expenses.filter(
              (e) => e.sharerIds.includes(r.payerId) && e.payerId !== r.payerId,
            );
            return (
              <li key={r.payerId} className="flex flex-col gap-1 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-stone-800">{nameOf(r.payerId)}</span>
                  <span className="font-bold text-sm text-green-700">
                    +{formatKRW(r.totalReceived)}
                  </span>
                </div>
                {/* 수령 항목 */}
                <ul className="flex flex-col gap-0.5">
                  {paidItems.map((e) => {
                    const itemResult = result.items.find((i) => i.expenseId === e.id);
                    if (!itemResult) return null;
                    const isSelfShared = e.sharerIds.includes(r.payerId);
                    const nonSelfCount = itemResult.sharerCount - (isSelfShared ? 1 : 0);
                    const received = itemResult.perPerson * nonSelfCount;
                    const isEven = !e.splitMode || e.splitMode === 'even';
                    const total = isEven ? e.amount : itemResult.perPerson * itemResult.sharerCount;
                    return (
                      <li key={e.id} className="flex flex-col text-xs">
                        <div className="flex items-center justify-between text-stone-400">
                          <span>{e.description || '(이름 없음)'}</span>
                          <span>{formatKRW(received)}</span>
                        </div>
                        {isSelfShared && (
                          <div className="text-xs text-stone-500">
                            총 {formatKRW(total)} − 본인 {formatKRW(itemResult.perPerson)}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {/* 지출 항목 (다른 사람이 낸 항목 중 본인 몫) */}
                {owedItems.length > 0 && (
                  <>
                    <div className="mt-0.5 border-t border-stone-200 pt-0.5 text-xs font-semibold text-stone-400">
                      지출 항목
                    </div>
                    <ul className="flex flex-col gap-0.5">
                      {owedItems.map((e) => {
                        const itemResult = result.items.find((i) => i.expenseId === e.id);
                        if (!itemResult) return null;
                        return (
                          <li key={e.id} className="flex items-center justify-between text-xs text-red-400">
                            <span>{e.description || '(이름 없음)'} <span className="text-stone-400">(→ {nameOf(e.payerId)})</span></span>
                            <span>-{formatKRW(itemResult.perPerson)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </li>
            );
          })}
          {result.payerReceipts.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">수령 내역 없음</li>
          )}
        </ul>
      </div>
    </section>
  );
}
