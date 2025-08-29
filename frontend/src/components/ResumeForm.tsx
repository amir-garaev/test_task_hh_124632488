import React, { useEffect, useState } from "react";
import type { ResumeCreate } from "../types/models";


interface Props {
  initial?: { title: string; content: string };
  onSave: (payload: ResumeCreate) => void | Promise<void>;
}

export default function ResumeForm({ initial, onSave }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setContent(initial?.content ?? "");
  }, [initial]);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({ title, content }); }}
      className="grid gap-3"
    >
      <input
        className="border rounded px-3 py-2"
        placeholder="Заголовок"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
      />
      <textarea
        className="border rounded px-3 py-2 min-h-[220px]"
        placeholder="Содержимое"
        value={content}
        onChange={(e)=>setContent(e.target.value)}
      />
      <button className="self-start bg-slate-900 text-white rounded px-3 py-2 hover:opacity-90">
        Сохранить
      </button>
    </form>
  );
}
