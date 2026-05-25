import type { Participant, Vehicle } from '../domain/types';
import { calcFuelCost } from '../domain/fuel';
import { calcLaborCost } from '../domain/labor';
import { formatKRW } from '../utils/format';

interface Props {
  vehicle: Vehicle;
  participants: Participant[];
  onChange: (patch: Partial<Vehicle>) => void;
  onRemove: () => void;
  mode: 'carpool' | 'rental';
  index: number;
  fuelRatePerKm?: number;
  occupiedIds?: string[];
}

const NumInput = ({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  suffix?: string;
}) => (
  <div className="relative">
    <input
      type="number"
      inputMode="numeric"
      min={0}
      value={value === 0 ? '' : value}
      placeholder={placeholder ?? '0'}
      onChange={(e) => {
        const v = e.target.value === '' ? 0 : Number(e.target.value);
        onChange(Number.isNaN(v) ? 0 : v);
      }}
      className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-10 text-sm focus:border-green-500 focus:outline-none"
    />
    {suffix && (
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
        {suffix}
      </span>
    )}
  </div>
);

export default function VehicleCard({
  vehicle,
  participants,
  onChange,
  onRemove,
  mode,
  index,
  fuelRatePerKm = 170,
  occupiedIds = [],
}: Props) {
  const fuelCost = calcFuelCost(vehicle.distanceKm, vehicle.tollFee, vehicle.parkingFee, fuelRatePerKm);
  const laborCost = calcLaborCost(vehicle.distanceKm);

  const isMultiDriver = mode === 'rental';
  const driverIds = vehicle.driverIds;

  const toggleDriver = (id: string) => {
    let next: string[];
    if (isMultiDriver) {
      next = driverIds.includes(id)
        ? driverIds.filter((d) => d !== id)
        : [...driverIds, id];
    } else {
      next = driverIds[0] === id ? [] : [id];
    }
    onChange({
      driverIds: next,
      passengerIds: vehicle.passengerIds.filter((p) => !next.includes(p)),
    });
  };

  const togglePassenger = (id: string) => {
    if (driverIds.includes(id)) return;
    const next = vehicle.passengerIds.includes(id)
      ? vehicle.passengerIds.filter((p) => p !== id)
      : [...vehicle.passengerIds, id];
    onChange({ passengerIds: next });
  };

  const updateRatio = (driverId: string, value: number) => {
    const ratios = { ...(vehicle.driverShareRatios ?? {}) };
    if (value <= 0) {
      delete ratios[driverId];
    } else {
      ratios[driverId] = value;
    }
    onChange({
      driverShareRatios: Object.keys(ratios).length > 0 ? ratios : undefined,
    });
  };

  return (
    <article className="rounded-xl bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-800">
          🚙 차량 {index + 1}
          {mode === 'rental' && (
            <span className="ml-2 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
              렌트
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 hover:underline"
        >
          차량 삭제
        </button>
      </header>

      {participants.length === 0 ? (
        <p className="text-xs text-stone-400">먼저 참가자를 추가하세요.</p>
      ) : (
        <>
          {/* 운전자 */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-stone-600">
              {isMultiDriver ? '운전자 (여러 명 선택 가능)' : '운전자'}
            </label>
            <div className="flex flex-wrap gap-2">
              {participants
                .filter((p) => p.isCarpool)
                .map((p) => {
                  const selected = driverIds.includes(p.id);
                  const occupied = !selected && occupiedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={occupied}
                      title={occupied ? '다른 차량에 배정됨' : undefined}
                      onClick={() => !occupied && toggleDriver(p.id)}
                      className={
                        'rounded-full border px-3 py-1 text-xs transition ' +
                        (selected
                          ? 'border-green-600 bg-green-600 text-white'
                          : occupied
                          ? 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-green-400')
                      }
                    >
                      {p.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 탑승자 */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-stone-600">
              탑승자
            </label>
            <div className="flex flex-wrap gap-2">
              {participants
                .filter((p) => p.isCarpool && !driverIds.includes(p.id))
                .map((p) => {
                  const selected = vehicle.passengerIds.includes(p.id);
                  const occupied = !selected && occupiedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={occupied}
                      title={occupied ? '다른 차량에 배정됨' : undefined}
                      onClick={() => !occupied && togglePassenger(p.id)}
                      className={
                        'rounded-full border px-3 py-1 text-xs transition ' +
                        (selected
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : occupied
                          ? 'cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through'
                          : 'border-stone-300 bg-white text-stone-700 hover:border-sky-400')
                      }
                    >
                      {p.name}
                    </button>
                  );
                })}
            </div>
          </div>
        </>
      )}

      {/* 거리 & 톨비 & 주차비 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">
            왕복 거리
          </label>
          <NumInput
            value={vehicle.distanceKm}
            onChange={(n) => onChange({ distanceKm: n })}
            suffix="km"
          />
        </div>
        {mode === 'carpool' ? (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                톨비
              </label>
              <NumInput
                value={vehicle.tollFee}
                onChange={(n) => onChange({ tollFee: n })}
                suffix="원"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                주차비
              </label>
              <NumInput
                value={vehicle.parkingFee}
                onChange={(n) => onChange({ parkingFee: n })}
                suffix="원"
              />
            </div>
          </>
        ) : (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-stone-600">
              총 렌트비
            </label>
            <NumInput
              value={vehicle.rentalFee ?? 0}
              onChange={(n) => onChange({ rentalFee: n })}
              suffix="원"
            />
          </div>
        )}
      </div>

      {/* 렌트 + 운전자 다수 비율 */}
      {mode === 'rental' && driverIds.length > 1 && (
        <div className="mt-3 rounded-lg border border-purple-100 bg-purple-50 p-3">
          <p className="mb-2 text-xs font-medium text-purple-800">
            운전 거리 비율 (선택, 미입력 시 균등 분배)
          </p>
          <div className="space-y-2">
            {driverIds.map((id) => {
              const name = participants.find((p) => p.id === id)?.name ?? '?';
              const v = vehicle.driverShareRatios?.[id] ?? 0;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-stone-700">{name}</span>
                  <NumInput
                    value={v}
                    onChange={(n) => updateRatio(id, n)}
                    suffix="%"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 부가정보 */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">
            네이버지도 URL (선택)
          </label>
          <input
            type="url"
            placeholder="https://map.naver.com/..."
            value={vehicle.mapUrl ?? ''}
            onChange={(e) => onChange({ mapUrl: e.target.value })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">
            영수증 메모 (선택)
          </label>
          <input
            type="text"
            placeholder="예: 휴게소 영수증 1건"
            value={vehicle.memo ?? ''}
            onChange={(e) => onChange({ memo: e.target.value })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 실시간 계산 결과 */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-3 text-sm">
        {mode === 'carpool' ? (
          <>
            <Badge color="red" label="🔴 유류비" value={formatKRW(fuelCost)} />
            <Badge color="amber" label="🟡 수고비" value={formatKRW(laborCost)} />
          </>
        ) : (
          <>
            <Badge
              color="purple"
              label="렌트비"
              value={formatKRW(vehicle.rentalFee ?? 0)}
            />
            <Badge color="amber" label="🟡 수고비" value={formatKRW(laborCost)} />
          </>
        )}
      </div>
    </article>
  );
}

function Badge({
  color,
  label,
  value,
}: {
  color: 'red' | 'amber' | 'purple';
  label: string;
  value: string;
}) {
  const cls = {
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    purple: 'bg-purple-50 text-purple-700',
  }[color];
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-medium ${cls}`}>
      {label} {value}
    </span>
  );
}
