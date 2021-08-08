#!/usr/bin/env node

const connect = require('./connect');

const proxyServerHost = process.argv[2];
const destHostname = process.argv[3];
const destPort = process.argv[4];

connect(proxyServerHost, destHostname, destPort, process.stdin, process.stdout);
