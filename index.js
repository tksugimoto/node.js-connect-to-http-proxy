#!/usr/bin/env node

const http = require('http');
const assert = require('assert');
const {
    parse: parseUrl,
} = require('url');

const proxyServerHost = process.argv[2];
const destHost = process.argv[3];
const destPort = process.argv[4];

assert(proxyServerHost, 'http-proxy-server arg ("hostname:port") required.');

const {
    hostname: proxyHost,
    port: proxyPort,
} = parseUrl(`http://${proxyServerHost}`);


assert(destHost, 'destination-server host arg required.');
assert(destPort, 'destination-server port arg required.');

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
