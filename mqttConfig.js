const mqtt = require('mqtt');
const csvParser = require('csv-parser');
const anemo3d = require('./models/models_3d_anemo');  // Impor model anemo3d
const datalogger = require('./models/datalogger_models')
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
    client.subscribe('topic/dataloggerpetengoran', (err) => {
        if (err) {
            console.error(`Error subscribing to 'topic/dataloggerpetengoran' :`, err);
        } else {
            console.log("MQTT terhubung pada : topic/dataloggerpetengoran ");  // <-- Menampilkan topik di terminal
        }
    });
});

// client.on('message', async (topic, message) => {
//     if (topic === 'topic/filecsv') {
//         try {
//             const csvData = message.toString();
//             const data = [];

//             const s = new stream.Readable();
//             s._read = () => {};
//             s.push(csvData);
//             s.push(null);

//             s.pipe(csvParser())
//                 .on('data', (row) => {
//                     // let waktuParts = row.waktu.split('.');
//                     // row.waktu = `${waktuParts[0].padStart(2, '0')}:${waktuParts[1].padStart(2, '0')}:${waktuParts[2].padStart(2, '0')}`;

//                     row.selatan = parseFloat(row.selatan);
//                     row.timur = parseFloat(row.timur);
//                     row.utara = parseFloat(row.utara);
//                     row.barat = parseFloat(row.barat);
//                     row.atas = parseFloat(row.atas);
//                     row.bawah = parseFloat(row.bawah);
//                     row.co2_concentration = parseFloat(row.co2_concentration);
//                     row.ch4_concentration = parseFloat(row.ch4_concentration);
//                     row.dht_temperature = parseFloat(row.dht_temperature);
//                     row.dht_humidity = parseFloat(row.dht_humidity);
//                     row.bmp_temperature = parseFloat(row.bmp_temperature);
//                     row.bmp_pressure = parseFloat(row.bmp_pressure);
//                     row.sht31_temperature = parseFloat(row.sht31_temperature);
//                     row.sht31_humidity = parseFloat(row.sht31_humidity);
//                     row.heat_index = parseFloat(row.heat_index);
//                     row.approx_altitude = parseFloat(row.approx_altitude);
//                     row.absolute_humidity = parseFloat(row.absolute_humidity);


//                     data.push(row);
//                 })
//                 .on('end', () => {
//                     anemo3d.bulkCreate(data)
//                         .then(() => {
//                             console.log("Data CSV inserted into the database!");
//                             // console.log("Data CSV inserted into the database!" + JSON.stringify(data));
//                         })
//                         .catch((err) => {
//                             console.error('Error:', err);
//                         });
//                 });

//         } catch (err) {
//             console.error("Error processing CSV data:", err);
//         }
//     }
// });

client.on('message', async (topic, message) => {
    if (topic === 'topic/filecsv') {
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
    if (topic === 'topic/dataloggerpetengoran') {
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
            console.log(`Data 'topic/dataloggerpetengoran' inserted into the database!`);

        } catch (err) {
            console.error("Error during message handling:", err);
        }
    }
});



module.exports = client;
