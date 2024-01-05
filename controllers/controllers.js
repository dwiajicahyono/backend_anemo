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
