import { useState } from "react";
import { useRouter } from "next/router";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const resultado = await resposta.json();

      if (resultado.sucesso) {
        router.push("/admin");
      } else {
        setErro(resultado.erro || "Não foi possível entrar.");
      }
    } catch {
      setErro("Erro de conexão ao tentar entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main style={{ padding: "3rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Acesso PASCOM</h1>

      <form onSubmit={entrar}>
        <label>
          E-mail institucional
          <br />
          <input
            type="email"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", marginTop: "0.5rem" }}
          />
        </label>

        <br /><br />

        <button type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {erro && <p style={{ color: "darkred" }}>{erro}</p>}
    </main>
  );
}
