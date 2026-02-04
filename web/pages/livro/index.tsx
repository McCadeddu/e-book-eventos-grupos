// web/pages/livro/index.tsx

import Link from "next/link";
import fs from "fs";
import path from "path";

type EbookConfig = {
  ano: number;
  titulo: string;
  subtitulo: string;
  botao_texto: string;
  capas: string[];
  logo: string;
};

type Props = {
  ebook: EbookConfig;
};

export default function CapaLivro({ ebook }: Props) {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#fdfcf8",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "4rem",
      }}
    >
      <section
        style={{
          maxWidth: "900px",
          textAlign: "center",
          padding: "3rem 2rem",
        }}
      >
        {/* CONTAINER DA CAPA */}
        <div
          style={{
            position: "relative",
            width: "100%",
            marginBottom: "2.5rem",
          }}
        >
        {/* CAPAS (SLIDES ESTÁTICOS) */}
        {ebook.capas.map((src, index) => (
          <div
            key={src}
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "2.5rem",
            }}
          >
            <img
              src={src}
              alt={`Capa ${index + 1}`}
              style={{
                width: "100%",
                borderRadius: "16px",
                display: "block",
              }}
            />

            {/* LOGO SOMENTE NA ÚLTIMA CAPA */}
            {index === ebook.capas.length - 1 && (
              <img
                src={ebook.logo}
                alt="Logo"
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: "100px",
                  backgroundColor: "rgba(255,255,255,0.85)",
                  padding: "0.5rem 1.2rem",
                  borderRadius: "12px",
                }}
            />
            )}
          </div>
        ))}
        </div>

        {/* TÍTULO */}
        <h1
          style={{
            color: "#4bbbc8",
            fontSize: "2.5rem",
            marginBottom: "0.5rem",
          }}
        >
          {ebook.titulo} {ebook.ano}
        </h1>

        <p
          style={{
            color: "#3e4647",
            fontSize: "1.1rem",
            marginBottom: "2.5rem",
          }}
        >
          {ebook.subtitulo}
        </p>

        {/* BOTÃO */}
        <Link href="/livro/calendario">
          <button
            style={{
              backgroundColor: "#ff6136",
              color: "#ffffff",
              border: "none",
              borderRadius: "30px",
              padding: "0.9rem 2rem",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
          >
            📖 {ebook.botao_texto}
          </button>
        </Link>
      </section>
    </main>
  );
}

/**
 * 📘 Dados editoriais do e-book
 */
export async function getStaticProps() {
  const ebook = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "..", "data", "ebook.json"),
      "utf-8"
    )
  );

  return {
    props: { ebook },
  };
}

