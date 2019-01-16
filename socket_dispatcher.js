var express = require("express");
var app = express();
var server = app.listen(9991);
var io = require("socket.io")(server, { transports: ["websocket"] });

console.log(`Running socket dispatcher on 9991`);
var signalsClients = [];

io.on("connection", function(socket) {
  console.log("Client connected");
  socket.on("subscribe", chatId => {
    if (
      !signalsClients.some(sc => {
        sc.socketId == socket.id || sc.telegramChatId == chatId;
      })
    ) {
      signalsClients.push({ socketId: socket.id, telegramChatId: chatId });
      io.to(socket.id).emit("info", `Channel created for user ${chatId}`);
    }
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    var scIndex = signalsClients.findIndex(sc => {
      sc.socketId == socket.id;
    });
    signalsClients.splice(scIndex, 1);
  });
});

function dispatch(signal, clientIds) {
  clientIds.forEach(clientId => {
    let receiver = signalsClients.find(c => {
      return c.telegramChatId == clientId;
    });

    if (receiver) io.to(receiver.socketId).emit("signal", signal);
  });
}

module.exports = {
  dispatch: dispatch
};
