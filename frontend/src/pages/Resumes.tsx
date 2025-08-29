import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";
import type { Resume, ResumePage } from "../types/models";

const PER_PAGE = 10;

export default function Resumes() {
  const [list, setList] = useState<Resume[]>([]);
  const [meta, setMeta] = useState<ResumePage["meta"] | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");          
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const debouncedQ = useDebounce(q, 300);

  async function load(p = page, query = debouncedQ) {
    try {
      const url = new URL(`/resume`, window.location.origin);
      url.searchParams.set("page", String(p));
      url.searchParams.set("per_page", String(PER_PAGE));
      if (query.trim()) url.searchParams.set("q", query.trim());
      const data = await api<ResumePage>(url.pathname + url.search);
      setList(data.items);
      setMeta(data.meta);
    } catch (e: any) {
      setErr(e.message);
      navigate("/login");
    }
  }

  useEffect(() => { load(1, debouncedQ); setPage(1); }, [debouncedQ]);
  useEffect(() => { load(page, debouncedQ); }, [page]);

  const placeholders = Math.max(0, PER_PAGE - list.length);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">Мои резюме</h2>

        <div className="flex items-center gap-2 flex-1 max-w-xl">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию…"
            className="flex-1 px-3 py-2 border rounded outline-none focus:ring focus:ring-gray-200"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="px-3 py-2 rounded border hover:bg-gray-50"
              title="Сбросить"
            >
              Сброс
            </button>
          )}
          <Link
            to="/resumes/new"
            className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800 whitespace-nowrap"
          >
            Добавить резюме
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="text-gray-500">Ничего не найдено</div>
      ) : (
        <>
          <ul className="grid gap-2">
            {list.map((r) => (
              <li key={r.id} className="bg-white border rounded hover:bg-gray-50">
                <Link
                  to={`/resumes/${r.id}`}
                  className="block w-full px-4 py-3 font-medium hover:underline"
                >
                  {r.title}
                </Link>
              </li>
            ))}
            {Array.from({ length: placeholders }).map((_, i) => (
              <li key={`ph-${i}`} className="bg-white border rounded px-4 py-3 invisible select-none">placeholder</li>
            ))}
          </ul>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta?.has_prev}
              className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
            >
              ← Назад
            </button>
            <div className="text-sm text-gray-700">
              {meta ? `${meta.page} / ${meta.total_pages}` : "— / —"}
            </div>
            <button
              onClick={() => setPage((p) => (meta?.has_next ? p + 1 : p))}
              disabled={!meta?.has_next}
              className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-100"
            >
              Вперёд →
            </button>
          </div>
        </>
      )}

      {err && <div className="text-red-600 text-sm">{err}</div>}
    </div>
  );
}

function useDebounce<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
