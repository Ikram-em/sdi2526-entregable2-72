import { useEffect, useState } from "react";
import { loginWithApi } from "./services/loginApi.js";
import {
  createReservationWithApi,
  fetchOwnReservations,
  fetchSpaces,
  filterReservationsByStatus
} from "./services/reservationApi.js";

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

function ReservationForm({ session, spaces, spacesStatus, onReservationCreated }) {
  const [formData, setFormData] = useState({
    spaceId: "",
    startDateTime: "",
    endDateTime: "",
    purpose: ""
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");

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
    onReservationCreated(result.reservation);
    setFormData({
      spaceId: "",
      startDateTime: "",
      endDateTime: "",
      purpose: ""
    });
  }

  return (
    <section className="surface react-panel">
      <div className="react-panel__header">
        <span className="eyebrow">C2 · Nueva reserva</span>
        <h2>Registrar una nueva reserva</h2>
      </div>

      <form className="form react-reservation-form" onSubmit={handleSubmit} noValidate>
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

function ReservationsList({ reservations, reservationsStatus }) {
  const [reservationStatusFilter, setReservationStatusFilter] = useState("");
  const visibleReservations = filterReservationsByStatus(
    reservations,
    reservationStatusFilter
  );

  return (
    <section className="surface react-reservations">
      <div className="react-reservations__header">
        <div>
          <span className="eyebrow">C3 · Mis reservas</span>
          <h2>Listado de reservas propias</h2>
        </div>

        <div className="form__group react-reservations__filter">
          <label htmlFor="reservationStatus">Estado</label>
          <select
            id="reservationStatus"
            name="reservationStatus"
            value={reservationStatusFilter}
            onChange={(event) => setReservationStatusFilter(event.target.value)}
          >
            <option value="">Todos</option>
            <option value="ACTIVA">ACTIVA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>
      </div>

      {reservationsStatus === "loading" ? (
        <p className="muted">Cargando reservas...</p>
      ) : visibleReservations.length === 0 ? (
        <p className="muted">No hay reservas para el filtro seleccionado.</p>
      ) : (
        <table className="table react-reservations__table">
          <thead>
            <tr>
              <th>Espacio</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibleReservations.map((reservation) => (
              <tr key={reservation.id}>
                <td>{reservation.spaceName}</td>
                <td>{new Date(reservation.startDateTime).toLocaleString("es-ES")}</td>
                <td>{new Date(reservation.endDateTime).toLocaleString("es-ES")}</td>
                <td>
                  <span
                    className={`badge ${
                      reservation.status === "CANCELADA" ? "badge--neutral" : ""
                    }`}
                  >
                    {reservation.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function AuthenticatedApp({ session, onLogout }) {
  const [activeView, setActiveView] = useState("reservations");
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [message, setMessage] = useState("");
  const [spacesStatus, setSpacesStatus] = useState("loading");
  const [reservationsStatus, setReservationsStatus] = useState("loading");

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setSpacesStatus("loading");
      setReservationsStatus("loading");
      const [spacesResult, reservationsResult] = await Promise.all([
        fetchSpaces(),
        fetchOwnReservations({ token: session.token })
      ]);

      if (!active) {
        return;
      }

      if (!spacesResult.ok) {
        setSpacesStatus("error");
        setMessage(spacesResult.message);
      } else {
        setSpaces(spacesResult.spaces);
        setSpacesStatus("ready");
      }

      if (!reservationsResult.ok) {
        setReservationsStatus("error");
        setMessage(reservationsResult.message);
      } else {
        setReservations(reservationsResult.reservations);
        setReservationsStatus("ready");
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, [session.token]);

  function handleReservationCreated(reservation) {
    setReservations((current) => [reservation, ...current]);
    setActiveView("reservations");
  }

  return (
    <section className="react-dashboard">
      <header className="react-dashboard__header">
        <div>
          <span className="eyebrow">Cliente React</span>
          <h1>{activeView === "new" ? "Registrar una nueva reserva" : "Mis reservas"}</h1>
          <p>{session.user.name}</p>
        </div>
        <button className="button button--ghost" type="button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </header>

      <nav className="react-dashboard__nav" aria-label="Navegación del cliente React">
        <button
          className={`button ${activeView === "reservations" ? "button--primary" : "button--ghost"}`}
          type="button"
          onClick={() => setActiveView("reservations")}
        >
          Mis reservas
        </button>
        <button
          className={`button ${activeView === "new" ? "button--primary" : "button--ghost"}`}
          type="button"
          onClick={() => setActiveView("new")}
        >
          Nueva reserva
        </button>
      </nav>

      {message ? <p className="react-dashboard__message">{message}</p> : null}

      {activeView === "new" ? (
        <ReservationForm
          session={session}
          spaces={spaces}
          spacesStatus={spacesStatus}
          onReservationCreated={handleReservationCreated}
        />
      ) : (
        <ReservationsList
          reservations={reservations}
          reservationsStatus={reservationsStatus}
        />
      )}
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
        <AuthenticatedApp session={session} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={setSession} />
      )}
    </main>
  );
}
