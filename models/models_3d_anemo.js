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
  co2: {
    type: Sequelize.FLOAT,
  },
  ch4: {
    type: Sequelize.FLOAT,
  },
  H2OSHT85: {
    type: Sequelize.FLOAT,
  },
  bmp388Pressure: {
    type: Sequelize.FLOAT,
  },
  bmp388Temp: {
    type: Sequelize.FLOAT,
  },
  bmp388ApprxAltitude: {
    type: Sequelize.FLOAT,
  },
  sht85Humi: {
    type: Sequelize.FLOAT,
  },
  sht85Temp: {
    type: Sequelize.FLOAT,
  },
});
module.exports = anemo3d;
