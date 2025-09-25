const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store para conexiones SSE activas
const sseConnections = new Map();
let connectionId = 0;

// Función para crear headers de autenticación
function createAuthHeaders(email, token) {
    const auth = Buffer.from(`${email}:${token}`).toString('base64');
    return {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
}

// Función para construir JQL query con filtros
function buildJQLQuery(projectKey, labelFilter, statusFilter, priorityFilter) {
    let jql = `project = ${projectKey}`;

    // Filtro por labels
    if (labelFilter && labelFilter.trim()) {
        const labels = labelFilter.split(',').map(l => l.trim()).filter(l => l);
        if (labels.length > 0) {
            const labelConditions = labels.map(label => `labels = "${label}"`).join(' OR ');
            jql += ` AND (${labelConditions})`;
        }
    }

    // Filtro por estado
    if (statusFilter && statusFilter.trim()) {
        jql += ` AND status = "${statusFilter}"`;
    }

    // Filtro por prioridad
    if (priorityFilter && priorityFilter.trim()) {
        jql += ` AND priority = "${priorityFilter}"`;
    }

    // Ordenar por fecha de creación (más recientes primero)
    jql += ' ORDER BY created DESC';

    return jql;
}

// Función mejorada para enviar mensajes SSE
function sendSSEMessage(res, data, event = 'message') {
    try {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        res.write(message);
        res.flush && res.flush(); // Forzar envío inmediato
        return true;
    } catch (error) {
        console.error('Error sending SSE message:', error);
        return false;
    }
}

// Endpoint para probar la conexión con JIRA
app.post('/api/test-connection', async (req, res) => {
    try {
        const { url, email, token, projectKey } = req.body;

        if (!url || !email || !token || !projectKey) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros requeridos'
            });
        }

        const headers = createAuthHeaders(email, token);
        const projectUrl = `${url}/rest/api/3/project/${projectKey}`;

        const response = await axios.get(projectUrl, { headers, timeout: 10000 });

        res.json({
            success: true,
            message: 'Conexión exitosa',
            projectInfo: {
                key: response.data.key,
                name: response.data.name,
                projectTypeKey: response.data.projectTypeKey
            }
        });

    } catch (error) {
        console.error('Error testing connection:', error.response?.data || error.message);

        let errorMessage = 'Error al conectar con JIRA';
        if (error.response?.status === 401) {
            errorMessage = 'Credenciales inválidas. Verifica tu email y API token.';
        } else if (error.response?.status === 404) {
            errorMessage = 'Proyecto no encontrado. Verifica la clave del proyecto.';
        } else if (error.response?.data?.errorMessages) {
            errorMessage = error.response.data.errorMessages.join(', ');
        }

        res.status(400).json({
            success: false,
            message: errorMessage
        });
    }
});

