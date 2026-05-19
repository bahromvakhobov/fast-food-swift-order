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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { removeUndefinedFields } from '@/lib/firestoreUtils';

export interface Category {
  id: string;
  name: string;
  icon: string;
  sortOrder?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CATEGORIES_COLLECTION = 'categories';

type CategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
type FirestoreCategoryData = Omit<Category, 'id'> & {
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

const normalizeCategoryForFirestore = (categoryData: CategoryInput): FirestoreCategoryData => {
  const now = new Date();

  return removeUndefinedFields({
    name: categoryData.name,
    icon: categoryData.icon,
    sortOrder: categoryData.sortOrder ?? 0,
    active: categoryData.active ?? true,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  });
};

const fromFirestoreCategory = (id: string, data: Record<string, unknown>): Category => {
  return {
    id,
    name: String(data.name ?? ''),
    icon: String(data.icon ?? ''),
    sortOrder: data.sortOrder ? Number(data.sortOrder) : undefined,
    active: Boolean(data.active ?? true),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
};

export const createCategory = async (categoryData: CategoryInput): Promise<Category> => {
  const normalizedCategory = normalizeCategoryForFirestore(categoryData);
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), normalizedCategory);
  return fromFirestoreCategory(docRef.id, normalizedCategory);
};

export const updateCategory = async (categoryId: string, categoryData: Partial<CategoryInput>): Promise<void> => {
  const updateData: Partial<FirestoreCategoryData> = removeUndefinedFields({
    ...(categoryData.name !== undefined && { name: categoryData.name }),
    ...(categoryData.icon !== undefined && { icon: categoryData.icon }),
    ...(categoryData.sortOrder !== undefined && { sortOrder: categoryData.sortOrder }),
    ...(categoryData.active !== undefined && { active: categoryData.active }),
    updatedAt: Timestamp.fromDate(new Date()),
  });
  await updateDoc(doc(db, CATEGORIES_COLLECTION, categoryId), updateData);
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, categoryId));
};

export const subscribeToCategories = (
  callback: (categories: Category[]) => void,
  onError?: (error: Error) => void,
) => {
  const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION), orderBy('sortOrder', 'asc'));

  return onSnapshot(
    categoriesQuery,
    snapshot => {
      callback(snapshot.docs.map(catDoc => fromFirestoreCategory(catDoc.id, catDoc.data())));
    },
    error => onError?.(error),
  );
};

export const getCategories = async (): Promise<Category[]> => {
  const categoriesQuery = query(collection(db, CATEGORIES_COLLECTION), orderBy('sortOrder', 'asc'));
  const snapshot = await getDocs(categoriesQuery);
  return snapshot.docs.map(catDoc => fromFirestoreCategory(catDoc.id, catDoc.data()));
};