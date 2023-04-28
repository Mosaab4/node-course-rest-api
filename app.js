const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const path = require('path')
const multer = require('multer')
const {graphqlHTTP} = require('express-graphql')
const graphqlSchema = require('./grqphql/schema')
const graphqlResolvers = require('./grqphql/resolvers')
const auth = require('./middleware/is-auth')
const {clearImage} = require('./util/file')

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
    rootValue: graphqlResolvers,
    graphiql: true,
    formatError(err) {
        if (!err.originalError) {
            return err
        }

        const data = err.originalError.data
        const message = err.message || 'An error occurred'
        const code = err.originalError.code || 500

        return {message: message, status: code, data: data}
    }
}))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next();
});

// app.use('/feed', feedRoutes);
// app.use('/auth', authRoutes);
app.use(auth)

app.put('/post-image', (req, res, next) => {
    if (!req.isAuth) {
        const err = new Error('Not authenticated')
        err.code = 401
        throw err
    }

    if (!req.file) {
        return res.status(200).json({message: 'No file provided!'})
    }

    if (req.body.oldPath) {
        clearImage(req.body.oldPath)
    }

    return res.status(201).json({
        message: 'File Stored!',
        filePath: req.file.path
    })
})

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

