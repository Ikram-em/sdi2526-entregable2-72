require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const webRoutes = require("./src/routes/web");
const { connectDatabase, defaultUri } = require("./src/config/database");
const { seedDatabase } = require("./src/services/seedService");
const {
  formatDateInput,
  formatDateTime,
  formatDateTimeLocalInput
} = require("./src/utils/viewHelpers");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "sdi2526-session-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || defaultUri,
      collectionName: "sessions"
    })
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  res.locals.formatDateTime = formatDateTime;
  res.locals.formatDateInput = formatDateInput;
  res.locals.formatDateTimeLocalInput = formatDateTimeLocalInput;
  delete req.session.flash;
  next();
});

app.use("/", webRoutes);

app.use((req, res) => {
  res.status(404).render("not-found", {
    title: "Pagina no encontrada"
  });
});

async function start() {
  try {
    const uri = await connectDatabase();
    await seedDatabase();

    app.listen(port, () => {
      console.log(`Aplicacion disponible en http://localhost:${port}`);
      console.log(`Mongo conectado a ${uri}`);
    });
  } catch (error) {
    console.error("No se ha podido arrancar la aplicacion:", error.message);
    process.exit(1);
  }
}

start();
