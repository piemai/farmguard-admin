// FarmGuardAdminDashboard.jsx

import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
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
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [soil, setSoil] = useState(null);

  const [connected, setConnected] = useState(false);

  const [tempHistory, setTempHistory] = useState([]);
  const [humHistory, setHumHistory] = useState([]);
  const [soilHistory, setSoilHistory] = useState([]);

  const [logs, setLogs] = useState([]);

  const [activePage, setActivePage] = useState("dashboard");

  // ================= MOBILE SIDEBAR =================
  const [mobileMenu, setMobileMenu] = useState(false);

  // ================= THRESHOLDS =================
  const [tempHigh, setTempHigh] = useState(35);
  const [humHigh, setHumHigh] = useState(75);
  const [soilDry, setSoilDry] = useState(30);

  const [loaded, setLoaded] = useState(false);

  // ================= LAST UPDATE TRACKING =================
  const [lastUpdate, setLastUpdate] = useState(null);

  // ================= LOAD SETTINGS =================
  useEffect(() => {
    const settingsRef = ref(db, "settings/thresholds");

    onValue(settingsRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      setTempHigh(data.tempHigh ?? 35);
      setHumHigh(data.humHigh ?? 75);
      setSoilDry(data.soilDry ?? 30);

      setLoaded(true);
    });
  }, []);

  // ================= SAVE SETTINGS =================
  const saveSettings = (t, h, s) => {
    if (!loaded) return;

    set(ref(db, "settings/thresholds"), {
      tempHigh: t,
      humHigh: h,
      soilDry: s,
    });
  };

  const updateTemp = (v) => {
    const val = Math.max(0, v);
    setTempHigh(val);
    saveSettings(val, humHigh, soilDry);
  };

  const updateHum = (v) => {
    const val = Math.max(0, v);
    setHumHigh(val);
    saveSettings(tempHigh, val, soilDry);
  };

  const updateSoil = (v) => {
    const val = Math.max(0, v);
    setSoilDry(val);
    saveSettings(tempHigh, humHigh, val);
  };

  // ================= SENSOR DATA =================
  useEffect(() => {
    const tempRef = ref(db, "sensor/temperature");
    const humRef = ref(db, "sensor/humidity");
    const soilRef = ref(db, "sensor/soil");
    const lastRef = ref(db, "sensor/lastUpdate");

    // LAST UPDATE
    onValue(lastRef, (snap) => {
      const t = snap.val();
      setLastUpdate(t);
    });

    // TEMP
    onValue(tempRef, (snap) => {
      const val = snap.val();
      if (val == null) return;

      setTemperature(val);

      const now = new Date();

      setTempHistory((p) =>
        [...p, { value: val, time: now.toLocaleTimeString() }].slice(-10)
      );

      setLogs((p) =>
        [
          {
            type: "🌡 Temperature",
            value: `${val}°C`,
            status: val > tempHigh ? "🔥 HIGH" : "🟢 NORMAL",
            time: now.toLocaleString(),
          },
          ...p,
        ].slice(0, 30)
      );
    });

    // HUMIDITY
    onValue(humRef, (snap) => {
      const val = snap.val();
      if (val == null) return;

      setHumidity(val);

      const now = new Date();

      setHumHistory((p) =>
        [...p, { value: val, time: now.toLocaleTimeString() }].slice(-10)
      );

      setLogs((p) =>
        [
          {
            type: "💧 Humidity",
            value: `${val}%`,
            status: val > humHigh ? "⚠ HIGH" : "🟢 NORMAL",
            time: now.toLocaleString(),
          },
          ...p,
        ].slice(0, 30)
      );
    });

    // SOIL
    onValue(soilRef, (snap) => {
      const val = snap.val();
      if (val == null) return;

      setSoil(val);

      const now = new Date();

      setSoilHistory((p) =>
        [...p, { value: val, time: now.toLocaleTimeString() }].slice(-10)
      );

      setLogs((p) =>
        [
          {
            type: "🌱 Soil Moisture",
            value: `${val}%`,
            status: val < soilDry ? "🌵 DRY" : "🟢 NORMAL",
            time: now.toLocaleString(),
          },
          ...p,
        ].slice(0, 30)
      );
    });
  }, [tempHigh, humHigh, soilDry]);

  // ================= OFFLINE DETECTION =================
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastUpdate) {
        setConnected(false);
        setTemperature(null);
        setHumidity(null);
        setSoil(null);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const isOnline = now - lastUpdate <= 10;

      setConnected(isOnline);

      if (!isOnline) {
        setTemperature(null);
        setHumidity(null);
        setSoil(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const alertActive =
    connected &&
    (temperature > tempHigh ||
      humidity > humHigh ||
      soil < soilDry);

  const nav = (id, label) => (
    <button
      onClick={() => {
        setActivePage(id);
        setMobileMenu(false);
      }}
      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${
        activePage === id
          ? "bg-green-600 text-white"
          : "hover:bg-green-100"
      }`}
    >
      {label}
    </button>
  );

  const statCard = (title, value, icon, color) => (
    <div
      className={`p-5 rounded-3xl shadow text-white bg-gradient-to-br ${color}`}
    >
      <p className="text-sm opacity-90">
        {icon} {title}
      </p>

      <p className="text-2xl md:text-3xl font-bold mt-2 break-words">
        {value ?? "NO DATA"}
      </p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-green-50">
      {/* MOBILE OVERLAY */}
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed lg:static top-0 left-0 z-50
          h-full w-72 bg-white shadow-xl p-5 flex flex-col
          transform transition-transform duration-300
          ${mobileMenu ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-green-700">
            🌿 FarmGuard
          </h1>

          <button
            onClick={() => setMobileMenu(false)}
            className="lg:hidden text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-2">
          {nav("dashboard", "🏠 Dashboard")}
          {nav("live", "📡 Live Sensors")}
          {nav("alerts", "⚠ Alerts")}
          {nav("history", "📈 History")}
          {nav("notifications", "🔔 Notification Levels")}
          {nav("settings", "⚙ Settings")}
        </div>

        <div className="mt-6">
          <div
            className={`p-3 rounded-xl text-center font-bold ${
              connected
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {connected ? "🟢 ONLINE" : "🔴 OFFLINE"}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 w-full">
        {/* TOPBAR MOBILE */}
        <div className="lg:hidden bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileMenu(true)}
            className="text-2xl"
          >
            ☰
          </button>

          <h1 className="font-bold text-green-700 text-lg">
            FarmGuard
          </h1>

          <div />
        </div>

        <div className="p-4 md:p-6">
          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
              <h1 className="text-2xl md:text-3xl font-bold mb-6">
                🌾 Dashboard Overview
              </h1>

              {/* STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {statCard(
                  "Temperature",
                  temperature,
                  "🌡",
                  "from-orange-400 to-red-500"
                )}

                {statCard(
                  "Humidity",
                  humidity,
                  "💧",
                  "from-blue-400 to-cyan-500"
                )}

                {statCard(
                  "Soil Moisture",
                  soil,
                  "🌱",
                  "from-green-400 to-emerald-600"
                )}
              </div>

              {/* CHARTS */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {[
                  {
                    title: "Temperature Trend",
                    data: tempHistory,
                    color: "#f97316",
                  },
                  {
                    title: "Humidity Trend",
                    data: humHistory,
                    color: "#3b82f6",
                  },
                  {
                    title: "Soil Trend",
                    data: soilHistory,
                    color: "#16a34a",
                  },
                ].map((g, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 rounded-2xl shadow"
                  >
                    <h3 className="font-bold mb-2">
                      {g.title}
                    </h3>

                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={g.data}>
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <Tooltip />

                        <Line
                          dataKey="value"
                          stroke={g.color}
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* LIVE */}
          {activePage === "live" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-4">
                📡 Live Sensors
              </h2>

              <div className="space-y-4 text-lg">
                <p>
                  🌡 Temperature:{" "}
                  <b>{temperature ?? "NO DATA"}</b>
                </p>

                <p>
                  💧 Humidity:{" "}
                  <b>{humidity ?? "NO DATA"}</b>
                </p>

                <p>
                  🌱 Soil: <b>{soil ?? "NO DATA"}</b>
                </p>
              </div>
            </div>
          )}

          {/* ALERTS */}
          {activePage === "alerts" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold text-red-600">
                ⚠ Alerts
              </h2>

              <p className="mt-3 text-lg">
                {alertActive
                  ? "🚨 ALERT TRIGGERED"
                  : "🟢 All systems normal"}
              </p>
            </div>
          )}

          {/* HISTORY */}
          {activePage === "history" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-4">
                📈 History
              </h2>

              <div className="space-y-3">
                {logs.map((l, i) => (
                  <div
                    key={i}
                    className="border rounded-xl p-3 flex flex-col md:flex-row md:justify-between gap-2"
                  >
                    <span className="font-semibold">
                      {l.type}
                    </span>

                    <span>{l.value}</span>

                    <span>{l.status}</span>

                    <span className="text-gray-400 text-sm">
                      {l.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activePage === "notifications" && (
            <div className="bg-white p-4 md:p-6 rounded-2xl shadow space-y-4">
              <h2 className="text-2xl font-bold">
                🔔 Notification Levels
              </h2>

              <div className="border p-4 rounded-xl flex flex-col md:flex-row md:justify-between gap-4">
                <span>🌡 Temperature HIGH</span>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => updateTemp(tempHigh - 1)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span>{tempHigh}°C</span>

                  <button
                    onClick={() => updateTemp(tempHigh + 1)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="border p-4 rounded-xl flex flex-col md:flex-row md:justify-between gap-4">
                <span>💧 Humidity HIGH</span>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => updateHum(humHigh - 1)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span>{humHigh}%</span>

                  <button
                    onClick={() => updateHum(humHigh + 1)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="border p-4 rounded-xl flex flex-col md:flex-row md:justify-between gap-4">
                <span>🌱 Soil DRY</span>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => updateSoil(soilDry - 1)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    -
                  </button>

                  <span>{soilDry}%</span>

                  <button
                    onClick={() => updateSoil(soilDry + 1)}
                    className="bg-green-500 text-white px-3 py-1 rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activePage === "settings" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h2 className="text-2xl font-bold mb-4">
                ⚙ Settings
              </h2>

              <div className="space-y-2">
                <p>Device: ESP32</p>
                <p>Database: Firebase</p>

                <p>
                  Status:{" "}
                  <span
                    className={
                      connected
                        ? "text-green-600 font-bold"
                        : "text-red-600 font-bold"
                    }
                  >
                    {connected ? "ONLINE" : "OFFLINE"}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}