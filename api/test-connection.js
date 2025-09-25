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
    const projectUrl = `${url}/rest/api/3/project/${projectKey}`;

    const response = await axios.get(projectUrl, { headers, timeout: 10000 });

    res.json({
      success: true,
      message: 'Conexión exitosa',
      project: {
        key: response.data.key,
        name: response.data.name,
        projectTypeKey: response.data.projectTypeKey
      }
    });
  } catch (error) {
    console.error('Error testing connection:', error.message);

    let errorMessage = 'Error al conectar con JIRA';
    if (error.response?.status === 401) {
      errorMessage = 'Credenciales inválidas. Verifica tu email y API token.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Proyecto no encontrado. Verifica la clave del proyecto.';
    }

    res.status(400).json({ success: false, message: errorMessage });
  }
};