var io = require('socket.io')(80)

console.log('Running socket dispatcher on port 80 🎵')
var signalsClients = []

io.on('connection', function (socket) {
    console.log('Client connected')
    socket.on('subscribe', (chatId) => {
        if (!signalsClients.some((sc) => { sc.socketId == socket.id })) {
            signalsClients.push({ socketId: socket.id, telegramChatId: chatId })
            console.log(`ITF user ${chatId} connected on socket ${socket.id}`)
        }
    });
    socket.on('disconnect', () => {
        console.log('Client disconnected')
        var scIndex = signalsClients.findIndex((sc) => { sc.socketId == socket.id })
        signalsClients.splice(scIndex, 1)
    });
});

function dispatch(signal, clientIds) {
    clientIds.forEach(clientId => {
        io.to(signalsClients[clientId]).emit('signal', signal)
    });
}

module.exports = {
    dispatch: dispatch
}