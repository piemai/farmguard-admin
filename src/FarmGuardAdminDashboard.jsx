import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FarmGuardAdminDashboard() {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);

  const [tempHistory, setTempHistory] = useState([]);
  const [humHistory, setHumHistory] = useState([]);

  const [connected, setConnected] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  // ================= FIREBASE =================
  useEffect(() => {
    const tempRef = ref(db, "sensor/temperature");
    const humRef = ref(db, "sensor/humidity");

    onValue(tempRef, (snap) => {
      const val = snap.val() || 0;

      setTemperature(val);
      setConnected(true);

      setTempHistory((prev) => {
        const updated = [...prev, { value: val }];

        if (updated.length > 10) {
          updated.shift();
        }

        return updated;
      });
    });

    onValue(humRef, (snap) => {
      const val = snap.val() || 0;

      setHumidity(val);

      setHumHistory((prev) => {
        const updated = [...prev, { value: val }];

        if (updated.length > 10) {
          updated.shift();
        }

        return updated;
      });
    });
  }, []);

  // ================= ALERT =================
  const alertActive = temperature > 35 || humidity > 75;

  // ================= SIDEBAR =================
  const navItem = (page, label) => (
    <button
      onClick={() => {
        setActivePage(page);
        setMenuOpen(false);
      }}
      className={`w-full text-left px-4 py-3 rounded-xl transition font-medium ${
        activePage === page
          ? "bg-green-600 text-white"
          : "hover:bg-green-100 text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">

      {/* MOBILE MENU BUTTON */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <div
        className={`fixed md:relative z-40 h-full w-64 bg-white shadow-xl p-6 transition-all duration-300 ${
          menuOpen ? "left-0" : "-left-72 md:left-0"
        }`}
      >
        <h2 className="text-2xl font-bold text-green-700 mb-8">
          🌿 FarmGuard
        </h2>

        <nav className="space-y-3">
          {navItem("dashboard", "🏠 Dashboard")}
          {navItem("live", "📡 Live Sensors")}
          {navItem("alerts", "⚠ Alerts")}
          {navItem("history", "📈 History")}
          {navItem("settings", "⚙ Settings")}
        </nav>

        {/* STATUS */}
        <div className="mt-10 p-4 bg-green-50 rounded-2xl">
          <p className="text-sm text-gray-500">System Status</p>

          <div className="flex items-center gap-2 mt-2">
            <span
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-red-500"
              }`}
            ></span>

            <p className="font-bold text-green-700">
              {connected ? "ONLINE" : "OFFLINE"}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 p-6">

        {/* HEADER */}
        <div className="mb-8 mt-12 md:mt-0">
          <h1 className="text-4xl font-extrabold text-green-800">
            FarmGuard Dashboard
          </h1>

          <p className="text-green-600">
            Smart Agriculture Monitoring System
          </p>
        </div>

        {/* ================= DASHBOARD ================= */}
        {activePage === "dashboard" && (
          <>
            {/* CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

              {/* TEMP CARD */}
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h2 className="text-gray-600 font-semibold">
                  🌡 Temperature
                </h2>

                <p className="text-5xl font-bold text-orange-500 mt-4">
                  {temperature}°C
                </p>

                <div className="w-full bg-orange-100 rounded-full h-3 mt-5">
                  <div
                    className="bg-orange-500 h-3 rounded-full"
                    style={{
                      width: `${Math.min((temperature / 50) * 100, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* HUMIDITY CARD */}
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h2 className="text-gray-600 font-semibold">
                  💧 Humidity
                </h2>

                <p className="text-5xl font-bold text-blue-500 mt-4">
                  {humidity}%
                </p>

                <div className="w-full bg-blue-100 rounded-full h-3 mt-5">
                  <div
                    className="bg-blue-500 h-3 rounded-full"
                    style={{
                      width: `${Math.min(humidity, 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* GRAPHS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* TEMP GRAPH */}
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h2 className="font-bold text-xl mb-4">
                  📈 Temperature Trend
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tempHistory}>
                    <XAxis />
                    <YAxis />
                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* HUM GRAPH */}
              <div className="bg-white p-6 rounded-3xl shadow-lg">
                <h2 className="font-bold text-xl mb-4">
                  💧 Humidity Trend
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={humHistory}>
                    <XAxis />
                    <YAxis />
                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ================= LIVE ================= */}
        {activePage === "live" && (
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-6">
              📡 Live Sensor Monitoring
            </h2>

            <div className="space-y-5">

              <div className="flex justify-between text-lg">
                <span>Temperature</span>

                <span className="font-bold text-orange-500">
                  {temperature}°C
                </span>
              </div>

              <div className="flex justify-between text-lg">
                <span>Humidity</span>

                <span className="font-bold text-blue-500">
                  {humidity}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= ALERTS ================= */}
        {activePage === "alerts" && (
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-6">
              ⚠ Alert Center
            </h2>

            {alertActive ? (
              <div className="bg-red-50 border border-red-300 p-5 rounded-2xl">
                <p className="text-red-700 font-bold text-xl">
                  WARNING DETECTED
                </p>

                <p className="text-red-500 mt-2">
                  Temperature or humidity exceeded safe level.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-300 p-5 rounded-2xl">
                <p className="text-green-700 font-bold text-xl">
                  All Systems Normal
                </p>

                <p className="text-green-500 mt-2">
                  No active alerts detected.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ================= HISTORY ================= */}
        {activePage === "history" && (
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-6">
              📈 Sensor History
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div>
                <h3 className="font-semibold mb-3">
                  Temperature History
                </h3>

                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={tempHistory}>
                    <XAxis />
                    <YAxis />
                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f97316"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-3">
                  Humidity History
                </h3>

                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={humHistory}>
                    <XAxis />
                    <YAxis />
                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ================= SETTINGS ================= */}
        {activePage === "settings" && (
          <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold text-green-700 mb-6">
              ⚙ System Settings
            </h2>

            <div className="space-y-4 text-gray-700">

              <div className="flex justify-between">
                <span>Device</span>
                <span className="font-bold">ESP32</span>
              </div>

              <div className="flex justify-between">
                <span>Sensor</span>
                <span className="font-bold">DHT22</span>
              </div>

              <div className="flex justify-between">
                <span>Database</span>
                <span className="font-bold">
                  Firebase RTDB
                </span>
              </div>

              <div className="flex justify-between">
                <span>Connection</span>
                <span className="font-bold text-green-600">
                  Real-time
                </span>
              </div>

              <div className="flex justify-between">
  <span>Status</span>

    <span
    className={`font-bold ${
      connected ? "text-green-600" : "text-red-600"
    }`}
  >
    {connected ? "Active" : "Offline"}
  </span>
</div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="text-center text-gray-500 text-sm mt-10">
          FarmGuard © 2026 • Smart Farming IoT System
        </div>
      </div>
    </div>
  );
}