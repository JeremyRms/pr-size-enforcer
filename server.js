require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

if (environment === 'development') {
    console.log('Running in development mode');
}

const fs = require('fs');
const http = require('http');
const { Probot, createNodeMiddleware } = require('probot');
const appFn = require('./index');

const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, 'utf8');

const probot = new Probot({
    appId: process.env.APP_ID,
    privateKey,
    secret: process.env.WEBHOOK_SECRET,
});

probot.load(appFn);

// Create the Probot webhook middleware
const webhookMiddleware = createNodeMiddleware(appFn, { probot });

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/') {
        webhookMiddleware(req, res);
    } else {
        res.statusCode = 404;
        res.end('Not found');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Probot app listening on http://localhost:${PORT}`);
});
