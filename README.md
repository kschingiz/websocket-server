# Websocket Server

Simple and lightweight partial implementation of Websocket server by RFC-6455.

With Zero dependencies

## Usage

```js
const server = require('./../');

// echo server
server.on('message', (websocket, message) => {
  websocket.sendMessage(message);
});

server.listen(8080);
```

## TODOS

1. Support for partial messages
2. Support for secured WS: WSS
3. Proxy support
4. Tests coverage
5. Code style, Prettier + Eslint

## WARNING: The project is not intended to be used in production, I am developing it just for fun
