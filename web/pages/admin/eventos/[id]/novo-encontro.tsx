// web/pages/admin/eventos/[id]/novo-encontro.tsx

import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { supabase } from "../../../../lib/supabaseClient";

type Evento = {
    id: string;
    titulo: string;
};

type Props = {
    evento: Evento;
};

export default function NovoEncontroEvento({ evento }: Props) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [nivelSelecionado, setNivelSelecionado] = useState("evento");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const nivel = formData.get("nivel");

        const dados = {
            evento_id: evento.id,
            grupoId: null,
            tipo: formData.get("tipo"),
            dataInicio: formData.get("dataInicio"),
            dataFim: formData.get("dataFim"),
            dataLegivel: formData.get("dataLegivel"),
            titulo: formData.get("titulo"),
            horario: formData.get("horario"),
            local: formData.get("local"),
            visibilidade: formData.get("visibilidade"),

            // 🔵 novos campos
            nivel,
            mostrar_no_anual:
                nivel === "evento"
                    ? formData.get("mostrar_no_anual") === "on"
                    : false,
        };

        const resposta = await fetch("/api/encontros", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            setStatus("Encontro criado com sucesso.");
            formRef.current?.reset();
            setTimeout(() => router.push(`/admin/eventos/editar/${evento.id}`), 800);
        } else {
            setStatus("Erro ao criar encontro.");
        }
    }

    return (
        <main style={{ padding: "3rem" }}>
            <h1>Novo Encontro – {evento.titulo}</h1>

            <form ref={formRef} onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}
            >
                <select
                    name="nivel"
                    required
                    value={nivelSelecionado}
                    onChange={(e) => setNivelSelecionado(e.target.value)}
                >
                    <option value="evento">Evento principal</option>
                    <option value="organizacao">Equipe organizativa</option>
                </select>

                <label style={{ opacity: nivelSelecionado === "organizacao" ? 0.5 : 1 }}>
                    <input
                        type="checkbox"
                        name="mostrar_no_anual"
                        defaultChecked
                        disabled={nivelSelecionado === "organizacao"}
                    />
                    Mostrar no calendário anual
                </label>

                <select name="tipo" required>
                    <option value="evento">Evento</option>
                    <option value="preparacao">Preparação</option>
                    <option value="avaliacao">Avaliação</option>
                </select>

                <input type="date" name="dataInicio" required />
                <input type="date" name="dataFim" />
                <input name="dataLegivel" placeholder="Ex: 15–17 maio · Retiro" />
                <input name="titulo" placeholder="Título" />
                <input name="horario" placeholder="Horário" />
                <input name="local" placeholder="Local" />

                <select name="visibilidade">
                    <option value="publico">Público</option>
                    <option value="interno">Interno</option>
                </select>

                <button type="submit">Salvar</button>
            </form>

            {status && <p>{status}</p>}
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.params?.id as string;

    const { data: evento } = await supabase
        .from("eventos")
        .select("id, titulo")
        .eq("id", id)
        .single();

    if (!evento) return { notFound: true };

    return { props: { evento } };
};