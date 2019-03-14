const crypto = require('crypto');

const MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

module.exports = {
  isWebsocketRequest(headers) {
    return headers.upgrade === 'websocket';
  },
  calculateAcceptKey(secWebsocketKey) {
    const concatKey = `${secWebsocketKey}${MAGIC_STRING}`;

    const hash = crypto.createHash('sha1');
    hash.update(concatKey);

    const websocketAcceptKey = hash.digest('base64');

    return websocketAcceptKey;
  }
};
