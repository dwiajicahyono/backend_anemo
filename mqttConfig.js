const mqtt = require('mqtt');
const csvParser = require('csv-parser');
const anemo3d = require('./models/models_3d_anemo');  // Impor model anemo3d
const datalogger = require('./models/datalogger_models')
const dhteddy = require('./models/dht_models');
const logeddy = require('./models/log_models')


const stream = require('stream');
require('dotenv').config();

const options = {
    username: process.env.USERNAMEMQTT,
    password: process.env.PASSWORDMQTT
};


const client = mqtt.connect(process.env.LINKMQTT, options);

client.on('connect', () => {
    client.subscribe(process.env.TOPIC_EDY, (err) => {
        if (err) {
            console.error("Error subscribing to topic:", err);
        } else {
            console.log("1. MQTT terhubung pada : ", process.env.TOPIC_EDY);  // <-- Menampilkan topik di terminal
        }
    });
    client.subscribe(process.env.TOPIC_LOG, (err) => {
        if (err) {
            console.error(`Error subscribing to ${process.env.TOPIC_LOG}' :`, err);
        } else {
            console.log("2. MQTT terhubung pada : ", process.env.TOPIC_LOG);  // <-- Menampilkan topik di terminal
        }

    });
    client.subscribe(process.env.TOPIC_DHT, (err) => {
        if (err) {
            console.error(`Error subscribing to ${process.env.TOPIC_DHT}' :`, err);
        } else {
            console.log("3. MQTT terhubung pada : ", process.env.TOPIC_DHT);  // <-- Menampilkan topik di terminal
        }

    });
    client.subscribe(process.env.TOPIC_LOGDATA, (err) => {
        if (err) {
            console.error(`Error subscribing to ${process.env.TOPIC_LOGDATA}' :`, err);
        } else {
            console.log("4. MQTT terhubung pada : ", process.env.TOPIC_LOGDATA);  // <-- Menampilkan topik di terminal
        }

    });
});

client.on('message', async (topic, message) => {
    if (topic === process.env.TOPIC_EDY) {
        try {
            const csvData = message.toString();
            const data = [];

            const s = new stream.Readable();
            s._read = () => { };
            s.push(csvData);
            s.push(null);

            s.pipe(csvParser())
                // .on('data', (row) => {
                //     // Pemeriksaan tambahan untuk nilai timestamp yang tidak diinginkan
                //     if (row.timestamp && !isNaN(Date.parse(row.timestamp)) && row.timestamp !== '[null]') {
                //         // Pemeriksaan tambahan untuk memastikan baris tidak sepenuhnya kosong
                //         if (Object.values(row).some(value => value !== '' && value !== null)) {
                //             // Proses dan konversi nilai lain jika timestamp valid
                //             row.selatan = parseFloat(row.selatan);
                //             row.timur = parseFloat(row.timur);
                //             row.utara = parseFloat(row.utara);
                //             row.barat = parseFloat(row.barat);
                //             row.atas = parseFloat(row.atas);
                //             row.bawah = parseFloat(row.bawah);
                //             row.co2_concentration = parseFloat(row.co2_concentration);
                //             row.ch4_concentration = parseFloat(row.ch4_concentration);
                //             row.dht_temperature = parseFloat(row.dht_temperature);
                //             row.dht_humidity = parseFloat(row.dht_humidity);
                //             row.bmp_temperature = parseFloat(row.bmp_temperature);
                //             row.bmp_pressure = parseFloat(row.bmp_pressure);
                //             row.sht31_temperature = parseFloat(row.sht31_temperature);
                //             row.sht31_humidity = parseFloat(row.sht31_humidity);
                //             row.heat_index = parseFloat(row.heat_index);
                //             row.approx_altitude = parseFloat(row.approx_altitude);
                //             row.absolute_humidity = parseFloat(row.absolute_humidity);
                //             data.push(row);
                //         }
                //     }
                // })
                .on('data', (row) => {
                    // let waktuParts = row.waktu.split('.');
                    // row.waktu = `${waktuParts[0].padStart(2, '0')}:${waktuParts[1].padStart(2, '0')}:${waktuParts[2].padStart(2, '0')}`;

                    row.selatan = parseFloat(row.selatan);
                    row.timur = parseFloat(row.timur);
                    row.utara = parseFloat(row.utara);
                    row.barat = parseFloat(row.barat);
                    row.atas = parseFloat(row.atas);
                    row.bawah = parseFloat(row.bawah);
                    row.H2OSHT85 = parseFloat(row.H2OSHT85);
                    row.ch4 = parseFloat(row.ch4);
                    row.co2 = parseFloat(row.co2);
                    row.sht85Temp = parseFloat(row.sht85Temp);
                    row.sht85Humi = parseFloat(row.sht85Humi);
                    row.bmp388ApprxAltitude = parseFloat(row.bmp388ApprxAltitude);
                    row.bmp388Temp = parseFloat(row.bmp388Temp);
                    row.bmp388Pressure = parseFloat(row.bmp388Pressure);


                    data.push(row);
                })
                .on('end', () => {
                    if (data.length > 0) {
                        anemo3d.bulkCreate(data)
                            .then(() => {
                                console.log("Data CSV inserted into the database!");
                            })
                            .catch((err) => {
                                console.error('Error:', err);
                            });
                    } else {
                        console.log("No valid data to insert into the database.");
                    }
                });

        } catch (err) {
            console.error("Error processing CSV data:", err);
        }
    }
});

