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

    // LAST UPDATE (ESP32 heartbeat)
    onValue(lastRef, (snap) => {
      const t = snap.val();
      setLastUpdate(t);
    });

    // ================= TEMP =================
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

    // ================= HUMIDITY =================
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

    // ================= SOIL =================
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

  // ================= ESP32 OFFLINE DETECTION =================
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

      // 🔴 FORCE NO DATA WHEN OFFLINE
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
    (temperature > tempHigh || humidity > humHigh || soil < soilDry);

  const nav = (id, label) => (
    <button
      onClick={() => setActivePage(id)}
      className={`w-full text-left px-4 py-3 rounded-xl font-medium transition ${
        activePage === id ? "bg-green-600 text-white" : "hover:bg-green-100"
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
      <p className="text-3xl font-bold mt-2">
        {value ?? "NO DATA"}
      </p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-green-50">
      {/* SIDEBAR */}
      <div className="w-64 bg-white shadow-xl p-5 flex flex-col">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          🌿 FarmGuard
        </h1>

        <div className="flex-1 space-y-2">
          {nav("dashboard", "🏠 Dashboard")}
          {nav("live", "📡 Live Sensors")}
          {nav("alerts", "⚠ Alerts")}
          {nav("history", "📈 History")}
          {nav("notifications", "🔔 Notification Levels")}
          {nav("settings", "⚙ Settings")}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-6">
        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <>
            <h1 className="text-3xl font-bold mb-6">
              🌾 Dashboard Overview
            </h1>

            <div className="grid grid-cols-3 gap-4 mb-6">
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

            <div className="grid grid-cols-3 gap-4">
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
                <div key={i} className="bg-white p-4 rounded-2xl shadow">
                  <h3 className="font-bold mb-2">{g.title}</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={g.data}>
                      <XAxis dataKey="time" />
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
            <p>
              🌡 Temperature: <b>{temperature ?? "NO DATA"}</b>
            </p>
            <p>
              💧 Humidity: <b>{humidity ?? "NO DATA"}</b>
            </p>
            <p>
              🌱 Soil: <b>{soil ?? "NO DATA"}</b>
            </p>
          </div>
        )}

        {/* ALERTS */}
        {activePage === "alerts" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold text-red-600">
              ⚠ Alerts
            </h2>
            <p className="mt-3">
              {alertActive
                ? "🚨 ALERT TRIGGERED"
                : "🟢 All systems normal"}
            </p>
          </div>
        )}

        {/* HISTORY */}
        {activePage === "history" && (
          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="text-2xl font-bold mb-4">📈 History</h2>
            {logs.map((l, i) => (
              <div
                key={i}
                className="flex justify-between border-b p-2"
              >
                <span>{l.type}</span>
                <span>{l.value}</span>
                <span>{l.status}</span>
                <span className="text-gray-400">{l.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* NOTIFICATION LEVELS */}
        {activePage === "notifications" && (
          <div className="bg-white p-6 rounded-2xl shadow space-y-4">
            <h2 className="text-2xl font-bold">
              🔔 Notification Levels
            </h2>

            <div className="border p-4 rounded-xl flex justify-between">
              <span>🌡 Temperature HIGH</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => updateTemp(tempHigh - 1)}
                  className="bg-red-500 text-white px-3 rounded"
                >
                  -
                </button>
                <span>{tempHigh}°C</span>
                <button
                  onClick={() => updateTemp(tempHigh + 1)}
                  className="bg-green-500 text-white px-3 rounded"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border p-4 rounded-xl flex justify-between">
              <span>💧 Humidity HIGH</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => updateHum(humHigh - 1)}
                  className="bg-red-500 text-white px-3 rounded"
                >
                  -
                </button>
                <span>{humHigh}%</span>
                <button
                  onClick={() => updateHum(humHigh + 1)}
                  className="bg-green-500 text-white px-3 rounded"
                >
                  +
                </button>
              </div>
            </div>

            <div className="border p-4 rounded-xl flex justify-between">
              <span>🌱 Soil DRY</span>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => updateSoil(soilDry - 1)}
                  className="bg-red-500 text-white px-3 rounded"
                >
                  -
                </button>
                <span>{soilDry}%</span>
                <button
                  onClick={() => updateSoil(soilDry + 1)}
                  className="bg-green-500 text-white px-3 rounded"
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
            <h2 className="text-2xl font-bold">⚙ Settings</h2>
            <p>Device: ESP32</p>
            <p>Database: Firebase</p>
          </div>
        )}
      </div>
    </div>
  );
}