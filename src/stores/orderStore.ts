import { Order } from '@/types/kiosk';
import {
  createOrder,
  getOrders as getFirestoreOrders,
  subscribeToOrder,
  subscribeToOrders,
  updateOrderStatus as updateFirestoreOrderStatus,
  updatePaymentStatus,
} from '@/services/orderService';

export const getOrders = async (): Promise<Order[]> => {
  return getFirestoreOrders();
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const orders = await getFirestoreOrders();
  return orders.find(order => order.id === orderId) ?? null;
};

export const saveOrder = async (order: Order): Promise<Order> => {
  return createOrder(order);
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  return updateFirestoreOrderStatus(orderId, status);
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  paymentStatus: Order['paymentStatus'],
): Promise<void> => {
  if (!paymentStatus) return;
  return updatePaymentStatus(orderId, paymentStatus);
};

export const clearOrders = (): void => {
  console.warn('clearOrders is not supported for Firestore-backed orders.');
};

export { subscribeToOrder, subscribeToOrders };
