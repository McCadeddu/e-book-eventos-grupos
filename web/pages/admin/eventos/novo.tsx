// web/pages/admin/eventos/novo.tsx

import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { getGruposOrdenados } from "../../../lib/db/grupos";

type Grupo = {
    id: string;
    nome: string;
};

type Props = {
    grupos: Grupo[];
};

export default function NovoEvento({ grupos }: Props) {
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);
    const [todos, setTodos] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const gruposSelecionados = todos
            ? []
            : formData.getAll("grupos_envolvidos");

        const dados = {
            titulo: (formData.get("titulo") as string)?.toUpperCase(),
            faixa_etaria: formData.get("faixa_etaria"),
            descricao: formData.get("descricao"),
            equipe: (formData.get("equipe") as string)
                ?.split(",")
                .map((n) => n.trim()),
            objetivo_ano: formData.get("objetivo_ano"),
            convite: formData.get("convite"),
            grupos_envolvidos: gruposSelecionados,
            todos_os_grupos: todos,
            visibilidade: formData.get("visibilidade"),
        };

        const resposta = await fetch("/api/eventos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            setStatus("Evento criado com sucesso.");
            setTimeout(() => router.push("/admin/eventos"), 1000);
        } else {
            setStatus("Erro ao criar evento.");
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
                        Novo Evento
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
                        placeholder="Título do evento"
                        required
                    />

                    <input
                        name="faixa_etaria"
                        placeholder="Faixa etária"
                    />

                    <textarea
                        name="descricao"
                        placeholder="Descrição do evento"
                        rows={3}
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
                        Selecionar grupo
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
                        placeholder="Responsáveis separados por vírgula"
                    />

                    <h3 style={{ marginTop: "1.5rem" }}>
                        Objetivo do Ano
                    </h3>

                    <textarea name="objetivo_ano" rows={3} />

                    <h3 style={{ marginTop: "1.5rem" }}>
                        Convite
                    </h3>

                    <textarea name="convite" rows={2} />

                    <select name="visibilidade">
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
                        Criar Evento
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

export const getServerSideProps: GetServerSideProps = async () => {
    const grupos = await getGruposOrdenados();

    return {
        props: {
            grupos,
        },
    };
};