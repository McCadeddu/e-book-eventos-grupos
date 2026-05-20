import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminDashboard() {
  const router = useRouter();

  async function sair() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

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
        Painel PASCOM
      </h1>

      <p style={{ color: "#3e4647", marginBottom: "2.5rem" }}>
        Area interna para organizar, revisar e publicar a agenda pastoral
        dos grupos e eventos da Comunidade Missionaria de Villaregia - BH.
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={sair}
          style={{
            background: "transparent",
            border: "1px solid #d7d7d7",
            borderRadius: "999px",
            padding: "0.45rem 0.9rem",
            cursor: "pointer",
          }}
        >
          Sair da area administrativa
        </button>
      </div>

      <section
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          marginBottom: "2rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#4bbbc8" }}>Producao pastoral</h2>

        <ul>
          <li>
            <Link href="/admin/grupos">Gerir grupos e encontros</Link>
          </li>
        </ul>
      </section>

      <section
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          marginBottom: "2rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#ff6136" }}>Publicacao</h2>

        <ul>
          <li>
            <Link href="/livro" target="_blank">
              Ver e-book publico
            </Link>
          </li>
          <li>
            <Link href="/admin/preview">
              Pre-visualizar materiais (panfletos)
            </Link>
          </li>
          <li>
            <Link href="/admin/pdf">
              Gerar PDFs
            </Link>
          </li>
        </ul>
      </section>

      <section
        style={{
          background: "#ffffff",
          padding: "2rem",
          borderRadius: "14px",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#548287" }}>Revisao e controle</h2>

        <p style={{ fontSize: "0.95rem", color: "#3e4647" }}>
          Nesta fase, verifique se:
        </p>

        <ul style={{ fontSize: "0.95rem" }}>
          <li>todos os encontros tem data e local</li>
          <li>os eventos especiais estao corretos</li>
          <li>o e-book reflete fielmente a agenda</li>
        </ul>
      </section>
    </main>
  );
}