// Endpoint para obtener tickets con filtros
app.post('/api/get-tickets', async (req, res) => {
    try {
        const { url, email, token, projectKey, labelFilter, statusFilter, priorityFilter } = req.body;

        if (!url || !email || !token || !projectKey) {
            return res.status(400).json({
                success: false,
                message: 'Faltan parámetros requeridos'
            });
        }

        const headers = createAuthHeaders(email, token);
        const jql = buildJQLQuery(projectKey, labelFilter, statusFilter, priorityFilter);

        console.log('JQL Query:', jql);

        const searchUrl = `${url}/rest/api/3/search`;
        const searchPayload = {
            jql: jql,
            maxResults: 100,
            fields: [
                'summary',
                'description', 
                'status',
                'priority',
                'issuetype',
                'assignee',
                'labels',
                'created',
                'updated'
            ]
        };

        const response = await axios.post(searchUrl, searchPayload, { 
            headers,
            timeout: 15000 
        });

        const tickets = response.data.issues.map(issue => ({
            id: issue.id,
            key: issue.key,
            url: `${url}/browse/${issue.key}`,
            summary: issue.fields.summary,
            description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
            status: issue.fields.status,
            priority: issue.fields.priority,
            issueType: issue.fields.issuetype,
            assignee: issue.fields.assignee,
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
        console.error('Error getting tickets:', error.response?.data || error.message);

        let errorMessage = 'Error al obtener tickets';
        if (error.response?.data?.errorMessages) {
            errorMessage = error.response.data.errorMessages.join(', ');
        }

        res.status(400).json({
            success: false,
            message: errorMessage
        });
    }
});

// Endpoint mejorado de Server-Sent Events
app.get('/api/tickets-stream', (req, res) => {
    const connId = ++connectionId;

    // Configurar headers optimizados para SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Credentials': 'true',
        'X-Accel-Buffering': 'no' // Nginx: deshabilitar buffering
    });

    // Enviar mensaje inicial inmediatamente
    sendSSEMessage(res, {
        type: 'connected',
        message: 'Conectado a actualizaciones en tiempo real',
        connectionId: connId
    }, 'connection');

    // Almacenar la conexión con sus parámetros
    const connection = {
        id: connId,
        res,
        params: req.query,
        lastUpdate: Date.now(),
        lastTicketCount: 0,
        isActive: true
    };

    sseConnections.set(connId, connection);
    console.log(`[SSE] Nueva conexión establecida (ID: ${connId}). Total: ${sseConnections.size}`);

    // Enviar heartbeat cada 30 segundos para mantener conexión viva
    const heartbeat = setInterval(() => {
        if (connection.isActive) {
            const success = sendSSEMessage(res, {
                type: 'heartbeat',
                timestamp: new Date().toISOString()
            }, 'heartbeat');

            if (!success) {
                clearInterval(heartbeat);
                connection.isActive = false;
                sseConnections.delete(connId);
            }
        } else {
            clearInterval(heartbeat);
        }
    }, 30000);

    // Cargar tickets iniciales después de 1 segundo
    setTimeout(async () => {
        if (connection.isActive) {
            await checkAndSendTickets(connection);
        }
    }, 1000);

    // Limpiar al cerrar la conexión
    req.on('close', () => {
        connection.isActive = false;
        clearInterval(heartbeat);
        sseConnections.delete(connId);
        console.log(`[SSE] Conexión cerrada (ID: ${connId}). Total: ${sseConnections.size}`);
    });

    req.on('error', (error) => {
        connection.isActive = false;
        clearInterval(heartbeat);
        sseConnections.delete(connId);
        console.error(`[SSE] Error en conexión (ID: ${connId}):`, error);
    });
});

// Función para verificar y enviar tickets a una conexión específica
async function checkAndSendTickets(connection) {
    if (!connection.isActive) return;

    try {
        const { url, email, token, projectKey, labelFilter, statusFilter, priorityFilter } = connection.params;

        if (!url || !email || !token || !projectKey) return;

        const headers = createAuthHeaders(email, token);
        const jql = buildJQLQuery(projectKey, labelFilter, statusFilter, priorityFilter);

        const searchUrl = `${url}/rest/api/3/search`;
        const searchPayload = {
            jql: jql,
            maxResults: 100,
            fields: [
                'summary',
                'description',
                'status',
                'priority',
                'issuetype',
                'assignee',
                'labels',
                'created',
                'updated'
            ]
        };

        const response = await axios.post(searchUrl, searchPayload, { 
            headers,
            timeout: 10000 
        });

        const tickets = response.data.issues.map(issue => ({
            id: issue.id,
            key: issue.key,
            url: `${url}/browse/${issue.key}`,
            summary: issue.fields.summary,
            description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
            status: issue.fields.status,
            priority: issue.fields.priority,
            issueType: issue.fields.issuetype,
            assignee: issue.fields.assignee,
            labels: issue.fields.labels || [],
            created: issue.fields.created,
            updated: issue.fields.updated
        }));

        // Detectar cambios
        const currentCount = tickets.length;
        const hasChanges = currentCount !== connection.lastTicketCount;

        if (hasChanges || Date.now() - connection.lastUpdate > 60000) { // Forzar actualización cada minuto
            const success = sendSSEMessage(connection.res, {
                type: 'tickets-update',
                tickets: tickets,
                count: currentCount,
                previousCount: connection.lastTicketCount,
                timestamp: new Date().toISOString()
            }, 'update');

            if (success) {
                connection.lastTicketCount = currentCount;
                connection.lastUpdate = Date.now();
                console.log(`[SSE] Tickets enviados a conexión ${connection.id}: ${currentCount} tickets`);
            } else {
                connection.isActive = false;
                sseConnections.delete(connection.id);
            }
        }

    } catch (error) {
        console.error(`[SSE] Error checking tickets for connection ${connection.id}:`, error.message);

        if (connection.isActive) {
            sendSSEMessage(connection.res, {
                type: 'error',
                message: 'Error al verificar actualizaciones',
                error: error.message
            }, 'error');
        }
    }
}

// Verificar actualizaciones en todas las conexiones cada 15 segundos
setInterval(async () => {
    if (sseConnections.size > 0) {
        console.log(`[SSE] Verificando actualizaciones para ${sseConnections.size} conexiones...`);

        for (const connection of sseConnections.values()) {
            if (connection.isActive) {
                await checkAndSendTickets(connection);
                // Esperar 100ms entre conexiones para no sobrecargar
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
}, 15000);

// Endpoint para obtener los tipos de issue disponibles
app.post('/api/issue-types', async (req, res) => {
    try {
        const { url, email, token, projectKey } = req.body;
        const headers = createAuthHeaders(email, token);

        const metaUrl = `${url}/rest/api/3/issue/createmeta?projectKeys=${projectKey}&expand=projects.issuetypes.fields`;

        const response = await axios.get(metaUrl, { headers, timeout: 10000 });

        const project = response.data.projects[0];
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Proyecto no encontrado'
            });
        }

        const issueTypes = project.issuetypes.map(type => ({
            id: type.id,
            name: type.name,
            description: type.description
        }));

        res.json({
            success: true,
            issueTypes
        });

    } catch (error) {
        console.error('Error getting issue types:', error.response?.data || error.message);
        res.status(400).json({
            success: false,
            message: 'Error al obtener tipos de issue'
        });
    }
});

// Endpoint para crear un ticket
app.post('/api/create-ticket', async (req, res) => {
    try {
        const { 
            url, 
            email, 
            token, 
            projectKey, 
            issueType, 
            summary, 
            description, 
            priority, 
            labels,
            assignee 
        } = req.body;

        if (!url || !email || !token || !projectKey || !issueType || !summary) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos para crear el ticket'
            });
        }

        const headers = createAuthHeaders(email, token);

        const payload = {
            fields: {
                project: {
                    key: projectKey
                },
                summary: summary,
                issuetype: {
                    name: issueType
                }
            }
        };

        if (description) {
            payload.fields.description = {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: description
                            }
                        ]
                    }
                ]
            };
        }

        if (priority) {
            payload.fields.priority = {
                id: priority
            };
        }

        if (labels && labels.length > 0) {
            payload.fields.labels = labels.filter(label => label.trim() !== '');
        }

        if (assignee) {
            payload.fields.assignee = {
                accountId: assignee
            };
        }

        console.log('Creating ticket with payload:', JSON.stringify(payload, null, 2));

        const createUrl = `${url}/rest/api/3/issue`;
        const response = await axios.post(createUrl, payload, { 
            headers,
            timeout: 15000 
        });

        const ticketData = response.data;

        // Notificar a todas las conexiones SSE sobre el nuevo ticket (después de 2 segundos)
        setTimeout(() => {
            for (const connection of sseConnections.values()) {
                if (connection.isActive) {
                    sendSSEMessage(connection.res, {
                        type: 'new-ticket-created',
                        ticket: {
                            id: ticketData.id,
                            key: ticketData.key,
                            url: `${url}/browse/${ticketData.key}`
                        },
                        message: `Nuevo ticket creado: ${ticketData.key}`,
                        timestamp: new Date().toISOString()
                    }, 'notification');
                }
            }
        }, 2000);

        res.json({
            success: true,
            message: 'Ticket creado exitosamente',
            ticket: {
                id: ticketData.id,
                key: ticketData.key,
                self: ticketData.self,
                url: `${url}/browse/${ticketData.key}`
            }
        });

    } catch (error) {
        console.error('Error creating ticket:', error.response?.data || error.message);

        let errorMessage = 'Error al crear el ticket';
        if (error.response?.data?.errors) {
            const errors = Object.values(error.response.data.errors);
            errorMessage = errors.join(', ');
        } else if (error.response?.data?.errorMessages) {
            errorMessage = error.response.data.errorMessages.join(', ');
        }

        res.status(400).json({
            success: false,
            message: errorMessage,
            details: error.response?.data
        });
    }
});

