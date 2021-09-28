const http = require('http');
const assert = require('assert');

/**
 *
 * @param {string} proxyServerHosts (Comma-separated string of `${FQDN || IP}:${port}`)
 * @param {string} destHostname destination-server hostname (FQDN or IP)
 * @param {string} destPort destination-server port (numeric string)
 * @param {NodeJS.ReadStream} inputStream stream supplying input like process.stdin
 * @param {NodeJS.WriteStream} outputStream stream that accepts output like process.stdout
 */
function connect(proxyServerHosts, destHostname, destPort, inputStream, outputStream) {
    assert(proxyServerHosts, 'http-proxy-server arg ("hostname:port") required.');
    assert(destHostname, 'destination-server hostname arg required.');
    assert(destPort, 'destination-server port arg required.');

    const start = Date.now();

    proxyServerHosts.split(',')
    .reduce((previousPromise, proxyServerHost) => {
        return previousPromise.catch(() => { // 前のserverへの接続に失敗した場合のみ次のserverへ接続する
            return connectToProxyServer(proxyServerHost)
            .then(proxySocket => {
                console.error(`${Date.now() - start} ms: ${proxyServerHost}: connected`);
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
            const timeoutMs = 500;
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
        promise.catch(() => {
            console.error(`${Date.now() - start} ms: ${proxyServerHost}: timeout`);
        });
        return promise;
    }
}

module.exports = connect;
