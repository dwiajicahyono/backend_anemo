const { Sequelize, Op } = require("sequelize");
// const carbon_config = require('../configs/dataCarbon.config');
require("dotenv").config();

const log_sequelize = new Sequelize(
    process.env.DB,
    process.env.USER,
    process.env.PASSWORD,
    {
        host: process.env.HOSTS,
        dialect: process.env.DIALECT,
        logging: false,
    }
);

const log = log_sequelize.define("logeddystation", {
    log: {
        type: Sequelize.STRING,
    },
});
module.exports = log;
