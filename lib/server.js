const http = require('http');

const utils = require('./utils');
const Websocket = require('./websocket');

const server = http.createServer();

server.on('upgrade', (req, socket) => {
  const { headers } = req;

  if (utils.isWebsocketRequest(headers)) {
    const websocket = new Websocket(server, socket);
    const responseHeaders = websocket.getUpgradeHeaders(headers);

    const headersString = `${responseHeaders.join('\r\n')}\r\n\r\n`;
    socket.write(headersString);
  }
});

module.exports = server;
