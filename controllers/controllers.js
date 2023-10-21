const fs = require("fs");
const csvParser = require("csv-parser");
const path = require("path");
const { Sequelize } = require("sequelize");
const anemo3d = require("../models/models_3d_anemo"); // Hanya import sekali

exports.get50anemo3d = (request, response) => {
  anemo3d
    .findAll({
      limit: 50,
      order: [["createdAt", "DESC"]],
    })
    .then((result) => {
      response.json({
        count: result.length,
        data: result,
      });
    })
    .catch((error) => {
      response.status(500).json({ error: "Internal server error" });
    });
};

exports.add3dAnemo = (request, response) => {
  if (!request.file) {
    return response.status(400).send("No CSV file uploaded");
  }

  const data = [];
  fs.createReadStream(request.file.path)
    .pipe(csvParser())
    .on("data", (row) => {
      // let waktuParts = row.waktu.split(".");
      // row.waktu = `${waktuParts[0].padStart(2, "0")}:${waktuParts[1].padStart(
      //   2,
      //   "0"
      // )}:${waktuParts[2].padStart(2, "0")}`;
      row.timestamp = parseFloat(row.timestamp);

      row.selatan = parseFloat(row.selatan);
      row.timur = parseFloat(row.timur);
      row.utara = parseFloat(row.utara);
      row.barat = parseFloat(row.barat);
      row.bawah = parseFloat(row.bawah);
      row.atas = parseFloat(row.atas);
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
    .on("end", () => {
      // Masukkan data dari CSV ke tabel di database
      anemo3d
        .bulkCreate(data)
        .then(() => {
          response
            .status(200)
            .send(
              "Data imported successfully with data: " + JSON.stringify(data)
            );
        })
        .catch((err) => {
          console.error("Error:", err);
          response.status(500).send("Failed to import data");
        });
    });
};
