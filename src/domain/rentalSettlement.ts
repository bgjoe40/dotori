import type {
  Participant,
  ParticipantOwed,
  RentalSettlement,
  Vehicle,
} from './types';
import { calcLaborCost } from './labor';

const round = (n: number) => Math.round(n);

/**
 * 렌트 정산 계산 (차량 1대 단위)
 *
 * 규칙:
 *  - 총 렌트비 = (운전자 + 탑승자) 균등 엔빵
 *  - 수고비 = 탑승자만 엔빵 → 운전자에게 송금
 *  - 운전자 2명 이상이면 운전 거리 비율로 분배. 미입력 시 균등.
 *  - 운전자도 본인 렌트비 부담분은 발생 (자기 자신에게 송금 0)
 */
export function calcRentalSettlement(
  vehicle: Vehicle,
  participants: Participant[],
): RentalSettlement {
  const drivers = vehicle.driverIds.filter((id) =>
    participants.some((p) => p.id === id),
  );
  const passengers = vehicle.passengerIds.filter((id) =>
    participants.some((p) => p.id === id),
  );

  const totalHeadcount = drivers.length + passengers.length;
  const rentalFee = Math.max(0, vehicle.rentalFee ?? 0);
  const laborCost = calcLaborCost(vehicle.distanceKm);

  const rentalPerPerson =
    totalHeadcount > 0 ? round(rentalFee / totalHeadcount) : 0;
  const laborPerPassenger =
    passengers.length > 0 ? round(laborCost / passengers.length) : 0;

  // 수고비 총액(탑승자가 부담) — 운전자에게 분배
  const totalLaborFromPassengers = laborPerPassenger * passengers.length;

  // 비율 결정
  const ratios = vehicle.driverShareRatios ?? {};
  const ratioSum = drivers.reduce((s, id) => s + (ratios[id] || 0), 0);
  const useCustomRatio = ratioSum > 0;

  const driverReceipts = drivers.map((did) => {
    let amount: number;
    if (useCustomRatio) {
      const r = ratios[did] || 0;
      amount = round((totalLaborFromPassengers * r) / ratioSum);
    } else {
      amount = round(totalLaborFromPassengers / drivers.length);
    }
    return { driverId: did, amount };
  });

  const driverSet = new Set(drivers);
  const passengerSet = new Set(passengers);
  const owed: ParticipantOwed[] = participants.map((p) => {
    const isDriver = driverSet.has(p.id);
    const isPassenger = passengerSet.has(p.id);
    const involved = isDriver || isPassenger;
    const fuelShare = involved ? rentalPerPerson : 0; // "fuelShare" 슬롯에 렌트비 부담을 담음
    const laborShare = isPassenger ? laborPerPassenger : 0;
    return {
      participantId: p.id,
      fuelShare,
      laborShare,
      total: fuelShare + laborShare,
      isDriver,
    };
  });

  return {
    vehicleId: vehicle.id,
    rentalFee,
    laborCost,
    totalHeadcount,
    rentalPerPerson,
    laborPerPassenger,
    driverReceipts,
    owed,
  };
}
