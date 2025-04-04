const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger_output.json"; 
const endpointsFiles = ['./routes/apiRoutes.js']; 

const doc = {
  info: {
    version: "1.0.0",
    title: "Instagram Clone",
    description: "API documentation for the E-Commerce project, auto-generated using Swagger.",
  },
  host: "localhost:3000",
  schemes: ["http"],
  consumes: ['application/json'],
  produces: ["application/json"],
  basePath: "/api",
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter the token as 'Bearer <your-token>'",
    },
  },
  
  security: [{ Bearer: [] }],
};

swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    console.log(" Swagger documentation successfully generated!");
  })
  .catch((error) => {
    console.error("Error generating Swagger documentation:", error);
  });
