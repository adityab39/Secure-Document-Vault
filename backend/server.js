const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth-router');
const s3Routes = require("./routes/s3-router")
require('dotenv').config();  

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/documents', s3Routes);


app.get('/', (req, res) => {
  res.send('Welcome to the Secure Document Vault API');
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
