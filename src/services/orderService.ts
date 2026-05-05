import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentStatus } from '@/types/kiosk';
import { normalizeOrderStatus } from '@/lib/orderStatus';

const ORDERS_COLLECTION = 'orders';

type OrderInput = Omit<Order, 'id'> | Order;
type FirestoreOrderData = Omit<Order, 'id' | 'createdAt'> & {
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const toDate = (value: unknown): Date => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
};

const removeUndefined = <T extends Record<string, unknown>>(value: T): T => {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
};

const normalizePaymentStatus = (paymentStatus?: PaymentStatus): PaymentStatus => {
  return paymentStatus ?? 'unpaid';
};

const normalizeOrderForFirestore = (orderData: OrderInput): FirestoreOrderData => {
  const now = new Date();
  const createdAt = orderData.createdAt ? toDate(orderData.createdAt) : now;

  return removeUndefined({
    orderNumber: orderData.orderNumber,
    items: orderData.items,
    subtotal: orderData.subtotal ?? orderData.total,
    serviceFee: orderData.serviceFee ?? 0,
    total: orderData.total,
    serviceType: orderData.serviceType ?? 'self-service',
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(now),
    status: normalizeOrderStatus(orderData.status ?? 'new'),
    orderType: orderData.orderType,
    tableNumber: orderData.orderType === 'dine-in' ? orderData.tableNumber : undefined,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: normalizePaymentStatus(orderData.paymentStatus),
  });
};

const fromFirestoreOrder = (id: string, data: Record<string, unknown>): Order => {
  const total = Number(data.total ?? 0);

  return {
    id,
    orderNumber: Number(data.orderNumber ?? 0),
    items: (data.items ?? []) as Order['items'],
    subtotal: Number(data.subtotal ?? total),
    serviceFee: Number(data.serviceFee ?? 0),
    total,
    serviceType: (data.serviceType ?? 'self-service') as Order['serviceType'],
    createdAt: toDate(data.createdAt),
    status: normalizeOrderStatus(data.status as OrderStatus | undefined),
    orderType: (data.orderType ?? 'take-out') as Order['orderType'],
    tableNumber: typeof data.tableNumber === 'number' ? data.tableNumber : undefined,
    paymentMethod: data.paymentMethod as Order['paymentMethod'] | undefined,
    paymentStatus: normalizePaymentStatus(data.paymentStatus as PaymentStatus | undefined),
  };
};

export const createOrder = async (orderData: OrderInput): Promise<Order> => {
  const normalizedOrder = normalizeOrderForFirestore(orderData);
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), normalizedOrder);
  return fromFirestoreOrder(docRef.id, normalizedOrder);
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    status: normalizeOrderStatus(status),
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<void> => {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), {
    paymentStatus,
    updatedAt: Timestamp.fromDate(new Date()),
  });
};

export const subscribeToOrders = (
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void,
) => {
  const ordersQuery = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'asc'));

  return onSnapshot(
    ordersQuery,
    snapshot => {
      callback(snapshot.docs.map(orderDoc => fromFirestoreOrder(orderDoc.id, orderDoc.data())));
    },
    error => onError?.(error),
  );
};

export const subscribeToOrder = (
  orderId: string,
  callback: (order: Order | null) => void,
  onError?: (error: Error) => void,
) => {
  return onSnapshot(
    doc(db, ORDERS_COLLECTION, orderId),
    snapshot => {
      callback(snapshot.exists() ? fromFirestoreOrder(snapshot.id, snapshot.data()) : null);
    },
    error => onError?.(error),
  );
};

export const getOrders = async (): Promise<Order[]> => {
  const ordersQuery = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(ordersQuery);
  return snapshot.docs.map(orderDoc => fromFirestoreOrder(orderDoc.id, orderDoc.data()));
};
