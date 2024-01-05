"use strict";
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./models/models_3d_anemo');
const route = require('./routes/user.routes');
const mqttClient = require('./mqttConfig');  // Impor konfigurasi MQTT
const multer = require('multer');
const storage = multer.memoryStorage(); // menyimpan file ke memory
const upload = multer({ storage: storage });


const fs = require('fs');
const http = require('http');
const https = require('https');
// konfigurasi http
const privateKey = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/vps.isi-net.org/chain.pem', 'utf8');

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca
};
const app = express();




const corsOptions = {
  origin: '*',
};

// apply the CORS options
app.use(cors(corsOptions));
// parse requests of content-type - application/json
app.use(bodyParser.json());

// Endpoint untuk menguji melalui Postman
app.post('/sendcsv', upload.single('csv'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No CSV file uploaded');
  }
  const csvData = req.file.buffer.toString();
  mqttClient.publish('topic/filecsv', csvData);
  res.send('CSV data sent to MQTT topic!');
});


// if you run again and don't wanna lose your data
db.sequelize.sync();




// Pertama, atur middleware untuk file statis
app.use(express.static('public'));
app.use('/api', route);

app.use('/', cors(), (req, res) => {
  res.status(404);
  res.send('POWERED BY DWI AJI| You Can Try in ROOT');
});

// set port, listen for requests
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on  http://localhost:${PORT}.`);
});

// Starting the https server
// Mulai server HTTPS

const HTTPS_PORT = 7800;  // Ganti dengan port yang Anda inginkan untuk HTTPS
const httpsServer = https.createServer(credentials, app);
httpsServer.listen(HTTPS_PORT, () => {
  console.log(`HTTPS Server is running on https://localhost:${HTTPS_PORT}`);
});