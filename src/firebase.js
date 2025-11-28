// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
	apiKey: "AIzaSyB96cFTdBBW6ohFNI-ghJ-Hdr9X7QujA-U",
	authDomain: "deltahacks-50bd9.firebaseapp.com",
	projectId: "deltahacks-50bd9",
	storageBucket: "deltahacks-50bd9.appspot.com",
	messagingSenderId: "443400938540",
	appId: "1:443400938540:web:db4704bb42d134e8b19d89",
	measurementId: "G-667ZNVD8KG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;