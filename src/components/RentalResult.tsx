import type { Participant, RentalSettlement, Vehicle } from '../domain/types';
import { formatKRW } from '../utils/format';

interface Props {
  results: { vehicle: Vehicle; result: RentalSettlement }[];
  participants: Participant[];
}

export default function RentalResult({ results, participants }: Props) {
  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? '?';

  if (results.length === 0) {
    return (
      <section className="rounded-xl border-2 border-purple-300 bg-white p-4 text-center text-xs text-stone-400">
        렌트 차량을 추가하면 결과가 표시됩니다.
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {results.map(({ vehicle: v, result: r }, idx) => (
        <div
          key={v.id}
          className="rounded-xl border-2 border-purple-500 bg-white p-4 shadow"
        >
          <h2 className="mb-3 text-base font-bold text-purple-700">
            🚐 렌트 차량 {idx + 1} 정산
          </h2>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-purple-50 p-3">
              <div className="text-[11px] text-purple-700">1인당 렌트비</div>
              <div className="mt-1 text-lg font-bold text-purple-700">
                {formatKRW(r.rentalPerPerson)}
              </div>
              <div className="text-[10px] text-purple-600">
                ÷ {r.totalHeadcount}명
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 p-3">
              <div className="text-[11px] text-amber-700">1인당 수고비</div>
              <div className="mt-1 text-lg font-bold text-amber-700">
                {formatKRW(r.laborPerPassenger)}
              </div>
              <div className="text-[10px] text-amber-600">
                탑승자 {v.passengerIds.length}명
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="mb-2 text-xs font-semibold text-stone-600">
              💸 탑승자/운전자 부담액
            </h3>
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {r.owed
                .filter((o) => o.total > 0)
                .map((o) => (
                  <li
                    key={o.participantId}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-stone-800">
                      {nameOf(o.participantId)}
                      {o.isDriver && (
                        <span className="ml-1 text-[10px] text-purple-700">
                          (운전자)
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-stone-900">
                      {formatKRW(o.total)}
                    </span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="mt-3">
            <h3 className="mb-2 text-xs font-semibold text-stone-600">
              💰 운전자 수령 (수고비)
            </h3>
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
              {r.driverReceipts.map((d) => (
                <li
                  key={d.driverId}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-stone-800">{nameOf(d.driverId)}</span>
                  <span className="font-semibold text-stone-900">
                    {formatKRW(d.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </section>
  );
}
