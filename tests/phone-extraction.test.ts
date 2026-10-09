import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneCandidates, reliablePhone } from '../lib/phone-extraction';
test('Tamil formal and colloquial digits recover a missing AI phone', () => {
  assert.equal(
    reliablePhone(
      'என் எண் ஒன்பது ஒன்பது எட்டு ஏழு ஆறு ஐந்து நான்கு மூன்று இரண்டு ஒன்று. பயிற்சி வேண்டும்.',
      '',
    ),
    '9987654321',
  );
  assert.equal(
    reliablePhone(
      'எண் ஒம்பது ஒம்பது எட்டு ஏழு ஆரு அஞ்சு நாலு மூணு ரெண்டு ஒண்ணு',
      '',
    ),
    '9987654321',
  );
  assert.deepEqual(phoneCandidates('எனது எண் ௯௯௮௭௬௫௪௩௨௧'), ['9987654321']);
});
test('Mixed speech, repetitions, grouped digits and +91 are preserved', () => {
  for (const s of [
    'எண் டபுள் nine eight seven six five four three two one',
    'என் எண் +91 99876 54321',
    'mobile double nine எட்டு ஏழு ஆறு ஐந்து four three two one',
  ])
    assert.equal(reliablePhone(s, ''), '9987654321');
});
test('Do not merge unrelated numbers or guess an ambiguous phone', () => {
  assert.deepEqual(
    phoneCandidates('9 staff and 987 students, 654 rooms, 321 tablets'),
    [],
  );
  assert.equal(reliablePhone('9987654321 or 9876543210', ''), '');
  assert.equal(reliablePhone('9987654321 or 9876543210', '8765432109'), '');
  assert.deepEqual(phoneCandidates('1234567890'), []);
});

import { reviewPhone } from '../lib/phone-extraction';
test('Review preserves extra and missing Tamil phone digits without guessing', () => {
  assert.equal(reviewPhone('என் எண் ஒன்பது ஒன்பது எட்டு ஏழு ஆறு ஐந்து நான்கு மூன்று இரண்டு ஒன்று பூஜ்யம்', ''), '99876543210');
  assert.equal(reviewPhone('எண் ஒம்பது ஒம்பது எட்டு ஏழு ஆரு அஞ்சு நாலு மூணு ரெண்டு', ''), '998765432');
  assert.equal(reviewPhone('mobile 99876543210', '9987654321'), '99876543210');
  assert.equal(reviewPhone('mobile +91 99876 54321', ''), '9987654321');
  assert.equal(reviewPhone('99876543210 or 987654321', ''), '');
  assert.equal(reviewPhone('9 staff and 987 students, 654 rooms, 321 tablets', ''), '');
});
