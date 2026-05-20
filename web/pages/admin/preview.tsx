import Link from "next/link";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { getAnoEmPreparacaoEbook, getAnoPublicadoEbook } from "../../lib/ebook-config";

type Props = {
  anoPublicado: number;
  anoEmPreparacao: number;
};

export default function Preview({ anoPublicado, anoEmPreparacao }: Props) {
  const router = useRouter();

  return (
    <main style={{ padding: "2rem" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => router.push("/admin/grupos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b5c6b",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.95rem",
          }}
        >
          Voltar à administração dos grupos
        </button>
      </p>

      <h1>Pré-visualização</h1>

      <p>
        Esta área mostra como os conteúdos aparecerão no e-book e nos
        materiais de divulgação.
      </p>

      <h2>E-book</h2>

      <p>
        Publicado agora:{" "}
        <Link href="/livro" target="_blank">
          /livro
        </Link>
        {" "}({anoPublicado})
      </p>

      <p>
        Ano em preparação:{" "}
        <Link href={`/livro/edicao/${anoEmPreparacao}`} target="_blank">
          {`/livro/edicao/${anoEmPreparacao}`}
        </Link>
      </p>

      <p style={{ color: "#555", maxWidth: "760px" }}>
        Enquanto vocês montam a nova edição, o link oficial <strong>/livro</strong>
        {" "}continua mostrando o ano publicado. O rascunho fica separado aqui,
        para revisão interna, sem mexer no conteúdo divulgado ao público.
      </p>

      <iframe
        src={`/livro/edicao/${anoEmPreparacao}`}
        style={{
          width: "100%",
          height: "80vh",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => ({
  props: {
    anoPublicado: await getAnoPublicadoEbook(),
    anoEmPreparacao: await getAnoEmPreparacaoEbook(),
  },
});
