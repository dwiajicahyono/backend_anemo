const { Sequelize, Op } = require("sequelize");
// const carbon_config = require('../configs/dataCarbon.config');
require("dotenv").config();

const dht_sequelize = new Sequelize(
    process.env.DB,
    process.env.USER,
    process.env.PASSWORD,
    {
        host: process.env.HOSTS,
        dialect: process.env.DIALECT,
        logging: false,
    }
);

const dht = dht_sequelize.define("dhteddystation", {
    ts: {
        type: Sequelize.DATE,
    },
    humanTime: {
        type: Sequelize.STRING,
    },
    dht22Temp: {
        type: Sequelize.FLOAT,
    },
    dht22Humi: {
        type: Sequelize.FLOAT,
    },
    dht22HeatIndex: {
        type: Sequelize.FLOAT,
    },
});
module.exports = dht;
