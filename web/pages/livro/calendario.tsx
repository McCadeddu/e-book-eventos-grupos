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
      const [ano, m] = e.data_inicio.split("-").map(Number);
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

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fdfcf8",
        padding: "3rem 2rem",
      }}
    >
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

        {/* NAVEGAÇÃO */}
        <div style={{ marginTop: "3rem" }}>
          <Link href="/livro/gimvi-adolescentes">
            <button
              style={{
                backgroundColor: "#ff6136",
                color: "#ffffff",
                border: "none",
                borderRadius: "30px",
                padding: "0.8rem 1.8rem",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              📖 Começar pelos grupos
            </button>
          </Link>
        </div>
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