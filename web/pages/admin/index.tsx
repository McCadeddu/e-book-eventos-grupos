// web/pages/admin/index.tsx

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main
      style={{
        padding: "3rem",
        maxWidth: "900px",
        margin: "0 auto",
        background: "#f5f7f9",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ color: "#371900", marginBottom: "0.5rem" }}>
        🎛 Painel PASCOM
      </h1>

      <p style={{ color: "#3e4647", marginBottom: "2.5rem" }}>
        Área interna para organizar, revisar e publicar a agenda pastoral
        dos grupos e eventos da Comunidade Missionária de Villaregia – BH.
      </p>

      {/* ===== PRODUÇÃO ===== */}
      <section
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          marginBottom: "2rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#4bbbc8" }}>📝 Produção pastoral</h2>

        <ul>
          <li>
            <Link href="/admin/grupos">
              Gerir grupos e encontros
            </Link>
          </li>
        </ul>
      </section>

      {/* ===== PUBLICAÇÃO ===== */}
      <section
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          marginBottom: "2rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#ff6136" }}>📘 Publicação</h2>

        <ul>
          <li>
            <Link href="/livro" target="_blank">
              Ver e-book público
            </Link>
          </li>
          <li>
            <Link href="/admin/preview">
              Pré-visualizar materiais (panfletos)
            </Link>
          </li>
          <li>
            <Link href="/admin/pdf">
              Gerar PDFs
            </Link>
          </li>
        </ul>
      </section>

      {/* ===== CONTROLE ===== */}
      <section
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#548287" }}>🔍 Revisão e controle</h2>

        <p style={{ fontSize: "0.95rem", color: "#3e4647" }}>
          Nesta fase, verifique se:
        </p>

        <ul style={{ fontSize: "0.95rem" }}>
          <li>✔ todos os encontros têm data e local</li>
          <li>✔ os eventos especiais estão corretos</li>
          <li>✔ o e-book reflete fielmente a agenda</li>
        </ul>
      </section>
    </main>
  );
}
