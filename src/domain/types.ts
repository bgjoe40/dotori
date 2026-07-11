// 산행 정산 도메인 타입

export type ID = string;

export interface Participant {
  id: ID;
  name: string;
  /** false면 "개인참석" — 유류비/수고비 분모에서 제외 */
  isCarpool: boolean;
}

export interface Vehicle {
  id: ID;
  /** 운전자(들). 카풀은 1명, 렌트는 1명 이상 */
  driverIds: ID[];
  /** 탑승자(운전자 제외) */
  passengerIds: ID[];
  /** 왕복 거리 (km) */
  distanceKm: number;
  /** 톨비(원) */
  tollFee: number;
  /** 주차비(원) */
  parkingFee: number;
  /** 렌트 차량 여부 */
  isRental: boolean;
  /** 렌트일 때 총 렌트비(원) */
  rentalFee?: number;
  /** 렌트 + 운전자 다수일 때 각 운전자의 운전 거리 비율(%). 미입력 시 균등 */
  driverShareRatios?: Record<ID, number>;
  /** 네이버지도 URL (참고용) */
  mapUrl?: string;
  /** 영수증 메모 (참고용) */
  memo?: string;
}

export interface Meeting {
  /** 모임 이름 */
  name: string;
  /** YYYY-MM-DD */
  date: string;
  /** 벙주 참가자 ID */
  banjangId?: string;
}

export interface Expense {
  id: ID;
  /** 항목 설명 (예: 저녁식사, 커피) */
  description: string;
  /** 금액(원). even=총액, perPerson=1인당 금액 */
  amount: number;
  /** 지불한 사람 */
  payerId: ID;
  /** 엔빵/인원추가 대상 참가자 목록 (빈 배열이면 계산 제외) */
  sharerIds: ID[];
  /** 분할 방식: 'even'=N빵(기본, 총액÷인원), 'perPerson'=인원추가(1인당 고정금액) */
  splitMode?: 'even' | 'perPerson';
  /** 메모 */
  memo?: string;
}

export interface AppSettings {
  /** km당 유류비 단가(원). 기본 170 */
  fuelRatePerKm: number;
}

export interface AppState {
  meeting: Meeting;
  participants: Participant[];
  vehicles: Vehicle[];
  expenses: Expense[];
  settings: AppSettings;
}

/** 차량별 정산 결과 (카풀) */
export interface VehicleSettlement {
  vehicleId: ID;
  /** 🔴 유류비 = 거리×170 + 톨비 + 주차비 */
  fuelCost: number;
  /** 🟡 수고비 (왕복) */
  laborCost: number;
  /** 벙주 → 운전자 송금액 (운전자가 1명일 때) */
  driverPayout: number;
}

/** 참가자별 부담액 */
export interface ParticipantOwed {
  participantId: ID;
  /** 🔵 유류비 엔빵 부담분 */
  fuelShare: number;
  /** ⚫ 수고비 엔빵 부담분 (탑승자만 발생) */
  laborShare: number;
  /** 총 부담액 (벙주에게 송금할 금액) */
  total: number;
  /** 본인이 운전자라서 자기 자신 → 자신 흐름인지 */
  isDriver: boolean;
}

export interface CarpoolSettlement {
  /** 차량별 결과 */
  vehicles: VehicleSettlement[];
  /** 모든 카풀 차량 유류비 합 */
  totalFuel: number;
  /** 모든 카풀 차량 수고비 합 */
  totalLabor: number;
  /** 🔵 유류비 엔빵 1인당 */
  fuelPerPerson: number;
  /** ⚫ 수고비 엔빵 1인당 (탑승자 기준) */
  laborPerPerson: number;
  /** 유류비 분모 인원 (카풀 참여 운전자+탑승자) */
  fuelHeadcount: number;
  /** 수고비 분모 인원 (카풀 탑승자만) */
  laborHeadcount: number;
  /** 참가자별 부담액 */
  owed: ParticipantOwed[];
  /** 벙주→운전자 송금 명세 (유류비+수고비 합산) */
  driverPayouts: { driverId: ID; vehicleId: ID; amount: number }[];
  /** 운전자별 수고비 수령 합계 */
  driverLaborReceipts: { driverId: ID; amount: number }[];
}

/** 경비 항목별 결과 */
export interface ExpenseItemResult {
  expenseId: ID;
  /** 1인당 분담액 */
  perPerson: number;
  /** 분배 대상 인원 수 */
  sharerCount: number;
}

/** 송금 명세 (from→to 합산) */
export interface ExpenseTransfer {
  fromId: ID;
  toId: ID;
  amount: number;
}

/** 지불자별 수령 합계 */
export interface PayerReceipt {
  payerId: ID;
  totalReceived: number;
}

/** 경비 정산 결과 */
export interface ExpenseSettlement {
  items: ExpenseItemResult[];
  transfers: ExpenseTransfer[];
  payerReceipts: PayerReceipt[];
  totalAmount: number;
}

/** 렌트 정산 결과 */
export interface RentalSettlement {
  vehicleId: ID;
  rentalFee: number;
  tollFee: number;
  parkingFee: number;
  laborCost: number;
  totalHeadcount: number;
  /** 1인당 렌트비 (운전자+탑승자 균등) */
  rentalPerPerson: number;
  /** 1인당 수고비 (탑승자만 균등) */
  laborPerPassenger: number;
  /** 운전자별 수령액 (탑승자들이 보낸 렌트비 회수 + 수고비) */
  driverReceipts: {
    driverId: ID;
    /** 탑승자들이 환급하는 렌트비 회수분 (운전자 본인 부담분 제외) */
    rentalRecovery: number;
    /** 탑승자들이 보낸 수고비 */
    laborReceipt: number;
    /** 총 수령액 = rentalRecovery + laborReceipt */
    amount: number;
  }[];
  /** 참가자별 부담액 */
  owed: ParticipantOwed[];
}
