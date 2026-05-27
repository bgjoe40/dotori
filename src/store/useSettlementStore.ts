import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppState, Expense, Participant, Vehicle } from '../domain/types';
import { FUEL_RATE_PER_KM } from '../domain/fuel';
import { newId } from '../utils/id';

const STORAGE_KEY = 'dotori:settlement:v1';

const initialState: AppState = {
  meeting: { name: '', date: '' },
  participants: [],
  vehicles: [],
  expenses: [],
  settings: { fuelRatePerKm: FUEL_RATE_PER_KM },
};

/** 기존 저장본에 누락된 필드 주입 */
function isValidParticipant(p: unknown): boolean {
  return (
    typeof p === 'object' &&
    p !== null &&
    typeof (p as Record<string, unknown>).id === 'string' &&
    typeof (p as Record<string, unknown>).name === 'string' &&
    typeof (p as Record<string, unknown>).isCarpool === 'boolean'
  );
}
function isValidVehicle(v: unknown): boolean {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).id === 'string' &&
    Array.isArray((v as Record<string, unknown>).driverIds) &&
    Array.isArray((v as Record<string, unknown>).passengerIds) &&
    typeof (v as Record<string, unknown>).distanceKm === 'number' &&
    typeof (v as Record<string, unknown>).isRental === 'boolean'
  );
}
function isValidExpense(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as Record<string, unknown>).id === 'string' &&
    typeof (e as Record<string, unknown>).description === 'string' &&
    typeof (e as Record<string, unknown>).amount === 'number' &&
    typeof (e as Record<string, unknown>).payerId === 'string' &&
    Array.isArray((e as Record<string, unknown>).sharerIds)
  );
}

function migrate(raw: Partial<AppState>): AppState {
  return {
    meeting: raw.meeting ?? initialState.meeting,
    participants: Array.isArray(raw.participants)
      ? (raw.participants as unknown[]).filter(isValidParticipant) as Participant[]
      : [],
    vehicles: Array.isArray(raw.vehicles)
      ? (raw.vehicles as unknown[]).filter(isValidVehicle) as Vehicle[]
      : [],
    expenses: Array.isArray(raw.expenses)
      ? (raw.expenses as unknown[])
          .filter(isValidExpense)
          .map((e) => ({ splitMode: 'even' as const, ...(e as Expense) }))
      : [],
    settings: raw.settings ?? initialState.settings,
  };
}

function loadInitial(): AppState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || typeof parsed !== 'object') return initialState;
    return migrate(parsed);
  } catch {
    return initialState;
  }
}

export function useSettlementStore() {
  const [state, setState] = useState<AppState>(loadInitial);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // ignore quota errors
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [state]);

  const setMeeting = useCallback((meeting: Partial<AppState['meeting']>) => {
    setState((s) => ({ ...s, meeting: { ...s.meeting, ...meeting } }));
  }, []);

  const setFuelRate = useCallback((rate: number) => {
    const safeRate = Number.isNaN(rate) || rate <= 0 ? FUEL_RATE_PER_KM : Math.round(rate);
    setState((s) => ({ ...s, settings: { ...s.settings, fuelRatePerKm: safeRate } }));
  }, []);

  // ───── Participants ─────
  const addParticipant = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const pid = newId('p');
    setState((s) => ({
      ...s,
      participants: [
        ...s.participants,
        { id: pid, name: trimmed, isCarpool: true },
      ],
      // 신규 참가자를 기존 경비 항목 분담자에 자동 포함
      expenses: s.expenses.map((e) => ({
        ...e,
        sharerIds: [...e.sharerIds, pid],
      })),
    }));
  }, []);

  const updateParticipant = useCallback(
    (id: string, patch: Partial<Participant>) => {
      setState((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      }));
    },
    [],
  );

  const setBanjang = useCallback((id: string | null) => {
    setState((s) => ({
      ...s,
      meeting: { ...s.meeting, banjangId: id ?? undefined },
    }));
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      meeting: {
        ...s.meeting,
        banjangId: s.meeting.banjangId === id ? undefined : s.meeting.banjangId,
      },
      participants: s.participants.filter((p) => p.id !== id),
      vehicles: s.vehicles.map((v) => {
        const newDriverIds = v.driverIds.filter((d) => d !== id);
        const newRatios = v.driverShareRatios
          ? Object.fromEntries(
              Object.entries(v.driverShareRatios).filter(([k]) => k !== id),
            )
          : undefined;
        return {
          ...v,
          driverIds: newDriverIds,
          passengerIds: v.passengerIds.filter((d) => d !== id),
          // 운전자가 1명 이하로 줄면 비율 초기화
          driverShareRatios: newDriverIds.length <= 1 ? undefined : newRatios,
        };
      }),
      // 경비에서도 제거
      expenses: s.expenses.map((e) => ({
        ...e,
        payerId: e.payerId === id ? '' : e.payerId,
        sharerIds: e.sharerIds.filter((sid) => sid !== id),
      })),
    }));
  }, []);

  // ───── Vehicles ─────
  const addVehicle = useCallback((isRental = false) => {
    setState((s) => ({
      ...s,
      vehicles: [
        ...s.vehicles,
        {
          id: newId('v'),
          driverIds: [],
          passengerIds: [],
          distanceKm: 0,
          tollFee: 0,
          parkingFee: 0,
          isRental,
          rentalFee: isRental ? 0 : undefined,
        },
      ],
    }));
  }, []);

  const updateVehicle = useCallback((id: string, patch: Partial<Vehicle>) => {
    setState((s) => ({
      ...s,
      vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
  }, []);

  const removeVehicle = useCallback((id: string) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.filter((v) => v.id !== id) }));
  }, []);

  // ───── Expenses ─────
  const addExpense = useCallback((allParticipantIds: string[]) => {
    setState((s) => ({
      ...s,
      expenses: [
        ...s.expenses,
        {
          id: newId('e'),
          description: '',
          amount: 0,
          payerId: allParticipantIds[0] ?? '',
          sharerIds: allParticipantIds,
          splitMode: 'even' as const,
        },
      ],
    }));
  }, []);

  const updateExpense = useCallback((id: string, patch: Partial<Expense>) => {
    setState((s) => ({
      ...s,
      expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) }));
  }, []);

  // ───── Bulk ─────
  const reset = useCallback(() => setState(initialState), []);

  const importJson = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Partial<AppState>;
      setState(migrate(parsed));
      return true;
    } catch {
      return false;
    }
  }, []);

  const exportJson = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const participantById = useMemo(() => {
    const m = new Map<string, Participant>();
    state.participants.forEach((p) => m.set(p.id, p));
    return m;
  }, [state.participants]);

  return {
    state,
    setMeeting,
    setFuelRate,
    setBanjang,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addVehicle,
    updateVehicle,
    removeVehicle,
    addExpense,
    updateExpense,
    removeExpense,
    reset,
    importJson,
    exportJson,
    participantById,
  };
}
