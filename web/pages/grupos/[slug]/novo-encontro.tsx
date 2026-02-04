import { useRouter } from "next/router";
import { useState, useRef } from "react";
import fs from "fs";
import path from "path";
import { GetServerSideProps } from "next";

/* =======================
   TIPOS
======================= */
type Grupo = {
  id: string;
  nome: string;
  slug: string;
};

type Props = {
  grupo: Grupo;
};

/* =======================
   COMPONENTE
======================= */
export default function NovoEncontro({ grupo }: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  if (!grupo) {
    return <p>Grupo não encontrado.</p>;
  }

  /* =======================
     SUBMIT (ASYNC)
  ======================= */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const dados = {
      grupoId: grupo.id,
      tipo: formData.get("tipo"),
      dataInicio: formData.get("dataInicio"),
      dataFim: formData.get("dataFim"),
      dataLegivel: formData.get("dataLegivel"),
      titulo: formData.get("titulo"),
      horario: formData.get("horario"),
      local: formData.get("local"),
      visibilidade: formData.get("visibilidade"),
    };

    try {
      const resposta = await fetch("/api/encontros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      });

      const resultado = await resposta.json();

      if (resultado.sucesso) {
        setStatus("Encontro salvo com sucesso.");
        formRef.current?.reset();
      } else {
        setStatus("Erro ao salvar encontro.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Erro inesperado ao salvar.");
    }
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
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
          ← Voltar para administração dos grupos
        </button>
      </p>

      <h1>Novo Encontro</h1>

      <form ref={formRef} onSubmit={handleSubmit}>
        <label>
          Tipo de encontro
          <br />
          <select name="tipo" required>
            <option value="encontro_regular">Encontro regular</option>
            <option value="evento_especial">Evento especial</option>
          </select>
        </label>

        <br /><br />

        <label>
          Data de início
          <br />
          <input type="date" name="dataInicio" required />
        </label>

        <br /><br />

        <label>
          Data legível (opcional)
          <br />
          <input
            name="dataLegivel"
            placeholder="Ex: 15–17 de maio · Grand Prix"
          />
        </label>

        <br /><br />

        <label>
          Data de fim
          <br />
          <input type="date" name="dataFim" />
        </label>

        <br /><br />

        <label>
          Título / nome do encontro
          <br />
          <input name="titulo" />
        </label>

        <br /><br />

        <label>
          Horário
          <br />
          <input name="horario" />
        </label>

        <br /><br />

        <label>
          Local
          <br />
          <input name="local" />
        </label>

        <br /><br />

        <label>
          Visibilidade
          <br />
          <select name="visibilidade">
            <option value="interno">Interno</option>
            <option value="publico">Público</option>
          </select>
        </label>

        <br /><br />

        <button type="submit">Salvar Encontro</button>
      </form>

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </main>
  );
}

/* =======================
   SERVER SIDE
======================= */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const slug = context.params?.slug as string;

  const grupos = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "..", "data", "grupos.json"),
      "utf-8"
    )
  ).grupos;

  const grupo = grupos.find((g: any) => g.slug === slug);

  if (!grupo) {
    return { notFound: true };
  }

  return {
    props: {
      grupo,
    },
  };
};