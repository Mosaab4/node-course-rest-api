const {validationResult} = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const User = require('../models/user')

exports.signup = async (req, res, next) => {
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

    try {
        const hashPass = await bcrypt.hash(password, 12)

        const user = User({
            email: email,
            name: name,
            password: hashPass
        })

        const result = await user.save()

        res.status(201).json({
            message: 'user created',
            userId: result._id,
        })
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}

exports.login = async (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    let loadedUser

    try {
        const user = await User.findOne({email: email})
        if (!user) {
            const error = new Error('User not found')
            error.statusCode = 401
            throw error
        }

        const isEqual = await bcrypt.compare(password, user.password)

        if (!isEqual) {
            const error = new Error('User not found')
            error.statusCode = 401
            throw error
        }

        const token = jwt.sign({
                email: user.email,
                userId: user._id.toString()
            },
            'asdasdmansdiasdmasdjmds',
            {
                expiresIn: '1h'
            }
        )

        res.status(200).json({token: token, userId: user._id.toString()})
    } catch (error) {
        if (!err.statusCode) {
            err.statusCode = 500
        }
        next(err)
    }
}