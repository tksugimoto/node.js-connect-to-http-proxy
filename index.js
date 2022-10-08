#!/usr/bin/env node

const showUsageAndExit = () => {
    console.error(`
        connect-to-http-proxy: simple relaying command via proxy.
        usage: connect-to-http-proxy proxy-server-hostname:proxy-server-port target-hostname target-port
        example:
            connect-to-http-proxy proxy.intra.example.co.jp:8080 example.com 80
            connect-to-http-proxy proxy.intra.example.co.jp:8080,proxy.intra.example.co.jp:8081 example.com 80
    `.replace(/^ {8}/mg, '').trim());

    process.exit(1);
};

if (process.argv.length <= 4) {
    showUsageAndExit();
}

const connect = require('./connect');

const proxyServerHosts = process.argv[2];
const destHostname = process.argv[3];
const destPort = process.argv[4];

connect(proxyServerHosts, destHostname, destPort, process.stdin, process.stdout);
