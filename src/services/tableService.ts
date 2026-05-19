import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { removeUndefinedFields } from '@/lib/firestoreUtils';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'inactive';

export interface RestaurantTable {
  id: string;
  number: number;
  name?: string;
  status: TableStatus;
  currentOrderId?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TABLES_COLLECTION = 'restaurantTables';

type TableInput = Omit<RestaurantTable, 'id' | 'createdAt' | 'updatedAt'>;
type FirestoreTableData = Omit<RestaurantTable, 'id'> & {
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

const normalizeTableForFirestore = (tableData: TableInput): FirestoreTableData => {
  const now = new Date();

  return removeUndefinedFields({
    number: tableData.number,
    name: tableData.name,
    status: tableData.status,
    currentOrderId: tableData.currentOrderId,
    active: tableData.active ?? true,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
};

const fromFirestoreTable = (id: string, data: Record<string, unknown>): RestaurantTable => {
  return {
    id,
    number: Number(data.number ?? 0),
    name: data.name ? String(data.name) : undefined,
    status: (data.status as TableStatus) ?? 'available',
    currentOrderId: data.currentOrderId ? String(data.currentOrderId) : undefined,
    active: Boolean(data.active ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

export const createTable = async (tableData: TableInput): Promise<RestaurantTable> => {
  const normalizedTable = normalizeTableForFirestore(tableData);
  const docRef = await addDoc(collection(db, TABLES_COLLECTION), normalizedTable);
  return fromFirestoreTable(docRef.id, normalizedTable);
};

export const updateTable = async (tableId: string, tableData: Partial<TableInput>): Promise<void> => {
  const updateData: Partial<FirestoreTableData> = removeUndefinedFields({
    ...(tableData.number !== undefined && { number: tableData.number }),
    ...(tableData.name !== undefined && { name: tableData.name }),
    ...(tableData.status !== undefined && { status: tableData.status }),
    ...(tableData.currentOrderId !== undefined && { currentOrderId: tableData.currentOrderId }),
    ...(tableData.active !== undefined && { active: tableData.active }),
    updatedAt: Timestamp.fromDate(new Date()),
  });
  await updateDoc(doc(db, TABLES_COLLECTION, tableId), updateData);
};

export const deleteTable = async (tableId: string): Promise<void> => {
  await deleteDoc(doc(db, TABLES_COLLECTION, tableId));
};

export const subscribeToTables = (
  callback: (tables: RestaurantTable[]) => void,
  onError?: (error: Error) => void,
) => {
  const tablesQuery = query(collection(db, TABLES_COLLECTION), orderBy('number', 'asc'));

  return onSnapshot(
    tablesQuery,
    snapshot => {
      callback(snapshot.docs.map(tableDoc => fromFirestoreTable(tableDoc.id, tableDoc.data())));
    },
    error => onError?.(error),
  );
};

export const getTables = async (): Promise<RestaurantTable[]> => {
  const tablesQuery = query(collection(db, TABLES_COLLECTION), orderBy('number', 'asc'));
  const snapshot = await getDocs(tablesQuery);
  return snapshot.docs.map(tableDoc => fromFirestoreTable(tableDoc.id, tableDoc.data()));
};

export const getTableByNumber = async (tableNumber: number): Promise<RestaurantTable | null> => {
  const tablesQuery = query(collection(db, TABLES_COLLECTION), where('number', '==', tableNumber));
  const snapshot = await getDocs(tablesQuery);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return fromFirestoreTable(doc.id, doc.data());
};

export const markTableOccupied = async (tableNumber: number, orderId: string): Promise<void> => {
  const table = await getTableByNumber(tableNumber);
  if (table) {
    await updateTable(table.id, { status: 'occupied', currentOrderId: orderId });
  }
};

export const markTableAvailable = async (tableNumber: number): Promise<void> => {
  const table = await getTableByNumber(tableNumber);
  if (table) {
    await updateTable(table.id, { status: 'available', currentOrderId: undefined });
  }
};