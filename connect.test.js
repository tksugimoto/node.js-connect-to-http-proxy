const http = require('http');
const connect = require('./connect');
const { PassThrough, Transform } = require('stream');

let prosyServers = [];
afterEach(() => {
    prosyServers.forEach(prosyServer => prosyServer.close());
    prosyServers = [];
});

/**
 * @param {string} requestString
 * @returns Response String
 */
function generateResponse(requestString) {
    return `Response: ${requestString}`;
}

function createProxyServer() {
    return new Promise(resolve => {
        const server = http.createServer();
        const connectRequestUrlPromise = new Promise(connectRequestUrlResolve => {
            server.on('connect', (request, socket) => {
                socket.write('HTTP/1.0 200 Connection established\r\n\r\n');
                connectRequestUrlResolve(request.url);

                socket.pipe(new Transform({
                    transform(chunk, encoding, callback) {
                        callback(null, generateResponse(chunk.toString()));
                    },
                })).pipe(socket);
            });
        });
        server.listen({
            host: '127.0.0.1',
            port: 0,
        });
        server.on('listening', () => {
            const hostname = server.address().address;
            const port = server.address().port;
            resolve({
                proxyServerHost: `${hostname}:${port}`,
                connectRequestUrlPromise,
            });
        });
        prosyServers.push(server);
    });
}

expect.extend({
    /**
     * promise が resolve も reject もしないことをチェック
     * @param {Promise<any>} received
     * @param {number} timeoutMs
     * @returns
     */
    willNotSettle(received, timeoutMs = 1000) {
        const timeout = Symbol('timeout');
        return Promise.race([
            received,
            new Promise(resolve => setTimeout(() => resolve(timeout), timeoutMs)),
        ]).then(result => {
            return {
                message: () => `The subject is not Promise or settled within ${timeoutMs} milliseconds.`,
                pass: result === timeout,
            };
        });
    },
});


test('proxyServerHost が指定されていない場合例外が投げられる', () => {
    const proxyServerHost = undefined;
    const destHostname = 'localhost';
    const destPort = '80';
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    expect(() => {
        connect(proxyServerHost, destHostname, destPort, inputStream, outputStream);
    }).toThrowError('http-proxy-server arg ("hostname:port") required.');
});

test('destHostname が指定されていない場合例外が投げられる', () => {
    const proxyServerHost = 'localhost:8080';
    const destHostname = undefined;
    const destPort = '80';
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    expect(() => {
        connect(proxyServerHost, destHostname, destPort, inputStream, outputStream);
    }).toThrowError('destination-server hostname arg required.');
});

test('destPort が指定されていない場合例外が投げられる', () => {
    const proxyServerHost = 'localhost:8080';
    const destHostname = 'localhost';
    const destPort = undefined;
    const inputStream = new PassThrough();
    const outputStream = new PassThrough();
    expect(() => {
        connect(proxyServerHost, destHostname, destPort, inputStream, outputStream);
    }).toThrowError('destination-server port arg required.');
});

test('Proxy server へ接続する', () => {
    return createProxyServer().then(({
        proxyServerHost,
        connectRequestUrlPromise,
    }) => {
        const destHostname = '127.1.2.3';
        const destPort = '12345';
        const inputStream = new PassThrough();
        const outputStream = new PassThrough();
        const responsePromise = new Promise(resolve => {
            outputStream.once('data', chunk =>  resolve(chunk.toString()));
        });

        connect(proxyServerHost, destHostname, destPort, inputStream, outputStream);
        inputStream.end('test_input');

        return Promise.all([
            expect(responsePromise).resolves.toBe(generateResponse('test_input')),
            expect(connectRequestUrlPromise).resolves.toBe(`${destHostname}:${destPort}`),
        ]);
    });
});

test('Proxy server が複数指定されている場合、1番目へのconnectに失敗したら2番目へ接続する', () => {
    return createProxyServer().then(({
        proxyServerHost,
        connectRequestUrlPromise,
    }) => {
        const dummyProxyServerHost = '192.0.2.0:8080'; // 192.0.2.0/24 は test 用のため誰も使用していない
        const destHostname = '127.1.2.3';
        const destPort = '12345';
        const inputStream = new PassThrough();
        const outputStream = new PassThrough();
        const responsePromise = new Promise(resolve => {
            outputStream.once('data', chunk =>  resolve(chunk.toString()));
        });

        connect(`${dummyProxyServerHost},${proxyServerHost}`, destHostname, destPort, inputStream, outputStream);
        inputStream.end('test_input');

        return Promise.all([
            expect(responsePromise).resolves.toBe(generateResponse('test_input')),
            expect(connectRequestUrlPromise).resolves.toBe(`${destHostname}:${destPort}`),
        ]);
    });
});

test('Proxy server が複数指定されている場合、1番目へのconnectに成功したら2番目へ接続しない', () => {
    return Promise.all([
        createProxyServer(),
        createProxyServer(),
    ]).then(([server1, server2]) => {
        const proxyServerHost = `${server1.proxyServerHost},${server2.proxyServerHost}`;
        const destHostname = '127.1.2.3';
        const destPort = '12345';
        const inputStream = new PassThrough();
        const outputStream = new PassThrough();
        const responsePromise = new Promise(resolve => {
            outputStream.once('data', chunk =>  resolve(chunk.toString()));
        });

        connect(proxyServerHost, destHostname, destPort, inputStream, outputStream);
        inputStream.end('test_input');

        return Promise.all([
            expect(responsePromise).resolves.toBe(generateResponse('test_input')),
            expect(server1.connectRequestUrlPromise).resolves.toBe(`${destHostname}:${destPort}`),
            expect(server2.connectRequestUrlPromise).willNotSettle(800 /* ms */),
        ]);
    });
});
