/* eslint-disable no-new-wrappers */
/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
const assert = require('assert');

const utils = require('./utils');

class Websocket {
  constructor(server, socket) {
    this._server = server;
    this._socket = socket;

    this._socket.on('data', this.onData.bind(this));

    this._pingInterval = setInterval(() => {
      this.sendPing();
    }, 5000);
  }

  getUpgradeHeaders(headers) {
    const secWebsocketKey = headers['sec-websocket-key'];

    const websocketAcceptKey = utils.calculateAcceptKey(secWebsocketKey);
    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${websocketAcceptKey}`
    ];

    return responseHeaders;
  }

  onData(buffer) {
    const firstByte = buffer.readUInt8(0);

    const FIN = firstByte >> 7 === 1;
    const RSV1 = (firstByte >> 6) & 0x1;
    const RSV2 = (firstByte >> 5) & 0x1;
    const RSV3 = (firstByte >> 4) & 0x1;

    assert.notEqual(FIN, 0, 'We do not support partial messages');
    assert.notEqual(RSV1, 1, 'RSV1 is not 0');
    assert.notEqual(RSV2, 1, 'RSV2 is not 0');
    assert.notEqual(RSV3, 1, 'RSV3 is not 0');

    const OPCODE = firstByte & 0xf;

    if (OPCODE === 0x8) {
      this.onClose();
    } else if (OPCODE === 0x9) {
      // PING Event
      this.sendPong();
    } else if (OPCODE === 0x1) {
      const secondByte = buffer.readUInt8(1);

      const MASK = parseInt(secondByte >> 7, 2) === 1;
      const PAYLOAD_LENGTH = secondByte & 0x7f;

      const MASKING_KEY = buffer.slice(2, 6);

      const PAYLOAD = buffer.slice(6);

      let ENCODED = Buffer.alloc(PAYLOAD_LENGTH);

      if (MASK) {
        PAYLOAD.forEach((octet, i) => {
          const j = i % 4;
          ENCODED[i] = octet ^ MASKING_KEY[j];
        });
      } else {
        ENCODED = Buffer.from(PAYLOAD);
      }

      const message = ENCODED.toString('utf-8');

      this._server.emit('message', this, message);
    }
  }

  onClose() {
    this._server.emit('close', this);
    this._socket.end();
    clearTimeout(this._pingInterval);
  }

  sendMessage(message, callback) {
    const opcode = 0x1;

    let payload = '';

    if (typeof message === 'object') {
      payload = JSON.stringify(message);
    } else {
      payload = new String(message);
    }

    this._write(opcode, payload, callback);
  }

  sendPong() {
    const opcode = 0xa;
    this._write(opcode, null);
  }

  sendPing() {
    const opcode = 0x9;
    this._write(opcode, null);
  }

  _write(opcode, payload, callback) {
    // close, ping, pong
    const firstByte = 128 | opcode;

    if (opcode !== 0x1) {
      const secondByte = 0;
      const buffer = Buffer.from([firstByte, secondByte]);

      if (this._socket) {
        this._socket.write(buffer, callback);
      }
    } else {
      // text frame

      const payloadBuffer = Buffer.from(payload);
      const secondByte = payloadBuffer.length;

      const headerBuffer = Buffer.from([firstByte, secondByte]);

      const resultBufferLength = headerBuffer.length + payloadBuffer.length;
      const resultBuffer = Buffer.concat([headerBuffer, payloadBuffer], resultBufferLength);

      this._socket.write(resultBuffer);
    }
  }
}

module.exports = Websocket;
