// models/todo.js
const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    taskName: {
        type: String,
        required: true,
        trim: true
    },
    taskDescription: {
        type: String,
        trim: true
    },
    dueDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Todo = mongoose.model('Todo', todoSchema);

module.exports = Todo;