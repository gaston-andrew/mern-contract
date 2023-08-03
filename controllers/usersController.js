const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

// @desc get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) =>{
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found'})
    }
    res.json(users)
})



// @desc create new user
// @route POST /users
// @access Private
const createUser = asyncHandler(async (req, res) =>{
    const { username, password, roles } = req.body

    //Confirm recieved data has username, password, and is not an empty array
    if(!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'All Fields are required' })
    }
    //Check for duplicate information
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate){
        return res.status(409).json({ message: 'Duplicate username' })
    }

        //Hash the password
        const hashPass = await bcrypt.hash(password, 10) //salt rounds

        const userObject = { username, "password": hashPass, roles }

        const user = await User.create(userObject)

        if (user) {  // Created user
            res.status(201).json({ message: `New user ${ username } created` })
        } else {
            res.status(400).json({ message: 'Invalid user data received' })
        }
})


// @desc Update new user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) =>{
    const { id, username, roles, active, password } = req.body

    //Confirm Data
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    const user = await User.findById(id).exec()

    if(!user){
        return res.status(400).json({ message: 'User not found' })
    }

    //Check for duplicate
    const duplicate = await User.findOne({ username }).lean().exec()
        // Allow updates to the original user
    if (duplicate && duplicate?._id.toString() !== id){
        return res.status(409).json({ message: 'Duplicate Username' })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password){
        //hash password
        user.password = await bcrypt.hash(password, 10) // salt rounds
    }

    const updatedUser= await user.save()

    res.json({ message: `${updatedUser.username} updated`})
})

// @desc Delete user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) =>{
    const { id } = req.body
    if(!id) {
        return res.status(400).json({ message: 'User ID Required'})
    }

    const note = await Note.findOne({ user: id }).lean().exec()
    if (note){
        return res.status(400).json({ message: 'User has assigned notes' })
    }

    const user = await User.findById(id).exec()

    if(!user){
        return res.status(400).json({ message: 'User not found' })
    }
    const result = await user.deleteOne()

    const reply = `Username ${result.username} with ID ${result._id} has been deleted`

    res.json(reply)
})



module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser
}
