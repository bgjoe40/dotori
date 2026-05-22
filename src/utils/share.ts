import type {
  CarpoolSettlement,
  Expense,
  ExpenseSettlement,
  Participant,
  RentalSettlement,
  Vehicle,
} from '../domain/types';
import { FUEL_RATE_PER_KM } from '../domain/fuel';
import { formatKRW } from './format';

const nameOf = (id: string, participants: Participant[]) =>
  participants.find((p) => p.id === id)?.name ?? '?';

export function buildCarpoolShareText(
  result: CarpoolSettlement,
  vehicles: Vehicle[],
  participants: Participant[],
  meetingName?: string,
  fuelRatePerKm = FUEL_RATE_PER_KM,
): string {
  const lines: string[] = [];
  if (meetingName) lines.push(`📣 ${meetingName} 정산`);
  lines.push(`📐 유류비 단가: ${fuelRatePerKm}원/km`);

  const carpoolVehicles = vehicles.filter((x) => !x.isRental);

  // 🔴 유류비 (차량별)
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('🔴 유류비 정산 (차량별)');
  carpoolVehicles.forEach((v, idx) => {
    const r = result.vehicles.find((x) => x.vehicleId === v.id);
    if (!r) return;
    const drivers = v.driverIds.map((id) => nameOf(id, participants)).join('·') || '?';
    const distCost = v.distanceKm * fuelRatePerKm;
    let detail = `${v.distanceKm}km × ${fuelRatePerKm}원 = ${formatKRW(distCost)}`;
    if (v.tollFee > 0) detail += ` + 톨비 ${formatKRW(v.tollFee)}`;
    if (v.parkingFee > 0) detail += ` + 주차비 ${formatKRW(v.parkingFee)}`;
    detail += ` = ${formatKRW(r.fuelCost)}`;
    lines.push(`• 차량 ${idx + 1} (${drivers}): ${detail}`);
  });
  lines.push(`합계: ${formatKRW(result.totalFuel)}`);

  // 🟡 수고비 (차량별)
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('🟡 수고비 정산 (차량별)');
  carpoolVehicles.forEach((v, idx) => {
    const r = result.vehicles.find((x) => x.vehicleId === v.id);
    if (!r) return;
    const drivers = v.driverIds.map((id) => nameOf(id, participants)).join('·') || '?';
    lines.push(`• 차량 ${idx + 1} (${drivers}, ${v.distanceKm}km): ${formatKRW(r.laborCost)}`);
  });
  lines.push(`합계: ${formatKRW(result.totalLabor)}`);

  // 💰 최종 계
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('💰 최종 계');
  lines.push(
    `🔵 유류비 1인당: ${formatKRW(result.fuelPerPerson)} (÷ ${result.fuelHeadcount}명, 운전자+탑승자)`,
  );
  lines.push(
    `⚫ 수고비 1인당: ${formatKRW(result.laborPerPerson)} (÷ ${result.laborHeadcount}명, 탑승자만)`,
  );

  return lines.join('\n');
}

export function buildRentalShareText(
  results: { vehicle: Vehicle; result: RentalSettlement }[],
  participants: Participant[],
  meetingName?: string,
): string {
  const lines: string[] = [];
  if (meetingName) lines.push(`📣 ${meetingName} 렌트 정산`);
  for (const { vehicle: v, result: r } of results) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    const drivers = v.driverIds.map((id) => nameOf(id, participants)).join(', ') || '?';
    lines.push(`🚐 렌트차량 (${drivers}, ${v.distanceKm}km)`);
    lines.push(`총 렌트비: ${formatKRW(r.rentalFee)}`);
    lines.push(`1인당 렌트비: ${formatKRW(r.rentalPerPerson)} × ${r.totalHeadcount}명`);
    lines.push(
      `1인당 수고비: ${formatKRW(r.laborPerPassenger)} (탑승자 ${v.passengerIds.length}명)`,
    );
    lines.push('구성원별 부담액');
    for (const o of r.owed) {
      if (o.total <= 0) continue;
      const name = nameOf(o.participantId, participants);
      const tag = o.isDriver ? ' (운전자)' : '';
      lines.push(`• ${name}${tag}: ${formatKRW(o.total)}`);
    }
    lines.push('운전자 수령 (수고비)');
    for (const d of r.driverReceipts) {
      lines.push(`• ${nameOf(d.driverId, participants)}: ${formatKRW(d.amount)}`);
    }
  }
  return lines.join('\n');
}

export function buildExpenseShareText(
  result: ExpenseSettlement,
  expenses: Expense[],
  participants: Participant[],
  meetingName?: string,
): string {
  const lines: string[] = [];
  if (meetingName) lines.push(`📣 ${meetingName} 경비 정산`);
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(`🍲 경비 총액: ${formatKRW(result.totalAmount)} (${result.items.length}건)`);
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('🧾 항목별');
  for (const item of result.items) {
    const exp = expenses.find((e) => e.id === item.expenseId);
    if (!exp) continue;
    const payer = nameOf(exp.payerId, participants);
    const isEven = !exp.splitMode || exp.splitMode === 'even';
    const modeTag = isEven ? '[N빵]' : '[인원추가]';
    const displayTotal = isEven ? exp.amount : item.perPerson * item.sharerCount;
    const sharers = exp.sharerIds.map((id) => nameOf(id, participants)).join(', ');
    lines.push(
      `• [지불 ${payer}] ${exp.description || '(이름 없음)'} ${modeTag} ${formatKRW(displayTotal)} — 1인당 ${formatKRW(item.perPerson)} × ${item.sharerCount}명 (${sharers})`,
    );
  }
  if (result.payerReceipts.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('💰 지불자별 수령 합계');
    for (const r of result.payerReceipts) {
      lines.push(`• ${nameOf(r.payerId, participants)}: +${formatKRW(r.totalReceived)}`);
    }
  }
  return lines.join('\n');
}
