/** Apply after checking public visibility and active ownership in the selected year. */
export function nivelPermitidoNoAnual(encontro: { evento_id?: string | null; nivel?: string; mostrar_no_anual?: boolean }) {
    return !encontro.evento_id || (encontro.nivel === "evento" && encontro.mostrar_no_anual === true);
}
