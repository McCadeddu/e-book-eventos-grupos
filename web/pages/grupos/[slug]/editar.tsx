// web/pages/grupos/[slug]/editar.tsx

import { getGrupoPorSlug } from "../../../lib/db/grupos";
import { useRouter } from "next/router";
import { useState } from "react";
import type { Grupo } from "../../../lib/types";
import { GetServerSideProps } from "next";

type Props = {
  grupo: Grupo;
};

export default function EditarGrupo({ grupo }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function salvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const dadosAtualizados = {
      id: grupo.id,
      slug: grupo.slug,
      nome: formData.get("nome"),
      faixa_etaria: formData.get("faixa_etaria"),
      descricao: formData.get("descricao"),
      objetivo_ano: formData.get("objetivo_ano"),
      equipe: (formData.get("equipe") as string)
        .split(",")
        .map((n) => n.trim()),
      convite_final: formData.get("convite_final"),
    };

    const resposta = await fetch("/api/grupos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dadosAtualizados),
    });

    const resultado = await resposta.json();

    if (resultado.sucesso) {
      setStatus("Grupo atualizado com sucesso.");
      setTimeout(() => router.push("/admin/grupos"), 800);
    } else {
      setStatus("Erro ao salvar alterações.");
    }
  }

  return (
    <main style={{ padding: "3rem", maxWidth: "700px", margin: "0 auto" }}>
      <h1>Editar Grupo</h1>

      <form onSubmit={salvar}>
        <label>Nome<br />
          <input name="nome" defaultValue={grupo.nome} required />
        </label><br /><br />

        <label>Faixa etária<br />
          <input name="faixa_etaria" defaultValue={grupo.faixa_etaria} />
        </label><br /><br />

        <label>Descrição<br />
          <textarea name="descricao" defaultValue={grupo.descricao} />
        </label><br /><br />

        <label>Objetivo do ano<br />
          <textarea name="objetivo_ano" defaultValue={grupo.objetivo_ano} />
        </label><br /><br />

        <label>Equipe (separar por vírgula)<br />
          <input
            name="equipe"
            defaultValue={grupo.equipe.join(", ")}
          />
        </label><br /><br />

        <label>Convite final<br />
          <textarea name="convite_final" defaultValue={grupo.convite_final} />
        </label><br /><br />

        <button type="submit">Salvar alterações</button>
      </form>

      {status && <p>{status}</p>}
    </main>
  );
}
export const getServerSideProps: GetServerSideProps = async (context) => {
    const slug = context.params?.slug as string;

    const grupo = await getGrupoPorSlug(slug);

    if (!grupo) {
        return { notFound: true };
    }

    return {
        props: {
            grupo,
        },
    };
};