# Visitor feedback survey

Survey responses use `leads.bullet_requirements` for feedback. Bullets use canonical prefixes: Improvement, Current problem, Expected solution, Feature request. Text may be English or Tamil. The existing transactional finalize RPC saves these bullets. Legacy objective and callback columns remain nullable for deployment compatibility; survey APIs never accept or write appointment values. No schema or RLS changes are needed.

Session storage is versioned so old enquiry drafts cannot resume into the survey. Admin exports and filters use feedback, not callback or sales intent.
