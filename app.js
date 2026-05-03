require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const swaggerUi = require("swagger-ui-express");
const apiRoutes = require("./src/routes/api");
const webRoutes = require("./src/routes/web");
const { connectDatabase, defaultUri } = require("./src/config/database");
const { swaggerSpec } = require("./src/config/swagger");
const { configureTwig } = require("./src/config/twig");
const { seedDatabase } = require("./src/services/seedService");
const { syncSessionUser } = require("./src/middleware/auth");

const app = express();
const port = process.env.PORT || 3000;
const reactBuildPath = path.join(__dirname, "client", "dist");

app.set("views", path.join(__dirname, "views"));
configureTwig(app);

app.use(express.urlencoded({ extended: true }));
app.use("/api", express.json());
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
if (fs.existsSync(reactBuildPath)) {
  app.use("/react", express.static(reactBuildPath));
  app.get(/^\/react(?:\/.*)?$/, (req, res) => {
    res.sendFile(path.join(reactBuildPath, "index.html"));
  });
}
app.get("/api/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true
}));
app.use("/api", apiRoutes);
app.use("/api", (err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "El cuerpo de la petición debe ser JSON válido."
      }
    });
  }

  return next(err);
});

app.use(syncSessionUser);
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
    title: "Página no encontrada"
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
    console.error("No se ha podido arrancar la aplicación:", error.message);
    process.exit(1);
  }
}

start();
