import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<"ocioso" | "autenticando" | "abrindo">("ocioso");
  const carregando = etapa !== "ocioso";
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    if (carregando) return;
    setErro(null);
    setEtapa("autenticando");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let autenticado = false;

    try {
      const resposta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const resultado = await resposta.json();
      clearTimeout(timeout);

      if (resposta.ok && resultado.sucesso) {
        autenticado = true;
        setEtapa("abrindo");
        if (!(await router.replace("/admin"))) {
          window.location.assign("/admin");
        }
      } else {
        setErro(resultado.erro || "Não foi possível entrar.");
        setEtapa("ocioso");
      }
    } catch {
      if (autenticado) {
        window.location.assign("/admin");
      } else {
        setErro(controller.signal.aborted
          ? "A conexão demorou mais que o esperado. Verifique sua internet e tente novamente."
          : "Erro de conexão ao tentar entrar. Tente novamente.");
        setEtapa("ocioso");
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <main style={{ padding: "3rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Acesso PASCOM</h1>

      <form onSubmit={entrar} aria-busy={carregando}>
        <label>
          E-mail institucional
          <br />
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginTop: "0.5rem" }}
          />
        </label>

        <br /><br />

        <label>
          Senha administrativa
          <br />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginTop: "0.5rem" }}
          />
        </label>

        <br /><br />

        <button type="submit" disabled={carregando}>
          {etapa === "abrindo" ? "Abrindo painel..." : carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p role="status" aria-live="polite">
        {etapa === "autenticando" && "Conferindo suas credenciais…"}
        {etapa === "abrindo" && "Acesso autorizado. Abrindo o painel…"}
      </p>
      {erro && <p role="alert" style={{ color: "darkred" }}>{erro}</p>}
    </main>
  );
}
