# JIRA Ticket Creator

🎫 **Aplicación web moderna para crear y gestionar tickets en JIRA** con actualizaciones en tiempo real.

## ✨ Características

- ✅ **Formulario intuitivo** para crear tickets en JIRA
- ✅ **Bandeja de entrada** con filtros avanzados por labels, estado y prioridad
- ✅ **Actualizaciones automáticas** cada 10 segundos sin recargar la página
- ✅ **Interfaz responsive** que funciona en desktop y móvil
- ✅ **Validación completa** de formularios y manejo de errores
- ✅ **Conexión segura** a la API de JIRA Cloud

## 🚀 Demo en Vivo

Una vez desplegado en Vercel:
- **Formulario**: https://tu-proyecto.vercel.app/
- **Bandeja**: https://tu-proyecto.vercel.app/inbox

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, funciones serverless de Vercel
- **API**: JIRA Cloud REST API v3
- **Despliegue**: Vercel (gratuito)

## 📋 Requisitos Previos

1. **Cuenta de JIRA Cloud** (https://atlassian.com)
2. **API Token de JIRA** ([generar aquí](https://id.atlassian.com/manage-profile/security/api-tokens))
3. **Cuenta de GitHub** para versionado
4. **Cuenta de Vercel** para despliegue gratuito

## 🚀 Instalación y Despliegue

### Opción 1: Despliegue directo en Vercel

1. **Fork este repositorio** en tu cuenta de GitHub

2. **Conecta con Vercel**:
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con GitHub
   - Haz clic en "New Project" → "Import Git Repository"
   - Selecciona tu fork del proyecto

3. **Configura el proyecto**:
   - Framework Preset: **Other**
   - Root Directory: `/`
   - Build Command: `echo "No build needed"`

4. **¡Despliega!** - Vercel se encarga del resto

### Opción 2: Desarrollo local

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tu-usuario/jira-ticket-creator.git
   cd jira-ticket-creator
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

4. **Abre en el navegador**:
   - Formulario: http://localhost:3000
   - Bandeja: http://localhost:3000/inbox

## 🔧 Configuración

### 1. Generar API Token de JIRA

1. Ve a [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Haz clic en **"Create API token"**
3. Dale un nombre descriptivo (ej: "Ticket Creator")
4. **Copia y guarda** el token (no podrás verlo después)

### 2. Obtener información de JIRA

- **URL**: Tu instancia de JIRA (ej: `https://tuempresa.atlassian.net`)
- **Email**: Tu email de Atlassian
- **Clave del Proyecto**: Ve a tu proyecto en JIRA y copia la clave (ej: `TEST`, `PROJ`)

### 3. Usar la aplicación

1. **Configurar conexión**:
   - Introduce URL, email, token y proyecto
   - Haz clic en "Probar Conexión y Continuar"

2. **Crear tickets**:
   - Selecciona tipo de issue
   - Rellena resumen y descripción
   - Añade labels si quieres (separadas por comas)
   - ¡Crear ticket!

3. **Ver tickets**:
   - Ve a `/inbox`
   - Filtra por labels, estado o prioridad
   - Se actualiza automáticamente cada 10 segundos

## 🏗️ Estructura del Proyecto

```
jira-ticket-creator/
├── 📁 api/                     # Funciones serverless
│   ├── utils.js                # Helpers comunes
│   ├── test-connection.js      # Probar conexión JIRA
│   ├── get-tickets.js          # Obtener tickets con filtros
│   ├── create-ticket.js        # Crear nuevo ticket
│   ├── issue-types.js          # Tipos de issue disponibles
│   └── current-user.js         # Info del usuario actual
├── 📁 public/                  # Frontend estático
│   ├── jira-ticket-form.html   # Formulario de creación
│   └── jira-inbox.html         # Bandeja de entrada
├── package.json                # Dependencias del proyecto
├── vercel.json                 # Configuración de Vercel
└── README.md                   # Este archivo
```

## 🔗 Endpoints de la API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/test-connection` | POST | Valida credenciales y proyecto |
| `/api/get-tickets` | POST | Obtiene tickets con filtros |
| `/api/create-ticket` | POST | Crea un nuevo ticket |
| `/api/issue-types` | POST | Lista tipos de issue del proyecto |
| `/api/current-user` | POST | Info del usuario autenticado |

## 🐛 Solución de Problemas

### Error 401 - No autorizado
- ✅ Verifica que el email sea correcto
- ✅ Regenera el API token
- ✅ Asegúrate de tener permisos en el proyecto

### Error 404 - Proyecto no encontrado
- ✅ Verifica que la clave del proyecto sea correcta
- ✅ Comprueba que tengas acceso al proyecto

### No se crean tickets
- ✅ Verifica que el tipo de issue existe en el proyecto
- ✅ Revisa que el proyecto permita crear issues

### La bandeja no se actualiza
- ✅ Comprueba la consola del navegador (F12)
- ✅ Verifica que la conexión esté establecida
- ✅ Los filtros pueden estar limitando los resultados

## 🤝 Contribuciones

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit tus cambios: `git commit -am 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Atlassian JIRA](https://www.atlassian.com/software/jira) por su excelente API
- [Vercel](https://vercel.com) por el hosting gratuito
- [Axios](https://axios-http.com) por las peticiones HTTP

---

**⭐ ¡No olvides darle una estrella al proyecto si te ha sido útil!**
