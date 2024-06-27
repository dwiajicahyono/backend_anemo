const fs = require("fs");
const csvParser = require("csv-parser");
const { Sequelize, Op } = require("sequelize");
const fastcsv = require('fast-csv');
const anemo3d = require("../models/models_3d_anemo"); // Import model sekali saja
const moment = require('moment');
const datalogger = require('../models/datalogger_models')

// Mendapatkan data 30menit anemo3d terbaru
exports.anemo30minute = (request, response) => {
  const currentDate = new Date();
  // Set the start date to 30 minutes ago
  const startdate = new Date(currentDate.getTime() - (30 * 60 * 1000));
  const endDate = new Date(currentDate);

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per menit
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
          timestamp: item.get('timestamp'), // Pastikan untuk mengakses nilai menggunakan metode get jika perlu
          selatan: parseFloat(item.get('selatan')),
          timur: parseFloat(item.get('timur')),
          utara: parseFloat(item.get('utara')),
          barat: parseFloat(item.get('barat')),
          bawah: parseFloat(item.get('bawah')),
          atas: parseFloat(item.get('atas')),
        };
      });
      response.json(modifiedResult);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};

exports.gas30minute = (request, response) => {
  const currentDate = new Date();
  // Set the start date to 30 minutes ago
  const startdate = new Date(currentDate.getTime() - (30 * 60 * 1000));
  const endDate = new Date(currentDate);

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per jam
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
          timestamp: item.get('timestamp'), // Akses nilai menggunakan metode get
          co2_concentration: parseFloat(item.get('co2_concentration')),
          ch4_concentration: parseFloat(item.get('ch4_concentration')),
          dht_temperature: parseFloat(item.get('dht_temperature')),
          dht_humidity: parseFloat(item.get('dht_humidity')),
          bmp_temperature: parseFloat(item.get('bmp_temperature')),
          bmp_pressure: parseFloat(item.get('bmp_pressure')),
          sht31_temperature: parseFloat(item.get('sht31_temperature')),
          sht31_humidity: parseFloat(item.get('sht31_humidity')),
          approx_altitude: parseFloat(item.get('approx_altitude')),
          h2o: parseFloat(item.get('h2o')),
        };
      });
      response.json(modifiedResult);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};

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

// modus yang menangani nilai paling besar apabila tidak ada modus dan mengambil nilai terbesar apabila ada dua modus yang sama 
function calculateModes(records) {
  const parameterCounts = {};
  const parameterValues = {}; // Untuk menyimpan semua nilai yang unik untuk parameter

  records.forEach(record => {
    const dataValues = record.dataValues;

    Object.keys(dataValues).forEach(param => {
      if (!['timestamp', 'id'].includes(param)) {
        const value = dataValues[param];
        if (value != null) {
          parameterCounts[param] = parameterCounts[param] || {};
          parameterCounts[param][value] = (parameterCounts[param][value] || 0) + 1;

          // Menyimpan setiap nilai unik untuk perbandingan nanti
          parameterValues[param] = parameterValues[param] || new Set();
          parameterValues[param].add(value);
        }
      }
    });
  });

  const parameterModes = {};
  Object.keys(parameterCounts).forEach(param => {
    const values = Array.from(parameterValues[param]);
    const counts = parameterCounts[param];
    let maxCount = 0;
    let modes = [];

    // Menentukan modus dan menghitung frekuensi terbesar
    values.forEach(value => {
      const count = counts[value];
      if (count > maxCount) {
        maxCount = count;
        modes = [value];
      } else if (count === maxCount) {
        modes.push(value);
      }
    });

    // Jika ada lebih dari satu modus atau tidak ada modus, pilih nilai terbesar
    if (modes.length !== 1) {
      // Memastikan perbandingan dilakukan sebagai angka
      parameterModes[param] = Math.max(...modes.map(v => Number(v)));
    } else {
      parameterModes[param] = modes[0];
    }
  });

  return parameterModes;
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
      // Mengalikan nilai bmp388Pressure dengan 10
      if (modeData.bmp388Pressure) {
        modeData.bmp388Pressure *= 10;
      }
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



// testing the modus data
exports.getlatestmodus = async (req, res) => {
  // Mengambil timestamp terakhir dari database
  const latestTimestamp = await anemo3d.findOne({
    attributes: ['timestamp'],
    order: [['timestamp', 'DESC']],
  });

  if (!latestTimestamp) {
    return res.status(404).json({ error: 'No records found' });
  }

  const lastTs = new Date(latestTimestamp.timestamp); // Pastikan ini mengacu pada field yang benar
  const tenSecondsAgo = new Date(lastTs.getTime() - 10000); // 10 detik

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

      // Mengalikan nilai bmp388Pressure dengan 10
      if (modeData.bmp388Pressure) {
        modeData.bmp388Pressure *= 10;
      }

      return {
        timeKey,
        mode: modeData
      };
    });

    // Respond with the modes per second
    res.json(modesPerSecond);

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};




