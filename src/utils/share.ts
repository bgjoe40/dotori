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
    const distCost = Math.round(v.distanceKm * fuelRatePerKm);
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
    const rentalExtra: string[] = [];
    if (v.tollFee > 0) rentalExtra.push(`톨비 ${formatKRW(v.tollFee)}`);
    if (v.parkingFee > 0) rentalExtra.push(`주차비 ${formatKRW(v.parkingFee)}`);
    const totalRentalCost = r.rentalFee + r.tollFee + r.parkingFee;
    const rentalLine =
      rentalExtra.length > 0
        ? `렌트비 ${formatKRW(r.rentalFee)} + ${rentalExtra.join(' + ')} = ${formatKRW(totalRentalCost)}`
        : `렌트비 ${formatKRW(r.rentalFee)}`;
    lines.push(rentalLine);
    lines.push(`1인당 렌트비: ${formatKRW(r.rentalPerPerson)} × ${r.totalHeadcount}명`);
    lines.push(
      `1인당 수고비: ${formatKRW(r.laborPerPassenger)} (탑승자 ${v.passengerIds.length}명)`,
    );
    lines.push('탑승자 부담액 (→ 운전자에게 송금)');
    for (const o of r.owed) {
      if (o.total <= 0 || o.isDriver) continue;
      const name = nameOf(o.participantId, participants);
      lines.push(`• ${name}: ${formatKRW(o.total)}`);
    }
    lines.push('운전자 수령 (렌트비 회수 + 수고비)');
    for (const d of r.driverReceipts) {
      lines.push(
        `• ${nameOf(d.driverId, participants)}: ${formatKRW(d.amount)} (렌트비 ${formatKRW(d.rentalRecovery)} · 수고비 ${formatKRW(d.laborReceipt)})`,
      );
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

export function buildFinalSummaryShareText(params: {
  meetingName?: string;
  meetingDate?: string;
  participants: Participant[];
  banjangId?: string;
  finalNetBalance: Map<string, number>;
  finalTransfers: { fromId: string; toId: string; amount: number }[];
  participantBreakdown: Map<string, { label: string; amount: number }[]>;
  banjangData: {
    banjang: Participant;
    banjangBal: number;
    incoming: { id: string; name: string; amount: number }[];
    outgoing: { id: string; name: string; amount: number }[];
  } | null;
}): string {
  const { meetingName, meetingDate, participants, banjangId, finalNetBalance, finalTransfers, participantBreakdown, banjangData } = params;
  const lines: string[] = [];

  const header = meetingName ? `📊 ${meetingName} 최종 정산 요약` : '📊 최종 정산 요약';
  lines.push(header);
  if (meetingDate) lines.push(meetingDate);

  const banjang = banjangId ? participants.find((p) => p.id === banjangId) : undefined;
  const meta: string[] = [`참가자 ${participants.length}명`];
  if (banjang) meta.push(`벙주: ${banjang.name}`);
  lines.push(meta.join(' | '));

  lines.push('━━━━━━━━━━━━━━━━━━');
  lines.push('👤 참가자별 정산');

  const sorted = [...participants].sort((a, b) =>
    a.id === banjangId ? -1 : b.id === banjangId ? 1 : 0,
  );
  for (const p of sorted) {
    const bal = finalNetBalance.get(p.id) ?? 0;
    if (Math.abs(bal) < 1) continue;
    const isBanjang = p.id === banjangId;
    const prefix = isBanjang ? `👑 ${p.name} (벙주)` : `• ${p.name}`;
    const balText = bal > 0 ? `+${formatKRW(bal)} 수령` : `${formatKRW(Math.abs(bal))} 납부`;
    lines.push(`${prefix}: ${balText}`);
    const breakdown = participantBreakdown.get(p.id) ?? [];
    for (const item of breakdown) {
      const sign = item.amount >= 0 ? '+' : '-';
      lines.push(`  ${item.label}: ${sign}${formatKRW(Math.abs(item.amount))}`);
    }
  }

  if (!banjangData && finalTransfers.length > 0) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push('💸 정산 송금 내역');
    for (const t of finalTransfers) {
      const from = nameOf(t.fromId, participants);
      const to = nameOf(t.toId, participants);
      lines.push(`• ${from} → ${to}: ${formatKRW(t.amount)}`);
    }
  }

  if (banjangData) {
    lines.push('━━━━━━━━━━━━━━━━━━');
    lines.push(`👑 벙주 정산 — ${banjangData.banjang.name}`);
    if (banjangData.incoming.length > 0 || banjangData.banjangBal < -1) {
      lines.push('📥 수금 내역 (벙주에게 납부)');
      for (const { name, amount } of banjangData.incoming) {
        lines.push(`• ${name} → ${banjangData.banjang.name}: ${formatKRW(amount)}`);
      }
      if (banjangData.banjangBal < -1) {
        lines.push(`• ${banjangData.banjang.name} (본인 부담): ${formatKRW(Math.round(-banjangData.banjangBal))}`);
      }
    }
    if (banjangData.outgoing.length > 0 || banjangData.banjangBal > 1) {
      lines.push('📤 지급 내역 (벙주가 전달)');
      for (const { name, amount } of banjangData.outgoing) {
        lines.push(`• ${banjangData.banjang.name} → ${name}: ${formatKRW(amount)}`);
      }
      if (banjangData.banjangBal > 1) {
        lines.push(`• ${banjangData.banjang.name} (본인 수령): ${formatKRW(Math.round(banjangData.banjangBal))}`);
      }
    }
  }

  return lines.join('\n');
}
