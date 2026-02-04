// web/pages/grupos/novo.tsx

import { useState } from "react";
import { useRouter } from "next/router";

export default function NovoGrupo() {
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const dados = {
      nome: formData.get("nome"),
      faixa_etaria: formData.get("faixaEtaria"),
      descricao: formData.get("descricao"),
      equipe: formData.get("equipe"),
      objetivo_ano: formData.get("objetivoAno"),
      convite_final: formData.get("conviteFinal"),
    };


    const resposta = await fetch("/api/grupos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (resultado.sucesso && resultado.grupo?.slug) {
      router.push(`/grupos/${resultado.grupo.slug}`);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <p style={{ marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => router.push("/admin/grupos")}
          style={{
            background: "transparent",
            border: "none",
            color: "#0b5c6b",
            cursor: "pointer",
            padding: 0,
            fontSize: "0.95rem",
          }}
        >
          ← Voltar à administração dos grupos
        </button>
      </p>
      
      <h1>Criar Novo Grupo</h1>

      <form onSubmit={handleSubmit}>
        <h2>Identidade do Grupo</h2>

        <input name="nome" placeholder="Nome do grupo" required />
        <br /><br />

        <input
          name="faixaEtaria"
          placeholder="Faixa etária"
          required
        />
        <br /><br />

        <textarea
          name="descricao"
          placeholder="Frase explicativa do grupo"
          rows={3}
          required
        />
        <br /><br />

        <h2>Equipe</h2>
        <input
          name="equipe"
          placeholder="Responsáveis (separados por vírgula)"
        />
        <br /><br />

        <h2>Objetivo do Ano</h2>
        <textarea
          name="objetivoAno"
          placeholder="Objetivo pastoral do ano"
          rows={3}
        />
        <br /><br />

        <h2>Convite</h2>
        <textarea
          name="conviteFinal"
          placeholder="Frase final de convite"
          rows={2}
        />
        <br /><br />

        <button type="submit">Salvar Grupo</button>
      </form>

      {status && <p style={{ marginTop: "1rem" }}>{status}</p>}
    </main>
  );
}
