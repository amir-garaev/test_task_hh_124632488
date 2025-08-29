import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken } from "../api";
import type { TokenResponse } from "../types/models";

export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const data = await api<TokenResponse>(`/auth/${mode}`, { method: "POST", body: { email, password } });
      setToken(data.access_token);
      navigate("/resumes");
    } catch (e: any) {
      setErr(e.message ?? "Ошибка");
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-black">
            {mode === "login" ? "Вход" : "Регистрация"}
          </h2>
        </div>

        <form onSubmit={submit} className="px-6 py-5 grid gap-3">
          <input
            className="border border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 outline-none transition"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />
          <input
            className="border border-gray-300 focus:border-black focus:ring-1 focus:ring-black rounded-lg px-3 py-2 outline-none transition"
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button
            className="mt-1 rounded-lg bg-black text-white px-3 py-2 font-medium hover:bg-gray-800 active:bg-gray-900 transition"
          >
            {mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>

          <button
            type="button"
            className="text-sm text-gray-700 hover:text-black hover:underline justify-self-start"
            onClick={()=>setMode(mode==="login" ? "register" : "login")}
          >
            {mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}
          </button>

          {err && <div className="text-sm text-red-600">{err}</div>}
        </form>
      </div>
    </div>
  );
}
