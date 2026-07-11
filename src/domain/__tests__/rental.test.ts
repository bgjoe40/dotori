import { describe, expect, it } from 'vitest';
import { calcRentalSettlement } from '../rentalSettlement';
import type { Participant, Vehicle } from '../types';

const P = (id: string, name: string): Participant => ({ id, name, isCarpool: true });

describe('calcRentalSettlement', () => {
  it('렌트비 100,000원, 운전자1+탑승자3, 100km', () => {
    const participants = [P('d', 'D'), P('p1', 'P1'), P('p2', 'P2'), P('p3', 'P3')];
    const v: Vehicle = {
      id: 'r1',
      driverIds: ['d'],
      passengerIds: ['p1', 'p2', 'p3'],
      distanceKm: 100,
      tollFee: 0,
      parkingFee: 0,
      isRental: true,
      rentalFee: 100000,
    };
    const r = calcRentalSettlement(v, participants);
    expect(r.rentalPerPerson).toBe(25000); // 100000/4
    expect(r.laborCost).toBe(6000);
    expect(r.laborPerPassenger).toBe(2000); // 6000/3
    // 운전자 수령 = 탑승자 렌트비 회수(25000×3=75000) + 수고비(2000×3=6000)
    expect(r.driverReceipts[0]).toEqual({
      driverId: 'd',
      rentalRecovery: 75000,
      laborReceipt: 6000,
      amount: 81000,
    });

    const p1 = r.owed.find((o) => o.participantId === 'p1')!;
    expect(p1.total).toBe(27000); // 25000 + 2000

    const d = r.owed.find((o) => o.participantId === 'd')!;
    expect(d.total).toBe(25000); // 운전자 본인 렌트비 부담분(선결제 자기-정산, 송금 X)
  });

  it('운전자 2명, 비율 70/30 입력 시 수고비 분배 7:3', () => {
    const participants = [P('d1', 'D1'), P('d2', 'D2'), P('p1', 'P1'), P('p2', 'P2')];
    const v: Vehicle = {
      id: 'r2',
      driverIds: ['d1', 'd2'],
      passengerIds: ['p1', 'p2'],
      distanceKm: 200,
      tollFee: 0,
      parkingFee: 0,
      isRental: true,
      rentalFee: 200000,
      driverShareRatios: { d1: 70, d2: 30 },
    };
    const r = calcRentalSettlement(v, participants);
    // 200km → 수고비 12,000원, 탑승자 2명 → 1인 6,000원, 총 12,000원
    expect(r.laborCost).toBe(12000);
    expect(r.laborPerPassenger).toBe(6000);
    const d1 = r.driverReceipts.find((x) => x.driverId === 'd1')!;
    const d2 = r.driverReceipts.find((x) => x.driverId === 'd2')!;
    // 수고비는 비율 7:3 / 렌트비 환급은 운전자 균등
    // (rentalPerPerson 50000 × 탑승자 2명 = 100000 ÷ 운전자 2명 = 50000)
    expect(d1.laborReceipt).toBe(8400); // 12000*0.7
    expect(d2.laborReceipt).toBe(3600); // 12000*0.3
    expect(d1.rentalRecovery).toBe(50000);
    expect(d2.rentalRecovery).toBe(50000);
    expect(d1.amount).toBe(58400);
    expect(d2.amount).toBe(53600);
  });

  it('운전자 2명, 비율 미입력 → 균등 분배', () => {
    const participants = [P('d1', 'D1'), P('d2', 'D2'), P('p1', 'P1')];
    const v: Vehicle = {
      id: 'r3',
      driverIds: ['d1', 'd2'],
      passengerIds: ['p1'],
      distanceKm: 100,
      tollFee: 0,
      parkingFee: 0,
      isRental: true,
      rentalFee: 30000,
    };
    const r = calcRentalSettlement(v, participants);
    expect(r.rentalPerPerson).toBe(10000);
    // 렌트비 환급: 탑승자몫 10000 ÷ 2명 = 5000씩 / 수고비 6000 ÷ 2명(균등) = 3000씩
    expect(r.driverReceipts).toEqual([
      { driverId: 'd1', rentalRecovery: 5000, laborReceipt: 3000, amount: 8000 },
      { driverId: 'd2', rentalRecovery: 5000, laborReceipt: 3000, amount: 8000 },
    ]);
  });

  it('렌트비 + 톨비 + 주차비 합산 반영', () => {
    const participants = [P('d', 'D'), P('p1', 'P1'), P('p2', 'P2')];
    const v: Vehicle = {
      id: 'r4',
      driverIds: ['d'],
      passengerIds: ['p1', 'p2'],
      distanceKm: 0,
      tollFee: 3000,
      parkingFee: 2000,
      isRental: true,
      rentalFee: 90000,
    };
    const r = calcRentalSettlement(v, participants);
    // totalRentalCost = 90000 + 3000 + 2000 = 95000
    // rentalPerPerson = round(95000/3) = 31667
    expect(r.rentalPerPerson).toBe(31667);
    expect(r.tollFee).toBe(3000);
    expect(r.parkingFee).toBe(2000);
  });

  it('불변식 — Σ(탑승자 부담) === Σ(운전자 수령) (자금 보존, 반올림 포함)', () => {
    const participants = [
      P('d1', 'D1'), P('d2', 'D2'),
      P('p1', 'P1'), P('p2', 'P2'), P('p3', 'P3'),
    ];
    const v: Vehicle = {
      id: 'r5',
      driverIds: ['d1', 'd2'],
      passengerIds: ['p1', 'p2', 'p3'],
      distanceKm: 273,
      tollFee: 8000,
      parkingFee: 5000,
      isRental: true,
      rentalFee: 123456, // 나누어떨어지지 않는 금액 → 반올림 잔차 발생
      driverShareRatios: { d1: 60, d2: 40 },
    };
    const r = calcRentalSettlement(v, participants);

    // 탑승자(비운전자)의 부담 합계 == 운전자 수령 합계 → 최종 정산 합계 0
    const passengerOwed = r.owed
      .filter((o) => !o.isDriver)
      .reduce((s, o) => s + o.total, 0);
    const driverReceived = r.driverReceipts.reduce((s, d) => s + d.amount, 0);
    expect(driverReceived).toBe(passengerOwed);

    // 회수/수고비 각각도 잔차 없이 정확히 분배
    const rentalSum = r.driverReceipts.reduce((s, d) => s + d.rentalRecovery, 0);
    const laborSum = r.driverReceipts.reduce((s, d) => s + d.laborReceipt, 0);
    expect(rentalSum).toBe(r.rentalPerPerson * 3); // 탑승자 3명분 렌트비
    expect(laborSum).toBe(r.laborPerPassenger * 3); // 탑승자 3명분 수고비
  });
});
