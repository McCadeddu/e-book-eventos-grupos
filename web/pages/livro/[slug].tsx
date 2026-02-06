// web/pages/livro/[slug].tsx

import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";

import { lerGrupos, lerGrupoPorSlug, Grupo } from "../../lib/grupos";
import { lerEncontrosPorGrupo } from "../../lib/encontros";
import { ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { Encontro } from "../../lib/encontros-utils";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {
  grupo: Grupo;
  grupos: Grupo[];
  encontros: Encontro[];
};

export default function CapituloLivro({
  grupo,
  grupos,
  encontros,
}: Props) {
  const router = useRouter();
  const [animando, setAnimando] = useState(true);

  useEffect(() => {
    setAnimando(true);
    const timer = setTimeout(() => setAnimando(false), 300);
    return () => clearTimeout(timer);
  }, [router.asPath]);

  const encontrosOrdenados = ordenarEncontrosPorData(encontros);

    const coresCMV = [
        "#4bbbc8", // principal
        "#ff6136", // secundário
        "#443205", // secundário II (corrigido – bom contraste)
        "#c77e4a", // núcleo 1
        "#548287", // núcleo 2
        "#725e50", // núcleo 3
    ];

    function corDoGrupo(index: number) {
        return coresCMV[index % coresCMV.length];
    }

    // cor do grupo atual (baseada na posição na lista geral)
    const indiceGrupoAtual = grupos.findIndex(g => g.id === grupo.id);
    const corGrupoAtual = corDoGrupo(indiceGrupoAtual);

  return (
      <main
          style={{
              display: "flex",
              minHeight: "100vh",
              background: "#fdfcf8",
              paddingLeft: "4rem", // 👈 espaço para as abas
          }}
      >
          {/* ===== ÍNDICE LATERAL (ABAS DO LIVRO) ===== */}
          <aside
              style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  height: "100vh",
                  padding: "0.5rem",
                  backgroundColor: "#fdfcf8",
                  zIndex: 10,
                  overflowY: "auto",
              }}
          >
              {grupos.map((g, index) => {
                  const ativo = g.id === grupo.id;

                  return (
                      <Link key={g.id} href={`/livro/${g.slug}`}>
                          <span
                              style={{
                                  display: "block",
                                  writingMode: "vertical-rl",
                                  transform: "rotate(180deg)",
                                  margin: "0.4rem 0",
                                  padding: "0.45rem 0.3rem",
                                  borderRadius: "6px",
                                  backgroundColor: corDoGrupo(index),
                                  color: "#ffffff",
                                  fontSize: "0.75rem",
                                  fontWeight: ativo ? 700 : 500,
                                  opacity: ativo ? 1 : 0.75,
                                  border: ativo ? "2px solid #3e4647" : "none",
                                  whiteSpace: "nowrap",
                                  cursor: "pointer",
                              }}
                          >
                              {g.nome}
                          </span>
                      </Link>
                  );
              })}
          </aside>

      {/* ===== LIVRO ABERTO ===== */}
      <section
        style={{
          flex: 1,
          padding: "3rem",
          maxWidth: "1000px",
          display: "flex",
          gap: "3rem",
          transition: "all 0.35s ease",
          opacity: animando ? 0 : 1,
          transform: animando ? "translateX(60px)" : "translateX(0)",
        }}
      >
        {/* ===== PÁGINA ESQUERDA ===== */}
              <div
                  style={{
                      flex: 1,
                      padding: "2rem",
                      borderRight: "1px solid #e0ddd7",
                      backgroundColor: corGrupoAtual,
                      color: "#ffffff",
                      borderRadius: "8px",
                  }}
              >
          <h1 style={{ marginBottom: "0.25rem" }}>{grupo.nome}</h1>
          <p style={{ marginTop: 0, fontStyle: "italic" }}>
            {grupo.faixa_etaria}
          </p>
        
          <p style={{ marginTop: "1.5rem" }}>{grupo.descricao}</p>

          <h2 style={{ marginTop: "2.5rem" }}>Objetivo do Ano</h2>
          <p>{grupo.objetivo_ano}</p>

          <h2 style={{ marginTop: "2.5rem" }}>Equipe de Responsáveis</h2>
          <ul>
            {grupo.equipe.map((nome) => (
              <li key={nome}>{nome}</li>
            ))}
          </ul>

          <h2 style={{ marginTop: "2.5rem" }}>Convite</h2>
          <p>{grupo.convite_final}</p>
        </div>

        {/* ===== PÁGINA DIREITA ===== */}
              <div style={{ flex: 1, paddingLeft: "2rem" }}>
                  <p style={{ marginTop: 0, marginBottom: "1rem" }}>
                      <Link
                          href="/livro/calendario"
                          style={{
                              textDecoration: "none",
                              color: "#3e4647",
                              fontSize: "0.9rem",
                          }}
                      >
                          ← Voltar ao calendário anual
                      </Link>
                  </p>

                  <h2>Agenda dos Encontros</h2>

          {encontrosOrdenados.length === 0 && (
            <p>Nenhum encontro cadastrado.</p>
          )}

          <ul>
            {encontrosOrdenados.map((encontro) => (
              <li key={encontro.id} style={{ marginBottom: "0.6rem" }}>
                <strong>
                  {encontro.data_legivel ||
                    encontro.data_inicio
                      .split("-")
                      .reverse()
                      .join("/")}
                </strong>

                {encontro.data_fim &&
                  ` – ${encontro.data_fim
                    .split("-")
                    .reverse()
                    .join("/")}`}

                {encontro.titulo && ` — ${encontro.titulo}`}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}

/**
 * 🔹 Gera os capítulos do livro
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const grupos = lerGrupos();

  const paths = grupos
    .filter((g) => typeof g.slug === "string" && g.slug.length > 0)
    .map((g) => ({
      params: { slug: g.slug },
    }));

  return {
    paths,
    fallback: false,
  };
};

/**
 * 🔹 Dados do capítulo (livro público)
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;

  const grupo = lerGrupoPorSlug(slug);
  if (!grupo) {
    return { notFound: true };
  }

  const grupos = lerGrupos();
  const encontros = lerEncontrosPorGrupo(grupo.id);

  return {
    props: {
      grupo,
      grupos,
      encontros,
    },
    revalidate: 60,
  };
};
