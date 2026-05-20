import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./Login";
import FarmGuardAdminDashboard from "./FarmGuardAdminDashboard";

// ✅ ONLY THESE USERS CAN ENTER
const ADMIN_EMAILS = ["admin@farmguard.com"];

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

  // ❌ NOT LOGGED IN → LOGIN PAGE
  if (!user) {
    return <Login />;
  }

  // ❌ LOGGED IN BUT NOT ADMIN → BLOCK ACCESS
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

  // ✅ ADMIN ONLY
  return (
    <>
      <div className="fixed top-4 right-4 z-50">
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