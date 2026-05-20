import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCV2soceMd3MRgSsoja0XRV-mJxBltyWnI",
  authDomain: "farmguard-78439.firebaseapp.com",
  databaseURL:
    "https://farmguard-78439-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "farmguard-78439",
  storageBucket: "farmguard-78439.firebasestorage.app",
  messagingSenderId: "370464069273",
  appId: "1:370464069273:android:2aa5e60f768483539a8a08",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);