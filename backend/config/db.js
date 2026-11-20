
'use strict';

const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const conn = await mongoose.connect(config.mongoUri);

  console.log(`MongoDB Connected: ${conn.connection.host}`);

  return conn.connection;
};

module.exports = connectDB;
