//web/pages/admin/eventos/editar/[id].tsx

import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { getGruposOrdenados } from "../../../../lib/db/grupos";

type Grupo = {
    id: string;
    nome: string;
};

type Evento = {
    id: string;
    titulo: string;
    faixa_etaria?: string;
    descricao?: string;
    equipe?: string[];
    objetivo_ano?: string;
    convite?: string;
    data_inicio: string;
    data_fim?: string | null;
    todos_os_grupos: boolean;
    grupos_envolvidos?: string[];
    visibilidade: string;
};

type Props = {
    evento: Evento;
    grupos: Grupo[];
};

export default function EditarEvento({ evento, grupos }: Props) {
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);
    const [todos, setTodos] = useState(evento.todos_os_grupos);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const gruposSelecionados = todos
            ? []
            : formData.getAll("grupos_envolvidos");

        const dados = {
            id: evento.id,
            titulo: formData.get("titulo"),
            faixa_etaria: formData.get("faixa_etaria"),
            descricao: formData.get("descricao"),
            equipe: (formData.get("equipe") as string)
                ?.split(",")
                .map((n) => n.trim()),
            objetivo_ano: formData.get("objetivo_ano"),
            convite: formData.get("convite"),
            data_inicio: formData.get("data_inicio"),
            data_fim: formData.get("data_fim"),
            grupos_envolvidos: gruposSelecionados,
            todos_os_grupos: todos,
            visibilidade: formData.get("visibilidade"),
        };

        const resposta = await fetch("/api/eventos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            setStatus("Evento atualizado com sucesso.");
            setTimeout(() => router.push("/admin/eventos"), 800);
        } else {
            setStatus("Erro ao atualizar evento.");
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
                            color: "#ff6136",
                            cursor: "pointer",
                            padding: 0,
                            fontSize: "0.9rem",
                            fontWeight: 500,
                        }}
                    >
                        ← Voltar à administração
                    </button>
                </p>

                <div
                    style={{
                        borderBottom: "3px solid #ff6136",
                        paddingBottom: "0.8rem",
                        marginBottom: "2rem",
                    }}
                >
                    <h1 style={{ margin: 0, color: "#3e4647" }}>
                        Editar Evento
                    </h1>
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.2rem",
                    }}
                >
                    <h3 style={{ color: "#ff6136" }}>Identidade</h3>

                    <input
                        name="titulo"
                        defaultValue={evento.titulo}
                        required
                    />

                    <input
                        name="faixa_etaria"
                        defaultValue={evento.faixa_etaria}
                    />

                    <textarea
                        name="descricao"
                        defaultValue={evento.descricao}
                        rows={3}
                    />

                    <h3 style={{ color: "#4bbbc8", marginTop: "1.5rem" }}>
                        Datas
                    </h3>

                    <input
                        type="date"
                        name="data_inicio"
                        defaultValue={evento.data_inicio}
                        required
                    />

                    <input
                        type="date"
                        name="data_fim"
                        defaultValue={evento.data_fim || ""}
                    />

                    <h3 style={{ color: "#c77e4a", marginTop: "1.5rem" }}>
                        Grupos Envolvidos
                    </h3>

                    <label>
                        <input
                            type="radio"
                            name="modo_grupo"
                            checked={todos}
                            onChange={() => setTodos(true)}
                        />
                        Todos os grupos
                    </label>

                    <label style={{ marginTop: "0.5rem" }}>
                        <input
                            type="radio"
                            name="modo_grupo"
                            checked={!todos}
                            onChange={() => setTodos(false)}
                        />
                        Selecionar grupo(s)
                    </label>

                    {!todos && (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.4rem",
                                marginTop: "0.5rem",
                                padding: "1rem",
                                border: "1px solid #e0ddd7",
                                borderRadius: "8px",
                                backgroundColor: "#faf9f6",
                            }}
                        >
                            {grupos.map((g) => (
                                <label
                                    key={g.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        name="grupos_envolvidos"
                                        value={g.id}
                                        defaultChecked={
                                            evento.grupos_envolvidos?.includes(g.id)
                                        }
                                    />
                                    {g.nome}
                                </label>
                            ))}
                        </div>
                    )}

                    <h3 style={{ color: "#548287", marginTop: "1.5rem" }}>
                        Equipe
                    </h3>

                    <input
                        name="equipe"
                        defaultValue={evento.equipe?.join(", ")}
                        placeholder="Responsáveis separados por vírgula"
                    />

                    <h3 style={{ marginTop: "1.5rem" }}>
                        Objetivo do Ano
                    </h3>

                    <textarea
                        name="objetivo_ano"
                        defaultValue={evento.objetivo_ano}
                        rows={3}
                    />

                    <h3 style={{ marginTop: "1.5rem" }}>
                        Convite
                    </h3>

                    <textarea
                        name="convite"
                        defaultValue={evento.convite}
                        rows={2}
                    />

                    <select
                        name="visibilidade"
                        defaultValue={evento.visibilidade}
                    >
                        <option value="publico">Público</option>
                        <option value="interno">Interno</option>
                    </select>

                    <button
                        type="submit"
                        style={{
                            marginTop: "2rem",
                            padding: "0.8rem",
                            backgroundColor: "#ff6136",
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
                    <p style={{ marginTop: "1rem", color: "#3e4647" }}>
                        {status}
                    </p>
                )}
            </div>
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.id as string;

    const { data: evento } = await supabase
        .from("eventos")
        .select("*")
        .eq("id", id)
        .single();

    const grupos = await getGruposOrdenados();

    if (!evento) {
        return { notFound: true };
    }

    return {
        props: {
            evento,
            grupos,
        },
    };
};