// web/pages/admin/eventos/index.tsx

import { GetServerSideProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../../../lib/supabaseClient";

type Evento = {
    id: string;
    titulo: string;
    data_inicio: string;
    data_fim?: string | null;
    todos_os_grupos: boolean;
    grupos_envolvidos?: string[];
};

type Grupo = {
    id: string;
    nome: string;
};

type Props = {
    eventos: Evento[];
    grupos: Grupo[];
};

export default function AdminEventos({ eventos, grupos }: Props) {
    const router = useRouter();

    async function excluir(id: string) {
        if (!confirm("Excluir evento?")) return;

        await fetch("/api/eventos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });

        router.replace(router.asPath);
    }

    function nomesGrupos(evento: Evento) {
        if (evento.todos_os_grupos) return "Todos os grupos";

        const nomes = grupos
            .filter((g) => evento.grupos_envolvidos?.includes(g.id))
            .map((g) => g.nome);

        return nomes.join(", ");
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
                    maxWidth: "900px",
                    margin: "0 auto",
                    backgroundColor: "#ffffff",
                    borderRadius: "10px",
                    padding: "2.5rem",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
            >
                <p style={{ marginBottom: "1.5rem" }}>
                    <Link href="/admin/grupos">
                        <button
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
                            ← Voltar para Grupos e Eventos
                        </button>
                    </Link>
                </p>

                <div
                    style={{
                        borderBottom: "3px solid #ff6136",
                        paddingBottom: "0.8rem",
                        marginBottom: "2rem",
                    }}
                >
                    <h1 style={{ margin: 0 }}>Administração de Eventos</h1>
                </div>

                <div style={{ marginBottom: "2rem" }}>
                    <Link href="/admin/eventos/novo">
                        <button
                            style={{
                                padding: "0.6rem 1.2rem",
                                backgroundColor: "#ff6136",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            ➕ Novo Evento
                        </button>
                    </Link>
                </div>

                {eventos.length === 0 && (
                    <p>Nenhum evento cadastrado.</p>
                )}

                {eventos.map((evento) => (
                    <div
                        key={evento.id}
                        style={{
                            border: "1px solid #e0ddd7",
                            borderRadius: "8px",
                            padding: "1rem",
                            marginBottom: "1rem",
                        }}
                    >
                        <strong>
                            {evento.data_inicio}
                        </strong>
                        {" — "}
                        <span style={{ fontWeight: 600 }}>
                            {evento.titulo}
                        </span>

                        <div style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
                            {nomesGrupos(evento)}
                        </div>

                        <div style={{ marginTop: "0.6rem" }}>
                            <Link href={`/admin/eventos/editar/${evento.id}`}>
                                <button
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#4bbbc8",
                                        cursor: "pointer",
                                        marginRight: "1rem"
                                    }}
                                >
                                    ✏️ Editar
                                </button>
                            </Link>

                            <button
                                onClick={() => excluir(evento.id)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "darkred",
                                    cursor: "pointer",
                                }}
                            >
                                🗑 Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    const { data: eventos } = await supabase
        .from("eventos")
        .select("*")
        .order("data_inicio", { ascending: true });

    const { data: grupos } = await supabase
        .from("grupos")
        .select("id, nome");

    return {
        props: {
            eventos: eventos || [],
            grupos: grupos || [],
        },
    };
};