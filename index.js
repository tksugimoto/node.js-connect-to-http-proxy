const net = require('net');
const assert = require('assert');
const {
    parse: parseUrl,
} = require('url');

assert(process.argv[2], 'http-proxy-server arg ("hostname:port") required.');

const {
    hostname: proxyHost,
    port: proxyPort,
} = parseUrl(`http://${process.argv[2]}`);

const destHost = 'example.com';
const destPort = 80;

const CRLF = '\r\n';

const serverSocket = net.createConnection(proxyPort, proxyHost);
serverSocket.once('connect', () => {
    serverSocket.write(`CONNECT ${destHost}:${destPort} HTTP/1.0${CRLF}${CRLF}`);
    serverSocket.once('data', data => {
        const response = data.toString();
        const statusLine = response.split(CRLF)[0];
        const [/* version */, statusCode] = statusLine.split(' ');
        if (statusCode !== '200') {
            console.error(statusLine);
            return;
        }
        process.stdin.pipe(serverSocket);
        serverSocket.pipe(process.stdout);
    });
});
serverSocket.on('error', err => {
    console.error(err);
});
