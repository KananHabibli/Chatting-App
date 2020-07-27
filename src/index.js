const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')
const http = require('http')
const app  = express()
const server = http.createServer(app) 
const io = socketio(server)


const port = process.env.PORT || 3000

// Static public directory
app.use(express.static(path.join(__dirname, '../public')))



// server (emit) -> client (receive) --acknowledgement--> countUpdated
// client (emit) -> server (receive) --acknowledgement--> increment

io.on('connection', (socket) => {
    console.log('New WebSocket connection')

    
    socket.on('join', ({username, room}, callback) => {

        const {error, user} = addUser({id: socket.id, username, room})

        if (error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage('Admin','Welcome!')) 
        // Send to everyone except current user
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
        // Display users' name in the list
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        // No error
        callback()

    })
    socket.on('sendMessage', (text, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(text)){
            return callback('Profanity is not allowed')
        }
        // console.log(user.room)
        io.to(user.room).emit('message', generateMessage(user.username,text))
        callback()
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        callback('Location is sent')
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
    })
 
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }


        
    })
})


server.listen(port, () => {
    console.log(`Server is up on ${port}`)
})