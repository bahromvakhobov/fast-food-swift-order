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
import { MenuItem } from '@/types/kiosk';
import { removeUndefinedFields } from '@/lib/firestoreUtils';

const FOODS_COLLECTION = 'foods';

type FoodInput = Omit<MenuItem, 'id'> | MenuItem;
type FirestoreFoodData = Omit<MenuItem, 'id'> & {
  categoryId: string;
  categoryName?: string;
  imageUrl: string;
  model3dUrl?: string;
  arEnabled: boolean;
  preparationTime?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

const toDate = (value: unknown): Date => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return new Date();
};

const normalizeFoodForFirestore = (foodData: FoodInput): FirestoreFoodData => {
  const now = new Date();
  const createdAt = foodData.createdAt ? toDate(foodData.createdAt) : now;

  return removeUndefinedFields({
    name: foodData.name,
    description: foodData.description,
    price: foodData.price,
    categoryId: foodData.category,
    categoryName: foodData.category,
    imageUrl: foodData.image,
    model3dUrl: foodData.modelUrl,
    arEnabled: foodData.hasAR ?? false,
    preparationTime: 10,
    available: foodData.available ?? true,
    ingredients: foodData.ingredients,
    createdAt: Timestamp.fromDate(createdAt),
    updatedAt: Timestamp.fromDate(now),
  });
};

const fromFirestoreFood = (id: string, data: Record<string, unknown>): MenuItem => {
  return {
    id,
    name: String(data.name ?? ''),
    description: data.description ? String(data.description) : undefined,
    price: Number(data.price ?? 0),
    image: String(data.imageUrl ?? ''),
    category: String(data.categoryId ?? ''),
    modelUrl: data.model3dUrl ? String(data.model3dUrl) : undefined,
    hasAR: Boolean(data.arEnabled ?? false),
    available: Boolean(data.available ?? true),
    ingredients: Array.isArray(data.ingredients) ? data.ingredients.map(String) : undefined,
  };
};

export const createFood = async (foodData: FoodInput): Promise<MenuItem> => {
  const normalizedFood = normalizeFoodForFirestore(foodData);
  const docRef = await addDoc(collection(db, FOODS_COLLECTION), normalizedFood);
  return fromFirestoreFood(docRef.id, normalizedFood);
};

export const updateFood = async (foodId: string, foodData: Partial<FoodInput>): Promise<void> => {
  const updateData: Partial<FirestoreFoodData> = removeUndefinedFields({
    ...(foodData.name !== undefined && { name: foodData.name }),
    ...(foodData.description !== undefined && { description: foodData.description }),
    ...(foodData.price !== undefined && { price: foodData.price }),
    ...(foodData.category !== undefined && { categoryId: foodData.category, categoryName: foodData.category }),
    ...(foodData.image !== undefined && { imageUrl: foodData.image }),
    ...(foodData.modelUrl !== undefined && { model3dUrl: foodData.modelUrl }),
    ...(foodData.hasAR !== undefined && { arEnabled: foodData.hasAR }),
    ...(foodData.available !== undefined && { available: foodData.available }),
    ...(foodData.ingredients !== undefined && { ingredients: foodData.ingredients }),
    updatedAt: Timestamp.fromDate(new Date()),
  });
  await updateDoc(doc(db, FOODS_COLLECTION, foodId), updateData);
};

export const deleteFood = async (foodId: string): Promise<void> => {
  await deleteDoc(doc(db, FOODS_COLLECTION, foodId));
};

export const subscribeToFoods = (
  callback: (foods: MenuItem[]) => void,
  onError?: (error: Error) => void,
) => {
  const foodsQuery = query(collection(db, FOODS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    foodsQuery,
    snapshot => {
      callback(snapshot.docs.map(foodDoc => fromFirestoreFood(foodDoc.id, foodDoc.data())));
    },
    error => onError?.(error),
  );
};

export const getFoods = async (): Promise<MenuItem[]> => {
  const foodsQuery = query(collection(db, FOODS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(foodsQuery);
  return snapshot.docs.map(foodDoc => fromFirestoreFood(foodDoc.id, foodDoc.data()));
};