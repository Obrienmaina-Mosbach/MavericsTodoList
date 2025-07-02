// index.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const methodOverride = require('method-override');
const path = require('path');
const fs = require('fs'); // Keep for logger

// Load environment variables from .env file
dotenv.config();

const Todo = require('./Models/todo'); // Import your Todo Mongoose model

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
// Set the view engine to EJS
app.set('view engine', 'ejs');
// Specify the directory where EJS templates are located
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse URL-encoded bodies (for form data submissions)
app.use(express.urlencoded({ extended: true }));
// Middleware for parsing JSON data (useful for API endpoints if you add them later)
app.use(express.json());
// Middleware for method override, allowing PUT and DELETE requests from HTML forms
app.use(methodOverride('_method'));

// Serve static files (like CSS, images, JavaScript) from the 'public' directory.
// This allows your HTML to link to '/style.css' and find the file in 'your-project/public/style.css'.
app.use(express.static(path.join(__dirname, 'public')));

// Custom Logger Middleware: Logs details of incoming requests to a file.
function logger(req, res, next) {
    const logMessage = `${new Date().toISOString()} - ${req.method} ${req.url}\n`;
    fs.appendFile('access.log', logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
    next(); // Pass control to the next middleware or route handler
}
app.use(logger); // Apply the custom logger middleware to all incoming requests

// --- MongoDB Connection ---
// Connect to MongoDB using the URI from environment variables or a default local URI
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/todoApp')
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Routes ---

// Route to display all tasks: This is the main To-Do List page.
// It fetches all tasks from MongoDB and renders them using the 'todolist.ejs' template.
app.get('/', async (req, res) => {
    try {
        const todos = await Todo.find({}); // Fetch all tasks from MongoDB
        res.render('todolist', { todos }); // Render todolist.ejs, passing the fetched tasks
    } catch (error) {
        console.error('Error retrieving tasks for view:', error);
        res.status(500).send('Failed to load to-do list.'); // Send an error response
    }
});

// Route to create a new task: Handles form submissions for adding new tasks.
app.post('/todos', async (req, res) => {
    try {
        const { title, description } = req.body; // Extract 'title' and 'description' from the form data
        if (!title) {
            return res.status(400).send('Task title is required.'); // Validate that a title is provided
        }

        // Create a new Todo document based on the Mongoose model
        const newTodo = new Todo({
            taskName: title,        // Map 'title' from form to 'taskName' in schema
            taskDescription: description, // Map 'description' from form to 'taskDescription'
            status: 'pending'       // New tasks are 'pending' by default
        });

        await newTodo.save(); // Save the new task to the database
        res.redirect('/'); // Redirect back to the main list after successful creation
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).send('Failed to add task.'); // Send an error response
    }
});

// Route to toggle task status (Mark as Done/Undone): Handles PUT requests to update task status.
app.put('/todos/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the task ID from the URL parameters
        const { done } = req.body; // Get the 'done' status from the form (string 'true' or 'false')

        // Determine the new status based on the 'done' value
        const newStatus = (done === 'true' || done === true) ? 'completed' : 'pending';

        // Find the task by ID and update its status
        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true, runValidators: true } // 'new: true' returns the updated document; 'runValidators: true' ensures schema validation
        );

        if (!updatedTodo) {
            return res.status(404).send('Task not found.'); // If task not found, send 404
        }
        res.redirect('/'); // Redirect back to the main list after update
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).send('Failed to update task.'); // Send an error response
    }
});

// Route to delete a task: Handles DELETE requests to remove tasks.
app.delete('/todos/:id', async (req, res) => {
    try {
        const { id } = req.params; // Get the task ID from the URL parameters
        const deletedTodo = await Todo.findByIdAndDelete(id); // Find and delete the task by ID

        if (!deletedTodo) {
            return res.status(404).send('Task not found.'); // If task not found, send 404
        }
        res.redirect('/'); // Redirect back to the main list after deletion
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).send('Failed to delete task.'); // Send an error response
    }
});

// Start the server: Listen for incoming requests on the specified port.
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
