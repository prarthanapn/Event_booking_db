require('dotenv').config(); // loading environment variables from .env file
const express = require('express'); // importing express module
const mongoose = require('mongoose'); // importing mongoose for MongoDB connection

const app = express(); // creating express app

app.use(express.json()); // middleware to parse JSON

// connecting to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Connected to MongoDB successfully");
})
.catch((err) => {
    console.log("Error connecting to MongoDB:", err);
});

// creating event schema
const eventSchema = new mongoose.Schema({
    title: String,
    desc: String,
    date: String,
    time: String,
    capacity: Number
});

// creating registration schema
const registrationSchema = new mongoose.Schema({
    name: String,
    email: String,
    eventTitle: String,
    eventDesc: String,
    eventDate: String,
    eventTime: String
});

// creating models
const Event = mongoose.model('Event', eventSchema);
const Registration = mongoose.model('Registration', registrationSchema);

// add a new event
app.post('/postevent', async (request, response) => {
    let title = request.body.title;
    let desc = request.body.desc;
    let date = request.body.date;
    let time = request.body.time;
    let capacity = request.body.capacity;

    if (!title || !desc || !date || !time || !capacity) {
        return response.status(400).json({ message: 'Please provide title, desc, date, time, and capacity' });
    }

    let event = new Event({
        title: title,
        desc: desc,
        date: date,
        time: time,
        capacity: capacity
    });

    await event.save();

    response.status(200).json({
        message: 'Event added successfully',
        event: event
    });
});

// get all events
app.get('/getevent', async (request, response) => {
    let events = await Event.find();
    response.status(200).json({
        message: 'Events retrieved successfully',
        events: events
    });
});

// update event
app.put('/updateevent', async (request, response) => {
    let title = request.body.title;
    let desc = request.body.desc;
    let date = request.body.date;
    let time = request.body.time;
    let capacity = request.body.capacity;

    let event = await Event.findOne({ title: title });

    if (!event) {
        return response.status(404).json({ message: 'Event not found' });
    }

    event.desc = desc;
    event.date = date;
    event.time = time;
    event.capacity = capacity;

    await event.save();

    response.status(200).json({
        message: 'Event updated successfully',
        event: event
    });
});

// delete event
app.delete('/deleteevent', async (request, response) => {
    let title = request.body.title;

    let event = await Event.findOneAndDelete({ title: title });

    if (!event) {
        return response.status(404).json({ message: 'Event not found' });
    }

    response.status(200).json({ message: 'Event deleted successfully' });
});

// register for an event
app.post('/registration', async (request, response) => {
    let name = request.body.name;
    let email = request.body.email;
    let eventTitle = request.body.eventTitle;

    if (!name || !email || !eventTitle) {
        return response.status(400).json({ message: 'Please provide name, email, and event title' });
    }

    let event = await Event.findOne({ title: eventTitle });

    if (!event) {
        return response.status(404).json({ message: 'Event not found' });
    }

    let already = await Registration.findOne({ name: name, eventTitle: eventTitle });

    if (already) {
        return response.status(409).json({ message: 'Already registered for this event' });
    }

    if (event.capacity > 0) {
        let reg = new Registration({
            name: name,
            email: email,
            eventTitle: eventTitle,
            eventDesc: event.desc,
            eventDate: event.date,
            eventTime: event.time
        });

        await reg.save();

        event.capacity = event.capacity - 1;
        await event.save();

        response.status(200).json({
            message: 'Registration successful',
            registration: reg
        });
    } else {
        response.status(400).json({ message: 'Event is full' });
    }
});

// get all registrations
app.get('/getregistration', async (request, response) => {
    let registrations = await Registration.find();
    response.status(200).json({
        message: 'All registrations retrieved successfully',
        registrations: registrations
    });
});

// get one registration by name
app.post('/getoneregistration', async (request, response) => {
    let name = request.body.name;

    if (!name) {
        return response.status(400).json({ message: 'Please provide a name' });
    }

    let reg = await Registration.find({ name: name });

    if (reg.length === 0) {
        return response.status(404).json({ message: 'No registration found with that name' });
    }

    response.status(200).json({
        message: 'Registration found successfully',
        registrations: reg
    });
});

// update registration
app.put('/updateregistration', async (request, response) => {
    let name = request.body.name;
    let newName = request.body.newName;
    let email = request.body.email;

    let reg = await Registration.findOne({ name: name });

    if (!reg) {
        return response.status(404).json({ message: 'Registration not found' });
    }

    if (newName) {
        reg.name = newName;
    }
    if (email) {
        reg.email = email;
    }

    await reg.save();

    response.status(200).json({
        message: 'Registration updated successfully',
        registration: reg
    });
});

// delete registration
app.delete('/deleteregistration', async (request, response) => {
    let name = request.body.name;

    if (!name) {
        return response.status(400).json({ message: 'Please provide a name to delete registration' });
    }

    let reg = await Registration.findOneAndDelete({ name: name });

    if (!reg) {
        return response.status(404).json({ message: 'Registration not found' });
    }

    response.status(200).json({ message: 'Registration deleted successfully' });
});

// Search registration by email
app.post('/searchregistration', async (request, response) => {
    let email = request.body.email;

    if (!email) {
        return response.status(400).json({ message: 'Please provide an email' });
    }

    let registrations = await Registration.find();
    let found = registrations.filter((reg) => reg.email.toLowerCase() === email.toLowerCase());

    if (found.length === 0) {
        return response.status(404).json({ message: 'No registration found with that email' });
    }

    response.status(200).json({
        message: 'Registrations found successfully',
        registrations: found
    });
});

// Filter registrations by event title
app.post('/filterregistration', async (request, response) => {
    let eventTitle = request.body.eventTitle;

    if (!eventTitle) {
        return response.status(400).json({ message: 'Please provide an event title' });
    }

    let registrations = await Registration.find();
    let found = registrations.filter((reg) => reg.eventTitle.toLowerCase() === eventTitle.toLowerCase());

    if (found.length === 0) {
        return response.status(404).json({ message: 'No registrations found for this event' });
    }

    response.status(200).json({
        message: 'Registrations for event found successfully',
        registrations: found
    });
});



// start the server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
