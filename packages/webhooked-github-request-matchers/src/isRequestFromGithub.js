const { createHmac } = require('crypto');

module.exports = (req, hmacKey) =>
  req.headers['x-hub-signature'] ===
  `sha1=${createHmac('sha1', hmacKey)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;
