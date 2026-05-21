import { useEffect, useState } from "react";
import Link from "next/link";

type EbookConfig = {
  ano: number;
  titulo: string;
  subtitulo: string;
  botao_texto: string;
  capas: string[];
  logo: string;
};

type EstadoEdicoes = {
  anoPublicado: number;
  anoEmPreparacao: number;
  edicoes: EbookConfig[];
  origem?: string;
};

type FormEdicao = {
  titulo: string;
  subtitulo: string;
  botao_texto: string;
  capasTexto: string;
  logo: string;
};

type UploadKind = "logo" | "capa";

function editarParaForm(edicao: EbookConfig): FormEdicao {
  return {
    titulo: edicao.titulo,
    subtitulo: edicao.subtitulo,
    botao_texto: edicao.botao_texto,
    capasTexto: edicao.capas.join("\n"),
    logo: edicao.logo,
  };
}

export default function AdminEdicoes() {
  const [estado, setEstado] = useState<EstadoEdicoes | null>(null);
  const [novoAno, setNovoAno] = useState("");
  const [anoBase, setAnoBase] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [formularios, setFormularios] = useState<Record<number, FormEdicao>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  async function carregar() {
    setErro(null);
    const resposta = await fetch("/api/ebook-edicoes");
    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro || "Nao foi possivel carregar as edicoes.");
      return;
    }

    setEstado(dados);
    if (!anoBase && dados.edicoes?.length) {
      setAnoBase(String(dados.edicoes[dados.edicoes.length - 1].ano));
    }

    setFormularios(
      Object.fromEntries(
        (dados.edicoes ?? []).map((edicao: EbookConfig) => [
          edicao.ano,
          editarParaForm(edicao),
        ])
      )
    );
  }

  useEffect(() => {
    carregar();
  }, []);

  function atualizarFormulario(ano: number, campo: keyof FormEdicao, valor: string) {
    setFormularios((atual) => ({
      ...atual,
      [ano]: {
        ...atual[ano],
        [campo]: valor,
      },
    }));
  }

  function lerArquivoComoDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
      reader.readAsDataURL(file);
    });
  }

  async function enviarAsset(ano: number, tipo: UploadKind, files: FileList | null) {
    const arquivo = files?.[0];
    if (!arquivo) return;

    const chaveUpload = `${ano}-${tipo}`;

    setUploading((atual) => ({ ...atual, [chaveUpload]: true }));
    setMensagem(null);
    setErro(null);

    try {
      const dataUrl = await lerArquivoComoDataUrl(arquivo);
      const resposta = await fetch("/api/admin/upload-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano,
          tipo,
          fileName: arquivo.name,
          dataUrl,
        }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Nao foi possivel enviar a imagem.");
        return;
      }

      if (tipo === "logo") {
        atualizarFormulario(ano, "logo", dados.url);
      } else {
        const edicaoAtual = estado?.edicoes.find((edicao) => edicao.ano === ano);
        const formularioAtual =
          formularios[ano] ??
          (edicaoAtual ? editarParaForm(edicaoAtual) : null);

        if (!formularioAtual) {
          setErro("Nao foi possivel localizar a edicao para adicionar a capa.");
          return;
        }

        const linhas = formularioAtual.capasTexto
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean);

        atualizarFormulario(ano, "capasTexto", [...linhas, dados.url].join("\n"));
      }

      setMensagem(
        tipo === "logo"
          ? `Logo da edicao ${ano} enviado com sucesso.`
          : `Nova capa enviada para a edicao ${ano}.`
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar a imagem."
      );
    } finally {
      setUploading((atual) => ({ ...atual, [chaveUpload]: false }));
    }
  }

  async function criarAno(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMensagem(null);
    setErro(null);

    try {
      const resposta = await fetch("/api/ebook-edicoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano: Number(novoAno),
          anoBase: Number(anoBase),
        }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Nao foi possivel criar o novo ano.");
        return;
      }

      setMensagem(`Ano ${dados.ano} criado e marcado como em preparacao.`);
      setNovoAno("");
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function atualizarEstado(payload: { anoPublicado?: number; anoEmPreparacao?: number }) {
    setSalvando(true);
    setMensagem(null);
    setErro(null);

    try {
      const resposta = await fetch("/api/ebook-edicoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Nao foi possivel atualizar o estado das edicoes.");
        return;
      }

      setMensagem("Configuracao atualizada com sucesso.");
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(ano: number) {
    const form = formularios[ano];
    if (!form) return;

    setSalvando(true);
    setMensagem(null);
    setErro(null);

    try {
      const resposta = await fetch("/api/ebook-edicoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ano,
          titulo: form.titulo,
          subtitulo: form.subtitulo,
          botao_texto: form.botao_texto,
          capas: form.capasTexto
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean),
          logo: form.logo,
        }),
      });
      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Nao foi possivel salvar a edicao.");
        return;
      }

      setMensagem(`Edicao ${ano} atualizada com sucesso.`);
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={{ padding: "3rem", maxWidth: "980px", margin: "0 auto" }}>
      <p style={{ marginBottom: "1rem" }}>
        <Link href="/admin" style={{ color: "#0b5c6b" }}>
          Voltar ao painel
        </Link>
      </p>

      <h1 style={{ color: "#371900" }}>Gerir edicoes do e-book</h1>

      <p style={{ color: "#3e4647", maxWidth: "760px" }}>
        Aqui voce cria um novo ano de trabalho sem mexer no link oficial. O ano
        publicado continua em <code>/livro</code> e o ano em preparacao aparece
        no preview administrativo.
      </p>

      {erro && <p style={{ color: "darkred" }}>{erro}</p>}
      {mensagem && <p style={{ color: "#0b6b45" }}>{mensagem}</p>}

      <section
        style={{
          background: "#ffffff",
          padding: "1.5rem",
          borderRadius: "14px",
          marginBottom: "1.5rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#4bbbc8" }}>Estado atual</h2>
        <p>
          Ano publicado: <strong>{estado?.anoPublicado ?? "..."}</strong>
        </p>
        <p>
          Ano em preparacao: <strong>{estado?.anoEmPreparacao ?? "..."}</strong>
        </p>
        <p>
          Origem dos dados: <strong>{estado?.origem ?? "..."}</strong>
        </p>
      </section>

      <section
        style={{
          background: "#ffffff",
          padding: "1.5rem",
          borderRadius: "14px",
          marginBottom: "1.5rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#ff6136" }}>Criar novo ano</h2>

        <form onSubmit={criarAno}>
          <label style={{ display: "block", marginBottom: "0.8rem" }}>
            Novo ano
            <br />
            <input
              value={novoAno}
              onChange={(e) => setNovoAno(e.target.value)}
              inputMode="numeric"
              required
              style={{ width: "220px", marginTop: "0.4rem" }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "0.8rem" }}>
            Copiar capa e textos de
            <br />
            <select
              value={anoBase}
              onChange={(e) => setAnoBase(e.target.value)}
              style={{ width: "220px", marginTop: "0.4rem" }}
            >
              {(estado?.edicoes ?? []).map((edicao) => (
                <option key={edicao.ano} value={edicao.ano}>
                  {edicao.ano}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Criar ano"}
          </button>
        </form>
      </section>

      <section
        style={{
          background: "#ffffff",
          padding: "1.5rem",
          borderRadius: "14px",
          marginBottom: "1.5rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
        }}
      >
        <h2 style={{ color: "#548287" }}>Edicoes cadastradas</h2>

        {(estado?.edicoes ?? []).map((edicao) => {
          const form = formularios[edicao.ano] ?? editarParaForm(edicao);

          return (
            <div
              key={edicao.ano}
              style={{
                border: "1px solid #e4e1d8",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ marginBottom: "0.8rem" }}>
                <strong>{edicao.ano}</strong> - {edicao.titulo}
              </div>

              <div style={{ marginBottom: "0.8rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={salvando || estado?.anoPublicado === edicao.ano}
                  onClick={() => atualizarEstado({ anoPublicado: edicao.ano })}
                >
                  Publicar este ano
                </button>
                <button
                  type="button"
                  disabled={salvando || estado?.anoEmPreparacao === edicao.ano}
                  onClick={() => atualizarEstado({ anoEmPreparacao: edicao.ano })}
                >
                  Usar como preparacao
                </button>
                <Link href={`/livro/edicao/${edicao.ano}`} target="_blank">
                  Abrir edicao
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                <label>
                  Titulo
                  <br />
                  <input
                    value={form.titulo}
                    onChange={(e) => atualizarFormulario(edicao.ano, "titulo", e.target.value)}
                    style={{ width: "100%", marginTop: "0.35rem" }}
                  />
                </label>

                <label>
                  Subtitulo
                  <br />
                  <input
                    value={form.subtitulo}
                    onChange={(e) => atualizarFormulario(edicao.ano, "subtitulo", e.target.value)}
                    style={{ width: "100%", marginTop: "0.35rem" }}
                  />
                </label>

                <label>
                  Texto do botao
                  <br />
                  <input
                    value={form.botao_texto}
                    onChange={(e) => atualizarFormulario(edicao.ano, "botao_texto", e.target.value)}
                    style={{ width: "100%", marginTop: "0.35rem" }}
                  />
                </label>

                <label>
                  Logo
                  <br />
                  <input
                    value={form.logo}
                    onChange={(e) => atualizarFormulario(edicao.ano, "logo", e.target.value)}
                    placeholder="/villaregia-logo.png"
                    style={{ width: "100%", marginTop: "0.35rem" }}
                  />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => enviarAsset(edicao.ano, "logo", e.target.files)}
                    disabled={salvando || uploading[`${edicao.ano}-logo`]}
                    style={{ width: "100%", marginTop: "0.5rem" }}
                  />
                  <small style={{ color: "#555" }}>
                    {uploading[`${edicao.ano}-logo`]
                      ? "Enviando logo..."
                      : "Tambem pode enviar um novo logo por aqui."}
                  </small>
                </label>
              </div>

              <label style={{ display: "block", marginTop: "1rem" }}>
                Capas
                <br />
                <textarea
                  value={form.capasTexto}
                  onChange={(e) => atualizarFormulario(edicao.ano, "capasTexto", e.target.value)}
                  rows={3}
                  placeholder="/villaregia-capa-2027.png"
                  style={{ width: "100%", marginTop: "0.35rem" }}
                />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => enviarAsset(edicao.ano, "capa", e.target.files)}
                  disabled={salvando || uploading[`${edicao.ano}-capa`]}
                  style={{ width: "100%", marginTop: "0.6rem" }}
                />
              </label>

              <p style={{ fontSize: "0.9rem", color: "#555" }}>
                Use um caminho ou URL por linha. Exemplo: <code>/villaregia-capa-2027.png</code>.
                Se preferir, envie uma capa nova acima e ela sera adicionada automaticamente.
              </p>

              <button type="button" disabled={salvando} onClick={() => salvarEdicao(edicao.ano)}>
                {salvando ? "Salvando..." : `Salvar edicao ${edicao.ano}`}
              </button>
            </div>
          );
        })}
      </section>

      <section
        style={{
          background: "#fff8ef",
          padding: "1rem 1.2rem",
          borderRadius: "12px",
          border: "1px solid #f0d8b8",
        }}
      >
        <strong>Importante:</strong> se a tela informar que a base online ainda
        nao foi criada, basta executar o SQL de configuracao do Supabase. Para
        uploads de capa e logo, tambem e preciso criar o bucket
        <code> ebook-assets </code> no Supabase Storage e configurar a variavel
        <code> SUPABASE_SERVICE_ROLE_KEY </code> na Vercel.
      </section>
    </main>
  );
}
