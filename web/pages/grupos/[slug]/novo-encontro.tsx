import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { getGrupoPorSlug } from "../../../lib/db/grupos";
import { getEventos } from "../../../lib/db/eventos";

type Grupo = {
    id: string;
    nome: string;
    slug: string;
};

type Props = {
    grupo: Grupo;
    eventos: any[];
};

export default function NovoEncontro({ grupo, eventos }: Props) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);
    const [eventoId, setEventoId] = useState<string | null>(null);

    if (!grupo) {
        return <p>Grupo nao encontrado.</p>;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setStatus(null);

        const formData = new FormData(event.currentTarget);
        const eventoIdSelecionado =
            String(formData.get("evento_id") || "").trim() || null;
        const dataInicio = String(formData.get("dataInicio") || "").trim();
        const dataFim = String(formData.get("dataFim") || "").trim();

        const dados = {
            grupoId: eventoIdSelecionado ? null : grupo.id,
            tipo: formData.get("tipo"),
            dataInicio,
            dataFim: dataFim || null,
            dataLegivel: formData.get("dataLegivel"),
            titulo: formData.get("titulo"),
            horario: formData.get("horario"),
            local: formData.get("local"),
            visibilidade: formData.get("visibilidade"),
            evento_id: eventoIdSelecionado,
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
                setEventoId(null);
                return;
            }

            setStatus(resultado.erro || "Erro ao salvar encontro.");
        } catch (error) {
            console.error(error);
            setStatus("Erro inesperado ao salvar.");
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
                    maxWidth: "700px",
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
                        Voltar a administracao dos grupos
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
                        Novo encontro - {grupo.nome}
                    </h1>
                </div>

                <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
                >
                    <select name="tipo" required>
                        <option value="encontro_regular">Encontro regular</option>
                        <option value="evento_especial">Evento especial</option>
                    </select>

                    <label>
                        Vincular a evento (opcional)
                        <br />
                        <select
                            name="evento_id"
                            value={eventoId || ""}
                            onChange={(e) => setEventoId(e.target.value || null)}
                        >
                            <option value="">Nenhum</option>
                            {eventos.map((evento) => (
                                <option key={evento.id} value={evento.id}>
                                    {evento.titulo}
                                </option>
                            ))}
                        </select>
                    </label>

                    <input type="date" name="dataInicio" required />
                    <input type="date" name="dataFim" />

                    <input
                        name="dataLegivel"
                        placeholder="Ex: 15-17 de maio · Grand Prix"
                    />

                    <input name="titulo" placeholder="Titulo do encontro" />
                    <input name="horario" placeholder="Horario" />
                    <input name="local" placeholder="Local" />

                    <select name="visibilidade">
                        <option value="publico">Publico no e-book</option>
                        <option value="interno">Oculto no e-book</option>
                    </select>

                    <button
                        type="submit"
                        style={{
                            marginTop: "1.5rem",
                            padding: "0.8rem",
                            backgroundColor: "#ff6136",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: "pointer",
                        }}
                    >
                        Salvar encontro
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
    const slug = context.params?.slug as string;

    const grupo = await getGrupoPorSlug(slug);

    if (!grupo) {
        return { notFound: true };
    }

    const eventos = await getEventos();

    return {
        props: {
            grupo,
            eventos,
        },
    };
};
