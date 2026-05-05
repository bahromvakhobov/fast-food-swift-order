import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  console.log('Testing Firebase Connection...');
  const testCollection = 'test_connection';
  
  try {
    console.log('1. Trying to add a document...');
    const docRef = await addDoc(collection(db, testCollection), {
      message: 'Hello Firebase!',
      timestamp: new Date()
    });
    console.log('✅ Document added with ID:', docRef.id);

    console.log('2. Trying to read documents...');
    const querySnapshot = await getDocs(collection(db, testCollection));
    console.log(`✅ Read ${querySnapshot.size} documents.`);
    
    console.log('3. Trying to clean up...');
    await deleteDoc(doc(db, testCollection, docRef.id));
    console.log('✅ Document deleted.');
    
    console.log('\n🎉 Firebase connection is SUCCESSFUL and fully working! 🎉');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Firebase connection FAILED:');
    console.error(error);
    process.exit(1);
  }
}

testConnection();
