import React, { useEffect, useState, useCallback, useEffect as useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Resume, ResumeUpdate, ResumeRevision, ResumeRevisionPage } from "../types/models";
import { api } from "../api";
import ResumeForm from "../components/ResumeForm";

export default function ResumeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ResumeRevisionPage | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histErr, setHistErr] = useState("");

  const [selectedRev, setSelectedRev] = useState<ResumeRevision | null>(null);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api<Resume>(`/resume/${id}`);
      setResume(data);
    } catch (e: any) {
      setErr(e.message ?? "Ошибка загрузки");
      setResume(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(page = 1, per_page = 10) {
    if (!id) return;
    setHistLoading(true);
    setHistErr("");
    try {
      const data = await api<ResumeRevisionPage>(
        `/resume/${id}/history?page=${page}&per_page=${per_page}`
      );
      setHistory(data);
    } catch (e: any) {
      setHistErr(e.message ?? "Ошибка загрузки истории");
      setHistory(null);
    } finally {
      setHistLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      load();
      if (showHistory) loadHistory(1);
    }
  }, [id]);

  async function save(payload: ResumeUpdate) {
    await api<Resume>(`/resume/${id}`, { method: "PATCH", body: payload });
    await load();
    if (showHistory) await loadHistory(history?.meta.page ?? 1);
  }

  async function remove() {
    await api(`/resume/${id}`, { method: "DELETE" });
    navigate("/resumes");
  }

  async function improve() {
    const updated = await api<Resume>(`/resume/${id}/improve`, { method: "POST" });
    setResume(updated);
    if (showHistory) await loadHistory(1);
  }

  function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next) loadHistory(1);
  }

  function goHistoryPage(to: number) {
    if (!history) return;
    const p = Math.max(1, Math.min(to, history.meta.total_pages || 1));
    loadHistory(p, history.meta.per_page);
  }

  const onCloseModal = useCallback(() => setSelectedRev(null), []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseModal();
    }
    if (selectedRev) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedRev, onCloseModal]);

  if (loading) return <div>Загрузка…</div>;

  if (err) {
    return (
      <div className="grid gap-3">
        <div className="text-red-600">Ошибка: {err}</div>
        <button
          onClick={() => navigate("/resumes")}
          className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800"
        >
          Назад к списку
        </button>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="grid gap-3">
        <div>Резюме не найдено.</div>
        <button
          onClick={() => navigate("/resumes")}
          className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800"
        >
          Назад к списку
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{resume.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/resumes")}
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Назад
          </button>
          <button
            onClick={improve}
            className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800"
          >
            Улучшить
          </button>
          <button
            onClick={toggleHistory}
            className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {showHistory ? "Скрыть историю" : "История"}
          </button>
          <button
            onClick={remove}
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <ResumeForm initial={resume} onSave={save} />
      </div>

      {showHistory && (
        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">История изменений</h3>
            {history?.meta && (
              <div className="text-sm text-gray-600">
                Всего: {history.meta.total} • Стр. {history.meta.page} из {history.meta.total_pages}
              </div>
            )}
          </div>

          {histLoading && <div>Загрузка истории…</div>}
          {histErr && <div className="text-red-600">Ошибка: {histErr}</div>}

          {!histLoading && !histErr && (
            <>
              {history && history.items.length > 0 ? (
                <ul className="divide-y">
                  {history.items.map((rev) => (
                    <li
                      key={rev.id}
                      className="py-3 cursor-pointer hover:bg-gray-50 rounded"
                      onClick={() => setSelectedRev(rev)}
                      title="Открыть полную версию"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          v{rev.version}{" "}
                          <span className="text-gray-500">
                            • {new Date(rev.created_at).toLocaleString()}
                          </span>
                        </div>
                        {rev.comment && (
                          <div className="text-sm text-gray-600 italic truncate max-w-[50%]">
                            {rev.comment}
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap line-clamp-3">
                        {rev.content}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-600">Пока нет ревизий.</div>
              )}

              {history && history.meta.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => goHistoryPage((history.meta.page ?? 1) - 1)}
                    disabled={!history.meta.has_prev}
                    className={`px-3 py-2 rounded border ${
                      history.meta.has_prev ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    ← Назад
                  </button>
                  <div className="text-sm text-gray-600">
                    Стр. {history.meta.page} / {history.meta.total_pages}
                  </div>
                  <button
                    onClick={() => goHistoryPage((history.meta.page ?? 1) + 1)}
                    disabled={!history.meta.has_next}
                    className={`px-3 py-2 rounded border ${
                      history.meta.has_next ? "hover:bg-gray-50" : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    Вперёд →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedRev && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseModal}
          />
          <div className="relative z-10 w-[min(90vw,900px)] max-h-[85vh] bg-white rounded-xl shadow-2xl border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="font-semibold text-lg">
                Версия v{selectedRev.version}
                <span className="text-gray-500 font-normal">
                  {" "}
                  • {new Date(selectedRev.created_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={onCloseModal}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200"
                aria-label="Закрыть"
              >
                Закрыть
              </button>
            </div>
            {selectedRev.comment && (
              <div className="mb-3 text-sm text-gray-600 italic">
                {selectedRev.comment}
              </div>
            )}
            <div className="border rounded p-3 overflow-auto max-h-[65vh] whitespace-pre-wrap text-sm">
              {selectedRev.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
