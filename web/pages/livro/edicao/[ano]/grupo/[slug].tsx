import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import PixAlmoco from "../../../../../components/PixAlmoco";
import { Encontro, formatarDataIntervalo, ordenarEncontrosPorData } from "../../../../../lib/encontros-utils";
import { listarAnosEbook } from "../../../../../lib/ebook-config";
import { carregarCapituloLivroPorAno } from "../../../../../lib/livro-ano";
import { getGruposOrdenadosStrict } from "../../../../../lib/db/grupos";
import { Grupo } from "../../../../../lib/types";

type Props = {
    ano: number;
    grupo: Grupo;
    grupos: Grupo[];
    encontros: Encontro[];
    eventosDoGrupo: any[];
};

export default function CapituloEdicaoLivro({
    ano,
    grupo,
    grupos,
    encontros,
    eventosDoGrupo,
}: Props) {
    const router = useRouter();
    const [animando, setAnimando] = useState(true);

    useEffect(() => {
        setAnimando(true);
        const timer = setTimeout(() => setAnimando(false), 300);
        return () => clearTimeout(timer);
    }, [router.asPath]);

    const encontrosOrdenados = ordenarEncontrosPorData(encontros);
    const coresCMV = ["#4bbbc8", "#ff6136", "#443205", "#c77e4a", "#548287", "#725e50"];
    const indiceGrupoAtual = grupos.findIndex((g) => g.id === grupo.id);
    const corGrupoAtual = coresCMV[indiceGrupoAtual % coresCMV.length];

    return (
        <main style={{ display: "flex", minHeight: "100vh", background: "#fdfcf8" }}>
            <aside
                style={{
                    width: "90px",
                    position: "sticky",
                    top: "0",
                    height: "100vh",
                    overflowY: "auto",
                    padding: "1rem 0.5rem",
                    backgroundColor: "#faf8f3",
                    borderRight: "1px solid #e8e3d9",
                }}
            >
                {grupos.map((g, index) => {
                    const ativo = g.id === grupo.id;

                    return (
                        <Link
                            key={g.id}
                            href={`/livro/edicao/${ano}/grupo/${g.slug}`}
                            style={{ textDecoration: "none" }}
                        >
                            <span
                                style={{
                                    display: "block",
                                    writingMode: "vertical-rl",
                                    margin: "0.6rem 0",
                                    padding: "0.7rem 0.4rem",
                                    borderRadius: "8px",
                                    backgroundColor: coresCMV[index % coresCMV.length],
                                    color: "#ffffff",
                                    fontSize: "0.75rem",
                                    fontWeight: ativo ? 700 : 500,
                                    opacity: ativo ? 1 : 0.65,
                                    transform: ativo ? "scale(1.05)" : "scale(1)",
                                }}
                            >
                                {g.nome}
                            </span>
                        </Link>
                    );
                })}
            </aside>

            <section
                style={{
                    flex: 1,
                    padding: "3rem",
                    maxWidth: "950px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2.5rem",
                    opacity: animando ? 0 : 1,
                    transform: animando ? "translateY(20px)" : "translateY(0)",
                    transition: "all 0.35s ease",
                }}
            >
                <div style={{ marginBottom: "1rem" }}>
                    <Link
                        href={`/livro/edicao/${ano}/calendario`}
                        style={{
                            display: "inline-flex",
                            padding: "0.45rem 0.9rem",
                            borderRadius: "999px",
                            backgroundColor: "#f1e5ae",
                            color: "#3e4647",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            textDecoration: "none",
                        }}
                    >
                        Voltar ao Calendário anual {ano}
                    </Link>
                </div>

                <div
                    style={{
                        padding: "2rem",
                        backgroundColor: corGrupoAtual,
                        color: "#ffffff",
                        borderRadius: "8px",
                    }}
                >
                    <h1>{grupo.nome}</h1>
                    <p><em>{grupo.faixa_etaria}</em></p>
                    <p>{grupo.descricao}</p>

                    <h2 style={{ marginTop: "2rem" }}>Objetivo do Ano</h2>
                    <p>{grupo.objetivo_ano}</p>

                    <h2 style={{ marginTop: "2rem" }}>Equipe</h2>
                    <ul>
                        {grupo.equipe.map((nome) => (
                            <li key={nome}>{nome}</li>
                        ))}
                    </ul>

                    <h2 style={{ marginTop: "2rem" }}>Convite</h2>
                    <p>{grupo.convite_final}</p>

                    <PixAlmoco />
                </div>

                <section
                    style={{
                        backgroundColor: "#ffffff",
                        padding: "2rem",
                        borderRadius: "8px",
                    }}
                >
                    <h2 style={{ marginBottom: "1rem" }}>Agenda dos Encontros</h2>

                    {encontrosOrdenados.length === 0 && <p>Nenhum encontro cadastrado.</p>}

                    <ul>
                        {encontrosOrdenados.map((encontro: any) => {
                            const ehEvento = !!encontro.evento_id;
                            const ehOrganizacao = encontro.nivel === "organizacao";

                            return (
                                <li
                                    key={encontro.id}
                                    style={{
                                        marginBottom: "1rem",
                                        padding: "0.8rem",
                                        borderRadius: "8px",
                                        border: ehOrganizacao
                                            ? "1px solid #ffd7c8"
                                            : ehEvento
                                                ? "1px solid #ffe3d8"
                                                : "1px solid #e0ddd7",
                                        backgroundColor: ehOrganizacao
                                            ? "#fff5f1"
                                            : ehEvento
                                                ? "#fff9f6"
                                                : "#ffffff",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                        <strong>
                                            {encontro.data_legivel ||
                                                formatarDataIntervalo(encontro.data_inicio, encontro.data_fim)}
                                        </strong>

                                        {ehEvento && (
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    padding: "0.2rem 0.5rem",
                                                    borderRadius: "999px",
                                                    backgroundColor: ehOrganizacao ? "#ff6136" : "#4bbbc8",
                                                    color: "#ffffff",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                {ehOrganizacao ? "EQUIPE ORGANIZATIVA" : "EVENTO"}
                                            </span>
                                        )}
                                    </div>

                                    {encontro.titulo && (
                                        <div style={{ marginTop: "0.3rem" }}>
                                            {ehOrganizacao && (
                                                <strong style={{ color: "#ff6136" }}>
                                                    Equipe organizativa —{" "}
                                                </strong>
                                            )}
                                            {encontro.titulo}
                                        </div>
                                    )}

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
                            );
                        })}
                    </ul>
                </section>
            </section>

            <aside
                style={{
                    width: "90px",
                    position: "sticky",
                    top: "0",
                    height: "100vh",
                    overflowY: "auto",
                    padding: "1rem 0.5rem",
                    backgroundColor: "#fff5f1",
                    borderLeft: "1px solid #ffd7c8",
                }}
            >
                {eventosDoGrupo.map((evento: any) => (
                    <Link
                        key={evento.id}
                        href={`/livro/edicao/${ano}/evento/${evento.id}`}
                        style={{ textDecoration: "none" }}
                    >
                        <span
                            style={{
                                display: "block",
                                writingMode: "vertical-rl",
                                margin: "0.6rem 0",
                                padding: "0.7rem 0.4rem",
                                borderRadius: "8px",
                                backgroundColor: "#ff6136",
                                color: "#ffffff",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                opacity: 0.85,
                            }}
                        >
                            {evento.titulo}
                        </span>
                    </Link>
                ))}
            </aside>
        </main>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const paths: { params: { ano: string; slug: string } }[] = [];
    const grupos = await getGruposOrdenadosStrict();

    for (const ano of await listarAnosEbook()) {
        for (const grupo of grupos) {
            paths.push({
                params: { ano: String(ano), slug: grupo.slug },
            });
        }
    }

    return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const ano = Number(params?.ano);
    const slug = String(params?.slug);
    const dados = await carregarCapituloLivroPorAno(ano, slug);

    if (!dados) {
        return { notFound: true };
    }

    return {
        props: dados,
        revalidate: 60,
    };
};
