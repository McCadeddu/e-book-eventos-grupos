// web/pages/grupos/[slug].tsx

import { GetStaticPaths, GetStaticProps } from "next";
import { lerGrupos, lerGrupoPorSlug, Grupo } from "../../lib/grupos";
import { useRouter } from "next/router";

import { lerEncontrosPorGrupo } from "../../lib/encontros";
import {
  Encontro,
  ordenarEncontrosPorData,
} from "../../lib/encontros-utils";

type Props = {
  grupo: Grupo;
  encontros: Encontro[];
};

export default function PaginaGrupo({ grupo, encontros }: Props) {
  const encontrosOrdenados = ordenarEncontrosPorData(encontros);
  const router = useRouter();

  async function excluirEncontro(id: string) {
    const confirmado = confirm(
      "Tem certeza que deseja excluir este encontro?"
    );

    if (!confirmado) return;

    const resposta = await fetch("/api/encontros", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const resultado = await resposta.json();

    if (resultado.sucesso) {
      router.replace(router.asPath);
    } else {
      alert("Erro ao excluir encontro");
    }
  }

  const encontrosRegulares = encontrosOrdenados.filter(
    (e) => e.tipo === "encontro_regular"
  );

  const eventosEspeciais = encontrosOrdenados.filter(
    (e) => e.tipo === "evento_especial"
  );

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <p>
        <button onClick={() => router.back()}>
          ← Voltar
        </button>
      </p>
      <p style={{ marginBottom: "1.5rem" }}>
        <button
          onClick={() => router.push("/admin/grupos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b5c6b",
            cursor: "pointer",
            fontSize: "0.95rem",
            padding: 0,
          }}
        >
          ← Voltar aos grupos
        </button>
      </p>
      
      {/* ===== CAPÍTULO: CABEÇALHO ===== */}
      <h1>{grupo.nome}</h1>
      <p>
        <em>{grupo.faixa_etaria}</em>
      </p>

      <p>{grupo.descricao}</p>

      {/* ===== OBJETIVO DO ANO ===== */}
      <h2>Objetivo do Ano</h2>
      <p>{grupo.objetivo_ano}</p>

      {/* ===== EQUIPE ===== */}
      <h2>Equipe de Responsáveis</h2>
      <ul>
        {grupo.equipe.map((nome) => (
          <li key={nome}>{nome}</li>
        ))}
      </ul>
      <p>
        <button
          onClick={() =>
            router.push(`/grupos/${router.query.slug}/novo-encontro`)
          }
        >
         ➕ Novo Encontro
        </button>
      </p>
      {/* ===== ENCONTROS REGULARES ===== */}
      <h2>Encontros Regulares – 2026</h2>

      {encontrosRegulares.length === 0 && (
        <p>Nenhum encontro regular cadastrado.</p>
      )}

      <ul>
        {encontrosRegulares.map((encontro) => (
            <li key={encontro.id} style={{ marginBottom: "0.5rem" }}>
            <strong>
              {encontro.data_legivel
                ? encontro.data_legivel
                : encontro.data_inicio
                ? encontro.data_inicio.split("-").reverse().join("/")
                : "Data a definir"}
            </strong>

              {encontro.titulo && <> — {encontro.titulo}</>}

              <div style={{ marginTop: "0.25rem" }}>
                <button
                  onClick={() =>
                    router.push(
                      `/grupos/${router.query.slug}/editar-encontro/${encontro.id}`
                    )
                 }
                >
                 🖊 Editar
                </button>{" "}
                <button onClick={() => excluirEncontro(encontro.id)}>
                  🗑 Excluir
                </button>
              </div>
            </li>
        ))}
      </ul>

      {/* ===== EVENTOS ESPECIAIS ===== */}
      <h2>Eventos Especiais</h2>

      {eventosEspeciais.length === 0 && (
        <p>Nenhum evento especial cadastrado.</p>
      )}

      <ul>
        {eventosEspeciais.map((evento) => (
            <li key={evento.id} style={{ marginBottom: "0.75rem" }}>
              <strong>
                {evento.data_inicio}
                {evento.data_fim && ` – ${evento.data_fim}`}
              </strong>

            {evento.titulo && <> — {evento.titulo}</>}

            <div style={{ marginTop: "0.25rem" }}>
                <button disabled>🖊 Editar</button>{" "}
                <button
                    onClick={() => excluirEncontro(evento.id)}
                >
                    🗑 Excluir
                </button>
            </div>
        </li>
      ))}

      </ul>

      {/* ===== CONVITE FINAL ===== */}
      <h2>Convite</h2>
      <p>{grupo.convite_final}</p>
    </main>
  );
}

/**
 * 🔹 Gera as páginas de todos os grupos
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const grupos = lerGrupos();

  const paths = grupos
    .filter(
      (g) =>
        typeof g.slug === "string" &&
        g.slug.trim().length > 0
    )
    .map((g) => ({
      params: { slug: g.slug },
    }));

  return {
    paths,
    fallback: false,
  };
};

/**
 * 🔹 Carrega dados do grupo + encontros
 */
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const grupo = lerGrupoPorSlug(slug);

  if (!grupo) {
    return { notFound: true };
  }

  const encontros = lerEncontrosPorGrupo(grupo.id);

  return {
    props: {
      grupo,
      encontros,
    },
  };
};
