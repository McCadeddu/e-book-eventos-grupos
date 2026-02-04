// web/pages/grupos/[slug]/editar-encontro/[id].tsx

import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import fs from "fs";
import path from "path";
import { Encontro } from "../../../../lib/encontros-utils";

type Props = {
  encontro: Encontro;
};

export default function EditarEncontro({ encontro }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSalvando(true);

    const formData = new FormData(event.currentTarget);

    const dadosAtualizados = {
      id: encontro.id,
      grupo_id: encontro.grupo_id,
      tipo: formData.get("tipo"),
      data_inicio: formData.get("data_inicio"),
      data_fim: formData.get("data_fim") || null,
      data_legivel: formData.get("data_legivel") || "",
      titulo: formData.get("titulo"),
      horario: formData.get("horario"),
      local: formData.get("local"),
      visibilidade: formData.get("visibilidade"),
    };

    const resposta = await fetch("/api/encontros", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosAtualizados),
    });

    const resultado = await resposta.json();

    if (resultado.sucesso) {
      setStatus("Encontro atualizado com sucesso.");
      setTimeout(() => {
        router.push(`/grupos/${router.query.slug}`);
      }, 800);
    } else {
      setStatus("Erro ao atualizar encontro.");
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Editar Encontro</h1>

        <p>
            <button onClick={() => router.back()}>
                ← Voltar ao grupo
            </button>
        </p>

      <form ref={formRef} onSubmit={handleSubmit}>
        <label>
          Tipo
          <br />
          <select name="tipo" defaultValue={encontro.tipo}>
            <option value="encontro_regular">Encontro regular</option>
            <option value="evento_especial">Evento especial</option>
          </select>
        </label>

        <br /><br />

        <label>
          Data de início
          <br />
          <input name="data_inicio" defaultValue={encontro.data_inicio || ""} />
        </label>

        <br /><br />

        <label>
          Data de fim
          <br />
          <input name="data_fim" defaultValue={encontro.data_fim || ""} />
        </label>

        <br /><br />

        <label>
          Data legível (opcional)
          <br />
          <input
            name="data_legivel"
            defaultValue={encontro.data_legivel || ""}
            placeholder="Ex: 15–17 de maio · Grand Prix"
          />
        </label>

        <br /><br />

        <label>
          Título
          <br />
          <input
            name="titulo"
            defaultValue={encontro.titulo || ""}
          />
        </label>

        <br /><br />

        <label>
          Horário
          <br />
          <input
            name="horario"
            defaultValue={encontro.horario || ""}
          />
        </label>

        <br /><br />

        <label>
          Local
          <br />
          <input
            name="local"
            defaultValue={encontro.local || ""}
          />
        </label>

        <br /><br />

        <label>
          Visibilidade
          <br />
          <select
            name="visibilidade"
            defaultValue={encontro.visibilidade}
          >
            <option value="interno">Interno</option>
            <option value="publico">Público</option>
          </select>
        </label>

        <br /><br />

        <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar Alterações"}
        </button>

      </form>

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </main>
  );
}

/**
 * 🔹 Carrega o encontro pelo ID (server-side)
 */
export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  const { id } = context.params as { id: string };

  const caminho = path.join(
    process.cwd(),
    "..",
    "data",
    "encontros.json"
  );
  const conteudo = fs.readFileSync(caminho, "utf-8");
  const dados = JSON.parse(conteudo);

  const encontro = dados.encontros.find(
    (e: Encontro) => e.id === id
  );

  if (!encontro) {
    return { notFound: true };
  }

  return {
    props: {
      encontro,
    },
  };
};