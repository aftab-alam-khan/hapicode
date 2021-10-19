const hapi = require('@hapi/hapi');
const inert = require('@hapi/inert');
const vision = require('@hapi/vision');
const path = require('path')
const mongoose = require('mongoose');

// Connect Database
mongoose.connect('mongodb://localhost/hapidb')
    .then(() => console.log('MongoDB Connected'))
    .catch((err) => console.log(err));

// Create Task Model
const Task = mongoose.model('Task', { text: String });


const init = async () => {

    const server = hapi.server({
        port: 8000,
        host: 'localhost'
    });

    await server.register([{
        // Inert Templates
        plugin: inert
    },
    {
        // Vision Templates
        plugin: vision
    }]);
    

    const routes = [
        {// GET Tasks Route
            method: 'GET',
            path: '/tasks',
            handler: async (request, h) => {
                Task.create()
                const taskRaw = await Task.find({});
                const taskData = taskRaw.map(val => {
                    return { id: val._id.toString(), text: val.text }
                });
                return h.view('task', {
                    tasks: taskData
                });
            }
        },
        {// Get Tasks Route by id
            method: 'GET',
            path: '/tasks/{id}',
            handler: async (request, h) => {
                const _id = request.params.id;
                const taskRaw = await Task.findById({ _id });
                const taskData = [taskRaw].map(val => {
                    return { id: val._id, text: val.text }
                });
                h.response(taskData)
                return h.view('task', {
                    tasks: taskData
                });
            }
        },
        {// POST Tasks Route
            method: 'POST',
            path: '/tasks',
            handler: async (request, h) => {
                const rawText = request.payload.text;
                const addd = new Task({ text: rawText })
                const {_id, text} = await addd.save();
                return h.response({ _id, text }).redirect().location('/tasks');
                
            }
        },
        {// Update Tasks Route by id
            method: 'PATCH',
            path: '/tasks/{id}',
            handler: async (request, h) => {
                const _id = request.params.id;
                const textRaw = request.payload.text
                const taskData = await Task.updateOne({ _id },
                    { $set: { text: textRaw }});
                console.log(taskData, 'Updated');
                return h.response('Updated');
            }
        },
        {// Delete Tasks Route by id
            method: 'DELETE',
            path: '/tasks/{id}',
            handler: async (request, h) => {
                const _id = request.params.id;
                const taskData = await Task.deleteOne({_id})
                return h.response(`Deleted ${taskData}`)
            }
        }
    ];

    server.route(routes);

    server.views({
        engines: { html: require('handlebars') },
        path: path.join(__dirname, '/views'),
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();