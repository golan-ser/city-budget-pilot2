import React, { useRef } from "react";

type Props = { tabarId: number | string; documents: any[] };

export default function TabarDocuments({ tabarId, documents }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/tabarim/${tabarId}/document`, {
      method: "POST",
      body: formData,
    });
    window.location.reload();
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">מסמכים</h2>
      <button
        className="bg-blue-600 hover:bg-blue-800 text-white px-4 py-2 rounded-xl mb-4"
        onClick={() => inputRef.current?.click()}
      >
        העלה מסמך
      </button>
      <input type="file" ref={inputRef} className="hidden" onChange={handleUpload} />
      <ul>
        {documents.map((doc: any) => (
          <li key={doc.id}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
              {doc.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
