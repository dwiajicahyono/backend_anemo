const fs = require("fs");
const csvParser = require("csv-parser");
const { Sequelize, Op } = require("sequelize");
const fastcsv = require('fast-csv');
const anemo3d = require("../models/models_3d_anemo"); // Import model sekali saja

// Mendapatkan 50 data anemo3d terbaru
exports.get50anemo3d = (req, res) => {
  anemo3d.findAll({
    limit: 50,
    order: [["id", "DESC"]],
  })
  .then(result => {
    res.json({
      count: result.length,
      data: result,
    });
  })
  .catch(error => {
    res.status(500).json({ error: "Internal server error" });
  });
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
      [Sequelize.fn('avg', Sequelize.col('absolute_humidity')), 'absolute_humidity']
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
          absolute_humidity: parseFloat(item.absolute_humidity),
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
      [Sequelize.fn('avg', Sequelize.col('absolute_humidity')), 'absolute_humidity']
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
        absolute_humidity: parseFloat(item.absolute_humidity),
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
    const endDate = new Date(req.query.endDate);
    const limit = parseInt(req.query.limit);

    console.log(`Received parameters: startDate = ${startDate}, endDate = ${endDate}, limit = ${limit}`);

    // Mengambil semua data yang tersedia hingga limit
    const allData = await anemo3d.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate,
          [Op.lt]: endDate,
        },
      },
      limit: limit,
      order: [['id', 'ASC']],
    });

    console.log(`Total data gathered: ${allData.length}`);

    // Setup CSV stream
    const csvStream = fastcsv.format({ headers: true });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Carbon1DataLength-${startDate}-${endDate}-${allData.length}.csv`);

    // Pipe CSV stream to response
    csvStream.pipe(res).on('end', () => res.end());

    // Write data to CSV
    allData.forEach(item => csvStream.write(item.dataValues));

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
