# 🚀 Guía de Despliegue en Vercel

## Paso 1: Preparar el proyecto en GitHub

1. **Sube tu código a GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: JIRA Ticket Creator"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/jira-ticket-creator.git
   git push -u origin main
   ```

## Paso 2: Desplegar en Vercel

1. **Ir a Vercel**: https://vercel.com
2. **Iniciar sesión** con tu cuenta de GitHub
3. **New Project** → **Import Git Repository**
4. **Seleccionar** tu repositorio `jira-ticket-creator`
5. **Configurar**:
   - Framework Preset: **Other**
   - Root Directory: `/`  
   - Build Command: `echo "No build needed"`
   - Output Directory: `public`
6. **Deploy** 🚀

## Paso 3: Verificar el despliegue

Tu aplicación estará disponible en:
- **URL principal**: https://jira-ticket-creator-xxxx.vercel.app
- **Formulario**: https://jira-ticket-creator-xxxx.vercel.app/
- **Bandeja**: https://jira-ticket-creator-xxxx.vercel.app/inbox

## Paso 4: Configurar dominio personalizado (opcional)

En el dashboard de Vercel:
1. Ve a tu proyecto → **Settings** → **Domains**
2. Añade tu dominio personalizado
3. Configura los DNS según las instrucciones

## Actualizaciones automáticas

Cada vez que hagas `git push` a la rama `main`, Vercel:
1. ✅ Detectará los cambios automáticamente
2. ✅ Hará un nuevo build
3. ✅ Desplegará la nueva versión
4. ✅ Te notificará por email

## Monitoreo

En el dashboard de Vercel puedes ver:
- 📊 **Analytics**: Visitas y rendimiento  
- 🔍 **Functions**: Logs de las API calls
- ⚡ **Performance**: Tiempos de carga
- 🚨 **Errors**: Errores de la aplicación

¡Tu aplicación JIRA está lista para usar! 🎉
