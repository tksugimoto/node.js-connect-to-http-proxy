const http = require('http');
const assert = require('assert');

/**
 *
 * @param {string} proxyServerHost (`${FQDN || IP}:${port}`)
 * @param {string} destHostname destination-server hostname (FQDN or IP)
 * @param {string} destPort destination-server port (numeric string)
 * @param {NodeJS.ReadStream} inputStream stream supplying input like process.stdin
 * @param {NodeJS.WriteStream} outputStream stream that accepts output like process.stdout
 */
function connect(proxyServerHost, destHostname, destPort, inputStream, outputStream) {
    assert(proxyServerHost, 'http-proxy-server arg ("hostname:port") required.');
    assert(destHostname, 'destination-server hostname arg required.');
    assert(destPort, 'destination-server port arg required.');

    const {
        hostname: proxyHostname,
        port: proxyPort,
    } = new URL(`http://${proxyServerHost}`);

    const proxyRequestOptions = {
        hostname: proxyHostname,
        port: proxyPort,
        method: 'CONNECT',
        path: `${destHostname}:${destPort}`,
    };
    const proxyRequest = http.request(proxyRequestOptions);
    proxyRequest.on('connect', (res, proxySocket) => {
        if (res.statusCode !== 200) {
            console.error(`${res.statusCode} ${res.statusMessage}`);
            return;
        }
        inputStream.pipe(proxySocket);
        proxySocket.pipe(outputStream);
    });
    proxyRequest.on('error', err => {
        console.error(err);
    });
    proxyRequest.end();
}

module.exports = connect;
