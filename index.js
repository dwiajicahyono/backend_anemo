const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./models/models_3d_anemo');
const route = require('./routes/user.routes');
const mqttClient = require('./mqttConfig');  // Impor konfigurasi MQTT

const multer = require('multer');
const storage = multer.memoryStorage(); // menyimpan file ke memory
const upload = multer({ storage: storage });


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

// medium route
app.use('/api', route);

// set port, listen for requests
const PORT = process.env.PORT || 8012;
app.listen(PORT, () => {
  console.log(`Server is running on  http://localhost:${PORT}.`);
});
