const axios = require('axios');
const { createAuthHeader } = require('./utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { url, email, token } = req.body;

  try {
    const headers = createAuthHeader(email, token);
    const userUrl = `${url}/rest/api/3/myself`;

    const response = await axios.get(userUrl, { headers, timeout: 10000 });

    res.json({
      success: true,
      user: {
        accountId: response.data.accountId,
        displayName: response.data.displayName,
        emailAddress: response.data.emailAddress
      }
    });

  } catch (error) {
    console.error('Error getting user info:', error.message);
    res.status(400).json({ success: false, message: 'Error al obtener información del usuario' });
  }
};