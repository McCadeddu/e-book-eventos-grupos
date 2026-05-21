// web/pages/livro/[slug].tsx

import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";

import { Grupo } from "../../lib/types";
import {
    getGruposOrdenadosStrict,
    getGrupoPorSlugStrict,
} from "../../lib/db/grupos";
import {
    getEncontrosPorEventoStrict,
    getEncontrosPorGrupoStrict,
} from "../../lib/db/encontros";
import { getEventosStrict } from "../../lib/db/eventos";

import { ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { formatarDataIntervalo } from "../../lib/encontros-utils";

import { Encontro } from "../../lib/encontros-utils";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import PixAlmoco from "../../components/PixAlmoco";
import { getAnoAtualEbook, pertenceAoAno } from "../../lib/ebook-config";

type Props = {
    ano: number;
    grupo: Grupo;
    grupos: Grupo[];
    encontros: Encontro[];
    eventosDoGrupo: any[];
};

function encontroPertenceAoEvento(encontro: any, eventoId: string) {
    return encontro.evento_id === eventoId || encontro.grupo_id === eventoId;
}

export default function CapituloLivro({
  ano,
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
                      Voltar ao Calendário anual {ano}
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

                  <PixAlmoco />

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
                      {encontrosOrdenados.map((encontro) => {
                          const ehEvento = !!encontro.evento_id;
                          const ehOrganizacao = encontro.nivel === "organizacao";

                          return (
                              <li
                                  key={encontro.id}
                                  style={{
                                      marginBottom: "1rem",
                                      padding: "0.8rem",
                                      borderRadius: "8px",
                                      border: ehOrganizacao
                                          ? "1px solid #ffd7c8"
                                          : ehEvento
                                              ? "1px solid #ffe3d8"
                                              : "1px solid #e0ddd7",
                                      backgroundColor: ehOrganizacao
                                          ? "#fff5f1"
                                          : ehEvento
                                              ? "#fff9f6"
                                              : "#ffffff",
                                  }}
                              >
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                      <strong>
                                          {encontro.data_legivel ||
                                              formatarDataIntervalo(
                                                  encontro.data_inicio,
                                                  encontro.data_fim
                                              )}
                                      </strong>

                                      {ehEvento && (
                                          <span
                                              style={{
                                                  fontSize: "0.7rem",
                                                  fontWeight: 700,
                                                  padding: "0.2rem 0.5rem",
                                                  borderRadius: "999px",
                                                  backgroundColor: ehOrganizacao
                                                      ? "#ff6136"
                                                      : "#4bbbc8",
                                                  color: "#ffffff",
                                                  letterSpacing: "0.5px",
                                              }}
                                          >
                                              {ehOrganizacao
                                                  ? "EQUIPE ORGANIZATIVA"
                                                  : "EVENTO"}
                                          </span>
                                      )}
                                  </div>

                                  {encontro.titulo && (
                                      <div style={{ marginTop: "0.3rem" }}>
                                          {ehOrganizacao && (
                                              <strong style={{ color: "#ff6136" }}>
                                                  Equipe organizativa –{" "}
                                              </strong>
                                          )}
                                          {encontro.titulo}
                                      </div>
                                  )}

                                  {(encontro.horario || encontro.local) && (
                                      <div
                                          style={{
                                              fontSize: "0.9rem",
                                              marginTop: "0.3rem",
                                              color: "#555",
                                          }}
                                      >
                                          {encontro.horario && <span>🕒 {encontro.horario}</span>}
                                          {encontro.horario && encontro.local && " · "}
                                          {encontro.local && <span>📍 {encontro.local}</span>}
                                      </div>
                                  )}
                              </li>
                          );
                      })}
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
    const grupos = await getGruposOrdenadosStrict();

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
    const ano = await getAnoAtualEbook();

    // 1️⃣ grupo atual
    const grupo = await getGrupoPorSlugStrict(slug);
    if (!grupo) {
        return { notFound: true };
    }

    // 2️⃣ todos os grupos (para índice lateral)
    const grupos = await getGruposOrdenadosStrict();

    // 3️⃣ encontros próprios do grupo
    const encontrosGrupo = (await getEncontrosPorGrupoStrict(grupo.id)).filter(
        (encontro) =>
            encontro.visibilidade === "publico" &&
            pertenceAoAno(encontro.data_inicio, ano)
    );

    // 4️⃣ todos os eventos
    const eventos = (await getEventosStrict()).filter(
        (evento: any) => evento.visibilidade === "publico"
    );

    // 5️⃣ eventos que envolvem este grupo
    const eventosDoGrupo = eventos.filter((evento: any) =>
        evento.todos_os_grupos ||
        (evento.grupos_envolvidos &&
            evento.grupos_envolvidos.includes(grupo.id))
    );

    // 6️⃣ buscar encontros que pertencem aos eventos deste grupo (para mostrar na agenda, com prefixo do nome do evento)
    const encontrosEventos: any[] = [];

    for (const evento of eventosDoGrupo) {
        const data = await getEncontrosPorEventoStrict(evento.id);

        if (data) {
            encontrosEventos.push(
                ...data
                    .filter(
                        (encontro) =>
                            encontro.visibilidade === "publico" &&
                            pertenceAoAno(encontro.data_inicio, ano)
                    )
                    .map(e => ({
                        ...e,
                        nome_evento: evento.titulo, // 🔵 importante para prefixo
                    }))
            );
        }

        if (data?.length === 0) {
            const fallbackGrupo = await getEncontrosPorGrupoStrict(evento.id);

            encontrosEventos.push(
                ...fallbackGrupo
                    .filter(
                        (encontro) =>
                            encontro.visibilidade === "publico" &&
                            pertenceAoAno(encontro.data_inicio, ano)
                    )
                    .map(e => ({
                        ...e,
                        nome_evento: evento.titulo,
                    }))
            );
        }
    }

    // 7️⃣ unificar encontros do grupo + encontros dos eventos
    const todosEncontros = [
        ...encontrosGrupo,
        ...encontrosEventos,
    ];

    const eventosDoGrupoNoAno = eventosDoGrupo.filter((evento: any) =>
        todosEncontros.some((encontro) => encontroPertenceAoEvento(encontro, evento.id))
    );

    return {
        props: {
            ano,
            grupo,
            grupos,
            encontros: todosEncontros,
            eventosDoGrupo: eventosDoGrupoNoAno,
        },
        revalidate: 60,
    };
};
