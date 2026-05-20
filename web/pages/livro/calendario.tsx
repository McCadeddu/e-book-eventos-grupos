import Link from "next/link";
import { GetStaticProps } from "next";

import { Grupo } from "../../lib/types";
import { getGruposOrdenadosStrict } from "../../lib/db/grupos";
import { getEncontrosStrict } from "../../lib/db/encontros";
import { getEventosStrict } from "../../lib/db/eventos";
import { getAnoAtualEbook, pertenceAoAno } from "../../lib/ebook-config";

import {
  Encontro,
  formatarDataIntervalo,
  ordenarEncontrosPorData,
} from "../../lib/encontros-utils";

type ItemCalendario = Encontro;

type Props = {
  ano: number;
  grupos: Grupo[];
  encontros: ItemCalendario[];
  eventos: any[];
};

type LinhaAgrupada = {
  dataLabel: string;
  itens: {
    id: string;
    texto: string;
    ehEvento: boolean;
  }[];
};

export default function CalendarioLivro({ ano, grupos, encontros, eventos }: Props) {
  const encontrosOrdenados = ordenarEncontrosPorData(encontros);

  function encontrosDoMes(mes: number) {
    return encontrosOrdenados.filter((e) => {
      if (!e.data_inicio) return false;
      const [, m] = e.data_inicio.split("-").map(Number);
      return m === mes;
    });
  }

  function agruparEncontrosPorData(encontrosMes: ItemCalendario[]): LinhaAgrupada[] {
    const gruposMap = new Map(grupos.map((grupo) => [grupo.id, grupo]));
    const linhas = new Map<string, LinhaAgrupada>();

    for (const encontro of encontrosMes) {
      const dataLabel =
        encontro.data_legivel ||
        formatarDataIntervalo(encontro.data_inicio, encontro.data_fim);

      const grupo = encontro.grupo_id
        ? gruposMap.get(encontro.grupo_id)
        : null;

      const ehEvento = !encontro.grupo_id;
      const texto = ehEvento
        ? encontro.titulo || "Evento"
        : `${encontro.titulo || "Encontro"}${grupo ? ` · ${grupo.nome}` : ""}`;

      if (!linhas.has(dataLabel)) {
        linhas.set(dataLabel, {
          dataLabel,
          itens: [],
        });
      }

      linhas.get(dataLabel)?.itens.push({
        id: encontro.id,
        texto,
        ehEvento,
      });
    }

    return Array.from(linhas.values());
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
    "#4bbbc8",
    "#ff6136",
    "#443205",
    "#c77e4a",
    "#548287",
    "#725e50",
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

      <section
        style={{
          flex: 1,
          maxWidth: "950px",
          margin: "0 auto",
          padding: "3rem",
        }}
      >
        <h1 style={{ color: "#4bbbc8", marginBottom: "0.5rem" }}>
          Calendário Anual {ano}
        </h1>

        <p style={{ color: "#3e4647", marginBottom: "2.5rem" }}>
          Visão geral dos encontros e eventos da Comunidade Missionária de
          Villaregia em Belo Horizonte ao longo do ano.
        </p>

        {meses.map((nomeMes, index) => {
          const mesNumero = index + 1;
          const encontrosMes = encontrosDoMes(mesNumero);
          const encontrosAgrupados = agruparEncontrosPorData(encontrosMes);

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

              {encontrosAgrupados.length === 0 && (
                <p style={{ color: "#8d908f" }}>
                  Nenhuma atividade registrada.
                </p>
              )}

              <ul>
                {encontrosAgrupados.map((linha) => (
                  <li key={linha.dataLabel} style={{ marginBottom: "0.8rem" }}>
                    <strong>{linha.dataLabel}</strong>
                    {" — "}

                    {linha.itens.map((item, itemIndex) => (
                      <span key={item.id}>
                        {itemIndex > 0 && " — "}
                        {item.ehEvento ? (
                          <span
                            style={{
                              fontWeight: 700,
                              textTransform: "uppercase",
                              color: "#ff6136",
                            }}
                          >
                            {item.texto}
                          </span>
                        ) : (
                          item.texto
                        )}
                      </span>
                    ))}

                    {linha.itens.some((item) => item.ehEvento) && (
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#6b6b6b",
                          marginTop: "0.2rem",
                        }}
                      >
                        Encontro de Evento
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </section>

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

export const getStaticProps: GetStaticProps = async () => {
  const ano = await getAnoAtualEbook();
  const grupos = await getGruposOrdenadosStrict();

  const encontros = (await getEncontrosStrict())
    .filter((e) => {
      if (!pertenceAoAno(e.data_inicio, ano)) return false;

      if (!e.evento_id) return true;

      return e.nivel === "evento" && e.mostrar_no_anual === true;
    })
    .map((e) => ({
      ...e,
      data_inicio: e.data_inicio ?? null,
      data_fim: e.data_fim ?? null,
      data_legivel: e.data_legivel ?? null,
    }));

  const eventos = (await getEventosStrict()).filter((evento: any) =>
    encontros.some((encontro) => encontro.evento_id === evento.id)
  );

  return {
    props: {
      ano,
      grupos,
      encontros,
      eventos: eventos ?? [],
    },
    revalidate: 60,
  };
};
