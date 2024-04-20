require('dotenv').config();

module.exports = {
  HOSTS: process.env.HOSTS,
  USER: process.env.USER,
  PASSWORD: process.env.PASSWORD,
  DB: process.env.DB,
  DIALECT: process.env.DIALECT,
};
