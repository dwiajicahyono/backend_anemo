const fs = require("fs");
const csvParser = require("csv-parser");
const { Sequelize, Op } = require("sequelize");
const fastcsv = require('fast-csv');
const moment = require('moment');
const dht = require('../models/dht_models')

const dhtCarbon1 = dht;

exports.getOneDhtCarbon1 = (request, response) => {
    dhtCarbon1.findOne({
        order: [['id', 'DESC']],
    })
        .then((result) => {
            response.json(result);
        })
        .catch((error) => {
            response.status(500).json({ error: 'Internal server error' });
        });
};

exports.get10DhtCarbon1 = (request, response) => {
    dhtCarbon1.findAll({
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

exports.dhtCarbon1daily = (request, response) => {
    const currentDate = new Date();
    const startdate = new Date(currentDate);
    startdate.setDate(currentDate.getDate() - 1);
    const endDate = new Date(currentDate);

    dhtCarbon1.findAll({
        attributes: [
            [Sequelize.fn('date_trunc', 'minute', Sequelize.col('createdAt')), 'ts'],
            [Sequelize.fn('avg', Sequelize.col('dht22Temp')), 'dht22Temp'],
            [Sequelize.fn('avg', Sequelize.col('dht22Humi')), 'dht22Humi'],
            [Sequelize.fn('avg', Sequelize.col('dht22HeatIndex')), 'dht22HeatIndex']
        ],
        where: {
            createdAt: {
                [Op.between]: [startdate, endDate],
            },
        },
        group: [Sequelize.fn('date_trunc', 'minute', Sequelize.col('createdAt'))],
        order: [[Sequelize.fn('date_trunc', 'minute', Sequelize.col('createdAt')), 'ASC']],
    })
        .then((result) => {
            const modifiedResult = result.map(item => {
                return {
                    ts: item.ts,
                    dht22Temp: parseFloat(item.dht22Temp),
                    dht22Humi: parseFloat(item.dht22Humi),
                    dht22HeatIndex: parseFloat(item.dht22HeatIndex)
                };
            });
            response.json(modifiedResult);
        })
        .catch((error) => {
            console.error(error);
            response.status(500).json({ error: 'Internal server error' });
        });
};


exports.dht1weekly = async (request, response) => {

    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() - 7);

    // Query database untuk data setiap 30 menit selama 7 hari terakhir
    dhtCarbon1.findAll({
        attributes: [
            [Sequelize.literal("date_trunc('hour', \"ts\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"ts\") / 30)"), 'ts'],
            [Sequelize.fn('avg', Sequelize.col('dht22Temp')), 'dht22Temp'],
            [Sequelize.fn('avg', Sequelize.col('dht22Humi')), 'dht22Humi'],
            [Sequelize.fn('avg', Sequelize.col('dht22HeatIndex')), 'dht22HeatIndex']
        ],
        where: {
            createdAt: {
                [Op.between]: [startDate, currentDate],
            },
        },
        group: [Sequelize.literal("date_trunc('hour', \"ts\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"ts\") / 30)")],
        order: [[Sequelize.literal("date_trunc('hour', \"ts\") + INTERVAL '30 minutes' * FLOOR(EXTRACT(MINUTE FROM \"ts\") / 30)"), 'ASC']],
    }).then(result => {
        const modifiedResult = result.map(item => {
            return {
                ts: item.ts,
                dht22Temp: parseFloat(item.dht22Temp),
                dht22Humi: parseFloat(item.dht22Humi),
                dht22HeatIndex: parseFloat(item.dht22HeatIndex)
            };
        });
        response.json(modifiedResult);
    })
        .catch(error => {
            console.error('Error details:', error);
            response.status(500).json({ error: 'Internal server error', details: error.message });
        });
};

exports.dht1monthly = async (request, response) => {
    const currentDate = new Date();
    const startDate = new Date();
    startDate.setDate(currentDate.getDate() - 30); // Mengatur startDate menjadi 30 hari yang lalu

    // Query database untuk data setiap jam selama 30 hari terakhir
    dhtCarbon1.findAll({
        attributes: [
            [Sequelize.literal("date_trunc('hour', \"ts\")"), 'ts'], // Mengelompokkan data per jam
            [Sequelize.fn('avg', Sequelize.col('dht22Temp')), 'dht22Temp'],
            [Sequelize.fn('avg', Sequelize.col('dht22Humi')), 'dht22Humi'],
            [Sequelize.fn('avg', Sequelize.col('dht22HeatIndex')), 'dht22HeatIndex']
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
                dht22Temp: parseFloat(item.dht22Temp),
                dht22Humi: parseFloat(item.dht22Humi),
                dht22HeatIndex: parseFloat(item.dht22HeatIndex)
            };
        });
        response.json(modifiedResult);
    })
        .catch(error => {
            console.error('Error details:', error);
            response.status(500).json({ error: 'Internal server error', details: error.message });
        });
};

// Download data
exports.downloaddht1 = async (req, res) => {
    try {
        // Validasi dan konversi parameter
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(req.query.endDate);
        const limit = parseInt(req.query.limit);

        console.log(`Received parameters: startDate = ${startDate}, endDate = ${endDate}, limit = ${limit}`);

        // Mengambil semua data yang tersedia hingga limit
        const allData = await dhtCarbon1.findAll({
            where: {
                ts: {
                    [db.Op.gte]: startDate,
                    [db.Op.lt]: endDate,
                },
            },
            limit: limit,
            order: [['id', 'ASC']], // Pengurutan berdasarkan 'id' dari terkecil ke terbesar
        });

        console.log(`Total data gathered: ${allData.length}`);

        // Setup CSV stream
        const csvStream = fastcsv.format({ headers: true });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=DHT1Data-${startDate}-${endDate}-${allData.length}.csv`);

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