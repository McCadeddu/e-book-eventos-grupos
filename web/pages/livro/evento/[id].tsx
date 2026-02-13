// web/pages/livro/evento/[id].tsx

import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import { getEventos } from "../../../lib/db/eventos";
import { getGruposOrdenados } from "../../../lib/db/grupos";
import { formatarDataIntervalo } from "../../../lib/encontros-utils";

export default function PaginaEvento({ evento, grupos }) {
    if (!evento) return null;

    const nomesGrupos = evento.todos_os_grupos
        ? "Todos os grupos"
        : grupos
            .filter(g => evento.grupos_envolvidos?.includes(g.id))
            .map(g => g.nome)
            .join(", ");

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
                    borderRadius: "12px",
                    padding: "3rem",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                }}
            >
                {/* BOTÃO VOLTAR */}
                <div style={{ marginBottom: "2rem" }}>
                    <Link href="/livro/calendario">
                        <span
                            style={{
                                display: "inline-block",
                                padding: "0.4rem 0.9rem",
                                borderRadius: "999px",
                                backgroundColor: "#f1e5ae",
                                color: "#3e4647",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                cursor: "pointer",
                            }}
                        >
                            ← Voltar ao Calendário
                        </span>
                    </Link>
                </div>

                {/* CABEÇALHO */}
                <div
                    style={{
                        borderLeft: "6px solid #ff6136",
                        paddingLeft: "1.5rem",
                        marginBottom: "2.5rem",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                            textTransform: "uppercase",
                            fontSize: "2rem",
                            color: "#3e4647",
                            letterSpacing: "1px",
                        }}
                    >
                        {evento.titulo}
                    </h1>

                    {evento.faixa_etaria && (
                        <p style={{ marginTop: "0.6rem", fontStyle: "italic" }}>
                            {evento.faixa_etaria}
                        </p>
                    )}

                    <p style={{ marginTop: "0.8rem", fontWeight: 600 }}>
                        {formatarDataIntervalo(
                            evento.data_inicio,
                            evento.data_fim
                        )}
                    </p>

                    {!evento.todos_os_grupos && evento.grupos_envolvidos?.length > 0 && (
                        <div style={{ marginTop: "1rem" }}>
                            <h3 style={{ color: "#ff6136", marginBottom: "0.5rem" }}>
                                São envolvidos os membros de:
                            </h3>

                            <ul style={{ paddingLeft: "1rem" }}>
                                {grupos
                                    .filter(g => evento.grupos_envolvidos.includes(g.id))
                                    .map(g => (
                                        <li key={g.id}>{g.nome}</li>
                                    ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* DESCRIÇÃO */}
                {evento.descricao && (
                    <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ color: "#ff6136" }}>
                            Sobre o Evento
                        </h2>
                        <p>{evento.descricao}</p>
                    </section>
                )}

                {/* OBJETIVO */}
                {evento.objetivo_ano && (
                    <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ color: "#4bbbc8" }}>
                            Objetivo do Ano
                        </h2>
                        <p>{evento.objetivo_ano}</p>
                    </section>
                )}

                {/* EQUIPE */}
                {evento.equipe && (
                    <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ color: "#c77e4a" }}>
                            Equipe Responsável
                        </h2>
                        <p>{evento.equipe}</p>
                    </section>
                )}

                {/* CONVITE */}
                {evento.convite && (
                    <section>
                        <h2 style={{ color: "#548287" }}>
                            Convite
                        </h2>
                        <p>{evento.convite}</p>
                    </section>
                )}
            </div>
        </main>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const eventos = await getEventos();

    const paths = eventos.map(e => ({
        params: { id: e.id },
    }));

    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const eventos = await getEventos();
    const grupos = await getGruposOrdenados();

    const evento = eventos.find(e => e.id === params?.id);

    return {
        props: { evento, grupos },
        revalidate: 60,
    };
};
