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

  return (
    <main
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#fdfcf8",
      }}
    >
      {/* ===== ÍNDICE LATERAL ===== */}
      <aside
        style={{
          width: "260px",
          padding: "2rem 1.5rem",
          borderRight: "1px solid #ddd",
          background: "#f7efe2",
        }}
      >
        <h2 style={{ color: "#0b5c6b" }}>Agenda 2026</h2>

        <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "1.5rem" }}>
          {grupos.map((g) => (
            <li key={g.id} style={{ marginBottom: "0.75rem" }}>
              <Link
                href={`/livro/${g.slug}`}
                style={{
                  textDecoration: "none",
                  color:
                    g.slug === grupo.slug ? "#0b5c6b" : "#371900",
                  fontWeight: g.slug === grupo.slug ? 700 : 500,
                }}
              >
                ▸ {g.nome}
              </Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: "2rem", fontSize: "0.85rem" }}>
          <Link href="/livro" style={{ color: "#0b5c6b" }}>
            ← Voltar ao índice do livro
          </Link>
        </p>
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
            paddingRight: "2rem",
            borderRight: "1px solid #e0ddd7",
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
