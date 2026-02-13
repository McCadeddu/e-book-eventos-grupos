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
        <main
            style={{
                minHeight: "100vh",
                backgroundColor: "#fdfcf8",
                padding: "3rem 1rem",
            }}
        >
            <div
                style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    padding: "2.5rem",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
            >
                <p style={{ marginBottom: "1.5rem" }}>
                    <button
                        type="button"
                        onClick={() => router.push("/admin/grupos")}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#4bbbc8",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "0.9rem",
                            fontWeight: 500,
                        }}
                    >
                        ← Voltar à administração dos grupos
                    </button>
                </p>

                <div
                    style={{
                        borderBottom: "3px solid #4bbbc8",
                        paddingBottom: "0.8rem",
                        marginBottom: "2rem",
                    }}
                >
                    <h1 style={{ margin: 0, color: "#3e4647" }}>
                        Editar Grupo
                    </h1>
                </div>

                <form
                    onSubmit={salvar}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.2rem",
                    }}
                >
                    <h3 style={{ color: "#4bbbc8" }}>Identidade</h3>

                    <input
                        name="nome"
                        defaultValue={grupo.nome}
                        required
                        placeholder="Nome do grupo"
                    />

                    <input
                        name="faixa_etaria"
                        defaultValue={grupo.faixa_etaria}
                        placeholder="Faixa etária"
                    />

                    <textarea
                        name="descricao"
                        defaultValue={grupo.descricao}
                        rows={3}
                        placeholder="Descrição do grupo"
                    />

                    <h3 style={{ color: "#ff6136", marginTop: "1.5rem" }}>
                        Objetivo do Ano
                    </h3>

                    <textarea
                        name="objetivo_ano"
                        defaultValue={grupo.objetivo_ano}
                        rows={3}
                    />

                    <h3 style={{ color: "#c77e4a", marginTop: "1.5rem" }}>
                        Equipe
                    </h3>

                    <input
                        name="equipe"
                        defaultValue={grupo.equipe.join(", ")}
                        placeholder="Responsáveis separados por vírgula"
                    />

                    <h3 style={{ color: "#548287", marginTop: "1.5rem" }}>
                        Convite Final
                    </h3>

                    <textarea
                        name="convite_final"
                        defaultValue={grupo.convite_final}
                        rows={2}
                    />

                    <button
                        type="submit"
                        style={{
                            marginTop: "2rem",
                            padding: "0.8rem",
                            backgroundColor: "#4bbbc8",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Salvar Alterações
                    </button>
                </form>

                {status && (
                    <p
                        style={{
                            marginTop: "1.5rem",
                            color: "#3e4647",
                            fontWeight: 500,
                        }}
                    >
                        {status}
                    </p>
                )}
            </div>
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