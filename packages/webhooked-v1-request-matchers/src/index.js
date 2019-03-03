const { createHmac } = require('crypto');

const isRequestFromV1 = (req, hmacKey) => {
  return (
    req.headers['x-v1-signature'] ===
    createHmac('sha1', hmacKey)
      .update(JSON.stringify(req.body))
      .digest('hex')
  );
};

module.exports.isRequestFromV1 = isRequestFromV1;
