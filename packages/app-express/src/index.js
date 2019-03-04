const express = require('express');
const webhooked = require('@andrew-codes/webhooked');

const app = express();

app.use(express.json());

app.post('/', async (request, response) => {
  try {
    const responses = await webhooked({
      presets: [
        [
          '@andrew-codes/webhooked-preset-issue-sync-gh-v1',
          {
            connection: {
              v1: {
                host: process.env.HOST,
                instance: process.env.INSTANCE,
                port: 443,
                isHttps: true,
                token: process.env.V1TOKEN,
                hmacSecret: process.env.V1SECRET,
              },
              gh: {
                token: process.env.GHTOKEN,
                hmacSecret: process.env.GHSECRET,
              },
            },
            scope: process.env.SCOPE,
            team: process.env.TEAM,
          },
        ],
      ],
    }).handle(request);
    response.status(200).send(responses.join(', '));
  } catch (error) {
    response.status(500).send('Server Error');
  }
});

app.listen(process.env.PORT || 3000);
