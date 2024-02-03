const fs = require("fs");
const csvParser = require("csv-parser");
const { Sequelize, Op } = require("sequelize");
const fastcsv = require('fast-csv');
const anemo3d = require("../models/models_3d_anemo"); // Import model sekali saja
const moment = require('moment');

// Mendapatkan 50 data anemo3d terbaru

// Helper function to group records by second with full timestamp
function groupBySecond(records) {
  return records.reduce((acc, record) => {
      // Ubah timestamp menjadi format yang unik untuk setiap detik
      const timeKey = moment(record.timestamp).format('YYYY-MM-DD HH:mm:ss');
      if (!acc[timeKey]) {
          acc[timeKey] = [];
      }
      acc[timeKey].push(record);
      return acc;
  }, {});
}

function calculateModes(records) {
  const parameterCounts = {};
  const parameterModes = {};

  records.forEach(record => {
    // Ambil hanya bagian dataValues dari record
    const dataValues = record.dataValues;

    Object.keys(dataValues).forEach(param => {
      if (!['timestamp', 'id'].includes(param)) {
        const value = dataValues[param];
        if (value != null) {
          parameterCounts[param] = parameterCounts[param] || {};
          parameterCounts[param][value] = (parameterCounts[param][value] || 0) + 1;

          // Update mode if this value is now the most common one
          if (!parameterModes[param] || parameterCounts[param][value] > parameterCounts[param][parameterModes[param]]) {
            parameterModes[param] = value;  // Save just the value, not the entire Sequelize object
          }
        }
      }
    });
  });

  // Return an object with mode value for each parameter
  return parameterModes;  // This should be an object with just data values
}

