require('dotenv').config();

// Import mongoose
const mongoose = require('mongoose');   

function connectDB() {
    // Database Connection
    mongoose.connect(process.env.MONGO_CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true});
    const connection = mongoose.connection;

    connection.once('open', () => {
        console.log('Database connected 🥳🥳🥳🥳');
    }).on('error', err => {
        console.log('Connection failed ☹️☹️☹️☹️');
    })
}

// Yr12TSfLdnWQySQz

module.exports = connectDB;