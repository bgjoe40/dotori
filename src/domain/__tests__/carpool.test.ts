import { describe, expect, it } from 'vitest';
import { calcCarpoolSettlement } from '../carpoolSettlement';
import type { Participant, Vehicle } from '../types';

const P = (id: string, name: string, isCarpool = true): Participant => ({
  id,
  name,
  isCarpool,
});

const V = (overrides: Partial<Vehicle> & { id: string }): Vehicle => ({
  driverIds: [],
  passengerIds: [],
  distanceKm: 0,
  tollFee: 0,
  parkingFee: 0,
  isRental: false,
  ...overrides,
});

describe('calcCarpoolSettlement', () => {
  it('차량 1대, 운전자1+탑승자3, 100km — 합계 일치 + 송금액 검증', () => {
    const participants = [
      P('d', '운전자'),
      P('p1', '탑1'),
      P('p2', '탑2'),
      P('p3', '탑3'),
    ];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d'], passengerIds: ['p1', 'p2', 'p3'], distanceKm: 100 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants);

    expect(r.totalFuel).toBe(17000); // 100*170
    expect(r.totalLabor).toBe(6000); // 51~100 구간
    expect(r.fuelHeadcount).toBe(4);
    expect(r.laborHeadcount).toBe(3);
    expect(r.fuelPerPerson).toBe(4250); // 17000/4
    expect(r.laborPerPerson).toBe(2000); // 6000/3

    // 탑승자 1인 부담 = 4250 + 2000 = 6250
    const p1 = r.owed.find((o) => o.participantId === 'p1')!;
    expect(p1.total).toBe(6250);

    // 운전자 부담 = 4250 (수고비 슬롯 0)
    const d = r.owed.find((o) => o.participantId === 'd')!;
    expect(d.fuelShare).toBe(4250);
    expect(d.laborShare).toBe(0);

    // 벙주→운전자 송금액 = 17000 - 4250 + 6000 = 18750
    const payout = r.driverPayouts.find((x) => x.driverId === 'd')!;
    expect(payout.amount).toBe(18750);

    // 자금 흐름 균형: 탑승자 송금 총합 == 운전자 송금 총합
    const inflow = ['p1', 'p2', 'p3'].reduce(
      (s, id) => s + r.owed.find((o) => o.participantId === id)!.total,
      0,
    );
    expect(inflow).toBe(18750);
  });

  it('개인참석자가 있어도 분모는 변하지 않음', () => {
    const participants = [
      P('d', '운전자'),
      P('p1', '탑1'),
      P('p2', '탑2'),
      P('p3', '탑3'),
      P('solo', '개인참석', false),
    ];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d'], passengerIds: ['p1', 'p2', 'p3'], distanceKm: 100 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants);
    expect(r.fuelHeadcount).toBe(4);
    expect(r.laborHeadcount).toBe(3);
    const solo = r.owed.find((o) => o.participantId === 'solo')!;
    expect(solo.total).toBe(0);
  });

  it('차량 2대 — 유류비/수고비는 차량별, 엔빵은 전체 합', () => {
    const participants = [
      P('d1', 'D1'),
      P('d2', 'D2'),
      P('p1', 'P1'),
      P('p2', 'P2'),
    ];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d1'], passengerIds: ['p1'], distanceKm: 100 }),
      V({ id: 'v2', driverIds: ['d2'], passengerIds: ['p2'], distanceKm: 50, tollFee: 1000 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants);
    // 유류비: 17000 + (50*170+1000) = 17000 + 9500 = 26500
    expect(r.totalFuel).toBe(26500);
    // 수고비: 6000 + 3000 = 9000
    expect(r.totalLabor).toBe(9000);
    expect(r.fuelHeadcount).toBe(4); // d1,d2,p1,p2
    expect(r.laborHeadcount).toBe(2); // p1,p2
    expect(r.fuelPerPerson).toBe(6625);
    expect(r.laborPerPerson).toBe(4500);
  });

  it('빈 차량(분모 0)도 안전하게 처리', () => {
    const r = calcCarpoolSettlement([], [P('a', 'A')]);
    expect(r.totalFuel).toBe(0);
    expect(r.fuelPerPerson).toBe(0);
    expect(r.owed.every((o) => o.total === 0)).toBe(true);
  });

  it('driverLaborReceipts — 운전자 수고비 수령 합산', () => {
    const participants = [P('d', '운전자'), P('p1', '탑1'), P('p2', '탑2')];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d'], passengerIds: ['p1', 'p2'], distanceKm: 100 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants);
    // laborCost 100km: 51~100 → 6000
    // 운전자 1명, 수고비 전액 수령
    const receipt = r.driverLaborReceipts.find((x) => x.driverId === 'd')!;
    expect(receipt).toBeDefined();
    expect(receipt.amount).toBe(6000);
  });

  it('불변식 — 탑승자 owed 합계 === driverPayouts 합계 (자금 흐름 균형)', () => {
    // finalNetBalance 계산 방식: 탑승자 owed 차감 + driverPayouts 가산
    // 이 두 합계가 일치해야 전체 합산이 0 (카풀 부분만)
    const participants = [
      P('d1', 'D1'), P('d2', 'D2'),
      P('p1', 'P1'), P('p2', 'P2'), P('p3', 'P3'),
    ];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d1'], passengerIds: ['p1', 'p2'], distanceKm: 200, tollFee: 5000 }),
      V({ id: 'v2', driverIds: ['d2'], passengerIds: ['p3'], distanceKm: 150 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants);

    // 탑승자(비운전자)의 owed 합계
    const passengerOwedSum = r.owed
      .filter((o) => !o.isDriver)
      .reduce((s, o) => s + o.total, 0);

    // driverPayouts 합계
    const driverPayoutSum = r.driverPayouts.reduce((s, d) => s + d.amount, 0);

    expect(passengerOwedSum).toBe(driverPayoutSum);
  });

  it('2차량 실데이터 — 운전자 순 잔액이 driverPayout과 일치', () => {
    // 첨부 JSON(5월 24일 가야산)과 동일한 구조로 검증
    const participants = [
      P('d1', '조부관'), P('d2', '김은비'),
      P('p1', '최유진'), P('p2', '박경륜'),
      P('p3', '김성은'), P('p4', '세응'),
    ];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d1'], passengerIds: ['p1', 'p2'], distanceKm: 297, tollFee: 13600 }),
      V({ id: 'v2', driverIds: ['d2'], passengerIds: ['p3', 'p4'], distanceKm: 325, tollFee: 15000 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants, 170);

    // fuelCost: 297*170+13600=64090, 325*170+15000=70250 → total=134340
    expect(r.totalFuel).toBe(134340);
    // laborCost: ceil(297/50)*3000=18000, ceil(325/50)*3000=21000 → total=39000
    expect(r.totalLabor).toBe(39000);
    // fuelPerPerson: 134340/6=22390
    expect(r.fuelPerPerson).toBe(22390);
    // laborPerPerson: 39000/4=9750
    expect(r.laborPerPerson).toBe(9750);

    // 운전자 payout
    const payout1 = r.driverPayouts.find((x) => x.driverId === 'd1')!;
    const payout2 = r.driverPayouts.find((x) => x.driverId === 'd2')!;
    // 64090 - 22390 + 18000 = 59700
    expect(payout1.amount).toBe(59700);
    // 70250 - 22390 + 21000 = 68860
    expect(payout2.amount).toBe(68860);

    // 불변식: 탑승자 owed 합계 === driverPayouts 합계
    const passengerOwedSum = r.owed
      .filter((o) => !o.isDriver)
      .reduce((s, o) => s + o.total, 0);
    const driverPayoutSum = r.driverPayouts.reduce((s, d) => s + d.amount, 0);
    expect(passengerOwedSum).toBe(driverPayoutSum);
  });

  it('반올림 잔차 보정 — Σ(driverPayouts) === Σ(non-driver owed.total)', () => {
    const participants = [P('d', 'D'), P('p1', 'P1'), P('p2', 'P2')];
    const vehicles: Vehicle[] = [
      V({ id: 'v1', driverIds: ['d'], passengerIds: ['p1', 'p2'], distanceKm: 0, tollFee: 10000 }),
    ];
    const r = calcCarpoolSettlement(vehicles, participants);
    expect(r.totalFuel).toBe(10000);
    expect(r.fuelPerPerson).toBe(3333);
    const p1owed = r.owed.find((o) => o.participantId === 'p1')!;
    const p2owed = r.owed.find((o) => o.participantId === 'p2')!;
    const totalNonDriverOwed = p1owed.total + p2owed.total;
    const totalDriverPayout = r.driverPayouts.reduce((s, d) => s + d.amount, 0);
    expect(totalDriverPayout).toBe(totalNonDriverOwed);
  });
});