exports.get50anemo3d = async (req, res) => {
  // Mengambil timestamp terakhir dari database
  const latestTimestamp = await anemo3d.findOne({
    attributes: ['timestamp'],
    order: [['timestamp', 'DESC']],
  });

  if (!latestTimestamp) {
    return res.status(404).json({ error: 'No records found' });
  }

  const lastTs = new Date(latestTimestamp.timestamp); // Pastikan ini mengacu pada field yang benar
  const tenSecondsAgo = new Date(lastTs.getTime() - 10000); // 10,000 milliseconds = 10 seconds

  try {
    // Mengambil data dari database
    const results = await anemo3d.findAll({
      where: {
        timestamp: {
          [Op.gt]: tenSecondsAgo, // greater than 10 seconds ago
        },
      },
      order: [['timestamp', 'DESC']], // Order by timestamp descending
    });

    const groupedBySecond = groupBySecond(results); // Langsung gunakan results

    // For each second, calculate mode for each parameter from the 5 data points
    const modesPerSecond = Object.entries(groupedBySecond).map(([timeKey, records]) => {
      const fiveRecords = records.slice(0, 5); // Ambil 5 data teratas
      const modeData = calculateModes(fiveRecords);

      return {
        timeKey,
        mode: modeData
      };
    });
    // Sort the result based on timeKey and take the last 10
    const sortedModesPerSecond = modesPerSecond.sort((a, b) => a.timeKey.localeCompare(b.timeKey)).slice(-10);

    // Respond with the modes per second
    res.json(sortedModesPerSecond);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.getlastanemo3d = (req, res) => {
  anemo3d.findOne({
    order: [['id', 'DESC']],
  })
  .then((result) => {
    res.json(result); // Gunakan 'res' bukan 'response'
  })
  .catch((error) => {
    res.status(500).json({ error: 'Internal server error' }); // Gunakan 'res' bukan 'response'
  });
};

// ****************************************************************
// Get Daily Data 
// ****************************************************************
exports.carbondaily = (request, response) => {
  const currentDate = new Date();
  const startdate = new Date(currentDate);
  startdate.setDate(currentDate.getDate() - 1);
  const endDate = new Date(currentDate);

  anemo3d.findAll({
    attributes: [
      [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('co2_concentration')), 'co2_concentration'],
      [Sequelize.fn('avg', Sequelize.col('ch4_concentration')), 'ch4_concentration'],
      [Sequelize.fn('avg', Sequelize.col('dht_temperature')), 'dht_temperature'],
      [Sequelize.fn('avg', Sequelize.col('dht_humidity')), 'dht_humidity'],
      [Sequelize.fn('avg', Sequelize.col('bmp_temperature')), 'bmp_temperature'],
      [Sequelize.fn('avg', Sequelize.col('bmp_pressure')), 'bmp_pressure'],
      [Sequelize.fn('avg', Sequelize.col('sht31_temperature')), 'sht31_temperature'],
      [Sequelize.fn('avg', Sequelize.col('sht31_humidity')), 'sht31_humidity'],
      [Sequelize.fn('avg', Sequelize.col('approx_altitude')), 'approx_altitude'],
      [Sequelize.fn('avg', Sequelize.col('h2o')), 'h2o']
    ],
    where: {
      createdAt: {
        [Op.between]: [startdate, endDate],
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp'))],
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.timestamp,
          co2_concentration: parseFloat(item.co2_concentration),
          ch4_concentration: parseFloat(item.ch4_concentration),
          dht_temperature: parseFloat(item.dht_temperature),
          dht_humidity: parseFloat(item.dht_humidity),
          bmp_temperature: parseFloat(item.bmp_temperature),
          bmp_pressure: parseFloat(item.bmp_pressure),
          sht31_temperature: parseFloat(item.sht31_temperature),
          sht31_humidity: parseFloat(item.sht31_humidity),
          approx_altitude: parseFloat(item.approx_altitude),
          h2o: parseFloat(item.h2o),
        };
      });
      response.json(modifiedResult);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};
exports.anemodaily = (request, response) => {
  const currentDate = new Date();
  const startdate = new Date(currentDate);
  startdate.setDate(currentDate.getDate() - 1);
  const endDate = new Date(currentDate);

  anemo3d.findAll({
    attributes: [
      [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      createdAt: {
        [Op.between]: [startdate, endDate],
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp'))],
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.timestamp,
          selatan: parseFloat(item.selatan),
          timur: parseFloat(item.timur),
          utara: parseFloat(item.utara),
          barat: parseFloat(item.barat),
          bawah: parseFloat(item.bawah),
          atas: parseFloat(item.atas)
        };
      });
      response.json(modifiedResult);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};

// ****************************************************************
// GET 7 Day DATA
// ****************************************************************
exports.carbonweekly = async (request, response) => {

  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 7);

  // Query database untuk data setiap 30 menit selama 7 hari terakhir
  anemo3d.findAll({
    attributes: [
      [Sequelize.literal("date_trunc('hour', \"timestamp\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"timestamp\") / 30)"), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('co2_concentration')), 'co2_concentration'],
      [Sequelize.fn('avg', Sequelize.col('ch4_concentration')), 'ch4_concentration'],
      [Sequelize.fn('avg', Sequelize.col('dht_temperature')), 'dht_temperature'],
      [Sequelize.fn('avg', Sequelize.col('dht_humidity')), 'dht_humidity'],
      [Sequelize.fn('avg', Sequelize.col('bmp_temperature')), 'bmp_temperature'],
      [Sequelize.fn('avg', Sequelize.col('bmp_pressure')), 'bmp_pressure'],
      [Sequelize.fn('avg', Sequelize.col('sht31_temperature')), 'sht31_temperature'],
      [Sequelize.fn('avg', Sequelize.col('sht31_humidity')), 'sht31_humidity'],
      [Sequelize.fn('avg', Sequelize.col('approx_altitude')), 'approx_altitude'],
      [Sequelize.fn('avg', Sequelize.col('h2o')), 'h2o']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, currentDate],
      },
    },
    group: [Sequelize.literal("date_trunc('hour', \"timestamp\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"timestamp\") / 30)")],
    order: [[Sequelize.literal("date_trunc('hour', \"timestamp\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"timestamp\") / 30)"), 'ASC']],
  }).then(result => {
    const modifiedResult = result.map(item => {
      return {
        timestamp: item.timestamp,
        co2_concentration: parseFloat(item.co2_concentration),
        ch4_concentration: parseFloat(item.ch4_concentration),
        dht_temperature: parseFloat(item.dht_temperature),
        dht_humidity: parseFloat(item.dht_humidity),
        bmp_temperature: parseFloat(item.bmp_temperature),
        bmp_pressure: parseFloat(item.bmp_pressure),
        sht31_temperature: parseFloat(item.sht31_temperature),
        sht31_humidity: parseFloat(item.sht31_humidity),
        approx_altitude: parseFloat(item.approx_altitude),
        h2o: parseFloat(item.h2o),
      };
    });
    response.json(modifiedResult);
  })
    .catch(error => {
      console.error('Error details:', error);
      response.status(500).json({ error: 'Internal server error', details: error.message });
    });
};
exports.anemoweekly = async (request, response) => {

  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 7);

  // Query database untuk data setiap 30 menit selama 7 hari terakhir
  anemo3d.findAll({
    attributes: [
      [Sequelize.literal("date_trunc('hour', \"timestamp\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"timestamp\") / 30)"), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, currentDate],
      },
    },
    group: [Sequelize.literal("date_trunc('hour', \"timestamp\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"timestamp\") / 30)")],
    order: [[Sequelize.literal("date_trunc('hour', \"timestamp\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"timestamp\") / 30)"), 'ASC']],
  }).then(result => {
    const modifiedResult = result.map(item => {
      return {
        timestamp: item.timestamp,
        selatan: parseFloat(item.selatan),
        timur: parseFloat(item.timur),
        utara: parseFloat(item.utara),
        barat: parseFloat(item.barat),
        bawah: parseFloat(item.bawah),
        atas: parseFloat(item.atas)
      };
    });
    response.json(modifiedResult);
  })
    .catch(error => {
      console.error('Error details:', error);
      response.status(500).json({ error: 'Internal server error', details: error.message });
    });
};

