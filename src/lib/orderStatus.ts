import { OrderStatus } from '@/types/kiosk';

export type CanonicalOrderStatus = 'new' | 'preparing' | 'ready' | 'served';

export const orderStatusSteps: CanonicalOrderStatus[] = ['new', 'preparing', 'ready', 'served'];

export const orderStatusLabels: Record<CanonicalOrderStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
};

export const orderStatusLabelsUz: Record<CanonicalOrderStatus, string> = {
  new: 'Yangi',
  preparing: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  served: 'Yetkazildi',
};

export function normalizeOrderStatus(status: OrderStatus | undefined): CanonicalOrderStatus {
  if (status === 'pending') return 'new';
  if (status === 'completed') return 'served';
  if (status === 'preparing' || status === 'ready' || status === 'served') return status;
  return 'new';
}

export function getNextOrderStatus(status: OrderStatus): CanonicalOrderStatus | null {
  const normalized = normalizeOrderStatus(status);
  if (normalized === 'new') return 'preparing';
  if (normalized === 'preparing') return 'ready';
  if (normalized === 'ready') return 'served';
  return null;
}

export function getOrderStatusStepIndex(status: OrderStatus): number {
  return orderStatusSteps.indexOf(normalizeOrderStatus(status));
}
