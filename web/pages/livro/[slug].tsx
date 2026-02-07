// web/pages/livro/[slug].tsx

import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";

import { Grupo } from "../../lib/grupos";
import {
    getGruposOrdenados,
    getGrupoPorSlug,
} from "../../lib/db/grupos";
import { getEncontrosPorGrupo } from "../../lib/db/encontros";
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
              padding: "0 1rem",
          }}
      >

          {/* ===== CONTEÚDO DO LIVRO (1 COLUNA) ===== */}
          <section
              style={{
                  flex: 1,
                  padding: "3rem",
                  maxWidth: "1000px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2.5rem",
                  transition: "all 0.35s ease",
                  opacity: animando ? 0 : 1,
                  transform: animando ? "translateX(60px)" : "translateX(0)",
              }}
          >
              {/* ===== NAVEGAÇÃO DO LIVRO ===== */}
              <div
                  style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "1rem",
                  }}
              >
                  <Link
                      href="/livro/calendario"
                      style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.45rem 0.9rem",
                          borderRadius: "999px",
                          backgroundColor: "#f1e5ae", // CMV secundário II
                          color: "#3e4647",          // texto núcleo escuro
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          textDecoration: "none",
                      }}
                  >
                      Voltar ao Calendário anual
                  </Link>
              </div>

              {/* ===== APRESENTAÇÃO DO GRUPO ===== */}
              <div
                  style={{
                      padding: "2rem",
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

              {/* ===== AGENDA DOS ENCONTROS ===== */}
              <section
                  style={{
                      backgroundColor: "#ffffff",
                      padding: "2rem",
                      borderRadius: "8px",
                  }}
              >
                  
                  <h2
                      style={{
                          marginBottom: "1.25rem",
                          color: "#3e4647",
                          fontSize: "1.25rem",
                      }}
                  >
                      Agenda dos Encontros
                  </h2>

                  {encontrosOrdenados.length === 0 && (
                      <p style={{ color: "#8d908f" }}>Nenhum encontro cadastrado.</p>
                  )}

                  <ul style={{ paddingLeft: "1rem" }}>
                      {encontrosOrdenados.map((encontro) => (
                          <li key={encontro.id} style={{ marginBottom: "1rem" }}>
                              <div>
                                  <strong>
                                      {encontro.data_legivel ||
                                          encontro.data_inicio
                                              .split("-")
                                              .reverse()
                                              .join("/")}
                                  </strong>
                                  {encontro.titulo && ` — ${encontro.titulo}`}
                              </div>

                              {(encontro.horario || encontro.local) && (
                                  <div
                                      style={{
                                          fontSize: "0.85rem",
                                          opacity: 0.9,
                                          marginTop: "0.2rem",
                                      }}
                                  >
                                      {encontro.horario && <>⏰ {encontro.horario}</>}
                                      {encontro.local && <> · 📍 {encontro.local}</>}
                                  </div>
                              )}
                          </li>
                      ))}
                  </ul>
              </section>
          </section>

          {/* ===== ÍNDICE DE GRUPOS (EXTREMA DIREITA) ===== */}
          <aside
              style={{
                  position: "sticky",
                  top: "3rem",
                  padding: "0.5rem",
                  marginLeft: "1rem",
                  backgroundColor: "#fdfcf8",
                  alignSelf: "flex-start",
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
                                  margin: "0.4rem 0",
                                  padding: "0.6rem 0.35rem",
                                  borderRadius: "6px",
                                  backgroundColor: corDoGrupo(index),
                                  color: "#ffffff",
                                  fontSize: "0.75rem",
                                  fontWeight: ativo ? 700 : 500,
                                  opacity: ativo ? 1 : 0.7,
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
    </main>
  );
}

/**
 * 🔹 Gera os capítulos do livro
 */
export const getStaticPaths: GetStaticPaths = async () => {
    const grupos = await getGruposOrdenados();

    const paths = grupos.map((g) => ({
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

    const grupo = await getGrupoPorSlug(slug);
    if (!grupo) {
        return { notFound: true };
    }

    const grupos = await getGruposOrdenados();
    const encontros = await getEncontrosPorGrupo(grupo.id);

    return {
        props: {
            grupo,
            grupos,
            encontros,
        },
        revalidate: 60,
    };
};