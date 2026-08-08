import type { Timestamp } from 'firebase/firestore';
import type { ChoreRequest, FlowerEvent, PayoutRequest } from '../types/models';

export const toChoreRequest = (id: string, data: Record<string, unknown>): ChoreRequest => ({
  id,
  familyId: data.familyId as string,
  childId: data.childId as string,
  choreTemplateId: data.choreTemplateId as string | null,
  label: data.label as string,
  icon: data.icon as string,
  minutes: data.minutes as number,
  note: (data.note as string | null) ?? null,
  hourlyRateCentsSnapshot: data.hourlyRateCentsSnapshot as number,
  amountCents: data.amountCents as number,
  currencyCode: (data.currencyCode as string | undefined) ?? null,
  status: data.status as ChoreRequest['status'],
  declineReason: data.declineReason as string | null,
  submittedAt: (data.submittedAt as Timestamp).toDate(),
  reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : null,
});

export const toPayoutRequest = (id: string, data: Record<string, unknown>): PayoutRequest => ({
  id,
  familyId: data.familyId as string,
  childId: data.childId as string,
  amountCents: data.amountCents as number,
  currencyCode: (data.currencyCode as string | undefined) ?? null,
  status: data.status as PayoutRequest['status'],
  declineReason: data.declineReason as string | null,
  requestedAt: (data.requestedAt as Timestamp).toDate(),
  paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : null,
});

export const toFlowerEvent = (id: string, data: Record<string, unknown>): FlowerEvent => ({
  id,
  familyId: data.familyId as string,
  childId: data.childId as string,
  flowerType: data.flowerType as FlowerEvent['flowerType'],
  amountCents: data.amountCents as number,
  bloomedAt: (data.bloomedAt as Timestamp).toDate(),
});
