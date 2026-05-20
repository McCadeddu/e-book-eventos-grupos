import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";

import { Encontro } from "../../../../../lib/encontros-utils";
import { formatarDataIntervalo } from "../../../../../lib/encontros-utils";
import { listarAnosEbook } from "../../../../../lib/ebook-config";
import { carregarEventoLivroPorAno } from "../../../../../lib/livro-ano";
import { getEventosStrict } from "../../../../../lib/db/eventos";
import { Grupo } from "../../../../../lib/types";

type Props = {
    ano: number;
    evento: any;
    grupos: Grupo[];
    encontros: Encontro[];
};

export default function PaginaEventoEdicao({ ano, evento, grupos, encontros }: Props) {
    if (!evento) return null;

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
                <div style={{ marginBottom: "2rem" }}>
                    <Link href={`/livro/edicao/${ano}/calendario`}>
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
                            ← Voltar ao Calendário {ano}
                        </span>
                    </Link>
                </div>

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

                    {!evento.todos_os_grupos && evento.grupos_envolvidos?.length > 0 && (
                        <div style={{ marginTop: "1rem" }}>
                            <h3 style={{ color: "#ff6136", marginBottom: "0.5rem" }}>
                                São envolvidos os membros de:
                            </h3>

                            <ul style={{ paddingLeft: "1rem" }}>
                                {grupos
                                    .filter((g) => evento.grupos_envolvidos.includes(g.id))
                                    .map((g) => (
                                        <li key={g.id}>{g.nome}</li>
                                    ))}
                            </ul>
                        </div>
                    )}
                </div>

                {encontros.length > 0 && (
                    <section style={{ marginBottom: "2.5rem" }}>
                        <h2 style={{ color: "#ff6136" }}>Agenda do Evento</h2>

                        <ul style={{ marginTop: "1rem" }}>
                            {encontros.map((encontro: any) => (
                                <li key={encontro.id} style={{ marginBottom: "1rem" }}>
                                    <strong>
                                        {encontro.data_legivel ||
                                            formatarDataIntervalo(
                                                encontro.data_inicio,
                                                encontro.data_fim
                                            )}
                                    </strong>

                                    {encontro.titulo && ` — ${encontro.titulo}`}

                                    {(encontro.horario || encontro.local) && (
                                        <div
                                            style={{
                                                fontSize: "0.9rem",
                                                marginTop: "0.3rem",
                                                color: "#555",
                                            }}
                                        >
                                            {encontro.horario && <span>🕒 {encontro.horario}</span>}
                                            {encontro.horario && encontro.local && " · "}
                                            {encontro.local && <span>📍 {encontro.local}</span>}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {evento.descricao && (
                    <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ color: "#ff6136" }}>Sobre o Evento</h2>
                        <p>{evento.descricao}</p>
                    </section>
                )}

                {evento.objetivo_ano && (
                    <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ color: "#4bbbc8" }}>Objetivo do Ano</h2>
                        <p>{evento.objetivo_ano}</p>
                    </section>
                )}

                {evento.equipe && (
                    <section style={{ marginBottom: "2rem" }}>
                        <h2 style={{ color: "#c77e4a" }}>Equipe Responsável</h2>
                        <div style={{ marginTop: "0.8rem" }}>
                            {evento.equipe.map((nome: string) => (
                                <span
                                    key={nome}
                                    style={{
                                        display: "inline-block",
                                        backgroundColor: "#f3ede3",
                                        padding: "4px 10px",
                                        borderRadius: "999px",
                                        fontSize: "0.85rem",
                                        marginRight: "6px",
                                        marginBottom: "6px",
                                    }}
                                >
                                    {nome}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {evento.convite && (
                    <section>
                        <h2 style={{ color: "#548287" }}>Convite</h2>
                        <p>{evento.convite}</p>
                    </section>
                )}
            </div>
        </main>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const eventos = await getEventosStrict();
    const paths: { params: { ano: string; id: string } }[] = [];

    for (const ano of await listarAnosEbook()) {
        for (const evento of eventos) {
            paths.push({
                params: { ano: String(ano), id: evento.id },
            });
        }
    }

    return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const ano = Number(params?.ano);
    const id = String(params?.id);
    const dados = await carregarEventoLivroPorAno(ano, id);

    if (!dados) {
        return { notFound: true };
    }

    return {
        props: dados,
        revalidate: 60,
    };
};
