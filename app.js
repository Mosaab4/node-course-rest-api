const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const path = require('path')
const multer = require('multer')
const {graphqlHTTP} = require('express-graphql')
const graphqlSchema = require('./grqphql/schema')
const graphqlResolvers = require('./grqphql/resolvers')



// const feedRoutes = require('./routes/feed');
// const authRoutes = require('./routes/auth');

const app = express();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.use(bodyParser.json()); // application/json
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))
app.use('/images', express.static(path.join(__dirname, 'images')))

app.use('/graphql', graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolvers
}))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// app.use('/feed', feedRoutes);
// app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
    console.log(err)
    const status = err.statusCode
    const message = err.message
    const data = err.data

    res.status(status).json({message: message, data: data})
})

const MONGODB_URI = 'mongodb://admin:password@localhost:27017?authMechanism=DEFAULT'

mongoose
    .connect(
        MONGODB_URI, {
            useNewUrlParser: true
        }
    )
    .then(result => {
        const server = app.listen(8080)
        // const io = require('./socket').init(server)
        //
        // io.on('connection', (socket) => {
        //     console.log('a user connected')
        // })
    })
    .catch(err => {
        console.log(err)
    })

