const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')


// @desc get all users
// @route GET /users
// @access Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean()   //search mongo for all notes

    if (!notes.length) {        //if there are no notes, or if the array of notes is empty
        return res.status(400).json({ message: 'There are no notes at this time' })   //return a JSON message to tell the user there are no notes
    }
    // Attach a user to each note before
    // sending the response back
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))
    res.json(notesWithUser)
})


// @desc Create new note
// @route POST /notes
// @access Private

const creatNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }
    const duplicate = await Note.findOne({ title }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title. please rename your note' })
    }


    // Assign and store the new user to the note
    const note = await Note.create({ user, title, text })

    if (note) {
        return res.status(201).json({ message: 'New note was created!' })
    } else {
        return res.status(400).json({ message: 'Note data input is invalid ' })
    }
})

//@desc Update a note
//@route PATCH /notes
//@access Private

const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm the input data
    if (!id || !user || !title || !text || typeOf(completed) !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm this note exists for the update
    const note = await Note.findById(id).exec()

    if (!note) {
        return res.status(400).json({ message: 'Note not found'})
    }
    // Check for a duplicate title
    const duplicate = await Note.findOne({ title }).lean().exec()

    // Allow for original notes to be renamed
    if (duplicate && duplicate?.id.toString() != id ) {
        return res.status(409).json({message: 'Duplicate note title' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json(`'${updatedNote.title}' has been updated!`)
})


//@desc Delete a note
//@route DELETE /notes
//@access Private

const deleteNote = asyncHandler(async (res, req) =>{
    const { id } = req.body
    // Double-check data
    if (!id) {
        return res.status(400).json({ message: 'A valid Note ID is required' })
    }
    const note = await Note.findById(id).lean()

    // confirm
    if (!note){
        return res.status(400).json({ message: 'A note with the given ID was not Found'})
    }

    const result = await note.deleteOne()

    const reply = `Note '${result.title} with ID ${result.id} has been deleted`

    res.json(reply)
})

module.exports = {
    getAllNotes,
    creatNewNote,
    updateNote,
    deleteNote
}
