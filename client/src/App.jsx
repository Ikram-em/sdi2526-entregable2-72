import { useState } from "react";
import { loginWithApi } from "./services/loginApi.js";

export function App() {
  const [dni, setDni] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setErrors({});

    const result = await loginWithApi(
      { dni, password },
      { storage: window.localStorage }
    );

    if (!result.ok) {
      setStatus("error");
      setErrors(result.errors || {});
      setMessage(result.message);
      return;
    }

    setStatus("success");
    setMessage(`Sesión iniciada correctamente como ${result.user.name}.`);
  }

  return (
    <main className="react-page">
      <section className="react-login">
        <div className="react-login__intro">
          <span className="eyebrow">C1 · React</span>
          <h1>Autenticación del usuario</h1>
          <p>
            Cliente ligero React preparado para consumir la API REST de reservas.
          </p>
        </div>

        <form className="surface form react-login__form" onSubmit={handleSubmit} noValidate>
          <div className="form__group">
            <label htmlFor="react-dni">DNI</label>
            <input
              id="react-dni"
              name="dni"
              type="text"
              maxLength="9"
              value={dni}
              onChange={(event) => setDni(event.target.value)}
              placeholder="10000001S"
              className={errors.dni ? "is-invalid" : ""}
            />
            <small className="field-error">{errors.dni || ""}</small>
          </div>

          <div className="form__group">
            <label htmlFor="react-password">Contraseña</label>
            <input
              id="react-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              className={errors.password ? "is-invalid" : ""}
            />
            <small className="field-error">{errors.password || ""}</small>
          </div>

          <button
            className="button button--primary button--block"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Autenticando..." : "Entrar"}
          </button>

          {message ? (
            <p
              className={`react-login__message ${
                status === "success" ? "is-success" : "is-error"
              }`}
              role="status"
            >
              {message}
            </p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
