export type FlowerType = 'tulip' | 'sunflower' | 'daisy' | 'lavender';

export type ChoreStatus = 'pending' | 'approved' | 'declined';

export type PayoutStatus = 'requested' | 'paid' | 'declined';

export type PayoutRule = 'anytime' | 'weekly_friday' | 'on_bloom' | 'at_amount';

export interface Family {
  id: string;
  name: string;
  familyCode: string;
  currencyCode: string;
  fiscalYearStartMonth: number;
  notifyChoreRequests: boolean;
  notifyPayoutRequests: boolean;
  createdAt: Date;
}

export interface Child {
  id: string;
  familyId: string;
  name: string;
  hourlyRateCents: number;
  pin: string;
  currentFlowerType: FlowerType;
  flowerProgressCents: number;
  payoutRule: PayoutRule;
  /** Only meaningful when payoutRule === 'at_amount' — the unpaid balance
   * threshold that unlocks a payout request. */
  payoutThresholdCents: number;
  active: boolean;
  createdAt: Date;
}

export interface ChoreTemplate {
  id: string;
  familyId: string;
  label: string;
  icon: string;
  active: boolean;
  sortOrder: number;
}

export interface ChoreRequest {
  id: string;
  familyId: string;
  childId: string;
  choreTemplateId: string | null;
  label: string;
  icon: string;
  minutes: number;
  note: string | null;
  hourlyRateCentsSnapshot: number;
  amountCents: number;
  /** Currency in effect when this was approved — null until approved, or for
   * records written before this field existed (falls back to the family's
   * current currency at display time). */
  currencyCode: string | null;
  status: ChoreStatus;
  declineReason: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
}

export interface PayoutRequest {
  id: string;
  familyId: string;
  childId: string;
  amountCents: number;
  /** Currency in effect when this was marked paid — null until paid. */
  currencyCode: string | null;
  status: PayoutStatus;
  declineReason: string | null;
  requestedAt: Date;
  paidAt: Date | null;
}

export interface FlowerEvent {
  id: string;
  familyId: string;
  childId: string;
  flowerType: FlowerType;
  amountCents: number;
  bloomedAt: Date;
}

export interface ChildSession {
  childId: string;
  familyId: string;
}
