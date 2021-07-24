#!/usr/bin/env node

const connect = require('./connect');

const proxyServerHost = process.argv[2];
const destHost = process.argv[3];
const destPort = process.argv[4];

connect(proxyServerHost, destHost, destPort);
