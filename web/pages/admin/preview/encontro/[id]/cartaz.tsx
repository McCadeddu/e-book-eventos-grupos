// web/pages/admin/preview/encontro/[id].tsx

import { GetServerSideProps } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import { toPng } from "html-to-image";
import { useRef } from "react";


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

export default function CartazEncontro({ encontro, grupo }: Props) {
  const isEventoEspecial = encontro.tipo === "evento_especial";
  const cartazRef = useRef<HTMLDivElement>(null);

    async function gerarImagem() {
        if (!cartazRef.current) return;

        const dataUrl = await toPng(cartazRef.current, {
            cacheBust: true,
            pixelRatio: 2, // qualidade alta
        });

        const link = document.createElement("a");
        link.download = `cartaz-${encontro.id}.png`;
        link.href = dataUrl;
        link.click();
    }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fdfcf8",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >

      {/* CARTAZ */}
      <div
        ref={cartazRef}
        style={{
          width: "500px",
          height: "500px",
          background: isEventoEspecial ? "#ff6136" : "#4bbbc8",
          borderRadius: "24px",
          padding: "2rem",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        }}
      >
        {/* CABEÇALHO */}
        <div>
          <p style={{ fontSize: "0.85rem", opacity: 0.9 }}>
            Comunidade Missionária de Villaregia
          </p>

          <h2 style={{ margin: "0.5rem 0" }}>
            {isEventoEspecial ? "EVENTO ESPECIAL" : grupo.nome}
          </h2>

          {isEventoEspecial && (
            <p style={{ fontSize: "0.9rem" }}>{grupo.nome}</p>
          )}
        </div>

        {/* CONTEÚDO CENTRAL */}
        <div>
          <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>
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

          {encontro.titulo && (
            <h3 style={{ marginTop: "1rem" }}>
              {encontro.titulo}
            </h3>
          )}
        </div>

        {/* RODAPÉ */}
        <div style={{ fontSize: "0.9rem" }}>
          {encontro.horario && <p>🕒 {encontro.horario}</p>}
          {encontro.local && <p>📍 {encontro.local}</p>}
        </div>
      </div>

          {/* BOTÃO GERAR IMAGEM */}
            <button
                onClick={gerarImagem}
                style={{
                    marginTop: "1.5rem",
                    background: "#3e4647",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "24px",
                    padding: "0.7rem 1.6rem",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                }}
            >
                📥 Baixar imagem (PNG)
            </button>

      {/* AÇÕES */}
      <div style={{ marginLeft: "2rem" }}>
        <p>
            <Link
                href={`/admin/preview/encontro/${encontro.id}`}
                style={{
                    color: "#0b5c6b",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                }}
            >
                    ← Voltar à pré-visualização
            </Link>
        </p>
      </div>
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

  const encontros = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "..", "data", "encontros.json"),
      "utf-8"
    )
  ).encontros;

  const grupos = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "..", "data", "grupos.json"),
      "utf-8"
    )
  ).grupos;

  const encontro = encontros.find((e: any) => e.id === id);
  if (!encontro) return { notFound: true };

  const grupo = grupos.find((g: any) => g.id === encontro.grupo_id);
  if (!grupo) return { notFound: true };

  return {
    props: { encontro, grupo },
  };
};