// web/pages/admin/eventos/[id]/editar-encontro/[encontroId].tsx

import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Encontro = {
    id: string;
    evento_id: string;
    tipo: string;
    data_inicio: string;
    data_fim?: string;
    titulo?: string;
    horario?: string;
    local?: string;
};

type Props = {
    encontro: Encontro;
};

export default function EditarEncontroEvento({ encontro }: Props) {
    const router = useRouter();
    const [status, setStatus] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const formData = new FormData(e.currentTarget);

        const dados = {
            id: encontro.id,
            evento_id: encontro.evento_id,
            grupo_id: null,
            tipo: formData.get("tipo"),
            data_inicio: formData.get("data_inicio"),
            data_fim: formData.get("data_fim"),
            titulo: formData.get("titulo"),
            horario: formData.get("horario"),
            local: formData.get("local"),
        };

        const resposta = await fetch("/api/encontros", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            setStatus("Atualizado com sucesso.");
            setTimeout(() => router.push(`/admin/eventos/editar/${encontro.evento_id}`), 800);
        } else {
            setStatus("Erro ao atualizar.");
        }
    }

    return (
        <main style={{ padding: "3rem" }}>
            <h1>Editar Encontro</h1>

            <form onSubmit={handleSubmit}
                style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}
            >
                <select name="tipo" defaultValue={encontro.tipo}>
                    <option value="pre-evento">Pré-evento</option>
                    <option value="evento">Evento</option>
                    <option value="pos-evento">Pós-evento</option>
                </select>

                <input type="date" name="data_inicio" defaultValue={encontro.data_inicio} />
                <input type="date" name="data_fim" defaultValue={encontro.data_fim || ""} />
                <input name="titulo" defaultValue={encontro.titulo} />
                <input name="horario" defaultValue={encontro.horario} />
                <input name="local" defaultValue={encontro.local} />

                <button type="submit">Salvar</button>
            </form>

            {status && <p>{status}</p>}
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const encontroId = context.params?.encontroId as string;

    const { data: encontro } = await supabase
        .from("encontros")
        .select("*")
        .eq("id", encontroId)
        .single();

    if (!encontro) return { notFound: true };

    return { props: { encontro } };
};
