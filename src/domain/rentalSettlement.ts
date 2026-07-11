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
 *  - 렌트비는 운전자가 선결제했다고 보고, 탑승자 부담분을 운전자에게 환급한다.
 *    (운전자 본인 부담분은 자기-정산 → 송금 0. 카풀 운전자 driverPayout과 동일 규칙)
 *  - 수고비 = 탑승자만 엔빵 → 운전자에게 송금
 *  - 운전자 2명 이상이면 수고비는 운전 거리 비율로 분배(미입력 시 균등),
 *    렌트비 환급은 결제자 정보가 없으므로 운전자 균등 분배.
 *  - 불변식: Σ(탑승자 부담) === Σ(운전자 수령) → 최종 정산 합계가 0이 됨.
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
  const tollFee = Math.max(0, vehicle.tollFee ?? 0);
  const parkingFee = Math.max(0, vehicle.parkingFee ?? 0);
  const totalRentalCost = rentalFee + tollFee + parkingFee;
  const laborCost = calcLaborCost(vehicle.distanceKm);

  const rentalPerPerson =
    totalHeadcount > 0 ? round(totalRentalCost / totalHeadcount) : 0;
  const laborPerPassenger =
    passengers.length > 0 ? round(laborCost / passengers.length) : 0;

  // 탑승자가 부담하는 수고비 총액 — 운전자에게 분배
  const totalLaborFromPassengers = laborPerPassenger * passengers.length;
  // 탑승자가 부담하는 렌트비 총액 — 선결제한 운전자에게 환급
  // (운전자 본인 부담분은 자기-정산이므로 회수 대상에서 제외)
  const totalRentalFromPassengers = rentalPerPerson * passengers.length;

  // 비율 결정 (수고비 분배용. 렌트비 환급은 운전자 균등)
  const ratios = vehicle.driverShareRatios ?? {};
  const ratioSum = drivers.reduce((s, id) => s + (ratios[id] || 0), 0);
  const useCustomRatio = ratioSum > 0;

  const baseRentalRecovery =
    drivers.length > 0 ? round(totalRentalFromPassengers / drivers.length) : 0;
  let rentalAcc = 0;
  let laborAcc = 0;
  const driverReceipts = drivers.map((did, i) => {
    const isLast = i === drivers.length - 1;
    // 렌트비 환급: 운전자 균등 (마지막 운전자가 반올림 잔차 흡수)
    const rentalRecovery = isLast
      ? totalRentalFromPassengers - rentalAcc
      : baseRentalRecovery;
    rentalAcc += rentalRecovery;
    // 수고비: 비율 입력 시 비율대로, 아니면 균등 (마지막 운전자가 잔차 흡수)
    let laborReceipt: number;
    if (isLast) {
      laborReceipt = totalLaborFromPassengers - laborAcc;
    } else if (useCustomRatio) {
      laborReceipt = round((totalLaborFromPassengers * (ratios[did] || 0)) / ratioSum);
    } else {
      laborReceipt = round(totalLaborFromPassengers / drivers.length);
    }
    laborAcc += laborReceipt;
    return {
      driverId: did,
      rentalRecovery,
      laborReceipt,
      amount: rentalRecovery + laborReceipt,
    };
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
    tollFee,
    parkingFee,
    laborCost,
    totalHeadcount,
    rentalPerPerson,
    laborPerPassenger,
    driverReceipts,
    owed,
  };
}