// Topic Logger Condition
client.on('message', async (topic, message) => {
    if (topic === process.env.TOPIC_LOG) {
        try {
            // Parse the message into a JSON object
            const jsonData = JSON.parse(message.toString());

            // Menunggu proses penyimpanan data
            await datalogger.create({
                ts: jsonData.ts,
                humanTime: jsonData.humanTime,
                cpu_usage: jsonData.cpu_usage,
                mem_gpu: jsonData.mem_gpu,
                mem_arm: jsonData.mem_arm,
                temp: jsonData.temp,
            });
            console.log(`Data ${process.env.TOPIC_LOG}  inserted into the database!`);

        } catch (err) {
            console.error("Error during message handling:", err);
        }
    }
});

// topic dht
// client.on('message', async (topic, message) => {
//     if (topic === process.env.TOPIC_DHT) {
//         try {
//             // Parse the message into a JSON object
//             const jsonData = JSON.parse(message.toString());

//             // Menunggu proses penyimpanan data
//             await dhteddy.create({
//                 // ts: jsonData.ts,
//                 dht22Temp: jsonData.dht22Temp,
//                 dht22Humi: jsonData.dht22Humi,
//                 dht22HeatIndex: jsonData.dht22HeatIndex,
//             });
//             console.log(`Data  ${process.env.TOPIC_DHT} inserted into the database!`);

//         } catch (err) {
//             console.error("Error during message handling:", err);
//         }
//     }
// });

// topic dht csv
client.on('message', async (topic, message) => {
    if (topic === process.env.TOPIC_DHT) {
        try {
            const csvData = message.toString();
            const data = [];

            const s = new stream.Readable();
            s._read = () => { };
            s.push(csvData);
            s.push(null);

            s.pipe(csvParser())
                .on('data', (row) => {
                    // let waktuParts = row.waktu.split('.');
                    // row.waktu = `${waktuParts[0].padStart(2, '0')}:${waktuParts[1].padStart(2, '0')}:${waktuParts[2].padStart(2, '0')}`;
                    // row.humanTime = parseFloat(row.humanTime);
                    row.ts = parseFloat(row.ts);
                    row.dht22Temp = parseFloat(row.dht22Temp);
                    row.dht22Humi = parseFloat(row.dht22Humi);
                    row.dht22HeatIndex = parseFloat(row.dht22HeatIndex);
                    data.push(row);
                })
                .on('end', () => {
                    if (data.length > 0) {
                        dhteddy.bulkCreate(data)
                            .then(() => {
                                console.log("Data CSV inserted into the database! ", process.env.TOPIC_DHT);
                            })
                            .catch((err) => {
                                console.error('Error:', err);
                            });
                    } else {
                        console.log("No valid data to insert into the database.");
                    }
                });

        } catch (err) {
            console.error("Error processing CSV data:", err);
        }
    }
});

// topic log
client.on('message', async (topic, message) => {
    if (topic === process.env.TOPIC_LOGDATA) {
        try {
            // Parse the message into a JSON object
            const jsonData = JSON.parse(message.toString());

            // Menunggu proses penyimpanan data
            await logeddy.create({
                log: jsonData.log,
            });
            console.log(`Data  ${process.env.TOPIC_LOGDATA} inserted into the database!`);

        } catch (err) {
            console.error("Error during message handling:", err);
        }
    }
});



module.exports = client;
