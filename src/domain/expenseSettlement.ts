import type {
  Expense,
  ExpenseItemResult,
  ExpenseSettlement,
  ExpenseTransfer,
  Participant,
  PayerReceipt,
} from './types';

const round = (n: number) => Math.round(n);

/**
 * 추가 지출(경비) 정산 계산
 *
 * 규칙:
 *  - 항목별 1인당 = round(amount / sharerIds.length)
 *  - sharerIds에 지불자(payerId)가 포함되어 있어도 자기 자신으로의 송금은 생략
 *  - 동일 (from→to) 쌍 송금액은 합산
 *  - 지불자별 수령 합계 산출
 *  - sharerIds가 비어있거나 amount≤0이면 해당 항목 제외
 */
export function calcExpenseSettlement(
  expenses: Expense[],
  _participants: Participant[],
): ExpenseSettlement {
  const items: ExpenseItemResult[] = [];
  // key: "fromId->toId"
  const transferMap = new Map<string, number>();
  const payerMap = new Map<string, number>();
  let totalAmount = 0;

  for (const exp of expenses) {
    const sharers = Array.from(new Set(exp.sharerIds.filter(Boolean)));
    if (sharers.length === 0 || exp.amount <= 0 || !exp.payerId) continue;

    const isEven = !exp.splitMode || exp.splitMode === 'even';
    const perPerson = isEven ? round(exp.amount / sharers.length) : exp.amount;
    const effectiveTotal = isEven ? exp.amount : perPerson * sharers.length;
    items.push({ expenseId: exp.id, perPerson, sharerCount: sharers.length });
    totalAmount += effectiveTotal;

    for (const sharerId of sharers) {
      if (sharerId === exp.payerId) continue; // 자기 자신은 송금 불필요
      const key = `${sharerId}->${exp.payerId}`;
      transferMap.set(key, (transferMap.get(key) ?? 0) + perPerson);
      payerMap.set(exp.payerId, (payerMap.get(exp.payerId) ?? 0) + perPerson);
    }
  }

  const transfers: ExpenseTransfer[] = Array.from(transferMap.entries()).map(
    (entry) => {
      const [key, amount] = entry;
      const [fromId, toId] = key.split('->');
      return { fromId, toId, amount };
    },
  );

  const payerReceipts: PayerReceipt[] = Array.from(payerMap.entries()).map(
    (entry) => ({ payerId: entry[0], totalReceived: entry[1] }),
  );

  return { items, transfers, payerReceipts, totalAmount };
}
