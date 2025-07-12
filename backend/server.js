const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth-router');
const s3Routes = require("./routes/s3-router");
const cors = require('cors');
require('dotenv').config();  

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.json()); 
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3001"], // Allow frontend ports
  methods: ["GET", "POST", "PUT", "DELETE"], 
  credentials: true, 
}));

app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/documents', s3Routes);


app.get('/', (req, res) => {
  res.send('Welcome to the Secure Document Vault API');
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});