// Endpoint para obtener información del usuario actual
app.post('/api/current-user', async (req, res) => {
    try {
        const { url, email, token } = req.body;
        const headers = createAuthHeaders(email, token);

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
        console.error('Error getting user info:', error.response?.data || error.message);
        res.status(400).json({
            success: false,
            message: 'Error al obtener información del usuario'
        });
    }
});

// Endpoint para diagnósticos de SSE
app.get('/api/sse-status', (req, res) => {
    res.json({
        activeConnections: sseConnections.size,
        connections: Array.from(sseConnections.values()).map(conn => ({
            id: conn.id,
            isActive: conn.isActive,
            lastUpdate: new Date(conn.lastUpdate).toISOString(),
            lastTicketCount: conn.lastTicketCount
        }))
    });
});

// Servir el formulario HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'jira-ticket-form.html'));
});

// Servir la bandeja de entrada
app.get('/inbox', (req, res) => {
    res.sendFile(path.join(__dirname, 'jira-inbox.html'));
});

// Manejo de errores global
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
    });
});

// Limpiar conexiones SSE al cerrar el servidor
process.on('SIGTERM', () => {
    console.log('Cerrando servidor...');
    for (const connection of sseConnections.values()) {
        connection.isActive = false;
        connection.res.end();
    }
    sseConnections.clear();
});

process.on('SIGINT', () => {
    console.log('\nCerrando servidor...');
    for (const connection of sseConnections.values()) {
        connection.isActive = false;
        connection.res.end();
    }
    sseConnections.clear();
    process.exit(0);
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`📝 Formulario disponible en http://localhost:${PORT}`);
    console.log(`📬 Bandeja de entrada disponible en http://localhost:${PORT}/inbox`);
    console.log(`🔍 Estado SSE disponible en http://localhost:${PORT}/api/sse-status`);
});

module.exports = app;