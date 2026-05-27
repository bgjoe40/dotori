import { describe, expect, it } from 'vitest';
import { calcExpenseSettlement } from '../expenseSettlement';
import type { Expense, Participant } from '../types';

const P = (id: string, name: string): Participant => ({ id, name, isCarpool: true });

const E = (overrides: Partial<Expense> & { id: string; payerId: string; sharerIds: string[] }): Expense => ({
  description: '테스트',
  amount: 0,
  memo: undefined,
  ...overrides,
});

describe('calcExpenseSettlement', () => {
  it('4명 균등 분배: 지불자 외 3명 → 각 15,000원 송금, 지불자 45,000원 수령', () => {
    const participants = [P('a', 'A'), P('b', 'B'), P('c', 'C'), P('d', 'D')];
    const expenses = [
      E({ id: 'e1', payerId: 'a', sharerIds: ['a', 'b', 'c', 'd'], amount: 60000 }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    expect(r.totalAmount).toBe(60000);
    expect(r.items[0].perPerson).toBe(15000);
    expect(r.items[0].sharerCount).toBe(4);

    // b, c, d 각 15000원 → a에게
    expect(r.transfers.filter((t) => t.toId === 'a').length).toBe(3);
    r.transfers.forEach((t) => expect(t.amount).toBe(15000));

    // 지불자 a 수령 합계 = 45000
    const receipt = r.payerReceipts.find((x) => x.payerId === 'a')!;
    expect(receipt.totalReceived).toBe(45000);
  });

  it('지불자가 sharers에 없을 때 전체 금액 수령', () => {
    const participants = [P('a', 'A'), P('b', 'B')];
    const expenses = [
      E({ id: 'e1', payerId: 'a', sharerIds: ['b'], amount: 10000 }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    expect(r.transfers[0]).toEqual({ fromId: 'b', toId: 'a', amount: 10000 });
    expect(r.payerReceipts[0].totalReceived).toBe(10000);
  });

  it('같은 지불자 여러 항목 → payerReceipts 합산', () => {
    const participants = [P('a', 'A'), P('b', 'B')];
    const expenses = [
      E({ id: 'e1', payerId: 'a', sharerIds: ['a', 'b'], amount: 20000 }),
      E({ id: 'e2', payerId: 'a', sharerIds: ['a', 'b'], amount: 30000 }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    // e1: b→a 10000, e2: b→a 15000
    const receipt = r.payerReceipts.find((x) => x.payerId === 'a')!;
    expect(receipt.totalReceived).toBe(25000);
  });

  it('A→B 동일 경로 항목 여러 개 → transfers 병합', () => {
    const participants = [P('a', 'A'), P('b', 'B')];
    const expenses = [
      E({ id: 'e1', payerId: 'b', sharerIds: ['a', 'b'], amount: 10000 }), // a→b 5000
      E({ id: 'e2', payerId: 'b', sharerIds: ['a', 'b'], amount: 10000 }), // a→b 5000
    ];
    const r = calcExpenseSettlement(expenses, participants);
    const t = r.transfers.filter((x) => x.fromId === 'a' && x.toId === 'b');
    expect(t.length).toBe(1);
    expect(t[0].amount).toBe(10000);
  });

  it('금액 0 또는 분배자 없는 항목 → 무시', () => {
    const participants = [P('a', 'A')];
    const expenses = [
      E({ id: 'e1', payerId: 'a', sharerIds: [], amount: 5000 }),
      E({ id: 'e2', payerId: 'a', sharerIds: ['a'], amount: 0 }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    expect(r.items.length).toBe(0);
    expect(r.totalAmount).toBe(0);
    expect(r.transfers.length).toBe(0);
  });

  it('분배 대상 중복 ID는 1회만 반영된다', () => {
    const participants = [P('a', 'A'), P('b', 'B')];
    const expenses = [
      E({ id: 'e1', payerId: 'a', sharerIds: ['a', 'b', 'b'], amount: 9000 }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    expect(r.items[0].sharerCount).toBe(2);
    expect(r.items[0].perPerson).toBe(4500);
    expect(r.transfers).toEqual([{ fromId: 'b', toId: 'a', amount: 4500 }]);
  });

  it('[인원추가] 1인당 5,000원 × 3명 → 총액 15,000원, 각 5,000원 송금', () => {
    const participants = [P('a', 'A'), P('b', 'B'), P('c', 'C'), P('d', 'D')];
    const expenses = [
      E({
        id: 'e1',
        payerId: 'a',
        sharerIds: ['b', 'c', 'd'],
        amount: 5000,
        splitMode: 'perPerson',
      }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    expect(r.items[0].perPerson).toBe(5000);
    expect(r.items[0].sharerCount).toBe(3);
    expect(r.totalAmount).toBe(15000); // 5000 × 3
    // b, c, d 각 5000 → a
    expect(r.transfers.length).toBe(3);
    r.transfers.forEach((t) => {
      expect(t.toId).toBe('a');
      expect(t.amount).toBe(5000);
    });
    const receipt = r.payerReceipts.find((x) => x.payerId === 'a')!;
    expect(receipt.totalReceived).toBe(15000);
  });

  it('[인원추가] 지불자가 해당 인원 안에 포함되어도 자기 자신 송금 제외', () => {
    const participants = [P('a', 'A'), P('b', 'B'), P('c', 'C')];
    const expenses = [
      E({
        id: 'e1',
        payerId: 'a',
        sharerIds: ['a', 'b', 'c'],
        amount: 3000,
        splitMode: 'perPerson',
      }),
    ];
    const r = calcExpenseSettlement(expenses, participants);
    expect(r.totalAmount).toBe(9000); // 3000 × 3
    // a는 자기 자신 제외, b·c → a 각 3000
    const transfers = r.transfers;
    expect(transfers.length).toBe(2);
    expect(transfers.every((t) => t.amount === 3000)).toBe(true);
    const receipt = r.payerReceipts.find((x) => x.payerId === 'a')!;
    expect(receipt.totalReceived).toBe(6000); // b+c 합산
  });
});
