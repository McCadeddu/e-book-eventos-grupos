// web/pages/grupos/novo.tsx

import { useState } from "react";
import { useRouter } from "next/router";

export default function NovoGrupo() {
    const [status, setStatus] = useState<string | null>(null);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const formData = new FormData(event.currentTarget);

        const dados = {
            nome: formData.get("nome"),
            faixa_etaria: formData.get("faixaEtaria"),
            descricao: formData.get("descricao"),
            equipe: formData.get("equipe"),
            objetivo_ano: formData.get("objetivoAno"),
            convite_final: formData.get("conviteFinal"),
        };


        const resposta = await fetch("/api/grupos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso && resultado.grupo?.slug) {
            router.push(`/grupos/${resultado.grupo.slug}`);
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
                        Criar Novo Grupo
                    </h1>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>

                    <h3 style={{ color: "#4bbbc8" }}>Identidade</h3>

                    <input name="nome" placeholder="Nome do grupo" required />
                    <input name="faixaEtaria" placeholder="Faixa etária" required />
                    <textarea name="descricao" placeholder="Descrição do grupo" rows={3} required />

                    <h3 style={{ color: "#ff6136", marginTop: "1.5rem" }}>Equipe</h3>
                    <input name="equipe" placeholder="Responsáveis (separados por vírgula)" />

                    <h3 style={{ color: "#c77e4a", marginTop: "1.5rem" }}>Objetivo do Ano</h3>
                    <textarea name="objetivoAno" rows={3} />

                    <h3 style={{ color: "#548287", marginTop: "1.5rem" }}>Convite</h3>
                    <textarea name="conviteFinal" rows={2} />

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
                        Salvar Grupo
                    </button>
                </form>
            </div>
        </main>
    );
}