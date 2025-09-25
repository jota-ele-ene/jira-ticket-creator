const axios = require('axios');
const { createAuthHeader } = require('./utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { url, email, token, projectKey, issueType, summary, description, priority, labels } = req.body;

  if (!url || !email || !token || !projectKey || !issueType || !summary) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  }

  try {
    const headers = createAuthHeader(email, token);

    const payload = {
      fields: {
        project: { key: projectKey },
        summary: summary,
        issuetype: { name: issueType }
      }
    };

    if (description) {
      payload.fields.description = {
        type: "doc",
        version: 1,
        content: [{
          type: "paragraph",
          content: [{ type: "text", text: description }]
        }]
      };
    }

    if (priority) {
      payload.fields.priority = { id: priority };
    }

    if (labels && labels.length > 0) {
      payload.fields.labels = labels.filter(label => label.trim() !== '');
    }

    const createUrl = `${url}/rest/api/3/issue`;
    const response = await axios.post(createUrl, payload, { headers, timeout: 15000 });

    res.json({
      success: true,
      message: 'Ticket creado exitosamente',
      key: response.data.key,
      url: `${url}/browse/${response.data.key}`
    });

  } catch (error) {
    console.error('Error creating ticket:', error.response?.data || error.message);

    let errorMessage = 'Error al crear el ticket';
    if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors);
      errorMessage = errors.join(', ');
    }

    res.status(400).json({ success: false, message: errorMessage });
  }
};