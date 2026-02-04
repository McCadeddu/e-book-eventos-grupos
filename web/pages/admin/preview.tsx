// web/pages/admin/preview.tsx

import { useRouter } from "next/router";

export default function Preview() {
  const router = useRouter();
  
  return (
    <main style={{ padding: "2rem" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => router.push("/admin/grupos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b5c6b",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.95rem",
          }}
        >
          ← Voltar à administração dos grupos
        </button>
      </p>

      <h1>👁 Pré-visualização</h1>

      <p>
        Esta área mostra como os conteúdos aparecerão
        no e-book e nos materiais de divulgação.
      </p>

      <h2>📘 E-book</h2>

      <iframe
        src="/livro"
        style={{
          width: "100%",
          height: "80vh",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />
    </main>
  );
}
