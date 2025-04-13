import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// isi konfigurasi sesuai dengan konfigurasi firebase kalian
const firebaseConfig = {
  apiKey: "AIzaSyCmQ7rtoF2T8ChuJz_bA9vNPCRSs5lMu58",
  authDomain: "todolist-38602.firebaseapp.com",
  projectId: "todolist-38602",
  storageBucket: "todolist-38602.firebasestorage.app",
  messagingSenderId: "422153419425",
  appId: "1:422153419425:web:9fbe14f51d13f1cc37cee0",
  measurementId: "G-6BMCZD7JKY"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

