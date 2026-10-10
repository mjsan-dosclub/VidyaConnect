// Public-safe categories only: never return provider messages, addresses or keys.
export function emailFailure(error: { name?: string; message?: string }) {
  const message = (error.message ?? '').toLowerCase();
  if (message.includes('api key') || message.includes('unauthorized')) return 'api_key_rejected';
  if (message.includes('domain') && (message.includes('verif') || message.includes('not'))) return 'sender_domain_not_verified';
  if (message.includes('testing emails') || message.includes('own email') || message.includes('recipient')) return 'recipient_restricted';
  if (message.includes('quota') || message.includes('daily') || message.includes('rate limit')) return 'sending_limit';
  if (error.name === 'validation_error') return 'email_configuration_invalid';
  return 'provider_send_failed';
}
