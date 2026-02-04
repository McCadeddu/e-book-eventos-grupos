// web/pages/admin/pdf.tsx

import { useRouter } from "next/router";

export default function PdfAdmin() {
  const router = useRouter();

  return (
    <main style={{ padding: "2rem" }}>
      <p>
        <button
          onClick={() => router.push("/admin/grupos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b5c6b",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Voltar à administração
        </button>
      </p>

      <h1>🖨 Geração de PDFs</h1>

      <p>
        Esta área permitirá gerar:
      </p>

      <ul>
        <li>📄 Agenda anual (PDF)</li>
        <li>📄 Capítulos por grupo</li>
        <li>📄 Panfletos de encontros</li>
      </ul>

      <p style={{ marginTop: "1.5rem", opacity: 0.7 }}>
        ⏳ Em desenvolvimento.
      </p>
    </main>
  );
}
