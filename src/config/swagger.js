const swaggerJsdoc = require("swagger-jsdoc");

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "SDI 2526 Entrega 2 - API de reservas de espacios",
    version: "1.0.0",
    description:
      "Documentacion OpenAPI/Swagger de la API REST usada por la practica de gestion de reservas."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local por defecto"
    }
  ]
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./src/routes/api.js"]
});

module.exports = {
  swaggerSpec
};
