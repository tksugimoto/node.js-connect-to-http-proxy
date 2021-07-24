const connect = require('./connect');
const { PassThrough } = require('stream');

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
