import { useState } from "react";
import type { Encontro } from "../../lib/encontros-utils";
import type { Grupo } from "../../lib/types";
import type { EventoAdmin } from "../../lib/admin-types";
import { montarAgendaPlanejamento, filtrarAgendaPlanejamento } from "../../lib/agenda-planejamento";
import { baseInputStyle, baseButtonStyle } from "./formulario-ui";
import AvisosEncontro from "./AvisosEncontro";

type Props = {
    ano: number;
    encontros: Encontro[];
    grupos: Grupo[];
    eventos: EventoAdmin[];
    gruposInativos: Grupo[];
    eventosInativos: EventoAdmin[];
    onEditar: (encontro: Encontro) => void;
};

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function AgendaPlanejamento({ ano, encontros, grupos, eventos, gruposInativos, eventosInativos, onEditar }: Props) {
    const [busca, setBusca] = useState("");
    const [mes, setMes] = useState("");
    const [situacao, setSituacao] = useState("");
    const [revisao, setRevisao] = useState("");
    const itens = montarAgendaPlanejamento(ano, encontros, grupos, eventos, gruposInativos, eventosInativos);
    const visiveis = filtrarAgendaPlanejamento(itens, busca, mes, situacao, revisao);
    const comPendencias = itens.filter(item => item.pendencias.length > 0).length;
    return (
        <details style={{ marginBottom: "1.5rem", padding: "1rem", border: "1px solid #b8d9dd", borderRadius: "12px" }}>
            <summary>Visão geral dos encontros de {ano} ({itens.length})</summary>
            <p>Agenda em ordem de data, com um registro por encontro. Os filtros não alteram os cadastros.</p>
            <p>{comPendencias} encontro(s) com informações a conferir. Os avisos ajudam na revisão, sem impedir o cadastro ou alterar sua publicação.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))", gap: "0.75rem" }}>
                <label htmlFor="agenda-busca">Buscar por nome, título, local ou horário
                    <input id="agenda-busca" type="search" value={busca} onChange={e => setBusca(e.target.value)} style={baseInputStyle()} />
                </label>
                <label htmlFor="agenda-mes">Mês
                    <select id="agenda-mes" value={mes} onChange={e => setMes(e.target.value)} style={baseInputStyle()}>
                        <option value="">Todos os meses</option>
                        {meses.map((nome, index) => <option key={nome} value={String(index + 1).padStart(2,"0")}>{nome}</option>)}
                    </select>
                </label>
                <label htmlFor="agenda-situacao">Presença no calendário público
                    <select id="agenda-situacao" value={situacao} onChange={e => setSituacao(e.target.value)} style={baseInputStyle()}>
                        <option value="">Todos os encontros</option>
                        <option value="anual">No calendário anual</option>
                        <option value="fora">Fora do calendário anual</option>
                    </select>
                </label>
                <label htmlFor="agenda-revisao">Revisão de informações
                    <select id="agenda-revisao" value={revisao} onChange={e => setRevisao(e.target.value)} style={baseInputStyle()}>
                        <option value="">Todos, com ou sem avisos</option>
                        <option value="com">Com informações a conferir</option>
                        <option value="sem">Sem avisos de preenchimento</option>
                    </select>
                </label>
            </div>
            <button type="button" onClick={() => { setBusca(""); setMes(""); setSituacao(""); setRevisao(""); }}
                style={{ ...baseButtonStyle("#edf7f8", "#234950"), marginTop: "0.75rem" }}>Limpar filtros</button>
            <p role="status" aria-live="polite">{visiveis.length} de {itens.length} encontro(s).</p>
            {itens.length === 0 ? <p>Nenhum encontro cadastrado em {ano}. Use “Novo encontro” no grupo ou evento responsável.</p>
                : visiveis.length === 0 ? <p>Nenhum encontro corresponde aos filtros. Use “Limpar filtros” para ver a agenda completa.</p>
                : <ul style={{ listStyle: "none", padding: 0, maxHeight: "34rem", overflowY: "auto" }}>
                    {visiveis.map(item => (
                        <li key={item.encontro.id} style={{ padding: "0.8rem 0", borderTop: "1px solid #dce5e6", overflowWrap: "anywhere" }}>
                            <p style={{ margin: 0 }}><strong>{item.encontro.data_inicio.split("-").reverse().join("/")}</strong>
                                {item.encontro.data_fim && item.encontro.data_fim !== item.encontro.data_inicio && ` a ${item.encontro.data_fim.split("-").reverse().join("/")}`}
                                {item.encontro.horario && ` · ${item.encontro.horario}`}</p>
                            <p style={{ margin: "0.2rem 0" }}><strong>{item.responsavel}</strong>{item.encontro.titulo && ` — ${item.encontro.titulo}`}</p>
                            {item.encontro.local && <p style={{ margin: "0.2rem 0" }}>{item.encontro.local}</p>}
                            <p style={{ margin: "0.2rem 0" }}>{item.situacao}{item.encontro.nivel === "organizacao" && " · Organização"}</p>
                            <AvisosEncontro avisos={item.pendencias} />
                            {item.podeEditar ? <button type="button" onClick={() => onEditar(item.encontro)}
                                aria-label={`Editar ${item.encontro.titulo || item.responsavel} de ${item.encontro.data_inicio.split("-").reverse().join("/")}`}
                                style={baseButtonStyle("#0b5c6b")}>Editar encontro</button>
                                : <p style={{ margin: "0.2rem 0" }}>{item.situacao === "Cadastro inativo"
                                    ? "Reative o responsável na seção de cadastros inativos para editar."
                                    : "O vínculo com o grupo ou evento precisa ser conferido."}</p>}
                        </li>
                    ))}
                </ul>}
        </details>
    );
}
