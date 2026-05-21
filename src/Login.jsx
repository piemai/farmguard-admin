import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-3xl shadow-xl w-96"
      >
        <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
          🌿 FarmGuard Admin
        </h1>

        <input
          className="w-full p-3 border rounded-xl mb-4"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-3 border rounded-xl mb-4"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm mb-3">{error}</p>
        )}

        <button
          className="w-full bg-green-600 text-white py-3 rounded-xl"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}