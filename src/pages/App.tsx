import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import AcornRain from '../components/AcornRain';
import SkyBackground from '../components/SkyBackground';
import ParticipantList from '../components/ParticipantList';
import VehicleCard from '../components/VehicleCard';
import CarpoolResult from '../components/CarpoolResult';
import RentalResult from '../components/RentalResult';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseResult from '../components/ExpenseResult';
import CopyShareButton from '../components/CopyShareButton';
import GuideModal from '../components/GuideModal';
import { useSettlementStore } from '../store/useSettlementStore';
import { calcCarpoolSettlement } from '../domain/carpoolSettlement';
import { calcRentalSettlement } from '../domain/rentalSettlement';
import { calcExpenseSettlement } from '../domain/expenseSettlement';
import { FUEL_RATE_PER_KM } from '../domain/fuel';
import { buildCarpoolShareText, buildRentalShareText, buildExpenseShareText, buildFinalSummaryShareText } from '../utils/share';
import { formatKRW } from '../utils/format';

type Tab = 'carpool' | 'rental' | 'expense';

export default function App() {
  const store = useSettlementStore();
  const [tab, setTab] = useState<Tab>('carpool');
  const [showGuide, setShowGuide] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  // ── 테마 (다크/라이트) ─────────────────────────────────────────
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = window.localStorage.getItem('dotori:theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem('dotori:theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  const { state } = store;
  const fuelRate = state.settings?.fuelRatePerKm ?? FUEL_RATE_PER_KM;

  const carpoolVehicles = state.vehicles.filter((v) => !v.isRental);
  const rentalVehicles = state.vehicles.filter((v) => v.isRental);
  const banjangId = state.meeting.banjangId ?? null;

  const carpoolResult = useMemo(
    () => calcCarpoolSettlement(state.vehicles, state.participants, fuelRate),
    [state.vehicles, state.participants, fuelRate],
  );

  const rentalResults = useMemo(
    () =>
      rentalVehicles.map((v) => ({
        vehicle: v,
        result: calcRentalSettlement(v, state.participants),
      })),
    [rentalVehicles, state.participants],
  );

  const expenseResult = useMemo(
    () => calcExpenseSettlement(state.expenses, state.participants),
    [state.expenses, state.participants],
  );

  const carpoolShareText = useMemo(
    () =>
      buildCarpoolShareText(
        carpoolResult,
        carpoolVehicles,
        state.participants,
        state.meeting.name,
        fuelRate,
      ),
    [carpoolResult, carpoolVehicles, state.participants, state.meeting.name, fuelRate],
  );

  const rentalShareText = useMemo(
    () => buildRentalShareText(rentalResults, state.participants, state.meeting.name),
    [rentalResults, state.participants, state.meeting.name],
  );

  const expenseShareText = useMemo(
    () =>
      buildExpenseShareText(
        expenseResult,
        state.expenses,
        state.participants,
        state.meeting.name,
      ),
    [expenseResult, state.expenses, state.participants, state.meeting.name],
  );

  const finalNetBalance = useMemo(() => {
    const balance = new Map<string, number>();
    const add = (id: string, n: number) => balance.set(id, (balance.get(id) ?? 0) + n);
    // 카풀: 탑승자만 owed 차감 (운전자는 driverPayout이 유류비 차감 후 순 지급액이므로 이중 차감 방지)
    for (const p of carpoolResult.owed) {
      if (!p.isDriver) add(p.participantId, -p.total);
    }
    for (const d of carpoolResult.driverPayouts) add(d.driverId, d.amount);
    for (const { result } of rentalResults) {
      for (const p of result.owed) add(p.participantId, -p.total);
      for (const d of result.driverReceipts) add(d.driverId, d.amount);
    }
    for (const t of expenseResult.transfers) {
      add(t.fromId, -t.amount);
      add(t.toId, t.amount);
    }
    return balance;
  }, [carpoolResult, rentalResults, expenseResult]);

  const finalTransfers = useMemo(() => {
    const out: { fromId: string; toId: string; amount: number }[] = [];
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];
    for (const [id, bal] of finalNetBalance) {
      if (bal < -1) debtors.push({ id, amount: -bal });
      else if (bal > 1) creditors.push({ id, amount: bal });
    }
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const d = debtors[di];
      const c = creditors[ci];
      const amt = Math.min(d.amount, c.amount);
      out.push({ fromId: d.id, toId: c.id, amount: Math.round(amt) });
      d.amount -= amt;
      c.amount -= amt;
      if (d.amount < 1) di++;
      if (c.amount < 1) ci++;
    }
    return out;
  }, [finalNetBalance]);

  const banjangData = useMemo(() => {
    if (!banjangId) return null;
    const banjang = state.participants.find((p) => p.id === banjangId);
    if (!banjang) return null;
    const banjangBal = finalNetBalance.get(banjangId) ?? 0;
    const incoming = state.participants
      .filter((p) => p.id !== banjangId)
      .reduce<{ id: string; name: string; amount: number }[]>((acc, p) => {
        const bal = finalNetBalance.get(p.id) ?? 0;
        if (bal < -1) acc.push({ id: p.id, name: p.name, amount: Math.round(-bal) });
        return acc;
      }, []);
    const outgoing = state.participants
      .filter((p) => p.id !== banjangId)
      .reduce<{ id: string; name: string; amount: number }[]>((acc, p) => {
        const bal = finalNetBalance.get(p.id) ?? 0;
        if (bal > 1) acc.push({ id: p.id, name: p.name, amount: Math.round(bal) });
        return acc;
      }, []);
    return { banjang, banjangBal, incoming, outgoing };
  }, [banjangId, state.participants, finalNetBalance]);

  /** 참가자별 카풀/렌트/경비 세부 내역 (최종 정산 요약 아코디언) */
  const participantBreakdown = useMemo(() => {
    const map = new Map<string, { label: string; amount: number }[]>();
    for (const p of state.participants) {
      const items: { label: string; amount: number }[] = [];

      // 카풀 부담
      const carpoolOwed = carpoolResult.owed.find((o) => o.participantId === p.id);
      // 운전자는 driverPayout에 유류비 부담이 이미 차감되어 있으므로 별도 표시 안 함
      if (carpoolOwed && carpoolOwed.fuelShare > 0 && !carpoolOwed.isDriver) {
        items.push({ label: '🚗 유류비 부담', amount: -carpoolOwed.fuelShare });
      }
      if (carpoolOwed && carpoolOwed.laborShare > 0) {
        items.push({ label: '🚗 수고비 부담', amount: -carpoolOwed.laborShare });
      }
      // 카풀 운전자 수령
      for (const payout of carpoolResult.driverPayouts) {
        if (payout.driverId === p.id) {
          const vIdx = carpoolVehicles.findIndex((v) => v.id === payout.vehicleId);
          items.push({ label: `🚗 운전자 수령 (차량${vIdx + 1})`, amount: payout.amount });
        }
      }

      // 렌트 부담/수령
      rentalResults.forEach(({ vehicle: rv, result: rr }, idx) => {
        const rOwed = rr.owed.find((o) => o.participantId === p.id);
        if (rOwed && rOwed.fuelShare > 0) {
          items.push({ label: `🚐 렌트비 (차량${idx + 1})`, amount: -rOwed.fuelShare });
        }
        if (rOwed && rOwed.laborShare > 0) {
          items.push({ label: `🚐 수고비 (차량${idx + 1})`, amount: -rOwed.laborShare });
        }
        for (const dr of rr.driverReceipts) {
          if (dr.driverId === p.id) {
            items.push({ label: `🚐 운전자 수령 (차량${idx + 1})`, amount: dr.amount });
          }
        }
        void rv; // used for array index only
      });

      // 경비 부담/수령 (항목별)
      for (const exp of state.expenses) {
        const item = expenseResult.items.find((i) => i.expenseId === exp.id);
        if (!item) continue;
        if (exp.sharerIds.includes(p.id) && p.id !== exp.payerId) {
          items.push({
            label: `🧾 ${exp.description || '경비'}`,
            amount: -item.perPerson,
          });
        }
        if (p.id === exp.payerId) {
          const nonSelf = exp.sharerIds.filter((id) => id !== p.id).length;
          if (nonSelf > 0) {
            items.push({
              label: `🧾 ${exp.description || '경비'} 수령`,
              amount: item.perPerson * nonSelf,
            });
          }
        }
      }

      map.set(p.id, items);
    }
    return map;
  }, [
    state.participants,
    state.expenses,
    carpoolResult,
    carpoolVehicles,
    rentalResults,
    expenseResult,
  ]);

  const combinedShareText = useMemo(() => {
    const parts: string[] = [];
    if (carpoolVehicles.length > 0) parts.push(carpoolShareText);
    if (rentalVehicles.length > 0) parts.push(rentalShareText);
    if (state.expenses.length > 0) parts.push(expenseShareText);
    parts.push(
      buildFinalSummaryShareText({
        meetingName: state.meeting.name,
        meetingDate: state.meeting.date,
        participants: state.participants,
        banjangId: banjangId ?? undefined,
        finalNetBalance,
        finalTransfers,
        participantBreakdown,
        banjangData,
      }),
    );
    return parts.join('\n\n━━━━━━━━━━━━━━━━━━\n\n');
  }, [carpoolShareText, rentalShareText, expenseShareText, carpoolVehicles.length, rentalVehicles.length, state.expenses.length, state.meeting.name, state.meeting.date, state.participants, banjangId, finalNetBalance, finalTransfers, participantBreakdown, banjangData]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fname = (state.meeting.name || 'dotori-settlement').replace(/\s+/g, '_');
    a.href = url;
    a.download = `${fname}_${state.meeting.date || 'untitled'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const ok = store.importJson(String(reader.result ?? ''));
      if (!ok) alert('JSON 파일을 불러올 수 없습니다.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    if (window.confirm('모든 입력 데이터를 초기화할까요? (되돌릴 수 없습니다)')) {
      store.reset();
    }
  };

  return (
    <div className="relative mx-auto min-h-screen max-w-2xl px-4 pb-24 pt-6">
      <SkyBackground />
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      <AcornRain />
      {/* 헤더 */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-stone-900">🌰 도토리 산행 정산</h1>
          <p className="mt-1 text-xs text-stone-500">
            유류비 + 수고비 + 추가 경비를 자동 계산하여 엔빵 정산해 드려요.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGuide(true)}
            aria-label="사용 가이드 열기"
            title="사용 가이드"
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:border-amber-400"
          >
            📖
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:border-amber-400"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* 모임 정보 */}
      <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-stone-800">
          <span className="mr-1.5 rounded bg-stone-200 px-1.5 py-0.5 text-xs font-bold text-stone-500">01</span>
          📅 모임 정보
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            placeholder="모임 이름 (예: 5월 북한산 벙)"
            value={state.meeting.name}
            onChange={(e) => store.setMeeting({ name: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <input
            type="date"
            value={state.meeting.date}
            onChange={(e) => store.setMeeting({ date: e.target.value })}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={fuelRate === FUEL_RATE_PER_KM && fuelRate === 170 ? fuelRate : fuelRate}
              onChange={(e) => {
                const v = Number(e.target.value);
                store.setFuelRate(Number.isNaN(v) ? FUEL_RATE_PER_KM : v);
              }}
              className="w-28 rounded-lg border border-red-300 px-3 py-2 pr-14 text-sm focus:border-red-500 focus:outline-none"
              title="유류비 km당 단가"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-500">
              원/km
            </span>
          </div>
        </div>
        <p className="mt-1 text-xs text-stone-400">
          🔴 유류비 단가 기본값 {FUEL_RATE_PER_KM}원/km — 차량 연비에 따라 조정 가능
        </p>
      </section>

      {/* 참가자 */}
      <div className="mb-4">
        <ParticipantList
          participants={state.participants}
          banjangId={banjangId}
          onAdd={store.addParticipant}
          onUpdate={store.updateParticipant}
          onRemove={store.removeParticipant}
          onSetBanjang={store.setBanjang}
        />
      </div>

      {/* 주제 서비스 입력용 탭 */}
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded bg-stone-200 px-1.5 py-0.5 text-xs font-bold text-stone-500">03</span>
        <span className="text-base font-semibold text-stone-800">비용 입력</span>
      </div>
      {/* 탭 + 콘텐츠 (같은 배경) */}
      <div className={`mb-4 overflow-hidden rounded-2xl ${
        tab === 'carpool' ? 'bg-green-100' : tab === 'expense' ? 'bg-amber-100' : 'bg-purple-100'
      }`}>
        <div className="flex gap-1 p-1">
          <TabButton active={tab === 'carpool'} activeClass="bg-green-600 text-white shadow" onClick={() => setTab('carpool')}>
            🚙 카풀
          </TabButton>
          <TabButton active={tab === 'rental'} activeClass="bg-purple-600 text-white shadow" onClick={() => setTab('rental')}>
            🚐 렌트
          </TabButton>
          <TabButton active={tab === 'expense'} activeClass="bg-amber-500 text-white shadow" onClick={() => setTab('expense')}>
            🍲 경비
          </TabButton>
        </div>

        <div className="px-2 pb-2 pt-1">
          {tab === 'expense' ? (
            <>
              <div className="mb-3 space-y-3">
                {state.expenses.map((exp, idx) => (
                  <ExpenseCard
                    key={exp.id}
                    expense={exp}
                    participants={state.participants}
                    index={idx}
                    onChange={(patch) => store.updateExpense(exp.id, patch)}
                    onRemove={() => store.removeExpense(exp.id)}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => store.addExpense(state.participants.map((p) => p.id))}
                  className="w-full rounded-xl border-2 border-dashed border-stone-400 bg-stone-100 py-3 text-sm font-medium text-stone-600 hover:border-amber-500 hover:text-amber-700"
                >
                  + 경비 항목 추가
                </button>
              </div>
              {state.expenses.length > 0 && (
                <ExpenseResult
                  result={expenseResult}
                  expenses={state.expenses}
                  participants={state.participants}
                />
              )}
              {state.expenses.length === 0 && (
                <p className="mt-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/60 py-6 text-center text-sm text-amber-700">
                  경비 항목을 추가하면 정산 결과가 표시됩니다.
                </p>
              )}
            </>
          ) : (
            <>
              <div className="mb-3 space-y-3">
                {(tab === 'carpool' ? carpoolVehicles : rentalVehicles).map((v, idx) => {
                  const occupiedIds =
                    tab === 'carpool'
                      ? carpoolVehicles
                          .filter((other) => other.id !== v.id)
                          .flatMap((other) => [...other.driverIds, ...other.passengerIds])
                      : [];
                  return (
                    <VehicleCard
                      key={v.id}
                      vehicle={v}
                      participants={state.participants}
                      mode={tab as 'carpool' | 'rental'}
                      index={idx}
                      fuelRatePerKm={fuelRate}
                      occupiedIds={occupiedIds}
                      onChange={(patch) => store.updateVehicle(v.id, patch)}
                      onRemove={() => store.removeVehicle(v.id)}
                    />
                  );
                })}
                <button
                  type="button"
                  onClick={() => store.addVehicle(tab === 'rental')}
                  className="w-full rounded-xl border-2 border-dashed border-stone-400 bg-stone-100 py-3 text-sm font-medium text-stone-600 hover:border-green-500 hover:text-green-700"
                >
                  + {tab === 'rental' ? '렌트 차량' : '차량'} 추가
                </button>
              </div>
              {tab === 'carpool' ? (
                <>
                  {carpoolVehicles.length === 0 ? (
                    <p className="mt-3 rounded-xl border-2 border-dashed border-green-300 bg-green-50/60 py-6 text-center text-sm text-green-800">
                      차량을 추가하면 정산 결과가 표시됩니다.
                    </p>
                  ) : (
                    <CarpoolResult
                      result={carpoolResult}
                      vehicles={state.vehicles}
                      participants={state.participants}
                      fuelRatePerKm={fuelRate}
                    />
                  )}
                </>
              ) : (
                <>
                  {rentalVehicles.length === 0 ? (
                    <p className="mt-3 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/60 py-6 text-center text-sm text-purple-800">
                      렌트 차량을 추가하면 정산 결과가 표시됩니다.
                    </p>
                  ) : (
                    <RentalResult results={rentalResults} participants={state.participants} />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* 최종 정산 요약 */}
      {state.participants.length > 0 &&
        (carpoolVehicles.length > 0 || rentalVehicles.length > 0 || state.expenses.length > 0) && (
          <section className="relative z-10 mb-4 overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 shadow-lg shadow-amber-100">
            {/* 벙주 미선택 안내 */}
            {!banjangId && (
              <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                <span className="text-lg leading-none">ℹ️</span>
                <p className="text-sm text-amber-700">벙주를 선택하면 2단계 정산 방식이 적용됩니다.</p>
              </div>
            )}
            {/* 배경 도토리 워터마크 */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -top-3 select-none text-8xl opacity-10"
            >
              🌰
            </span>
            <h2 className="mb-1 text-base font-extrabold tracking-tight text-amber-900">
              <span className="mr-1.5 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-bold text-amber-700">04</span>
              📊 최종 정산 요약
            </h2>
            <p className="mb-3 text-xs text-amber-700/70">카풀 · 렌트 · 경비 통합 기준</p>

            {/* 모임 요약 카드 */}
            <div className="mb-3 rounded-xl border border-amber-200 bg-white/60 px-3 py-2.5">
              {(state.meeting.name || state.meeting.date) && (
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-amber-900">
                    {state.meeting.name || '이름 없는 모임'}
                  </span>
                  {state.meeting.date && (
                    <span className="shrink-0 text-xs text-amber-700">{state.meeting.date}</span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
                <span>👥 참가자 {state.participants.length}명</span>
                {banjangId && (
                  <span>👑 벙주: {state.participants.find((p) => p.id === banjangId)?.name}</span>
                )}
                {carpoolVehicles.length > 0 && <span>🚗 카풀 {carpoolVehicles.length}대</span>}
                {rentalVehicles.length > 0 && <span>🚐 렌트 {rentalVehicles.length}대</span>}
                {state.expenses.length > 0 && <span>🧾 경비 {state.expenses.length}건</span>}
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-amber-100 pt-2">
                <span className="text-xs text-stone-500">완 정산 금액</span>
                <span className="text-sm font-extrabold text-amber-900">
                  {formatKRW(
                    [...finalNetBalance.values()]
                      .filter((v) => v < -1)
                      .reduce((s, v) => s + Math.abs(v), 0),
                  )}
                </span>
              </div>
            </div>
            <table className="mb-3 w-full border-collapse text-sm">
              <tbody>
                {[...state.participants]
                  .sort((a, b) => (a.id === banjangId ? -1 : b.id === banjangId ? 1 : 0))
                  .map((p) => {
                  const bal = finalNetBalance.get(p.id) ?? 0;
                  if (Math.abs(bal) < 1) return null;
                  const isBanjang = p.id === banjangId;
                  const isExpanded = expandedIds.has(p.id);
                  const breakdown = participantBreakdown.get(p.id) ?? [];
                  return (
                    <Fragment key={p.id}>
                      <tr
                        className={
                          'cursor-pointer select-none transition-colors ' +
                          (isExpanded
                            ? 'bg-amber-100/60'
                            : 'hover:bg-amber-50/50')
                        }
                        onClick={() => toggleExpanded(p.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpanded(p.id);
                          }
                        }}
                      >
                        <td className="py-2 pr-2">
                          <span className="flex items-center gap-1 font-semibold text-stone-800">
                            {isBanjang && <span className="text-sm leading-none">👑</span>}
                            {p.name}
                            {isBanjang && (
                              <span className="ml-0.5 text-xs font-bold text-amber-600">벙주</span>
                            )}
                          </span>
                        </td>
                        <td
                          className={
                            'py-2 text-right text-sm font-bold ' +
                            (bal > 0 ? 'text-green-700' : 'text-red-600')
                          }
                        >
                          <span className="flex items-center justify-end gap-1">
                            {bal > 0
                              ? `+${formatKRW(bal)} 수령`
                              : `${formatKRW(Math.abs(bal))} 납부`}
                            <span
                              className={
                                'text-xs text-stone-400 transition-transform duration-200 ' +
                                (isExpanded ? 'rotate-90' : '')
                              }
                            >
                              ▶
                            </span>
                          </span>
                        </td>
                      </tr>
                      {isExpanded && breakdown.length > 0 && (
                        <tr>
                          <td colSpan={2} className="pb-2 pt-0">
                            <div className="border-l-4 border-amber-400 bg-amber-100/60 px-3 py-2.5 text-xs">
                              {breakdown.map((item, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between py-1"
                                >
                                  <span className="text-stone-600 before:mr-1.5 before:text-stone-400 before:content-['·']">{item.label}</span>
                                  <span
                                    className={
                                      'font-semibold ' +
                                      (item.amount >= 0 ? 'text-green-700' : 'text-red-600')
                                    }
                                  >
                                    {item.amount >= 0
                                      ? `+${formatKRW(item.amount)}`
                                      : `-${formatKRW(Math.abs(item.amount))}`}
                                  </span>
                                </div>
                              ))}
                              <div className="mt-1 flex items-center justify-between border-t border-amber-300/60 pt-1.5 font-bold">
                                <span className="text-stone-700">소계</span>
                                <span
                                  className={
                                    'font-extrabold ' +
                                    (bal > 0 ? 'text-green-700' : 'text-red-600')
                                  }
                                >
                                  {bal > 0
                                    ? `+${formatKRW(bal)} 수령`
                                    : `${formatKRW(Math.abs(bal))} 납부`}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {/* 벙주 없을 때: 최소 이체 방식 */}
            {!banjangData && finalTransfers.length > 0 && (
              <>
                <p className="mb-1.5 text-xs font-extrabold text-amber-800">💸 정산 송금 내역</p>
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {finalTransfers.map((t, i) => {
                      const from = state.participants.find((p) => p.id === t.fromId)?.name ?? '?';
                      const to = state.participants.find((p) => p.id === t.toId)?.name ?? '?';
                      return (
                        <tr key={i} className="border-b border-amber-100 last:border-0">
                          <td className="py-1.5 text-stone-800">
                            {from}
                            <span className="mx-1.5 font-bold text-amber-400">→</span>
                            {to}
                          </td>
                          <td className="py-1.5 text-right font-extrabold text-amber-800">
                            {formatKRW(t.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
            {/* 벙주 있을 때: 2단계 경유 정산 — 강조 카드 */}
            {banjangData && (
              <section
                aria-label={`벙주 정산 — 실제 송금 내역 (${banjangData.banjang.name})`}
                className="mt-4 overflow-hidden rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-white via-amber-50 to-orange-100 p-4 shadow-lg shadow-amber-300/40 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-400/60 active:-translate-y-0.5 active:shadow-xl active:shadow-amber-400/60"
              >
                {/* 카드 헤더 */}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-amber-900">
                    <span className="text-base leading-none">👑</span>
                    벙주 정산 — {banjangData.banjang.name}
                  </h3>
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    🎯 실제 송금
                  </span>
                </div>

                <div className="space-y-2">
                  {/* 수금 내역 */}
                  {(banjangData.incoming.length > 0 || banjangData.banjangBal < -1) && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-2.5">
                      <p className="mb-1.5 text-xs font-semibold text-blue-700">
                        📥 수금 내역 (벙주에게 납부)
                      </p>
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          {banjangData.incoming.map(({ id, name, amount }) => (
                            <tr key={id} className="border-b border-blue-100 last:border-0">
                              <td className="py-1.5 text-stone-800">
                                {name}
                                <span className="mx-1.5 font-bold text-blue-400">→</span>
                                {banjangData.banjang.name} 👑
                              </td>
                              <td className="py-1.5 text-right font-extrabold text-blue-700">
                                {formatKRW(amount)}
                              </td>
                            </tr>
                          ))}
                          {banjangData.banjangBal < -1 && (
                            <tr className="border-b border-blue-100 last:border-0">
                              <td className="py-1.5 text-stone-800">
                                {banjangData.banjang.name} 👑
                                <span className="ml-1 text-xs text-stone-500">(본인 부담)</span>
                              </td>
                              <td className="py-1.5 text-right font-extrabold text-blue-700">
                                {formatKRW(Math.round(-banjangData.banjangBal))}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* 지급 내역 */}
                  {(banjangData.outgoing.length > 0 || banjangData.banjangBal > 1) && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/60 px-3 py-2.5">
                      <p className="mb-1.5 text-xs font-semibold text-purple-700">
                        📤 지급 내역 (벙주가 전달)
                      </p>
                      <table className="w-full border-collapse text-sm">
                        <tbody>
                          {banjangData.outgoing.map(({ id, name, amount }) => (
                            <tr key={id} className="border-b border-purple-100 last:border-0">
                              <td className="py-1.5 text-stone-800">
                                {banjangData.banjang.name} 👑
                                <span className="mx-1.5 font-bold text-purple-400">→</span>
                                {name}
                              </td>
                              <td className="py-1.5 text-right font-extrabold text-purple-700">
                                {formatKRW(amount)}
                              </td>
                            </tr>
                          ))}
                          {banjangData.banjangBal > 1 && (
                            <tr className="border-b border-purple-100 last:border-0">
                              <td className="py-1.5 text-stone-800">
                                {banjangData.banjang.name} 👑
                                <span className="ml-1 text-xs text-stone-500">(본인 수령)</span>
                              </td>
                              <td className="py-1.5 text-right font-extrabold text-purple-700">
                                {formatKRW(Math.round(banjangData.banjangBal))}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            )}
            <div className="mt-4">
              <CopyShareButton text={combinedShareText} />
            </div>
          </section>
        )}

      {/* 백업/초기화 */}
      <section className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-stone-700">⚙ 데이터 관리</h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"
          >
            JSON 백업 다운로드
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 hover:bg-stone-50"
          >
            JSON 불러오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs text-red-700 hover:bg-red-50"
          >
            전체 초기화
          </button>
        </div>
        <p className="mt-3 text-xs text-stone-400">
          입력 데이터는 브라우저에 자동 저장됩니다. (DB 미사용)
        </p>
      </section>

      <footer className="mt-8 space-y-1 text-center text-xs text-stone-400">
        <p>⚠ 첫 탑승자 픽업지 기준 왕복거리 입력 · 편도 탑승자도 왕복 동일 기준 · 1원 단위 반올림</p>
        <p>🌰 도토리 산행 정산 v1.0.3 · 2026-05-23</p>
      </footer>
    </div>
  );
}

function TabButton({
  active,
  activeClass = 'bg-white text-stone-900 shadow',
  onClick,
  children,
}: {
  active: boolean;
  activeClass?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex-1 rounded-lg py-2 text-sm font-medium transition ' +
        (active ? activeClass : 'text-stone-600 hover:text-stone-800')
      }
    >
      {children}
    </button>
  );
}
