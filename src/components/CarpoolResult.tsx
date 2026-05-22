import type { CarpoolSettlement, Participant, Vehicle } from '../domain/types';
import { formatKRW } from '../utils/format';

interface Props {
  result: CarpoolSettlement;
  vehicles: Vehicle[];
  participants: Participant[];
}

export default function CarpoolResult({ result, vehicles, participants }: Props) {
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? '?';

  return (
    <section className="rounded-xl border-2 border-green-500 bg-white p-4 shadow">
      <h2 className="mb-3 text-base font-bold text-green-700">📊 카풀 정산 결과</h2>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-red-50 p-3">
          <div className="text-[11px] text-red-700">🔵 유류비 1인당</div>
          <div className="mt-1 text-lg font-bold text-red-700">
            {formatKRW(result.fuelPerPerson)}
          </div>
          <div className="text-[10px] text-red-600">
            ÷ {result.fuelHeadcount}명 (운전자+탑승자)
          </div>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-[11px] text-amber-700">⚫ 수고비 1인당</div>
          <div className="mt-1 text-lg font-bold text-amber-700">
            {formatKRW(result.laborPerPerson)}
          </div>
          <div className="text-[10px] text-amber-600">
            ÷ {result.laborHeadcount}명 (탑승자만)
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          💸 탑승자/운전자 → 벙주 송금
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {result.owed
            .filter((o) => o.total > 0)
            .map((o) => (
              <li
                key={o.participantId}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-stone-800">
                  {nameOf(o.participantId)}
                  {o.isDriver && (
                    <span className="ml-1 text-[10px] text-green-700">(운전자)</span>
                  )}
                </span>
                <span className="font-semibold text-stone-900">
                  {formatKRW(o.total)}
                </span>
              </li>
            ))}
          {result.owed.every((o) => o.total === 0) && (
            <li className="px-3 py-2 text-xs text-stone-400">송금 대상 없음</li>
          )}
        </ul>
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          💰 벙주 → 운전자 송금
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {result.driverPayouts.map((p, i) => {
            const v = vehicles.find((x) => x.id === p.vehicleId);
            const vIdx = vehicles
              .filter((x) => !x.isRental)
              .findIndex((x) => x.id === p.vehicleId);
            return (
              <li
                key={i}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-stone-800">
                  {nameOf(p.driverId)}{' '}
                  <span className="text-[10px] text-stone-500">
                    (차량 {vIdx + 1}, {v?.distanceKm ?? 0}km)
                  </span>
                </span>
                <span className="font-semibold text-stone-900">
                  {formatKRW(p.amount)}
                </span>
              </li>
            );
          })}
          {result.driverPayouts.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">송금 대상 없음</li>
          )}
        </ul>
      </div>

      <div className="mt-3 border-t border-stone-100 pt-3 text-[11px] text-stone-500">
        총 유류비 {formatKRW(result.totalFuel)} · 총 수고비{' '}
        {formatKRW(result.totalLabor)}
      </div>

      {/* ⚫ 수고비 정산 */}
      {result.driverLaborReceipts.length > 0 && (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <h3 className="mb-2 text-xs font-semibold text-stone-600">
            ⚫ 수고비 정산 — 운전자별 수령 합계
          </h3>
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
            {result.vehicles.map((vr) => {
              const v = vehicles.find((x) => x.id === vr.vehicleId);
              const vIdx = vehicles
                .filter((x) => !x.isRental)
                .findIndex((x) => x.id === vr.vehicleId);
              const drivers = v?.driverIds ?? [];
              return (
                <li
                  key={vr.vehicleId}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-stone-700">
                    차량 {vIdx + 1}{' '}
                    <span className="text-[11px] text-stone-500">
                      ({v?.distanceKm ?? 0}km
                      {drivers.length > 0
                        ? ', 운전: ' + drivers.map((id) => nameOf(id)).join('·')
                        : ''}
                      )
                    </span>
                  </span>
                  <span className="font-semibold text-amber-700">
                    🟡 {formatKRW(vr.laborCost)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
