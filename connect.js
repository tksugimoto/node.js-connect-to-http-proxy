const http = require('http');
const assert = require('assert');

/**
 *
 * @param {string} proxyServerHosts (Comma-separated string of `${FQDN || IP}:${port}`)
 * @param {string} destHostname destination-server hostname (FQDN or IP)
 * @param {string} destPort destination-server port (numeric string)
 * @param {NodeJS.ReadStream} inputStream stream supplying input like process.stdin
 * @param {NodeJS.WriteStream} outputStream stream that accepts output like process.stdout
 * @param {object} options
 * @param {number?} options.timeoutMs timeout to CONNECT(HTTP method)
 */
function connect(proxyServerHosts, destHostname, destPort, inputStream, outputStream, options = {}) {
    assert(proxyServerHosts, 'http-proxy-server arg ("hostname:port") required.');
    assert(destHostname, 'destination-server hostname arg required.');
    assert(destPort, 'destination-server port arg required.');
    const timeoutMs = options.timeoutMs || 500;
    assert(Number.isInteger(timeoutMs), 'timeoutMs must be Integer.');

    proxyServerHosts.split(',')
    .reduce((previousPromise, proxyServerHost) => {
        return previousPromise.catch(() => { // 前のserverへの接続に失敗した場合のみ次のserverへ接続する
            return connectToProxyServer(proxyServerHost)
            .then(proxySocket => {
                inputStream.pipe(proxySocket);
                proxySocket.pipe(outputStream);
            });
        });
    }, Promise.reject())
    .catch(err => console.error(err));

    function connectToProxyServer(proxyServerHost) {
        const promise = new Promise((resolve, reject) => {
            const {
                hostname: proxyHostname,
                port: proxyPort,
            } = new URL(`http://${proxyServerHost}`);

            const proxyRequestOptions = {
                hostname: proxyHostname,
                port: proxyPort,
                method: 'CONNECT',
                path: `${destHostname}:${destPort}`,
                headers: {
                    'User-Agent': 'connect-to-http-proxy',
                },
            };
            const proxyRequest = http.request(proxyRequestOptions);
            setTimeout(() => {
                promise.catch(() => {
                    proxyRequest.destroy();
                });
                reject(`Connection timeout to ${proxyHostname}:${proxyPort} (${timeoutMs} ms)`);
            }, timeoutMs);
            proxyRequest.on('connect', (res, proxySocket) => {
                if (res.statusCode !== 200) {
                    reject(`${res.statusCode} ${res.statusMessage}`);
                    return;
                }
                resolve(proxySocket);
            });
            proxyRequest.on('error', err => {
                reject(err);
            });
            proxyRequest.end();
        });
        return promise;
    }
}

module.exports = connect;
