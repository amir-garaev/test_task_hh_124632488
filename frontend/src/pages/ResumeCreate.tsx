import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Resume, ResumeCreate } from "../types/models";
import ResumeForm from "../components/ResumeForm";

export default function ResumeCreate() {
  const navigate = useNavigate();

  async function createResume(payload: ResumeCreate) {
    const created = await api<Resume>("/resume", { method: "POST", body: payload });
    navigate(`/resumes/${created.id}`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Добавить резюме</h2>
        <button
          onClick={() => navigate("/resumes")}
          className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
        >
          Назад
        </button>
      </div>

      <div className="bg-white border rounded p-4">
        <ResumeForm onSave={createResume} />
      </div>
    </div>
  );
}
