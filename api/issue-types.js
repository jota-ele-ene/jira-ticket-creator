const axios = require('axios');
const { createAuthHeader } = require('./utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { url, email, token, projectKey } = req.body;

  if (!url || !email || !token || !projectKey) {
    return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });
  }

  try {
    const headers = createAuthHeader(email, token);
    const metaUrl = `${url}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`;

    const response = await axios.get(metaUrl, { headers, timeout: 10000 });

    const project = response.data.projects[0];
    if (!project) {
      return res.status(404).json({ success: false, message: 'Proyecto no encontrado' });
    }

    const types = project.issuetypes.map(type => type.name);

    res.json({ success: true, types });

  } catch (error) {
    console.error('Error getting issue types:', error.message);
    res.status(400).json({ success: false, message: 'Error al obtener tipos de issue' });
  }
};