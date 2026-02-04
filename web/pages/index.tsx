// web/pages/index.tsx

import Link from "next/link";

export default function HomePublica() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fdfcf8",
      }}
    >
      <section style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", color: "#4bbbc8" }}>
          Agenda CMV-BH
        </h1>

        <p style={{ marginBottom: "2rem" }}>
          Agenda pastoral da Comunidade Missionária de Villaregia
        </p>

        <Link href="/livro" style={{ fontSize: "1rem", color: "#ff6136" }}>
          📘 Abrir agenda pública
        </Link>

        <br /><br />

        <Link href="/admin" style={{ fontSize: "1rem", color: "#4bbbc8" }}>
          Área interna PASCOM
        </Link>
      </section>
    </main>
  );
}
