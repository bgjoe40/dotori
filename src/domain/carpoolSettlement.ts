import type {
  CarpoolSettlement,
  Participant,
  ParticipantOwed,
  Vehicle,
  VehicleSettlement,
} from './types';
import { calcFuelCost, FUEL_RATE_PER_KM } from './fuel';
import { calcLaborCost } from './labor';

const round = (n: number) => Math.round(n);

/**
 * 카풀 정산 계산
 *
 * 규칙:
 *  - 🔴 유류비 = 거리×170 + 톨비 + 주차비 (차량별)
 *  - 🟡 수고비 = 50km 구간별 룩업 (차량별, 왕복)
 *  - 🔵 유류비 엔빵 = Σ🔴 / (모든 카풀차량 운전자+탑승자 전체 인원)
 *  - ⚫ 수고비 엔빵 = Σ🟡 / (모든 카풀차량 탑승자 인원만)
 *  - 개인참석(=`isCarpool` false) 인원은 분모에서 제외
 *  - 탑승자 1인 부담 = 🔵 + ⚫
 *  - 운전자 1인 부담 = 🔵 (수고비는 본인 수령자라 부담 0)
 *  - 벙주→운전자 송금액 = 해당 차량 🔴 - 🔵엔빵(운전자 1인분) + 🟡 전액
 *  - 원 단위 반올림
 */
export function calcCarpoolSettlement(
  vehicles: Vehicle[],
  participants: Participant[],
  fuelRatePerKm = FUEL_RATE_PER_KM,
): CarpoolSettlement {
  // 렌트 차량은 제외
  const carpoolVehicles = vehicles.filter((v) => !v.isRental);

  // 차량별 유류비/수고비 + 운전자 송금액 (운전자 1명 가정)
  const vehicleResults: VehicleSettlement[] = carpoolVehicles.map((v) => {
    const fuelCost = calcFuelCost(v.distanceKm, v.tollFee, v.parkingFee, fuelRatePerKm);
    const laborCost = calcLaborCost(v.distanceKm);
    return {
      vehicleId: v.id,
      fuelCost,
      laborCost,
      driverPayout: 0, // 아래에서 계산
    };
  });

  const totalFuel = vehicleResults.reduce((s, r) => s + r.fuelCost, 0);
  const totalLabor = vehicleResults.reduce((s, r) => s + r.laborCost, 0);

  // 분모 계산: 카풀 참여(isCarpool) 인원만 카운트
  const carpoolParticipantIds = new Set(
    participants.filter((p) => p.isCarpool).map((p) => p.id),
  );

  // 모든 카풀 차량의 운전자/탑승자 집합 (중복 없는 인원)
  const carpoolDriverSet = new Set<string>();
  const carpoolPassengerSet = new Set<string>();
  for (const v of carpoolVehicles) {
    v.driverIds.forEach((id) => {
      if (carpoolParticipantIds.has(id)) carpoolDriverSet.add(id);
    });
    v.passengerIds.forEach((id) => {
      if (carpoolParticipantIds.has(id)) carpoolPassengerSet.add(id);
    });
  }

  const fuelHeadcount = carpoolDriverSet.size + carpoolPassengerSet.size;
  const laborHeadcount = carpoolPassengerSet.size;

  const fuelPerPerson = fuelHeadcount > 0 ? round(totalFuel / fuelHeadcount) : 0;
  const laborPerPerson =
    laborHeadcount > 0 ? round(totalLabor / laborHeadcount) : 0;

  // 참가자별 부담액
  const driverIdsAll = carpoolDriverSet;
  const passengerIdsAll = carpoolPassengerSet;
  const owed: ParticipantOwed[] = participants.map((p) => {
    const isDriver = driverIdsAll.has(p.id);
    const isPassenger = passengerIdsAll.has(p.id);
    const involved = p.isCarpool && (isDriver || isPassenger);
    const fuelShare = involved ? fuelPerPerson : 0;
    const laborShare = involved && isPassenger ? laborPerPerson : 0;
    return {
      participantId: p.id,
      fuelShare,
      laborShare,
      total: fuelShare + laborShare,
      isDriver,
    };
  });

  // 벙주→운전자 송금액 계산 (운전자 1명 가정. 다수일 경우 균등 분배)
  const driverPayouts: { driverId: string; vehicleId: string; amount: number }[] =
    [];
  for (const v of carpoolVehicles) {
    const r = vehicleResults.find((x) => x.vehicleId === v.id)!;
    // 해당 차량 운전자 수 (카풀 참여자에 한함)
    const drivers = v.driverIds.filter((id) => carpoolParticipantIds.has(id));
    if (drivers.length === 0) continue;
    // 운전자가 부담하는 유류비 엔빵(1인분) — 차량당 운전자 수만큼 차감
    const driverFuelShareSum = fuelPerPerson * drivers.length;
    const totalPayout = r.fuelCost - driverFuelShareSum + r.laborCost;
    const basePerDriver = round(totalPayout / drivers.length);
    let remainingPayout = totalPayout;
    drivers.forEach((did, i) => {
      const amount = i === drivers.length - 1 ? remainingPayout : basePerDriver;
      remainingPayout -= basePerDriver;
      driverPayouts.push({ driverId: did, vehicleId: v.id, amount });
    });
    // r.driverPayout는 1인분 표시용
    r.driverPayout = basePerDriver;
  }

  // Balance adjustment: ensure Σ(driverPayouts) === Σ(non-driver owed.total)
  const totalNonDriverOwed = owed
    .filter((o) => !o.isDriver)
    .reduce((s, o) => s + o.total, 0);
  const totalDriverPayout = driverPayouts.reduce((s, d) => s + d.amount, 0);
  const residual = totalNonDriverOwed - totalDriverPayout;
  if (residual !== 0 && driverPayouts.length > 0) {
    driverPayouts[driverPayouts.length - 1].amount += residual;
  }

  // 운전자별 수고비 수령 합계
  const laborReceiptMap = new Map<string, number>();
  for (const v of carpoolVehicles) {
    const r = vehicleResults.find((x) => x.vehicleId === v.id)!;
    const drivers = v.driverIds.filter((id) => carpoolParticipantIds.has(id));
    if (drivers.length === 0) continue;
    const perDriver = round(r.laborCost / drivers.length);
    drivers.forEach((did) => {
      laborReceiptMap.set(did, (laborReceiptMap.get(did) ?? 0) + perDriver);
    });
  }
  const driverLaborReceipts = Array.from(laborReceiptMap.entries()).map(
    ([driverId, amount]) => ({ driverId, amount }),
  );

  return {
    vehicles: vehicleResults,
    totalFuel,
    totalLabor,
    fuelPerPerson,
    laborPerPerson,
    fuelHeadcount,
    laborHeadcount,
    owed,
    driverPayouts,
    driverLaborReceipts,
  };
}
