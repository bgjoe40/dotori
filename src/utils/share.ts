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
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('🚙 차량별 비용');
  for (const v of vehicles.filter((x) => !x.isRental)) {
    const r = result.vehicles.find((x) => x.vehicleId === v.id);
    if (!r) continue;
    const drivers = v.driverIds.map((id) => nameOf(id, participants)).join(', ') || '?';
    const passengers = v.passengerIds.map((id) => nameOf(id, participants)).join(', ') || '없음';
    lines.push(
      `• ${drivers} (${v.distanceKm}km, 탑승: ${passengers})\n  🔴 유류비 ${formatKRW(r.fuelCost)} | 🟡 수고비 ${formatKRW(r.laborCost)}`,
    );
    if (v.mapUrl) lines.push(`  지도: ${v.mapUrl}`);
  }
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push(
    `🔵 유류비 엔빵: ${formatKRW(result.fuelPerPerson)} × ${result.fuelHeadcount}명`,
  );
  lines.push(
    `⚫ 수고비 엔빵: ${formatKRW(result.laborPerPerson)} × ${result.laborHeadcount}명 (탑승자)`,
  );
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('💸 벙주에게 송금할 금액');
  for (const o of result.owed) {
    if (o.total <= 0) continue;
    const name = nameOf(o.participantId, participants);
    const tag = o.isDriver ? ' (운전자)' : '';
    lines.push(`• ${name}${tag}: ${formatKRW(o.total)}`);
  }
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('💰 벙주 → 운전자 송금');
  for (const p of result.driverPayouts) {
    const name = nameOf(p.driverId, participants);
    lines.push(`• ${name}: ${formatKRW(p.amount)}`);
  }
  if (result.driverLaborReceipts.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('🟡 운전자 수고비 수령 합계');
    for (const dr of result.driverLaborReceipts) {
      lines.push(`• ${nameOf(dr.driverId, participants)}: ${formatKRW(dr.amount)}`);
    }
  }
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
    lines.push('— 탑승자 송금 —');
    for (const o of r.owed) {
      if (o.total <= 0) continue;
      const name = nameOf(o.participantId, participants);
      const tag = o.isDriver ? ' (운전자)' : '';
      lines.push(`• ${name}${tag}: ${formatKRW(o.total)}`);
    }
    lines.push('— 운전자 수령 (수고비) —');
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
    lines.push(
      `• ${exp.description || '(이름 없음)'} ${formatKRW(exp.amount)} — 1인당 ${formatKRW(item.perPerson)} × ${item.sharerCount}명 (지불: ${payer})`,
    );
  }
  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('📤 송금 명세');
  for (const t of result.transfers) {
    lines.push(
      `• ${nameOf(t.fromId, participants)} → ${nameOf(t.toId, participants)}: ${formatKRW(t.amount)}`,
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
