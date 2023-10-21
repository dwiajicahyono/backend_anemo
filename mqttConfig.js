const mqtt = require('mqtt');
const csvParser = require('csv-parser');
const anemo3d = require('./models/models_3d_anemo');  // Impor model
const stream = require('stream');
require('dotenv').config();

const options = {
    username: process.env.USERNAMEMQTT,
    password: process.env.PASSWORDMQTT
};


const client = mqtt.connect(process.env.LINKMQTT, options);

client.on('connect', () => {
    client.subscribe('topic/filecsv', (err) => {
        if (err) {
            console.error("Error subscribing to topic:", err);
        }
    });
});

client.on('message', async (topic, message) => {
    if (topic === 'topic/filecsv') {
        try {
            const csvData = message.toString();
            const data = [];

            const s = new stream.Readable();
            s._read = () => {};
            s.push(csvData);
            s.push(null);

            s.pipe(csvParser())
                .on('data', (row) => {
                    // let waktuParts = row.waktu.split('.');
                    // row.waktu = `${waktuParts[0].padStart(2, '0')}:${waktuParts[1].padStart(2, '0')}:${waktuParts[2].padStart(2, '0')}`;
                  
                    row.selatan = parseFloat(row.selatan);
                    row.timur = parseFloat(row.timur);
                    row.utara = parseFloat(row.utara);
                    row.barat = parseFloat(row.barat);
                    row.atas = parseFloat(row.atas);
                    row.bawah = parseFloat(row.bawah);
                    row.co2_concentration = parseFloat(row.co2_concentration);
                    row.ch4_concentration = parseFloat(row.ch4_concentration);
                    row.dht_temperature = parseFloat(row.dht_temperature);
                    row.dht_humidity = parseFloat(row.dht_humidity);
                    row.bmp_temperature = parseFloat(row.bmp_temperature);
                    row.bmp_pressure = parseFloat(row.bmp_pressure);
                    row.sht31_temperature = parseFloat(row.sht31_temperature);
                    row.sht31_humidity = parseFloat(row.sht31_humidity);
                    

                    data.push(row);
                })
                .on('end', () => {
                    anemo3d.bulkCreate(data)
                        .then(() => {
                            console.log("Data CSV inserted into the database!");
                            // console.log("Data CSV inserted into the database!" + JSON.stringify(data));
                        })
                        .catch((err) => {
                            console.error('Error:', err);
                        });
                });

        } catch (err) {
            console.error("Error processing CSV data:", err);
        }
    }
});

module.exports = client;
