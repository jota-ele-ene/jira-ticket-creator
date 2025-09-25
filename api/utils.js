const createAuthHeader = (email, token) => ({
  'Authorization': `Basic ${Buffer.from(email + ':' + token).toString('base64')}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json'
});

module.exports = { createAuthHeader };