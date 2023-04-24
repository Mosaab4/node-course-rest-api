const {validationResult} = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

exports.signup = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        const error = new Error('Validation Failed')
        error.statusCode = 422
        errors.data = errors.array()
        throw error
    }

    const email = req.body.email
    const name = req.body.name
    const password = req.body.password

    bcrypt.hash(password, 12)
        .then(hashPass => {
            const user = User({
                email: email,
                name: name,
                password: hashPass
            })

            return user.save()
        })
        .then(result => {
            res.status(201).json({
                message: 'user created',
                userId: result._id,
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}

exports.login = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password

    console.log(req)
    let loadedUser

    User.findOne({email: email})
        .then(user => {
            console.log(user)
            if (!user) {
                const error = new Error('User not found')
                error.statusCode = 401
                throw error
            }

            loadedUser = user
            return bcrypt.compare(password, user.password)
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('User not found')
                error.statusCode = 401
                throw error
            }

            const token = jwt.sign({
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                'asdasdmansdiasdmasdjmds',
                {
                    expiresIn: '1h'
                }
            )

            res.status(200).json({token: token, userId: loadedUser._id.toString()})
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500
            }
            next(err)
        })
}