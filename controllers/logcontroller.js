const fs = require("fs");
const csvParser = require("csv-parser");
const { Sequelize, Op } = require("sequelize");
const fastcsv = require('fast-csv');
const moment = require('moment');
const log = require('../models/log_models')

const logCarbon1 = log;

exports.getOneLogCarbon1 = (request, response) => {
    logCarbon1.findOne({
        order: [['id', 'DESC']],
    })
        .then((result) => {
            response.json(result);
        })
        .catch((error) => {
            response.status(500).json({ error: 'Internal server error' });
        });
};

exports.get10LogCarbon1 = (request, response) => {
    logCarbon1.findAll({
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
