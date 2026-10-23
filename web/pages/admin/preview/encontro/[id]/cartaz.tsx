// web/pages/admin/preview/encontro/[id].tsx

import Link from "next/link";
import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import { withAdminPage } from "../../../../../lib/adminPage";
import { carregarDivulgacaoEncontro, type DadosDivulgacao } from "../../../../../lib/admin-divulgacao";


export default function CartazEncontro({ encontro, grupo }: DadosDivulgacao) {
  const isEventoEspecial = Boolean(encontro.evento_id) || encontro.tipo === "evento_especial";
  const cartazRef = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");

    async function gerarImagem() {
        if (!cartazRef.current) return;

        setGerando(true);
        setErro("");
        try {
            const dataUrl = await toPng(cartazRef.current, { cacheBust: true, pixelRatio: 2 });
            const link = document.createElement("a");
            link.download = `cartaz-${encontro.id}.png`;
            link.href = dataUrl;
            link.click();
        } catch {
            setErro("Não foi possível gerar o cartaz. Tente novamente.");
        } finally {
            setGerando(false);
        }
    }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fdfcf8",
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "1rem",
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
                type="button"
                disabled={gerando}
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
                {gerando ? "Gerando imagem..." : "📥 Baixar imagem (PNG)"}
            </button>

      {erro && <p role="alert">{erro}</p>}
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

export const getServerSideProps = withAdminPage(async (context) => {
    const id = context.params?.id;
    if (typeof id !== "string") return { notFound: true };
    const dados = await carregarDivulgacaoEncontro(id);
    if (!dados) return { notFound: true };
    return { props: dados };
});