// ****************************************************************
// GET 30 Day Data
// ****************************************************************
exports.carbonmonthly = async (request, response) => {
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 30); // Mengatur startDate menjadi 30 hari yang lalu

  // Query database untuk data setiap jam selama 30 hari terakhir
  anemo3d.findAll({
    attributes: [
      [Sequelize.literal("date_trunc('hour', \"timestamp\")"), 'timestamp'], // Mengelompokkan data per jam
      [Sequelize.fn('avg', Sequelize.col('co2_concentration')), 'co2_concentration'],
      [Sequelize.fn('avg', Sequelize.col('ch4_concentration')), 'ch4_concentration'],
      [Sequelize.fn('avg', Sequelize.col('dht_temperature')), 'dht_temperature'],
      [Sequelize.fn('avg', Sequelize.col('dht_humidity')), 'dht_humidity'],
      [Sequelize.fn('avg', Sequelize.col('bmp_temperature')), 'bmp_temperature'],
      [Sequelize.fn('avg', Sequelize.col('bmp_pressure')), 'bmp_pressure'],
      [Sequelize.fn('avg', Sequelize.col('sht31_temperature')), 'sht31_temperature'],
      [Sequelize.fn('avg', Sequelize.col('sht31_humidity')), 'sht31_humidity'],
      [Sequelize.fn('avg', Sequelize.col('approx_altitude')), 'approx_altitude'],
      [Sequelize.fn('avg', Sequelize.col('h2o')), 'h2o']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, currentDate],
      },
    },
    group: [Sequelize.literal("date_trunc('hour', \"timestamp\")")], // Mengelompokkan data per jam
    order: [[Sequelize.literal("date_trunc('hour', \"timestamp\")"), 'ASC']],
  }).then(result => {
    const modifiedResult = result.map(item => {
      return {
        timestamp: item.timestamp,
        co2_concentration: parseFloat(item.co2_concentration),
        ch4_concentration: parseFloat(item.ch4_concentration),
        dht_temperature: parseFloat(item.dht_temperature),
        dht_humidity: parseFloat(item.dht_humidity),
        bmp_temperature: parseFloat(item.bmp_temperature),
        bmp_pressure: parseFloat(item.bmp_pressure),
        sht31_temperature: parseFloat(item.sht31_temperature),
        sht31_humidity: parseFloat(item.sht31_humidity),
        approx_altitude: parseFloat(item.approx_altitude),
        h2o: parseFloat(item.h2o),
      };
    });
    response.json(modifiedResult);
  })
    .catch(error => {
      console.error('Error details:', error);
      response.status(500).json({ error: 'Internal server error', details: error.message });
    });
};
exports.anemomonthly = async (request, response) => {
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 30); // Mengatur startDate menjadi 30 hari yang lalu

  // Query database untuk data setiap jam selama 30 hari terakhir
  anemo3d.findAll({
    attributes: [
      [Sequelize.literal("date_trunc('hour', \"timestamp\")"), 'timestamp'], // Mengelompokkan data per jam
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, currentDate],
      },
    },
    group: [Sequelize.literal("date_trunc('hour', \"timestamp\")")], // Mengelompokkan data per jam
    order: [[Sequelize.literal("date_trunc('hour', \"timestamp\")"), 'ASC']],
  }).then(result => {
    const modifiedResult = result.map(item => {
      return {
        timestamp: item.timestamp,
        selatan: parseFloat(item.selatan),
        timur: parseFloat(item.timur),
        utara: parseFloat(item.utara),
        barat: parseFloat(item.barat),
        bawah: parseFloat(item.bawah),
        atas: parseFloat(item.atas)
      };
    });
    response.json(modifiedResult);
  })
    .catch(error => {
      console.error('Error details:', error);
      response.status(500).json({ error: 'Internal server error', details: error.message });
    });
};


