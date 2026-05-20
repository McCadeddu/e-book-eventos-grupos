// web/pages/livro/calendario.tsx

import Link from "next/link";
import { GetStaticProps } from "next";

import { Grupo } from "../../lib/types";
import { getGruposOrdenadosStrict } from "../../lib/db/grupos";
import { getEncontrosStrict } from "../../lib/db/encontros";
import { getEventosStrict } from "../../lib/db/eventos";

import { ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { formatarDataIntervalo } from "../../lib/encontros-utils";

import { Encontro } from "../../lib/encontros-utils";

type ItemCalendario = Encontro;

type Props = {
    grupos: Grupo[];
    encontros: ItemCalendario[];
    eventos: any[];
};

export default function CalendarioLivro({ grupos, encontros, eventos }: Props) {
  const encontrosOrdenados = ordenarEncontrosPorData(encontros);

  function encontrosDoMes(mes: number) {
    return encontrosOrdenados.filter((e) => {
        if (!e.data_inicio) return false;
        const [, m] = e.data_inicio.split("-").map(Number);
      return m === mes;
    });
  }

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

    const coresCMV = [
        "#4bbbc8", // principal
        "#ff6136", // secundário
        "#443205", // secundário II
        "#c77e4a", // núcleo 1
        "#548287", // núcleo 2
        "#725e50", // núcleo 3
    ];

    function corDoGrupo(index: number) {
        return coresCMV[index % coresCMV.length];
    }

  return (
    <main
          style={{
              display: "flex",
              minHeight: "100vh",
              backgroundColor: "#fdfcf8",
          }}
      >
          {/* ÍNDICE LATERAL DE GRUPOS ESQUERDO */}
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
              {grupos.map((grupo, index) => (
                  <Link
                      key={grupo.id}
                      href={`/livro/${grupo.slug}`}
                      style={{ textDecoration: "none" }}
                  >
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
                              opacity: 0.8,
                              transition: "all 0.25s ease",
                          }}
                      >
                          {grupo.nome}
                      </span>
                  </Link>
              ))}
          </aside>

          { /* CONTEÚDO PRINCIPAL */ }
          <section
              style={{
                  flex: 1,
                  maxWidth: "950px",
                  margin: "0 auto",
                  padding: "3rem",
              }}
          >

              {/* TÍTULO */}
        <h1 style={{ color: "#4bbbc8", marginBottom: "0.5rem" }}>
          Calendário Anual 2026
        </h1>

        <p style={{ color: "#3e4647", marginBottom: "2.5rem" }}>
          Visão geral dos encontros e eventos da Comunidade Missionária de
          Villaregia em Belo Horizonte ao longo do ano.
        </p>

        {/* MESES */}
        {meses.map((nomeMes, index) => {
          const mesNumero = index + 1;
          const encontrosMes = encontrosDoMes(mesNumero);

          return (
            <section
              key={nomeMes}
              style={{
                marginBottom: "2.5rem",
                paddingBottom: "1.5rem",
                borderBottom: "1px solid #e0ddd7",
              }}
            >
              <h2 style={{ color: "#c77e4a" }}>{nomeMes}</h2>

              {encontrosMes.length === 0 && (
                <p style={{ color: "#8d908f" }}>
                  Nenhuma atividade registrada.
                </p>
              )}

              <ul>

                      {encontrosMes.map((encontro) => {
                          const grupo = encontro.grupo_id
                              ? grupos.find((g) => g.id === encontro.grupo_id)
                              : null;

                          return (
                              <li key={encontro.id} style={{ marginBottom: "0.8rem" }}>
                                  <strong>
                                      {encontro.data_legivel ||
                                          formatarDataIntervalo(
                                              encontro.data_inicio,
                                              encontro.data_fim
                                          )}
                                  </strong>

                                  {" — "}

                                  {encontro.grupo_id ? (
                                      <>
                                          {encontro.titulo}
                                          {grupo && (
                                              <>
                                                  {" · "}
                                                  {grupo.nome}
                                              </>
                                          )}
                                      </>
                                  ) : (
                                      <>
                                          <span
                                              style={{
                                                  fontWeight: 700,
                                                  textTransform: "uppercase",
                                                  color: "#ff6136",
                                              }}
                                          >
                                              {encontro.titulo}
                                          </span>

                                          <div
                                              style={{
                                                  fontSize: "0.85rem",
                                                  color: "#6b6b6b",
                                                  marginTop: "0.2rem",
                                              }}
                                          >
                                              Encontro de Evento
                                          </div>
                                      </>
                                  )}
                              </li>
                          );
                      })}

              </ul>
            </section>
          );
        })}
      </section>

          {/* ÍNDICE LATERAL DIREITO (ESPELHO) */}
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
              {(eventos ?? []).map((evento: any) => (
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
                              fontWeight: 700,
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
 * 🔹 Dados do calendário público
 */
export const getStaticProps: GetStaticProps = async () => {
    const grupos = await getGruposOrdenadosStrict();

    const encontros = (await getEncontrosStrict())
        .filter(e => {
            if (!e.data_inicio) return false;

            if (!e.evento_id) return true;

            return e.nivel === "evento" && e.mostrar_no_anual === true;
        })
        .map(e => ({
            ...e,
            data_inicio: e.data_inicio ?? null,
            data_fim: e.data_fim ?? null,
            data_legivel: e.data_legivel ?? null,
        }));

    const eventos = await getEventosStrict();

    return {
        props: {
            grupos,
            encontros,
            eventos: eventos ?? [],
        },
        revalidate: 60,
    };
}
