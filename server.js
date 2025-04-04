const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger_output.json");



const app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));



mongoose.connect("mongodb+srv://nagasurendra2001:ULoQYXfHM7Aqxn3s@cluster0.p7339sj.mongodb.net/instagram?retryWrites=true&w=majority", {
}).then(() => console.log('successfully connected to database'))
  .catch((err) => console.log(err));

app.use('/api',apiRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));



const PORT = 3000;
app.listen(PORT, () =>{
   console.log(`Server running on http://localhost:${PORT}`);
   console.log(`Swagger UI available at http://localhost:${PORT}/swagger`);
});

