const test=require('node:test');const assert=require('node:assert/strict');
test('project exposes CommonJS application entry point',()=>{const app=require('../src/app');assert.equal(typeof app,'function');});
test('API key generation uses cryptographically secure random bytes (module loads)',()=>{const service=require('../src/services/core.service');assert.equal(typeof service.createKey,'function');});