// exports.getlatestanemo3d = (req, res) => {
//   anemo3d.findOne({
//     order: [['timestamp', 'DESC']],
//   })
//   .then((result) => {
//     res.json(result); // Gunakan 'res' bukan 'response'
//   })
//   .catch((error) => {
//     res.status(500).json({ error: 'Internal server error' }); // Gunakan 'res' bukan 'response'
//   });
// };

// Mendownload data anemo3d
exports.downloadanemo3d = async (req, res) => {
  try {
    // Validasi dan konversi parameter
    const startDate = new Date(req.query.startDate);
    startDate.setHours(0, 0, 0, 0); // Set waktu mulai pukul 00:00
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999); // Set waktu berakhir pukul 23:59
    const limit = parseInt(req.query.limit);
    
    console.log(`Received parameters: startDate = ${startDate}, endDate = ${endDate}, limit = ${limit}`);
    
    // Menghitung total hari dan durasi setiap interval
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1;
    const intervalDuration = totalDays / limit;
    
    // Menyiapkan array untuk menampung data yang diambil
    const collectedData = [];
    
    // Loop untuk mengambil data dari setiap interval
    for (let i = 0; i < limit; i++) {
      const intervalStart = new Date(startDate.getTime() + (intervalDuration * i * 1000 * 60 * 60 * 24));
      let intervalEnd;
    
      if (i < limit - 1) {
        // Untuk semua interval kecuali yang terakhir, akhir interval adalah awal dari interval berikutnya
        intervalEnd = new Date(startDate.getTime() + (intervalDuration * (i + 1) * 1000 * 60 * 60 * 24));
      } else {
        // Untuk interval terakhir, akhiri tepat pada endDate
        intervalEnd = new Date(endDate);
      }
    
      // Memastikan bahwa intervalEnd tidak melebihi endDate
      if (intervalEnd > endDate) {
        intervalEnd = new Date(endDate);
      }
    
      console.log(`Interval ${i + 1}: Start = ${intervalStart.toISOString()}, End = ${intervalEnd.toISOString()}`);
    

      // Mengambil satu data dari interval waktu saat ini
      const data = await anemo3d.findOne({
        where: {
          timestamp: {
            [Sequelize.Op.gte]: intervalStart,
            [Sequelize.Op.lt]: intervalEnd,
          },
        },
        order: [['timestamp', 'ASC']], // Pengurutan berdasarkan 'ts' dari terkecil ke terbesar
      });
      // Jika data ditemukan, tambahkan ke array collectedData
      if (data) {
        collectedData.push(data);
      } else {
        console.log(`No data found for interval ${i + 1} from ${intervalStart} to ${intervalEnd}`);
      }
    }
    
    console.log(`Total data gathered: ${collectedData.length}`);
    // Setup CSV stream
    const csvStream = fastcsv.format({ headers: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=DataPetengoran-limit-${limit}-Data Gathered-${collectedData.length}-Data.csv`);
    // Pipe CSV stream to response
    csvStream.pipe(res).on('end', () => res.end());
    
    // Write data to CSV
    collectedData.forEach(item => csvStream.write(item.dataValues));
    
    // End CSV stream
    csvStream.end();
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error during data download');
  }
};

// Menambahkan data anemo3d dari CSV
exports.add3dAnemo = (req, res) => {
  if (!req.file) {
    return res.status(400).send("No CSV file uploaded");
  }

  const data = [];
  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", row => {
      // Konversi dan normalisasi data
      Object.keys(row).forEach(key => {
        row[key] = isNaN(row[key]) ? row[key] : parseFloat(row[key]);
      });
      data.push(row);
    })
    .on("end", () => {
      // Insert data ke database
      anemo3d.bulkCreate(data)
        .then(() => {
          res.status(200).send("Data imported successfully");
        })
        .catch(err => {
          console.error("Error:", err);
          res.status(500).send("Failed to import data");
        });
    });
};
