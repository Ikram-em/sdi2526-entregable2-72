import { useEffect, useState } from "react";
import { loginWithApi } from "./services/loginApi.js";
import { createReservationWithApi, fetchSpaces } from "./services/reservationApi.js";

function readStoredSession() {
  try {
    const token = window.localStorage.getItem("apiToken");
    const user = JSON.parse(window.localStorage.getItem("apiUser") || "null");
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

function LoginForm({ onLogin }) {
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
    onLogin({ token: result.token, user: result.user });
  }

  return (
    <section className="react-login">
      <div className="react-login__intro">
        <span className="eyebrow">C1 · React</span>
        <h1>Autenticación del usuario</h1>
        <p>Cliente React preparado para consumir la API REST de reservas.</p>
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
  );
}

function ReservationForm({ session, onLogout }) {
  const [spaces, setSpaces] = useState([]);
  const [formData, setFormData] = useState({
    spaceId: "",
    startDateTime: "",
    endDateTime: "",
    purpose: ""
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [spacesStatus, setSpacesStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    async function loadSpaces() {
      setSpacesStatus("loading");
      const result = await fetchSpaces();

      if (!active) {
        return;
      }

      if (!result.ok) {
        setSpacesStatus("error");
        setMessage(result.message);
        return;
      }

      setSpaces(result.spaces);
      setSpacesStatus("ready");
    }

    loadSpaces();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    setErrors({});

    const result = await createReservationWithApi(formData, {
      token: session.token
    });

    if (!result.ok) {
      setStatus("error");
      setErrors(result.errors || {});
      setMessage(result.message);
      return;
    }

    setStatus("success");
    setMessage(result.message);
    setFormData({
      spaceId: "",
      startDateTime: "",
      endDateTime: "",
      purpose: ""
    });
  }

  return (
    <section className="react-dashboard">
      <header className="react-dashboard__header">
        <div>
          <span className="eyebrow">C2 · Nueva reserva</span>
          <h1>Registrar una nueva reserva</h1>
          <p>{session.user.name}</p>
        </div>
        <button className="button button--ghost" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>

      <form className="surface form react-reservation-form" onSubmit={handleSubmit} noValidate>
        <div className="form__grid">
          <div className="form__group">
            <label htmlFor="spaceId">Espacio</label>
            <select
              id="spaceId"
              name="spaceId"
              value={formData.spaceId}
              onChange={(event) => updateField("spaceId", event.target.value)}
              disabled={spacesStatus === "loading"}
              className={errors.spaceId ? "is-invalid" : ""}
            >
              <option value="">
                {spacesStatus === "loading" ? "Cargando espacios..." : "Selecciona un espacio"}
              </option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            <small className="field-error">{errors.spaceId || ""}</small>
          </div>

          <div className="form__group">
            <label htmlFor="startDateTime">Inicio</label>
            <input
              id="startDateTime"
              name="startDateTime"
              type="datetime-local"
              value={formData.startDateTime}
              onChange={(event) => updateField("startDateTime", event.target.value)}
              className={errors.startDateTime ? "is-invalid" : ""}
            />
            <small className="field-error">{errors.startDateTime || ""}</small>
          </div>

          <div className="form__group">
            <label htmlFor="endDateTime">Fin</label>
            <input
              id="endDateTime"
              name="endDateTime"
              type="datetime-local"
              value={formData.endDateTime}
              onChange={(event) => updateField("endDateTime", event.target.value)}
              className={errors.endDateTime ? "is-invalid" : ""}
            />
            <small className="field-error">{errors.endDateTime || ""}</small>
          </div>

          <div className="form__group form__group--wide">
            <label htmlFor="purpose">Motivo</label>
            <textarea
              id="purpose"
              name="purpose"
              rows="4"
              value={formData.purpose}
              onChange={(event) => updateField("purpose", event.target.value)}
              placeholder="Motivo opcional"
            />
          </div>
        </div>

        <button
          className="button button--primary"
          type="submit"
          disabled={status === "loading" || spacesStatus === "loading"}
        >
          {status === "loading" ? "Registrando..." : "Registrar reserva"}
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
  );
}

export function App() {
  const [session, setSession] = useState(readStoredSession);

  function handleLogout() {
    window.localStorage.removeItem("apiToken");
    window.localStorage.removeItem("apiUser");
    setSession(null);
  }

  return (
    <main className="react-page">
      {session ? (
        <ReservationForm session={session} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={setSession} />
      )}
    </main>
  );
}
