const User = require('../models/user')
const Post = require('../models/post')
const bcrypt = require("bcryptjs");
const validator = require('validator')
const jwt = require("jsonwebtoken");
const {clearImage} = require('../util/file')


module.exports = {
    createUser: async ({userInput}, req) => {
        const errors = []
        if (!validator.isEmail(userInput.email)) {
            errors.push({message: 'Email is invalid'})
        }

        if (
            validator.isEmpty(userInput.password) ||
            !validator.isLength(userInput.password, {min: 5})
        ) {
            errors.push({message: 'Password too short!'})
        }

        if (errors.length > 0) {
            const error = new Error('Invalid Input')
            error.data = errors
            error.code = 422
            throw error
        }

        const existingUser = await User.findOne({email: userInput.email})
        if (existingUser) {
            throw new Error('User already exists')
        }

        const hashPass = await bcrypt.hash(userInput.password, 12)

        const user = User({
            email: userInput.email,
            name: userInput.name,
            password: hashPass
        })

        const createdUser = await user.save()

        return {
            ...createdUser._doc,
            _id: createdUser._id.toString()
        }
    },
    login: async ({email, password}) => {
        const user = await User.findOne({email: email})

        if (!user) {
            const error = new Error('User not found')
            error.code = 401
            throw error
        }

        const isEqual = await bcrypt.compare(password, user.password)

        if (!isEqual) {
            const error = new Error('User not found')
            error.code = 401
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

        return {
            token: token,
            userId: user._id.toString()
        }
    },
    createPost: async ({postInput}, req) => {
        if (!req.isAuth) {
            const err = new Error('Not authenticated')
            err.code = 401
            throw err
        }

        const errors = []

        if (
            validator.isEmpty(postInput.title) ||
            !validator.isLength(postInput.title, {min: 5})
        ) {
            errors.push({message: 'Title is invalid'})
        }

        if (
            validator.isEmpty(postInput.content) ||
            !validator.isLength(postInput.content, {min: 5})
        ) {
            errors.push({message: 'Content is invalid'})
        }

        if (errors.length > 0) {
            const error = new Error('Invalid Input')
            error.data = errors
            error.code = 422
            throw error
        }

        const user = await User.findById(req.userId)
        if (!user) {
            const err = new Error('Invalid user.')
            err.code = 401
            throw err
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user,
        })

        const createdPost = await post.save()

        user.posts.push(post)
        await user.save()

        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString()
        }
    },
    posts: async ({page}, req) => {
        if (!req.isAuth) {
            const err = new Error('Not authenticated')
            err.code = 401
            throw err
        }

        if (!page) {
            page = 1
        }
        const perPage = 2

        const totalItems = await Post.find().countDocuments()

        const posts = await Post.find()
            .populate('creator')
            .sort({createdAt: -1})
            .skip((page - 1) * perPage)
            .limit(perPage)

        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                }
            }),
            totalPosts: totalItems
        }
    },
    post: async ({id}, req) => {
        if (!req.isAuth) {
            const err = new Error('Not authenticated')
            err.code = 401
            throw err
        }

        const post = await Post.findById(id)

        if (!post) {
            const error = new Error("couldn't find the post")
            error.statusCode = 404
            throw error
        }

        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },
    updatePost: async ({id, postInput}, req) => {
        if (!req.isAuth) {
            const err = new Error('Not authenticated')
            err.code = 401
            throw err
        }

        const post = await Post.findById(id).populate('creator')

        if (!post) {
            const error = new Error('Post Not found')
            error.statusCode = 404
            throw error
        }

        if (post.creator._id.toString() !== req.userId) {
            const error = new Error('Not Authorized')
            error.statusCode = 403
            throw error
        }

        const errors = []

        if (
            validator.isEmpty(postInput.title) ||
            !validator.isLength(postInput.title, {min: 5})
        ) {
            errors.push({message: 'Title is invalid'})
        }

        if (
            validator.isEmpty(postInput.content) ||
            !validator.isLength(postInput.content, {min: 5})
        ) {
            errors.push({message: 'Content is invalid'})
        }

        if (errors.length > 0) {
            const error = new Error('Invalid Input')
            error.data = errors
            error.code = 422
            throw error
        }

        post.title = postInput.title
        post.content = postInput.content

        if (postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl
        }

        const updatedPost = await post.save()

        return {
            ...updatedPost._doc,
            _id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        }
    },
    deletePost: async ({id}, req) => {
        if (!req.isAuth) {
            const err = new Error('Not authenticated')
            err.code = 401
            throw err
        }

        const post = await Post.findById(id)

        if (!post) {
            const error = new Error('Post Not found')
            error.statusCode = 404
            throw error
        }

        if (post.creator.toString() !== req.userId.t) {
            const error = new Error('Not Authorized')
            error.statusCode = 403
            throw error
        }
        clearImage(post.imageUrl)

        await Post.findOneAndRemove(id)

        const user = await User.findById(req.userId)
        user.posts.pull(id)
        await user.save()

        return true
    }
}