const http = require('http');
const assert = require('assert');
const {
    parse: parseUrl,
} = require('url');

/**
 *
 * @param {string} proxyServerHost (`${FQDN || IP}:${port}`)
 * @param {string} destHostname destination-server hostname (FQDN or IP)
 * @param {string} destPort destination-server port (numeric string)
 */
function connect(proxyServerHost, destHostname, destPort) {
    assert(proxyServerHost, 'http-proxy-server arg ("hostname:port") required.');

    const {
        hostname: proxyHostname,
        port: proxyPort,
    } = parseUrl(`http://${proxyServerHost}`);

    assert(destHostname, 'destination-server hostname arg required.');
    assert(destPort, 'destination-server port arg required.');

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
        process.stdin.pipe(proxySocket);
        proxySocket.pipe(process.stdout);
    });
    proxyRequest.on('error', err => {
        console.error(err);
    });
    proxyRequest.end();
}

module.exports = connect;
