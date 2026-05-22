import { GetServerSideProps } from "next";
import { supabase } from "../../../../lib/supabaseClient";
import { useRouter } from "next/router";
import { useState, useRef } from "react";
import { Encontro } from "../../../../lib/encontros-utils";
import { getEventos } from "../../../../lib/db/eventos";

type Props = {
    encontro: Encontro;
    eventos: any[];
};

export default function EditarEncontro({ encontro, eventos }: Props) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [eventoId, setEventoId] = useState<string | null>(
        encontro.evento_id || null
    );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSalvando(true);
        setStatus(null);

        const formData = new FormData(event.currentTarget);
        const eventoIdSelecionado =
            String(formData.get("evento_id") || "").trim() || null;
        const dataInicio =
            String(formData.get("data_inicio") || "").trim() ||
            encontro.data_inicio ||
            null;
        const dataFimBruta = String(formData.get("data_fim") || "").trim();

        const dadosAtualizados = {
            id: encontro.id,
            grupo_id: eventoIdSelecionado ? null : encontro.grupo_id,
            tipo: formData.get("tipo"),
            data_inicio: dataInicio,
            data_fim: dataFimBruta || null,
            data_legivel: formData.get("data_legivel") || "",
            titulo: formData.get("titulo"),
            horario: formData.get("horario"),
            local: formData.get("local"),
            visibilidade: formData.get("visibilidade"),
            evento_id: eventoIdSelecionado,
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
            return;
        }

        setStatus(resultado.erro || "Erro ao atualizar encontro.");
        setSalvando(false);
    }

    return (
        <main style={{ padding: "2rem", maxWidth: "700px", margin: "0 auto" }}>
            <h1>Editar Encontro</h1>

            <p>
                <button onClick={() => router.back()}>Voltar ao grupo</button>
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

                <br />
                <br />

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

                <br />
                <br />

                <label>
                    Data de inicio
                    <br />
                    <input
                        type="date"
                        name="data_inicio"
                        defaultValue={encontro.data_inicio || ""}
                        required
                    />
                </label>

                <br />
                <br />

                <label>
                    Data de fim
                    <br />
                    <input
                        type="date"
                        name="data_fim"
                        defaultValue={encontro.data_fim || ""}
                    />
                </label>

                <br />
                <br />

                <label>
                    Data legivel (opcional)
                    <br />
                    <input
                        name="data_legivel"
                        defaultValue={encontro.data_legivel || ""}
                        placeholder="Ex: 15-17 de maio · Grand Prix"
                    />
                </label>

                <br />
                <br />

                <label>
                    Titulo
                    <br />
                    <input name="titulo" defaultValue={encontro.titulo || ""} />
                </label>

                <br />
                <br />

                <label>
                    Horario
                    <br />
                    <input name="horario" defaultValue={encontro.horario || ""} />
                </label>

                <br />
                <br />

                <label>
                    Local
                    <br />
                    <input name="local" defaultValue={encontro.local || ""} />
                </label>

                <br />
                <br />

                <label>
                    Visibilidade no e-book
                    <br />
                    <select
                        name="visibilidade"
                        defaultValue={encontro.visibilidade}
                    >
                        <option value="publico">Publico no e-book</option>
                        <option value="interno">Oculto no e-book</option>
                    </select>
                </label>

                <br />
                <br />

                <button type="submit" disabled={salvando}>
                    {salvando ? "Salvando..." : "Salvar alteracoes"}
                </button>
            </form>

            {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id } = context.params as { id: string };

    const { data: encontro, error } = await supabase
        .from("encontros")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !encontro) {
        return { notFound: true };
    }

    const eventos = await getEventos();

    return {
        props: {
            encontro,
            eventos,
        },
    };
};
