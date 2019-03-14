const server = require('./../');

// echo server
server.on('message', (websocket, message) => {
  websocket.sendMessage(message);
});

server.listen(8080);
