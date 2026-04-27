const express = require("express");
const path = require("path");
const session = require("express-session");
const webRoutes = require("./src/routes/web");

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "sdi2526-frontend-secret",
    resave: false,
    saveUninitialized: false
  })
);
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentPath = req.path;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use("/", webRoutes);

app.use((req, res) => {
  res.status(404).render("not-found", {
    title: "Pagina no encontrada"
  });
});

app.listen(port, () => {
  console.log(`Aplicacion disponible en http://localhost:${port}`);
});
