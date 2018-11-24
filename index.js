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


assert(process.argv[3], 'destination-server host arg required.');
assert(process.argv[4], 'destination-server port arg required.');
const destHost = process.argv[3];
const destPort = process.argv[4];

const CRLF = '\r\n';

const proxySocket = net.createConnection(proxyPort, proxyHost);
proxySocket.once('connect', () => {
    proxySocket.write(`CONNECT ${destHost}:${destPort} HTTP/1.0${CRLF}${CRLF}`);
    proxySocket.once('data', data => {
        const response = data.toString();
        const statusLine = response.split(CRLF)[0];
        const [/* version */, statusCode] = statusLine.split(' ');
        if (statusCode !== '200') {
            console.error(statusLine);
            return;
        }
        process.stdin.pipe(proxySocket);
        proxySocket.pipe(process.stdout);
    });
});
proxySocket.on('error', err => {
    console.error(err);
});
