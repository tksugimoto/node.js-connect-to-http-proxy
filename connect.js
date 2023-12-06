const http = require('http');
const net = require('net');
const assert = require('assert');

/**
 *
 * @param {string} proxyServerHosts (Comma-separated string of `${FQDN || IP}:${port}`)
 * @param {string} destHostname destination-server hostname (FQDN or IP)
 * @param {string} destPort destination-server port (numeric string)
 * @param {NodeJS.ReadStream} inputStream stream supplying input like process.stdin
 * @param {NodeJS.WriteStream} outputStream stream that accepts output like process.stdout
 * @param {object} options
 * @param {number?} options.timeoutMs timeout to connect to proxy server
 * @param {Boolean} options.isSocks4 use SOCKS4. default: false = HTTP Proxy mode
 */
function connect(proxyServerHosts, destHostname, destPort, inputStream, outputStream, options = {}) {
    assert(proxyServerHosts, 'http-proxy-server arg ("hostname:port") required.');
    assert(destHostname, 'destination-server hostname arg required.');
    assert(destPort, 'destination-server port arg required.');
    const timeoutMs = options.timeoutMs || 500;
    assert(Number.isInteger(timeoutMs), 'timeoutMs must be Integer.');
    const isSocks4 = options.isSocks4 || false;

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

            if (isSocks4) {
                assert(/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/.test(destHostname), `destination-server(${destHostname}) must be IPv4.`);
                const proxyRequest = net.createConnection(proxyPort, proxyHostname);

                const uint8 = new Uint8Array(9);
                uint8[0] = 4; // version number
                uint8[1] = 1; // command code: CONNECT
                const portView = new DataView(uint8.buffer, 2, 2); // destination port
                portView.setInt16(0, Number(destPort), /* littleEndian  = */ false);
                uint8.set(destHostname.split('.').map(Number), 4); // destination IP
                uint8[8] = 0; // USERID and NULL: null
                proxyRequest.write(uint8);

                setTimeout(() => {
                    promise.catch(() => {
                        proxyRequest.destroy();
                    });
                    reject(`Connection timeout to ${proxyHostname}:${proxyPort} (${timeoutMs} ms)`);
                }, timeoutMs);
                proxyRequest.once('readable', () => {
                    const data = proxyRequest.read(8); // Socks Response: 8 Bytes
                    const response = new DataView(data.buffer);
                    const resultCode = response.getInt8(1);
                    if (resultCode !== 90) { // request granted
                        reject(`Socks server result code: ${resultCode}`);
                        return;
                    }
                    resolve(proxyRequest);
                });
                proxyRequest.on('error', err => {
                    reject(err);
                });
                // TODO: 共通化
                return;
            }

            const proxyRequestOptions = {
                hostname: proxyHostname,
                port: proxyPort,
                method: 'CONNECT',
                path: `${destHostname}:${destPort}`,
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
