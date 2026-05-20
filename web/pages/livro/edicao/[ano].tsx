/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import { EbookConfig, listarAnosEbook, carregarEbookPorAno } from "../../../lib/ebook-config";

type Props = {
    ebook: EbookConfig;
};

export default function CapaEdicaoLivro({ ebook }: Props) {
    const capas = ebook.capas ?? [];

    return (
        <main
            style={{
                minHeight: "100vh",
                backgroundColor: "#fdfcf8",
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                paddingTop: "4rem",
            }}
        >
            <section
                style={{
                    maxWidth: "900px",
                    textAlign: "center",
                    padding: "3rem 2rem",
                }}
            >
                <p style={{ marginBottom: "1rem" }}>
                    <Link href="/livro" style={{ color: "#0b5c6b" }}>
                        Ver link oficial publicado
                    </Link>
                </p>

                <div style={{ position: "relative", width: "100%" }}>
                    {capas.map((src, index) => (
                        <div
                            key={src}
                            style={{
                                position: "relative",
                                width: "100%",
                                marginBottom: "2.5rem",
                            }}
                        >
                            <img
                                src={src}
                                alt={`Capa ${index + 1}`}
                                style={{
                                    width: "100%",
                                    borderRadius: "16px",
                                    display: "block",
                                }}
                            />

                            {index === capas.length - 1 && (
                                <img
                                    src={ebook.logo}
                                    alt="Logo"
                                    style={{
                                        position: "absolute",
                                        bottom: "20px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        height: "100px",
                                        backgroundColor: "rgba(255,255,255,0.85)",
                                        padding: "0.5rem 1.2rem",
                                        borderRadius: "12px",
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <h1 style={{ color: "#4bbbc8", fontSize: "2.5rem" }}>
                    {ebook.titulo} {ebook.ano}
                </h1>

                <p style={{ color: "#3e4647", marginBottom: "2.5rem" }}>
                    {ebook.subtitulo}
                </p>

                <Link href={`/livro/edicao/${ebook.ano}/calendario`}>
                    <button
                        style={{
                            backgroundColor: "#ff6136",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "30px",
                            padding: "0.9rem 2rem",
                            fontSize: "1.1rem",
                            cursor: "pointer",
                        }}
                    >
                        Abrir agenda {ebook.ano}
                    </button>
                </Link>
            </section>
        </main>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    const paths = (await listarAnosEbook()).map((ano) => ({
        params: { ano: String(ano) },
    }));

    return {
        paths,
        fallback: "blocking",
    };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const ano = Number(params?.ano);
    const ebook = await carregarEbookPorAno(ano);

    if (!ebook) {
        return { notFound: true };
    }

    return {
        props: { ebook },
        revalidate: 60,
    };
};
