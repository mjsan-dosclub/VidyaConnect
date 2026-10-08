import test from 'node:test';
import assert from 'node:assert/strict';
import {retryTransientAI} from '../lib/ai-retry';
test('Gemini 503 retries recover without resubmitting a lead', async()=>{
 let attempts=0;
 const value=await retryTransientAI(async timeout=>{assert.ok(timeout<=20000);if(++attempts<3)throw {status:503};return 'parsed';},{delayMs:0});
 assert.equal(value,'parsed');assert.equal(attempts,3);
});
test('Auth and quota failures are not retried', async()=>{
 for(const status of [401,403,429]){let attempts=0;await assert.rejects(retryTransientAI(async()=>{attempts++;throw Object.assign(new Error('Failure'),{status});},{delayMs:0}));assert.equal(attempts,1);}
});
test('Repeated provider failures stop after three attempts', async()=>{
 let attempts=0;await assert.rejects(retryTransientAI(async()=>{attempts++;throw {status:503};},{delayMs:0}));assert.equal(attempts,3);
});
