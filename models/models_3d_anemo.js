const { Sequelize, Op } = require("sequelize");
// const carbon_config = require('../configs/dataCarbon.config');
require("dotenv").config();

const anemo_sequelize = new Sequelize(
  process.env.DB,
  process.env.USER,
  process.env.PASSWORD,
  {
    host: process.env.HOSTS,
    dialect: process.env.DIALECT,
    logging: false,
  }
);

const anemo3d = anemo_sequelize.define("anemo3d", {
  timestamp: {
    type: Sequelize.DATE,
  },
  selatan: {
    type: Sequelize.FLOAT,
  },
  timur: {
    type: Sequelize.FLOAT,
  },
  utara: {
    type: Sequelize.FLOAT,
  },
  barat: {
    type: Sequelize.FLOAT,
  },
  bawah: {
    type: Sequelize.FLOAT,
  },
  atas: {
    type: Sequelize.FLOAT,
  },
  co2_concentration: {
    type: Sequelize.FLOAT,
  },
  ch4_concentration: {
    type: Sequelize.FLOAT,
  },
  dht_temperature: {
    type: Sequelize.FLOAT,
  },
  dht_humidity: {
    type: Sequelize.FLOAT,
  },
  bmp_temperature: {
    type: Sequelize.FLOAT,
  },
  bmp_pressure: {
    type: Sequelize.FLOAT,
  },
  sht31_temperature: {
    type: Sequelize.FLOAT,
  },
  sht31_humidity: {
    type: Sequelize.FLOAT,
  },
  approx_altitude: {
    type: Sequelize.FLOAT,
  },
  h2o: {
    type: Sequelize.FLOAT,
  },
});
module.exports = anemo3d;
