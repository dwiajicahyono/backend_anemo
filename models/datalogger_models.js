const { Sequelize, Op } = require("sequelize");
// const carbon_config = require('../configs/dataCarbon.config');
require("dotenv").config();

const datalogger_sequelize = new Sequelize(
  process.env.DB,
  process.env.USER,
  process.env.PASSWORD,
  {
    host: process.env.HOSTS,
    dialect: process.env.DIALECT,
    logging: false,
  }
);

const datalogger = datalogger_sequelize.define("datalogger", {
    ts: {
        type: Sequelize.DATE,
      },
      humanTime: {
        type: Sequelize.STRING,
      },
      cpu_usage: {
        type: Sequelize.INTEGER,
      },
      mem_gpu: {
        type: Sequelize.INTEGER,
      },
      mem_arm: {
        type: Sequelize.INTEGER,
      },
      temp: {
        type: Sequelize.FLOAT,
      },
});
module.exports = datalogger ;
