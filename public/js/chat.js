const socket = io()

// Elements
const messageForm = document.querySelector('#message-form')
const messageFormInput = messageForm.querySelector('input')
const messageFormButton = messageForm.querySelector('button')
const loc = document.querySelector('#send-location')
const messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix : true})

const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = messages.offsetHeight

    // Height of messages container
    // Including the last message
    const containerHeight = messages.scrollHeight

    // How far have i scrolled
    // Excluding the last message
    const scrollOffset = messages.scrollTop + visibleHeight


    // console.log(messages.scrollTop)
    // console.log('visibleHeight' +visibleHeight)
    // console.log('Height of messages container : ' +containerHeight)
    // console.log('How far have i scrolled : ' +scrollOffset)

    if (containerHeight - newMessageHeight <= scrollOffset){
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (message) => {
    // console.log(message)
    const html = Mustache.render(messageTemplate , {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // console.log(message)
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', message => {
    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    // Disable
    messageFormButton.setAttribute('disabled', 'disabled')
    
    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
        // Enable
        messageFormButton.removeAttribute('disabled')
        messageFormInput.value = ''
        messageFormInput.focus()
        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

loc.addEventListener('click', () => {
    // Disable
    loc.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared!') 

            // Enable
            loc.removeAttribute('disabled') 
        })
    })
    
    
})

socket.emit('join', {username, room}, error => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})