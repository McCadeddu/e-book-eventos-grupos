import fs from "fs";
import path from "path";

export type EbookConfig = {
    ano: number;
    titulo: string;
    subtitulo: string;
    botao_texto: string;
    capas: string[];
    logo: string;
};

type EbookCollection = {
    ano_atual: number;
    edicoes: EbookConfig[];
};

function caminhoData(nomeArquivo: string) {
    return path.join(process.cwd(), "..", "data", nomeArquivo);
}

export function carregarEdicoesEbook(): {
    anoAtual: number;
    edicoes: EbookConfig[];
} {
    const caminhoColecao = caminhoData("ebooks.json");

    if (fs.existsSync(caminhoColecao)) {
        const conteudo = fs.readFileSync(caminhoColecao, "utf-8");
        const dados = JSON.parse(conteudo) as EbookCollection;

        return {
            anoAtual: dados.ano_atual,
            edicoes: dados.edicoes ?? [],
        };
    }

    const caminhoLegado = caminhoData("ebook.json");
    const conteudoLegado = fs.readFileSync(caminhoLegado, "utf-8");
    const edicaoLegada = JSON.parse(conteudoLegado) as EbookConfig;

    return {
        anoAtual: edicaoLegada.ano,
        edicoes: [edicaoLegada],
    };
}

export function carregarEbookAtual() {
    const { anoAtual, edicoes } = carregarEdicoesEbook();
    const ebookAtual =
        edicoes.find((edicao) => edicao.ano === anoAtual) ?? edicoes[0];

    if (!ebookAtual) {
        throw new Error("Nenhuma edição de e-book foi configurada.");
    }

    return ebookAtual;
}

export function getAnoAtualEbook() {
    return carregarEbookAtual().ano;
}

export function carregarEbookPorAno(ano: number) {
    const { edicoes } = carregarEdicoesEbook();
    return edicoes.find((edicao) => edicao.ano === ano) ?? null;
}

export function pertenceAoAno(
    dataIso: string | null | undefined,
    ano: number
) {
    if (!dataIso) {
        return false;
    }

    return Number(dataIso.slice(0, 4)) === ano;
}
