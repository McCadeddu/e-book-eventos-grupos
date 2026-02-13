// web/pages/livro/[slug].tsx

import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";

import { Grupo } from "../../lib/types";
import {
    getGruposOrdenados,
    getGrupoPorSlug,
} from "../../lib/db/grupos";
import { getEncontrosPorGrupo } from "../../lib/db/encontros";
import { getEventos } from "../../lib/db/eventos";

import { ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { formatarDataIntervalo } from "../../lib/encontros-utils";

import { Encontro } from "../../lib/encontros-utils";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

type Props = {
    grupo: Grupo;
    grupos: Grupo[];
    encontros: Encontro[];
    eventosDoGrupo: any[];
};

export default function CapituloLivro({
  grupo,
  grupos,
  encontros,
  eventosDoGrupo,
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
          }}
      >

          {/* ===== ÍNDICE DE GRUPOS (ESQUERDA) ===== */}
          <aside
              style={{
                  width: "90px",
                  position: "sticky",
                  top: "0",
                  height: "100vh",
                  overflowY: "auto",
                  padding: "1rem 0.5rem",
                  backgroundColor: "#faf8f3",
                  borderRight: "1px solid #e8e3d9",
              }}
          >
              {grupos.map((g, index) => {
                  const ativo = g.id === grupo.id;

                  return (
                      <Link key={g.id} href={`/livro/${g.slug}`} style={{ textDecoration: "none" }}>
                          <span
                              style={{
                                  display: "block",
                                  writingMode: "vertical-rl",
                                  margin: "0.6rem 0",
                                  padding: "0.7rem 0.4rem",
                                  borderRadius: "8px",
                                  backgroundColor: corDoGrupo(index),
                                  color: "#ffffff",
                                  fontSize: "0.75rem",
                                  fontWeight: ativo ? 700 : 500,
                                  opacity: ativo ? 1 : 0.65,
                                  transition: "all 0.25s ease",
                                  transform: ativo ? "scale(1.05)" : "scale(1)",
                              }}
                          >
                              {g.nome}
                          </span>
                      </Link>
                  );
              })}
          </aside>

          {/* ===== CONTEÚDO CENTRAL ===== */}
          <section
              style={{
                  flex: 1,
                  padding: "3rem",
                  maxWidth: "950px",
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2.5rem",
                  transition: "all 0.35s ease",
                  opacity: animando ? 0 : 1,
                  transform: animando ? "translateY(20px)" : "translateY(0)",
              }}
          >

              {/* BOTÃO VOLTAR */}
              <div style={{ marginBottom: "1rem" }}>
                  <Link
                      href="/livro/calendario"
                      style={{
                          display: "inline-flex",
                          padding: "0.45rem 0.9rem",
                          borderRadius: "999px",
                          backgroundColor: "#f1e5ae",
                          color: "#3e4647",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          textDecoration: "none",
                      }}
                  >
                      Voltar ao Calendário anual
                  </Link>
              </div>

              {/* APRESENTAÇÃO DO GRUPO */}
              <div
                  style={{
                      padding: "2rem",
                      backgroundColor: corGrupoAtual,
                      color: "#ffffff",
                      borderRadius: "8px",
                  }}
              >
                  <h1>{grupo.nome}</h1>
                  <p><em>{grupo.faixa_etaria}</em></p>
                  <p>{grupo.descricao}</p>

                  <h2 style={{ marginTop: "2rem" }}>Objetivo do Ano</h2>
                  <p>{grupo.objetivo_ano}</p>

                  <h2 style={{ marginTop: "2rem" }}>Equipe</h2>
                  <ul>
                      {grupo.equipe.map((nome) => (
                          <li key={nome}>{nome}</li>
                      ))}
                  </ul>

                  <h2 style={{ marginTop: "2rem" }}>Convite</h2>
                  <p>{grupo.convite_final}</p>
              </div>

              {/* AGENDA */}
              <section
                  style={{
                      backgroundColor: "#ffffff",
                      padding: "2rem",
                      borderRadius: "8px",
                  }}
              >
                  <h2 style={{ marginBottom: "1rem" }}>
                      Agenda dos Encontros
                  </h2>

                  {encontrosOrdenados.length === 0 && (
                      <p>Nenhum encontro cadastrado.</p>
                  )}

                  <ul>
                      {encontrosOrdenados.map((encontro) => (
                          <li key={encontro.id} style={{ marginBottom: "1rem" }}>
                              <strong>
                                  {encontro.data_legivel ||
                                      formatarDataIntervalo(encontro.data_inicio, encontro.data_fim)}
                              </strong>
                              {encontro.titulo && ` — ${encontro.titulo}`}
                          </li>
                      ))}
                  </ul>
              </section>

          </section>

          {/* ===== ÍNDICE DE EVENTOS (DIREITA) ===== */}
          <aside
              style={{
                  width: "90px",
                  position: "sticky",
                  top: "0",
                  height: "100vh",
                  overflowY: "auto",
                  padding: "1rem 0.5rem",
                  backgroundColor: "#fff5f1",
                  borderLeft: "1px solid #ffd7c8",
              }}
          >
              {eventosDoGrupo.map((evento: any) => (
                  <Link
                      key={evento.id}
                      href={`/livro/evento/${evento.id}`}
                      style={{ textDecoration: "none" }}
                  >
                      <span
                          style={{
                              display: "block",
                              writingMode: "vertical-rl",
                              margin: "0.6rem 0",
                              padding: "0.7rem 0.4rem",
                              borderRadius: "8px",
                              backgroundColor: "#ff6136",
                              color: "#ffffff",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              opacity: 0.85,
                              transition: "all 0.25s ease",
                          }}
                          onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.transform = "scale(1.05)";
                          }}
                          onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "0.85";
                              e.currentTarget.style.transform = "scale(1)";
                          }}
                      >
                          {evento.titulo}
                      </span>
                  </Link>
              ))}
          </aside>

      </main>
  );
}

/**
 * 🔹 Gera os capítulos do livro com base nos grupos cadastrados (slug)
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
 * 🔹 Dados do capítulo do livro (grupo + encontros + eventos relacionados)
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
    const slug = params?.slug as string;

    const grupo = await getGrupoPorSlug(slug);
    if (!grupo) {
        return { notFound: true };
    }

    const grupos = await getGruposOrdenados();
    const encontros = await getEncontrosPorGrupo(grupo.id);
    const eventos = await getEventos();

    const eventosDoGrupo = eventos.filter((evento: any) =>
        evento.todos_os_grupos ||
        (evento.grupos_envolvidos &&
            evento.grupos_envolvidos.includes(grupo.id))
    );

    const todos = [...encontros, ...eventosDoGrupo].sort((a: any, b: any) =>
        a.data_inicio.localeCompare(b.data_inicio)
    );

    return {
        props: {
            grupo,
            grupos,
            encontros: todos,
            eventosDoGrupo,
        },
        revalidate: 60,
    };
};