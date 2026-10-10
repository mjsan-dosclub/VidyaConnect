import test from 'node:test';
import assert from 'node:assert/strict';
import { emailFailure } from '../lib/email-failure';
test('Email diagnostics identify configuration errors without returning secrets or addresses', () => {
  assert.equal(emailFailure({name:'validation_error',message:'The descienceosclub.com domain is not verified'}), 'sender_domain_not_verified');
  assert.equal(emailFailure({message:'API key is invalid: re_secret'}), 'api_key_rejected');
  assert.equal(emailFailure({message:'You can only send testing emails to your own email address'}), 'recipient_restricted');
  assert.equal(emailFailure({message:'Daily quota exceeded'}), 'sending_limit');
  assert.equal(emailFailure({message:'Private recipient or provider details'}), 'recipient_restricted');
});
