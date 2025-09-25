# JIRA Ticket Creator

Formulario web para crear tickets en JIRA de manera fácil y rápida usando la REST API.

## Características

- ✅ Interfaz web moderna y responsive
- ✅ Configuración de conexión a JIRA
- ✅ Validación de campos en tiempo real
- ✅ Soporte para diferentes tipos de issues
- ✅ Manejo de errores completo
- ✅ Backend seguro para evitar problemas de CORS

## Requisitos

- Node.js 14 o superior
- Cuenta de JIRA Cloud
- API Token de JIRA

## Instalación

1. Clona o descarga este proyecto
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor:
   ```bash
   npm start
   ```

4. Abre tu navegador en `http://localhost:3000`

## Configuración

### 1. Generar API Token de JIRA

1. Ve a [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Haz clic en "Create API token"
3. Dale un nombre descriptivo
4. Copia el token generado

### 2. Configurar el formulario

1. **URL de JIRA**: Tu instancia de JIRA Cloud (ej: `https://tuempresa.atlassian.net`)
2. **Email**: Tu email registrado en JIRA
3. **API Token**: El token generado en el paso anterior
4. **Clave del Proyecto**: La clave del proyecto donde crear tickets (ej: `TEST`, `PROJ`)

## Uso

1. Completa la configuración de JIRA en el primer paso
2. Haz clic en "Probar Conexión y Continuar"
3. Rellena los campos del ticket:
   - Tipo de Issue (requerido)
   - Resumen (requerido)
   - Descripción (opcional)
   - Prioridad (opcional)
   - Labels (opcional)
4. Haz clic en "Crear Ticket"

## API Endpoints

### POST /api/test-connection
Prueba la conexión con JIRA y valida las credenciales.

### POST /api/create-ticket
Crea un nuevo ticket en JIRA.

### POST /api/issue-types
Obtiene los tipos de issue disponibles para el proyecto.

### POST /api/current-user
Obtiene información del usuario actual.

## Estructura del Proyecto

```
├── server.js              # Servidor backend Express
├── jira-ticket-form.html  # Formulario web frontend
├── package.json           # Dependencias del proyecto
└── README.md             # Documentación
```

## Seguridad

- Las credenciales nunca se almacenan en el frontend
- Todas las llamadas a JIRA se realizan desde el backend
- Validación de datos tanto en frontend como backend
- Manejo seguro de tokens de API

## Solución de Problemas

### Error 401 - Unauthorized
- Verifica que tu email sea correcto
- Asegúrate de que el API token sea válido
- Comprueba que tengas permisos en el proyecto

### Error 404 - Not Found
- Verifica que la URL de JIRA sea correcta
- Comprueba que la clave del proyecto exista
- Asegúrate de tener acceso al proyecto

### Problemas de CORS
- Este proyecto incluye un backend para evitar problemas de CORS
- No intentes usar la API de JIRA directamente desde el navegador

## Desarrollo

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT License
