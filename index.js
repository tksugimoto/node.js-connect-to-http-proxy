#!/usr/bin/env node

const connect = require('./connect');

const proxyServerHosts = process.argv[2];
const destHostname = process.argv[3];
const destPort = process.argv[4];

connect(proxyServerHosts, destHostname, destPort, process.stdin, process.stdout);
