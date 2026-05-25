import type { CarpoolSettlement, Participant, Vehicle } from '../domain/types';
import { formatKRW } from '../utils/format';

interface Props {
  result: CarpoolSettlement;
  vehicles: Vehicle[];
  participants: Participant[];
  fuelRatePerKm: number;
}

export default function CarpoolResult({ result, vehicles, participants, fuelRatePerKm }: Props) {
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? '?';
  const carpoolVehicles = vehicles.filter((v) => !v.isRental);

  return (
    <section className="rounded-xl border-2 border-green-500 bg-white p-4 shadow">
      <h2 className="mb-3 text-base font-bold text-green-700">📊 카풀 정산 결과</h2>

      {/* 1인당 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-red-50 p-3">
          <div className="text-[11px] text-red-700">� 유류비 1인당</div>
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

      {/* 🔴 유류비 (차량별) */}
      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          🔴 유류비 정산 (차량별)
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {carpoolVehicles.map((v, idx) => {
            const r = result.vehicles.find((x) => x.vehicleId === v.id);
            if (!r) return null;
            const drivers = v.driverIds.map((id) => nameOf(id)).join('·') || '?';
            const distCost = Math.round(v.distanceKm * fuelRatePerKm);
            return (
              <li key={v.id} className="flex flex-col gap-0.5 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-stone-700">
                    차량 {idx + 1}{' '}
                    <span className="text-[11px] text-stone-500">
                      ({drivers}, {v.distanceKm}km)
                    </span>
                  </span>
                  <span className="font-semibold text-red-700">{formatKRW(r.fuelCost)}</span>
                </div>
                <div className="text-[11px] text-stone-400">
                  {v.distanceKm}km × {fuelRatePerKm}원 = {formatKRW(distCost)}
                  {v.tollFee > 0 && ` + 톨비 ${formatKRW(v.tollFee)}`}
                  {v.parkingFee > 0 && ` + 주차비 ${formatKRW(v.parkingFee)}`}
                </div>
              </li>
            );
          })}
          {carpoolVehicles.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">차량 없음</li>
          )}
        </ul>
        <div className="mt-1 flex justify-end pr-1 text-xs font-bold text-red-700">
          합계 {formatKRW(result.totalFuel)}
        </div>
      </div>

      {/* 🟡 수고비 (차량별) */}
      <div className="mt-4">
        <h3 className="mb-2 text-xs font-semibold text-stone-600">
          🟡 수고비 정산 (차량별)
        </h3>
        <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
          {carpoolVehicles.map((v, idx) => {
            const r = result.vehicles.find((x) => x.vehicleId === v.id);
            if (!r) return null;
            const drivers = v.driverIds.map((id) => nameOf(id)).join('·') || '?';
            return (
              <li
                key={v.id}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-stone-700">
                  차량 {idx + 1}{' '}
                  <span className="text-[11px] text-stone-500">
                    (운전자: {drivers})
                  </span>
                </span>
                <span className="font-semibold text-amber-700">
                  {formatKRW(r.laborCost)}
                </span>
              </li>
            );
          })}
          {carpoolVehicles.length === 0 && (
            <li className="px-3 py-2 text-xs text-stone-400">차량 없음</li>
          )}
        </ul>
        <div className="mt-1 flex justify-end pr-1 text-xs font-bold text-amber-700">
          합계 {formatKRW(result.totalLabor)}
        </div>
      </div>
    </section>
  );
}