exports.carbondaily = (request, response) => {
  const currentDate = new Date(); // Waktu saat ini
  const startdate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000)); // 24 jam ke belakang

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per jam
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
      timestamp: {
        [Op.between]: [startdate, currentDate], // 24 jam ke belakang dari waktu sekarang
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp'))], // Kelompokkan per jam
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.get('timestamp'), // Akses nilai menggunakan metode get
          co2_concentration: parseFloat(item.get('co2_concentration')),
          ch4_concentration: parseFloat(item.get('ch4_concentration')),
          dht_temperature: parseFloat(item.get('dht_temperature')),
          dht_humidity: parseFloat(item.get('dht_humidity')),
          bmp_temperature: parseFloat(item.get('bmp_temperature')),
          bmp_pressure: parseFloat(item.get('bmp_pressure')),
          sht31_temperature: parseFloat(item.get('sht31_temperature')),
          sht31_humidity: parseFloat(item.get('sht31_humidity')),
          approx_altitude: parseFloat(item.get('approx_altitude')),
          h2o: parseFloat(item.get('h2o')),
        };
      });
      response.json(modifiedResult);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};

// fungsi terbaru 
exports.anemodaily = (request, response) => {
  const currentDate = new Date(); // Waktu saat ini
  const startdate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000)); // 24 jam ke belakang dari saat ini

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per menit
      [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      timestamp: {
        [Op.between]: [startdate, currentDate], // Mengambil data 24 jam ke belakang dari waktu sekarang
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp'))], // Kelompokkan per jam
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.get('timestamp'), // Pastikan untuk mengakses nilai menggunakan metode get jika perlu
          selatan: parseFloat(item.get('selatan')),
          timur: parseFloat(item.get('timur')),
          utara: parseFloat(item.get('utara')),
          barat: parseFloat(item.get('barat')),
          bawah: parseFloat(item.get('bawah')),
          atas: parseFloat(item.get('atas')),
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
    const startDate = new Date(req.query.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(req.query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const pageSize = 1000; // Tentukan ukuran batch, sesuaikan dengan kapasitas memori
    let offset = 0;
    let hasMoreData = true;

    const collectedData = [];

    while (hasMoreData) {
      const dataBatch = await anemo3d.findAll({
        where: {
          timestamp: {
            [Sequelize.Op.gte]: startDate,
            [Sequelize.Op.lte]: endDate,
          },
        },
        order: [['timestamp', 'ASC']],
        limit: pageSize,
        offset: offset,
      });

      if (dataBatch.length > 0) {
        collectedData.push(...dataBatch);
        offset += dataBatch.length;
      } else {
        hasMoreData = false;
      }
    }

    console.log(`Total data gathered: ${collectedData.length}`);

    // Setup CSV stream
    const csvStream = fastcsv.format({ headers: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=EddyStation-${collectedData.length}-Data.csv`);

    // Pipe CSV stream to response
    csvStream.pipe(res).on('end', () => res.end());

    // Write data to CSV
    collectedData.forEach((item) => csvStream.write(item.dataValues));

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


//  ****************************************************************
//  Data Logger 
// ****************************************************************

// get last data dari datalogger
exports.getlastdatalog = (req, res) => {
  datalogger.findOne({
    order: [['id', 'DESC']],
  })
    .then((result) => {
      res.json(result); // Gunakan 'res' bukan 'response'
    })
    .catch((error) => {
      res.status(500).json({ error: 'Internal server error' }); // Gunakan 'res' bukan 'response'
    });
};

// get 10 data dari datalogger
exports.get10datalog = (request, response) => {
  datalogger.findAll({
    limit: 10,
    order: [['id', 'DESC']],
  })
    .then((result) => {
      response.json(result);
    })
    .catch((error) => {
      response.status(500).json({ error: 'Internal server error' });
    });
};

// get data selama 1 hari
exports.dataloggerdaily = (request, response) => {
  const currentDate = new Date(); // Waktu saat ini
  const startdate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000)); // 24 jam ke belakang

  datalogger.findAll({
    attributes: [
      // Mengelompokkan data per jam
      [Sequelize.fn('date_trunc', 'minute', Sequelize.col('createdAt')), 'createdAt'],
      [Sequelize.fn('min', Sequelize.col('ts')), 'ts'],
      [Sequelize.fn('avg', Sequelize.col('cpu_usage')), 'cpu_usage'],
      [Sequelize.fn('avg', Sequelize.col('mem_gpu')), 'mem_gpu'],
      [Sequelize.fn('avg', Sequelize.col('mem_arm')), 'mem_arm'],
      [Sequelize.fn('avg', Sequelize.col('temp')), 'temp']
    ],
    where: {
      createdAt: {
        [Op.between]: [startdate, currentDate], // 24 jam ke belakang dari waktu sekarang
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('createdAt'))], // Kelompokkan per jam
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('createdAt')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          ts: item.ts, // Akses nilai menggunakan metode get
          cpu_usage: parseFloat(item.cpu_usage),
          mem_gpu: parseFloat(item.mem_gpu),
          mem_arm: parseFloat(item.mem_arm),
          temp: parseFloat(item.temp)
        };
      });
      response.json(modifiedResult);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};

// get data selama 7 hari
exports.dataloggerweekly = async (request, response) => {

  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 7);

  // Query database untuk data setiap 30 menit selama 7 hari terakhir
  datalogger.findAll({
    attributes: [
      [Sequelize.literal("date_trunc('hour', \"createdAt\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"createdAt\") / 30)"), 'ts'],
      [Sequelize.fn('avg', Sequelize.col('cpu_usage')), 'cpu_usage'],
      [Sequelize.fn('avg', Sequelize.col('mem_gpu')), 'mem_gpu'],
      [Sequelize.fn('avg', Sequelize.col('mem_arm')), 'mem_arm'],
      [Sequelize.fn('avg', Sequelize.col('temp')), 'temp']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, currentDate],
      },
    },
    group: [Sequelize.literal("date_trunc('hour', \"createdAt\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"createdAt\") / 30)")],
    order: [[Sequelize.literal("date_trunc('hour', \"createdAt\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"createdAt\") / 30)"), 'ASC']],
  }).then(result => {
    const modifiedResult = result.map(item => {
      return {
        ts: item.ts,
        cpu_usage: parseFloat(item.cpu_usage),
        mem_gpu: parseFloat(item.mem_gpu),
        mem_arm: parseFloat(item.mem_arm),
        temp: parseFloat(item.temp)
      };
    });
    response.json(modifiedResult);
  })
    .catch(error => {
      console.error('Error details:', error);
      response.status(500).json({ error: 'Internal server error', details: error.message });
    });
};

// get data 30 hari
exports.dataloggermonthly = async (request, response) => {
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 30); // Mengatur startDate menjadi 30 hari yang lalu

  // Query database untuk data setiap jam selama 30 hari terakhir
  datalogger.findAll({
    attributes: [
      [Sequelize.literal("date_trunc('hour', \"ts\")"), 'ts'], // Mengelompokkan data per jam
      [Sequelize.fn('avg', Sequelize.col('cpu_usage')), 'cpu_usage'],
      [Sequelize.fn('avg', Sequelize.col('mem_gpu')), 'mem_gpu'],
      [Sequelize.fn('avg', Sequelize.col('mem_arm')), 'mem_arm'],
      [Sequelize.fn('avg', Sequelize.col('temp')), 'temp']
    ],
    where: {
      createdAt: {
        [Op.between]: [startDate, currentDate],
      },
    },
    group: [Sequelize.literal("date_trunc('hour', \"ts\")")], // Mengelompokkan data per jam
    order: [[Sequelize.literal("date_trunc('hour', \"ts\")"), 'ASC']],
  }).then(result => {
    const modifiedResult = result.map(item => {
      return {
        ts: item.ts,
        cpu_usage: parseFloat(item.cpu_usage),
        mem_gpu: parseFloat(item.mem_gpu),
        mem_arm: parseFloat(item.mem_arm),
        temp: parseFloat(item.temp)
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
// tester
// calculated modus data daily

function groupBySeconddaily(records) {
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
function calculateModesdaily(records) {
  const parameterCounts = {};

  records.forEach(record => {
    Object.keys(record).forEach(param => {
      if (!['timestamp', 'id'].includes(param) && record[param] != null) {
        const value = record[param];
        if (!parameterCounts[param]) {
          parameterCounts[param] = {};
        }
        if (!parameterCounts[param][value]) {
          parameterCounts[param][value] = 0;
        }
        parameterCounts[param][value] += 1;
      }
    });
  });

  const parameterModes = {};
  Object.keys(parameterCounts).forEach(param => {
    let maxCount = 0;
    let modeValue = null;

    Object.keys(parameterCounts[param]).forEach(value => {
      const count = parameterCounts[param][value];
      if (count > maxCount) {
        maxCount = count;
        modeValue = value; // Ini masih sebagai string
      }
    });

    // Konversi modeValue ke tipe data numerik
    // Cek apakah nilai asli adalah integer atau float
    if (modeValue != null) {
      const numericValue = Number(modeValue); // Konversi ke numerik
      parameterModes[param] = isNaN(numericValue) ? modeValue : numericValue;
    } else {
      parameterModes[param] = modeValue;
    }
  });

  return parameterModes;
}


exports.modusdaily = (request, response) => {
  const currentDate = new Date(); // Waktu saat ini
  const startdate = new Date(currentDate.getTime() - (24 * 60 * 60 * 1000)); // 24 jam ke belakang

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per jam
      [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('bmp388Pressure')), 'bmp388Pressure'],
      [Sequelize.fn('avg', Sequelize.col('bmp388Temp')), 'bmp388Temp'],
      [Sequelize.fn('avg', Sequelize.col('bmp388ApprxAltitude')), 'bmp388ApprxAltitude'],
      [Sequelize.fn('avg', Sequelize.col('sht85Humi')), 'sht85Humi'],
      [Sequelize.fn('avg', Sequelize.col('sht85Temp')), 'sht85Temp'],
      [Sequelize.fn('avg', Sequelize.col('co2')), 'co2'],
      [Sequelize.fn('avg', Sequelize.col('ch4')), 'ch4'],
      [Sequelize.fn('avg', Sequelize.col('H2OSHT85')), 'H2OSHT85'],
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      timestamp: {
        [Op.between]: [startdate, currentDate], // 24 jam ke belakang dari waktu sekarang
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp'))], // Kelompokkan per jam
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.get('timestamp'), // Akses nilai menggunakan metode get
          bmp388Pressure: parseFloat(item.get('bmp388Pressure')),
          bmp388Temp: parseFloat(item.get('bmp388Temp')),
          bmp388ApprxAltitude: parseFloat(item.get('bmp388ApprxAltitude')),
          sht85Humi: parseFloat(item.get('sht85Humi')),
          sht85Temp: parseFloat(item.get('sht85Temp')),
          co2: parseFloat(item.get('co2')),
          ch4: parseFloat(item.get('ch4')),
          H2OSHT85: parseFloat(item.get('H2OSHT85')),
          selatan: parseFloat(item.get('selatan')),
          timur: parseFloat(item.get('timur')),
          utara: parseFloat(item.get('utara')),
          barat: parseFloat(item.get('barat')),
          bawah: parseFloat(item.get('bawah')),
          atas: parseFloat(item.get('atas')),
        };
      });

      const groupedBySecond = groupBySeconddaily(modifiedResult); // Langsung gunakan results

      // Proses seluruh records tanpa membatasi hanya 5 data teratas
      const modesPerSecond = Object.entries(groupedBySecond).map(([timeKey, records]) => {
        const modeData = calculateModesdaily(records); // Gunakan seluruh records

        return {
          timeKey,
          mode: modeData
        };
      });

      // Langsung kembalikan seluruh hasil tanpa melakukan slice(-10)
      response.json(modesPerSecond);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};
exports.modusweekly = (request, response) => {
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 7);

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per jam
      [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('bmp388Pressure')), 'bmp388Pressure'],
      [Sequelize.fn('avg', Sequelize.col('bmp388Temp')), 'bmp388Temp'],
      [Sequelize.fn('avg', Sequelize.col('bmp388ApprxAltitude')), 'bmp388ApprxAltitude'],
      [Sequelize.fn('avg', Sequelize.col('sht85Humi')), 'sht85Humi'],
      [Sequelize.fn('avg', Sequelize.col('sht85Temp')), 'sht85Temp'],
      [Sequelize.fn('avg', Sequelize.col('co2')), 'co2'],
      [Sequelize.fn('avg', Sequelize.col('ch4')), 'ch4'],
      [Sequelize.fn('avg', Sequelize.col('H2OSHT85')), 'H2OSHT85'],
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      timestamp: {
        [Op.between]: [startDate, currentDate], // 24 jam ke belakang dari waktu sekarang
      },
    },
    group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp'))], // Kelompokkan per jam
    order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.timestamp,
          bmp388Pressure: parseFloat(item.bmp388Pressure),
          bmp388Temp: parseFloat(item.bmp388Temp),
          bmp388ApprxAltitude: parseFloat(item.bmp388ApprxAltitude),
          sht85Humi: parseFloat(item.sht85Humi),
          sht85Temp: parseFloat(item.sht85Temp),
          co2: parseFloat(item.co2),
          ch4: parseFloat(item.ch4),
          H2OSHT85: parseFloat(item.H2OSHT85),
          selatan: parseFloat(item.selatan),
          timur: parseFloat(item.timur),
          utara: parseFloat(item.utara),
          barat: parseFloat(item.barat),
          bawah: parseFloat(item.bawah),
          atas: parseFloat(item.atas),
        };
      });

      const groupedBySecond = groupBySeconddaily(modifiedResult); // Langsung gunakan results

      // Proses seluruh records tanpa membatasi hanya 5 data teratas
      const modesPerSecond = Object.entries(groupedBySecond).map(([timeKey, records]) => {
        const modeData = calculateModesdaily(records); // Gunakan seluruh records

        return {
          timeKey,
          mode: modeData
        };
      });

      // Langsung kembalikan seluruh hasil tanpa melakukan slice(-10)
      response.json(modesPerSecond);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};
exports.modusmonthly = (request, response) => {
  const currentDate = new Date();
  const startDate = new Date();
  startDate.setDate(currentDate.getDate() - 30);

  anemo3d.findAll({
    attributes: [
      // Mengelompokkan data per jam
      [Sequelize.fn('date_trunc', 'hour', Sequelize.col('timestamp')), 'timestamp'],
      [Sequelize.fn('avg', Sequelize.col('bmp388Pressure')), 'bmp388Pressure'],
      [Sequelize.fn('avg', Sequelize.col('bmp388Temp')), 'bmp388Temp'],
      [Sequelize.fn('avg', Sequelize.col('bmp388ApprxAltitude')), 'bmp388ApprxAltitude'],
      [Sequelize.fn('avg', Sequelize.col('sht85Humi')), 'sht85Humi'],
      [Sequelize.fn('avg', Sequelize.col('sht85Temp')), 'sht85Temp'],
      [Sequelize.fn('avg', Sequelize.col('co2')), 'co2'],
      [Sequelize.fn('avg', Sequelize.col('ch4')), 'ch4'],
      [Sequelize.fn('avg', Sequelize.col('H2OSHT85')), 'H2OSHT85'],
      [Sequelize.fn('avg', Sequelize.col('selatan')), 'selatan'],
      [Sequelize.fn('avg', Sequelize.col('timur')), 'timur'],
      [Sequelize.fn('avg', Sequelize.col('utara')), 'utara'],
      [Sequelize.fn('avg', Sequelize.col('barat')), 'barat'],
      [Sequelize.fn('avg', Sequelize.col('bawah')), 'bawah'],
      [Sequelize.fn('avg', Sequelize.col('atas')), 'atas']
    ],
    where: {
      timestamp: {
        [Op.between]: [startDate, currentDate], // 24 jam ke belakang dari waktu sekarang
      },
    },
    group: [Sequelize.fn('date_trunc', 'hour', Sequelize.col('timestamp'))], // Kelompokkan per jam
    order: [[Sequelize.fn('date_trunc', 'hour', Sequelize.col('timestamp')), 'ASC']],
  })
    .then((result) => {
      const modifiedResult = result.map(item => {
        return {
          timestamp: item.timestamp,
          bmp388Pressure: parseFloat(item.bmp388Pressure),
          bmp388Temp: parseFloat(item.bmp388Temp),
          bmp388ApprxAltitude: parseFloat(item.bmp388ApprxAltitude),
          sht85Humi: parseFloat(item.sht85Humi),
          sht85Temp: parseFloat(item.sht85Temp),
          co2: parseFloat(item.co2),
          ch4: parseFloat(item.ch4),
          H2OSHT85: parseFloat(item.H2OSHT85),
          selatan: parseFloat(item.selatan),
          timur: parseFloat(item.timur),
          utara: parseFloat(item.utara),
          barat: parseFloat(item.barat),
          bawah: parseFloat(item.bawah),
          atas: parseFloat(item.atas),
        };
      });

      const groupedBySecond = groupBySeconddaily(modifiedResult); // Langsung gunakan results

      // Proses seluruh records tanpa membatasi hanya 5 data teratas
      const modesPerSecond = Object.entries(groupedBySecond).map(([timeKey, records]) => {
        const modeData = calculateModesdaily(records); // Gunakan seluruh records

        return {
          timeKey,
          mode: modeData
        };
      });

      // Langsung kembalikan seluruh hasil tanpa melakukan slice(-10)
      response.json(modesPerSecond);
    })
    .catch((error) => {
      console.error("Error detail:", error);
      response.status(500).json({ error: 'Internal server error' });
    });
};

