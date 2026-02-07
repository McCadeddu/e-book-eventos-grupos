// web/pages/admin/grupos.tsx

import Link from "next/link";
import { Grupo } from "../../lib/grupos";
import { getGruposOrdenados } from "../../lib/db/grupos";
import { getEncontros } from "../../lib/db/encontros";
import { Encontro, ordenarEncontrosPorData } from "../../lib/encontros-utils";

import { useEffect } from "react";

import { useRouter } from "next/router";

import { alertasDoEncontro } from "../../lib/alertas";

function labelData(encontro: Encontro): string {
    if (encontro.data_legivel && encontro.data_legivel.trim() !== "") {
        return encontro.data_legivel;
    }

    if (encontro.data_inicio && encontro.data_fim) {
        return `${encontro.data_inicio
            .split("-")
            .reverse()
            .join("/")} – ${encontro.data_fim
                .split("-")
                .reverse()
                .join("/")}`;
    }

    if (encontro.data_inicio) {
        return encontro.data_inicio
            .split("-")
            .reverse()
            .join("/");
    }

    return "Data a definir";
}

type Props = {
  grupos: Grupo[];
  encontros: Encontro[];
};

export default function Home({ grupos, encontros }: Props) {
    function encontrosDoGrupo(grupoId: string) {
      return ordenarEncontrosPorData(
      encontros.filter((e) => e.grupo_id === grupoId)
      );
    }
  const router = useRouter();

  async function excluirGrupo(grupoId: string, nomeGrupo: string) {
    const confirmado = window.confirm(
      `⚠️ ATENÇÃO!\n\nVocê está prestes a excluir o grupo:\n"${nomeGrupo}"\n\nTodos os encontros/eventos deste grupo também serão apagados.\n\nDeseja continuar?`
    );

    if (!confirmado) return;

    try {
      const resposta = await fetch("/api/grupos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupoId }),
      });

      const resultado = await resposta.json();

      if (resultado.sucesso) {
        alert("✅ Grupo excluído com sucesso.");
        router.replace(router.asPath);
      } else {
        alert("❌ Erro ao excluir o grupo.");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Erro inesperado ao excluir.");
    }
  }

  async function moverGrupo(grupoId: string, direcao: "up" | "down") {
      try {
          const resposta = await fetch("/api/grupos/ordenar", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ grupoId, direcao }),
          });

          const resultado = await resposta.json();

            if (resultado.sucesso) {
                router.replace(router.asPath);
            } else {
                alert("❌ Não foi possível alterar a ordem.");
            }
      } catch (error) {
            console.error(error);
            alert("❌ Erro ao alterar a ordem.");
      }
  }

    useEffect(() => {
        if (typeof window === "undefined") return;

        const hash = window.location.hash;
        if (!hash) return;

        const id = hash.replace("#", "");
        const el = document.getElementById(id);

        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [grupos]);

 return (
  <main
    style={{
      padding: "2.5rem",
      maxWidth: "1200px",
      margin: "0 auto",
      background: "#f5f7f9",
    }}
  >
    <div style={{ display: "flex", gap: "2rem" }}>
      
      {/* ===== ÍNDICE LATERAL (MARCADOR DE LIVRO) ===== */}
      <aside
        style={{
          width: "220px",
          position: "sticky",
          top: "2rem",
          alignSelf: "flex-start",
        }}
      >
        <h3 style={{ color: "#0b5c6b" }}>Grupos</h3>
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {grupos.map((grupo) => (
            <li key={grupo.id} style={{ marginBottom: "0.5rem" }}>
              <a
                href={`#grupo-${grupo.slug}`}
                style={{
                  color: "#0b5c6b",
                  textDecoration: "none",
                  fontSize: "0.95rem",
                }}
              >
                ▸ {grupo.nome}
              </a>
            </li>
          ))}
        </ul>
        <hr style={{ margin: "1.5rem 0" }} />

        <h4 style={{ color: "#0b5c6b" }}>Publicação</h4>

        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            <li>
                <Link href="/livro" target="_blank">
                    📘 Ver e-book (público)
                </Link>
            </li>

            <li style={{ marginTop: "0.5rem" }}>
                <Link href="/admin/preview">
                    👁 Pré-visualizar e-book
                </Link>
            </li>

            <li style={{ marginTop: "0.5rem" }}>
                <Link href="/admin/pdf">
                    🖨 Gerar PDFs
                </Link>
            </li>
        </ul>

      </aside>

      {/* ===== CONTEÚDO PRINCIPAL ===== */}
      <div style={{ flex: 1 }}>
        <h1 style={{ color: "#371900", marginBottom: "0.5rem" }}>
          Agenda dos Grupos CMV-BH – 2026
        </h1>

        <p style={{ maxWidth: "700px", color: "rgb(146, 53, 0)" }}>
          Esta agenda reúne os grupos da Comunidade Missionária de Villaregia
          em Belo Horizonte, acompanhando a vida pastoral, os encontros
          e os eventos ao longo do ano.
        </p>

        <p>
          <Link href="/grupos/novo">
            ➕ Criar novo grupo</Link>
        </p>

        <hr />

        {grupos.map((grupo) => (
          <section
            id={`grupo-${grupo.slug}`}
            key={grupo.id}
            style={{
              background: "#fff4d4f1",
              borderRadius: "10px",
              padding: "2rem",
              marginBottom: "2.5rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            }}
          >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "1rem",
                    }}
                >
                    <h2 style={{ color: "#3c8a97", margin: 0 }}>
                        {grupo.nome}
                    </h2>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                            title="Mover para cima"
                            onClick={() => moverGrupo(grupo.id, "up")}
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                            }}
                        >
                            ⬆️
                        </button>

                        <button
                            title="Mover para baixo"
                            onClick={() => moverGrupo(grupo.id, "down")}
                            style={{
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                fontSize: "1.1rem",
                            }}
                        >
                            ⬇️
                        </button>
                    </div>
                </div>

            <p style={{ color: "#3f3f3f", marginTop: 0 }}>
              <em>{grupo.faixa_etaria}</em>
            </p>

            <p>{grupo.descricao}</p>

            <h3 style={{ color: "#0b5c6b", marginTop: "1.5rem" }}>
              Próximos encontros
            </h3>

            <ul>
              {encontrosDoGrupo(grupo.id).length === 0 && (
                <li>Nenhum encontro cadastrado.</li>
              )}

              {encontrosDoGrupo(grupo.id).map((encontro, index) => (
                  <li key={`${encontro.id}-${index}`}>

                  <strong>{labelData(encontro)}</strong>

                  {alertasDoEncontro(encontro).length > 0 && (
                    <ul style={{ marginTop: "0.3rem", paddingLeft: "1rem" }}>
                      {alertasDoEncontro(encontro).map((alerta) => (
                        <li
                          key={alerta}
                          style={{
                            color: "#ff6136",
                            fontSize: "0.8rem",
                          }}
                        >
                          ⚠️ {alerta}
                        </li>
                      ))}
                    </ul>
                  )}

                  {encontro.titulo && ` — ${encontro.titulo}`}

                  <div style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
                    <Link
                      href={`/admin/preview/encontro/${encontro.id}`}
                      style={{ color: "#548287" }}
                    >
                      👁 Preview
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <p style={{ marginTop: "1rem" }}>
              <Link
                href={`/grupos/${grupo.slug}/novo-encontro`}
                style={{ color: "#0b5c6b" }}
              >
                ➕ Inserir novo encontro
              </Link>
            </p>

            <p style={{ marginTop: "1rem" }}>
              <Link
                href={`/grupos/${grupo.slug}/editar`}
                style={{ color: "#0b5c6b" }}
              >
                ✏️ Editar grupo
              </Link>
            </p>

            <p>
              <Link
                href={`/grupos/${grupo.slug}`}
                style={{ marginTop: "1rem", color: "#0b5c6b" }}
              >
                Editar/Escluir eventos do grupo
              </Link>
            </p>

            <p style={{ marginTop: "0.5rem" }}>
              <button
                onClick={() => excluirGrupo(grupo.id, grupo.nome)}                style={{
                  background: "transparent",
                  color: "darkred",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                🗑 Excluir grupo
              </button>
            </p>
          </section>
        ))}
      </div>
    </div>
  </main>
 );
}
/**
 * 🔹 Dados carregados no servidor
 */
export async function getStaticProps() {
    const grupos = await getGruposOrdenados();
    const encontros = await getEncontros();

    return {
        props: {
            grupos,
            encontros,
        },
        revalidate: 1,
    };
}