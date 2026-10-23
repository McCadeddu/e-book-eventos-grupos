export function lerAnoPastoral(valor: unknown): number | null {
    if (typeof valor !== "number" && typeof valor !== "string") return null;
    if (!/^\d{4}$/.test(String(valor))) return null;
    const ano = Number(valor);
    return Number.isInteger(ano) && ano >= 2020 && ano <= 9998 ? ano : null;
}

export function dataDoAnoPastoral(data: unknown, ano: number): boolean {
    if (typeof data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
    const date = new Date(`${data}T12:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === data &&
        Number(data.slice(0, 4)) === ano;
}

export function erroDatasDoAno(inicio: unknown, fim: unknown, ano: number): string | null {
    if (!dataDoAnoPastoral(inicio, ano)) return `Informe uma data de início válida de ${ano}.`;
    if (fim === undefined || fim === null || fim === "") return null;
    if (typeof fim !== "string" || !dataDoAnoPastoral(fim, Number(fim.slice(0, 4)))) {
        return "Informe uma data de término válida.";
    }
    if (fim < String(inicio)) return "A data de término não pode ser anterior ao início.";
    return null;
}
