// web/pages/livro/calendario.tsx

import Link from "next/link";
import { GetStaticProps } from "next";

import { lerGrupos, Grupo } from "../../lib/grupos";
import { lerEncontros } from "../../lib/encontros";
import { ordenarEncontrosPorData } from "../../lib/encontros-utils";
import { Encontro } from "../../lib/encontros-utils";

type Props = {
  grupos: Grupo[];
  encontros: Encontro[];
};

export default function CalendarioLivro({ grupos, encontros }: Props) {
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
        "#f1e5ae", // secundário II
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
              minHeight: "100vh",
              backgroundColor: "#fdfcf8",
              padding: "3rem 2rem 3rem 4rem", // 👈 espaço para o índice
          }}
      >
          {/* ÍNDICE LATERAL DE GRUPOS */}
          <aside
              style={{
                  position: "fixed",
                  left: 0,
                  top: 0,
                  height: "100vh",
                  display: "flex",
                  flexDirection: "column",
                  padding: "0.5rem",
                  backgroundColor: "#fdfcf8",
                  zIndex: 10,
                  overflowY: "auto",   // 👈 permite escorregar
              }}
          >
              {grupos.map((grupo, index) => (
                  <Link key={grupo.id} href={`/livro/${grupo.slug}`}>
                      <span
                          style={{
                              writingMode: "vertical-rl",
                              transform: "rotate(180deg)",
                              margin: "0.4rem 0",
                              padding: "0.4rem 0.25rem",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              backgroundColor: corDoGrupo(index),
                              color: "#ffffff",
                              opacity: 0.85,
                              whiteSpace: "nowrap",
                          }}
                      >
                          {grupo.nome}
                      </span>
                  </Link>
              ))}
          </aside>

          <section style={{ maxWidth: "900px", margin: "0 auto" }}>
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
                  const grupo = grupos.find(
                    (g) => g.id === encontro.grupo_id
                  );

                  return (
                    <li key={encontro.id} style={{ marginBottom: "0.4rem" }}>
                      <strong>
                        {encontro.data_legivel ||
                          encontro.data_inicio
                            .split("-")
                            .reverse()
                            .join("/")}
                      </strong>
                      {encontro.titulo && ` — ${encontro.titulo}`}
                      {grupo && ` · ${grupo.nome}`}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

      </section>
    </main>
  );
}

/**
 * 🔹 Dados do calendário público
 */
export const getStaticProps: GetStaticProps = async () => {
  const grupos = lerGrupos();
  const encontros = lerEncontros();

  return {
    props: {
      grupos,
      encontros,
    },
    revalidate: 60,
  };
};