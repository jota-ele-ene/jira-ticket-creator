const axios = require('axios');
const { createAuthHeader } = require('./utils');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { url, email, token, projectKey, labelFilter, statusFilter, priorityFilter } = req.body;

  if (!url || !email || !token || !projectKey) {
    return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos' });
  }

  try {
    const headers = createAuthHeader(email, token);

    // Construir JQL query
    let jql = `project = "${projectKey}"`;

    if (labelFilter && labelFilter.trim()) {
      const labels = labelFilter.split(',').map(l => l.trim()).filter(l => l);
      if (labels.length > 0) {
        const labelConditions = labels.map(label => `labels = "${label}"`).join(' OR ');
        jql += ` AND (${labelConditions})`;
      }
    }

    if (statusFilter && statusFilter.trim()) {
      jql += ` AND status = "${statusFilter}"`;
    }

    if (priorityFilter && priorityFilter.trim()) {
      jql += ` AND priority = "${priorityFilter}"`;
    }

    jql += ' ORDER BY created DESC';

    const searchUrl = `${url}/rest/api/3/search`;
    const searchPayload = {
      jql: jql,
      maxResults: 50,
      fields: ['summary', 'status', 'priority', 'labels', 'created', 'updated']
    };

    const response = await axios.post(searchUrl, searchPayload, { headers, timeout: 15000 });

    const tickets = response.data.issues.map(issue => ({
      key: issue.key,
      summary: issue.fields.summary,
      url: `${url}/browse/${issue.key}`,
      status: issue.fields.status?.name || 'Unknown',
      priority: issue.fields.priority?.name || 'Medium',
      labels: issue.fields.labels || [],
      created: issue.fields.created,
      updated: issue.fields.updated
    }));

    res.json({
      success: true,
      tickets: tickets,
      total: response.data.total,
      message: `${tickets.length} tickets encontrados`
    });

  } catch (error) {
    console.error('Error getting tickets:', error.message);
    res.status(400).json({ success: false, message: 'Error al obtener tickets' });
  }
};