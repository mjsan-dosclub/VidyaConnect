import test from 'node:test';
import assert from 'node:assert/strict';
import { recoverName, statedNames } from '../lib/name-extraction';
test('Recover explicit names after English and Tamil feedback', () => {
  assert.equal(recoverName('Please add reports. Teachers waste hours. My name is Mohan Raj. My mobile number is 9987654321.', ''), 'Mohan Raj');
  assert.equal(recoverName('அறிக்கைகள் வேண்டும். ஆசிரியர்களுக்கு நேரம் ஆகிறது. என் பெயர் அருண் குமார். என் மொபைல் எண் 9987654321.', ''), 'அருண் குமார்');
  assert.equal(recoverName('தமிழ் அறிக்கைகள் வேண்டும் என் பேரு மோகன் ராஜ் என் எண் 9987654321', ''), 'மோகன் ராஜ்');
  assert.equal(recoverName('Reports needed. Myself Priya from Test College.', ''), 'Priya');
});
test('Do not infer names from feedback subjects, instructions or ambiguous identities', () => {
  assert.deepEqual(statedNames('Teacher Arun wants reports. Student Priya needs charts.'), []);
  assert.equal(recoverName('My name is Arun. My name is Kumar.', ''), '');
  assert.equal(recoverName('My name is Arun. Actually my name is Kumar.', 'Kumar'), 'Kumar');
  assert.equal(recoverName('My name is add better reports and show scores.', ''), '');
});
