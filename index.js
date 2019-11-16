#!/usr/bin/env node

const http = require('http');
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

const proxyRequestOptions = {
    hostname: proxyHost,
    port: proxyPort,
    method: 'CONNECT',
    path: `${destHost}:${destPort}`,
};
const proxyRequest = http.request(proxyRequestOptions);
proxyRequest.on('connect', (res, proxySocket) => {
    if (res.statusCode !== 200) {
        console.error(`${res.statusCode} ${res.statusMessage}`);
        return;
    }
    process.stdin.pipe(proxySocket);
    proxySocket.pipe(process.stdout);
});
proxyRequest.on('error', err => {
    console.error(err);
});
proxyRequest.end();
