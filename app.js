const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const path = require('path')

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use((err, req, res, next) => {
    console.log(err)
    const status = err.statusCode
    const message = err.message

    res.status(status).json({message:message})
})

const MONGODB_URI = 'mongodb://admin:password@localhost:27017?authMechanism=DEFAULT'

mongoose
    .connect(
        MONGODB_URI, {
            useNewUrlParser: true
        }
    )
    .then(result => {
        app.listen(8080)
    })
    .catch(err => {
        console.log(err)
    })

