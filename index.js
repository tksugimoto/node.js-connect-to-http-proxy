#!/usr/bin/env node

const showUsageAndExit = () => {
    console.error(`
        connect-to-http-proxy: simple relaying command via proxy.
        usage: connect-to-http-proxy
                [[-H] http-proxy-server-hostname:proxy-server-port]
                [-S socks4-proxy-server-hostname:proxy-server-port]
                target-hostname target-port
        example:
            connect-to-http-proxy -H proxy.intra.example.co.jp:8080 example.com 80
            connect-to-http-proxy -H proxy.intra.example.co.jp:8080,proxy.intra.example.co.jp:8081 example.com 80
            connect-to-http-proxy -S proxy.intra.example.co.jp:1080 example.com 80
            connect-to-http-proxy -S proxy.intra.example.co.jp:1080,proxy.intra.example.co.jp:1081 example.com 80
        environment variable:
            SSH_CONNECT_TIMEOUT_MS: timeout to connect to proxy server. default: 500.
    `.replace(/^ {8}/mg, '').trim());

    process.exit(1);
};

if (process.argv.length <= 4) {
    showUsageAndExit();
}

const timeoutMs = Number(process.env.SSH_CONNECT_TIMEOUT_MS);

const options = {
    timeoutMs,
};

const connect = require('./connect');

if (process.argv[2] === '-H') { // HTTP Proxy
    const proxyServerHosts = process.argv[3];
    const destHostname = process.argv[4];
    const destPort = process.argv[5];

    connect(proxyServerHosts, destHostname, destPort, process.stdin, process.stdout, options);
} else if (process.argv[2] === '-S') { // SOCKS4 Proxy
    const proxyServerHosts = process.argv[3];
    const destHostname = process.argv[4];
    const destPort = process.argv[5];
    options.isSocks4 = true;

    connect(proxyServerHosts, destHostname, destPort, process.stdin, process.stdout, options);
} else {
    // 互換性のため `-` オプション無しの場合は HTTP Proxy とする
    const proxyServerHosts = process.argv[2];
    const destHostname = process.argv[3];
    const destPort = process.argv[4];

    connect(proxyServerHosts, destHostname, destPort, process.stdin, process.stdout, options);
}
