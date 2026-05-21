import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./Login";
import FarmGuardAdminDashboard from "./FarmGuardAdminDashboard";

const ADMIN_EMAILS = ["admin@farmguard.com"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // ================= INTERNET CHECK =================
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // ================= AUTH STATE =================
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);

      if (u && ADMIN_EMAILS.includes(u.email)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // ❌ OFFLINE LOGIN BLOCK MESSAGE
  if (isOffline && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-yellow-600">
            No Internet Connection
          </h1>
          <p className="text-gray-600 mt-2">
            Login requires internet connection (Firebase Auth).
          </p>
        </div>
      </div>
    );
  }

  // ❌ NOT LOGGED IN
  if (!user) {
    return <Login />;
  }

  // ❌ NOT ADMIN
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">
            Access Denied
          </h1>
          <p className="text-gray-600 mt-2">
            You are not authorized to access this dashboard.
          </p>

          <button
            onClick={() => signOut(auth)}
            className="mt-5 bg-red-500 text-white px-4 py-2 rounded-xl"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ✅ ADMIN DASHBOARD
  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {isOffline && (
          <span className="bg-yellow-500 text-white px-3 py-1 rounded-xl text-sm">
            Offline Mode
          </span>
        )}

        <button
          onClick={() => signOut(auth)}
          className="bg-red-500 text-white px-4 py-2 rounded-xl"
        >
          Logout
        </button>
      </div>

      <FarmGuardAdminDashboard />
    </>
  );
}