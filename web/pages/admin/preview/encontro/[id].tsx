// web/pages/admin/preview/encontro/[id].tsx

import { GetServerSideProps } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";

type Encontro = {
  id: string;
  grupo_id: string;
  tipo?: "encontro_regular" | "evento_especial";
  data_inicio?: string;
  data_fim?: string | null;
  data_legivel?: string;
  titulo?: string;
  horario?: string;
  local?: string;
};

type Grupo = {
  id: string;
  nome: string;
};

type Props = {
  encontro: Encontro;
  grupo: Grupo;
};

export default function PreviewEncontro({ encontro, grupo }: Props) {
  
  const isEventoEspecial = encontro.tipo === "evento_especial";

  return (
    <main
      style={{
        padding: "3rem",
        background: "#fdfcf8",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <section
        style={{
            width: "420px",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 10px 28px rgba(0,0,0,0.15)",
            fontFamily: "sans-serif",
            borderTop: isEventoEspecial
            ? "10px solid #ff6136"
            : "6px solid #4bbbc8",
        }}
      >
        {/* VOLTAR */}
        <p style={{ marginBottom: "1rem" }}>
          <Link href="/admin/grupos">← Voltar</Link>
        </p>

        {/* BOTÃO GERAR PDF */}
        <p style={{ marginBottom: "1.5rem" }}>
            <a
                href={`/api/pdf/encontro?id=${encontro.id}`}
                target="_blank"
                style={{
                display: "inline-block",
                background: "#548287",
                color: "#ffffff",
                padding: "0.5rem 1.2rem",
                borderRadius: "20px",
                fontSize: "0.9rem",
                textDecoration: "none",
                }}
            >
                🖨 Gerar PDF
            </a>
        </p>

        {/* BOTÃO VER CARTAZ */}
        <p style={{ marginTop: "0.8rem" }}>
            <Link
                href={`/admin/preview/encontro/${encontro.id}/cartaz`}
                style={{
                    display: "inline-block",
                    background: "#725e50",
                    color: "#ffffff",
                    padding: "0.5rem 1.2rem",
                    borderRadius: "20px",
                    fontSize: "0.9rem",
                    textDecoration: "none",
                }}
            >
                🖼 Ver cartaz (redes sociais)
            </Link>
        </p>
       
        {/* CABEÇALHO */}
        <h2
          style={{
            color: isEventoEspecial ? "#ff6136" : "#4bbbc8",
            marginBottom: "0.2rem",
            textTransform: isEventoEspecial ? "uppercase" : "none",
            letterSpacing: isEventoEspecial ? "0.04em" : "normal",
          }}
        >
            {isEventoEspecial ? "✨ EVENTO ESPECIAL" : grupo.nome}
        </h2>

            {isEventoEspecial && (
              <p
                style={{
                    color: "#3e4647",
                    fontSize: "0.9rem",
                    marginTop: 0,
                }}
              >
                    {grupo.nome}
              </p>
            )}

        {/* DATA */}
        <p style={{ color: "#3e4647", marginTop: 0 }}>
          {encontro.data_legivel
            ? encontro.data_legivel
            : encontro.data_inicio
            ? encontro.data_fim
              ? `${encontro.data_inicio
                  .split("-")
                  .reverse()
                  .join("/")} – ${encontro.data_fim
                  ?.split("-")
                  .reverse()
                  .join("/")}`
              : encontro.data_inicio
                  .split("-")
                  .reverse()
                  .join("/")
            : "Data a definir"}
        </p>

        {/* TÍTULO */}
        {encontro.titulo && (
          <h3 style={{ marginTop: "1.5rem", color: "#371900" }}>
            {encontro.titulo}
          </h3>
        )}

        {/* DETALHES */}
        <div style={{ marginTop: "1.2rem", fontSize: "0.95rem" }}>
          {encontro.horario && (
            <p>
              🕒 <strong>Horário:</strong> {encontro.horario}
            </p>
          )}

          {encontro.local && (
            <p>
              📍 <strong>Local:</strong> {encontro.local}
            </p>
          )}
        </div>

        {/* CHAMADA */}
        <p
            style={{
                marginTop: "2rem",
                background: isEventoEspecial ? "#ff6136" : "#f1e5ae",
                padding: "1rem",
                borderRadius: "12px",
                textAlign: "center",
                color: isEventoEspecial ? "#ffffff" : "#371900",
                fontWeight: 600,
            }}
        >
            {isEventoEspecial
                ? "🔥 Não perca! Um momento especial para viver juntos"
                : "✨ Venha participar e viver este momento conosco"}
        </p>

      </section>
    </main>
  );
}

/**
 * 🔹 Dados do encontro + grupo
 */
export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  const { id } = context.params as { id: string };

  const caminhoEncontros = path.join(
    process.cwd(),
    "..",
    "data",
    "encontros.json"
  );
  const caminhoGrupos = path.join(
    process.cwd(),
    "..",
    "data",
    "grupos.json"
  );

  const encontros = JSON.parse(
    fs.readFileSync(caminhoEncontros, "utf-8")
  ).encontros;

  const grupos = JSON.parse(
    fs.readFileSync(caminhoGrupos, "utf-8")
  ).grupos;

  const encontro = encontros.find((e: any) => e.id === id);

  if (!encontro) return { notFound: true };

  const grupo = grupos.find(
    (g: any) => g.id === encontro.grupo_id
  );

  if (!grupo) return { notFound: true };

  return {
    props: {
      encontro,
      grupo,
    },
  };
};