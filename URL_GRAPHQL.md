# URL de GraphQL - Configuración

## 📍 URL Actual Configurada

### Backend GraphQL Endpoint:
```
https://concerned-annnora-davv-632fa209.koyeb.app/mrp/graphql
```

## 🔍 Cómo se Construye la URL

### 1. Configuración en `enviroment.ts`:
```typescript
apiUrl: 'https://concerned-annnora-davv-632fa209.koyeb.app/mrp/'
```

### 2. Configuración del Backend (`application.properties`):
```properties
server.servlet.context-path=/mrp
spring.graphql.path=/graphql
```

### 3. Construcción en `GraphQLService`:
```typescript
const baseUrl = environment.apiUrl.endsWith('/') 
  ? environment.apiUrl.slice(0, -1) 
  : environment.apiUrl;
this.graphqlUrl = `${baseUrl}/graphql`;
```

**Resultado:** `https://concerned-annnora-davv-632fa209.koyeb.app/mrp/graphql`

## ✅ Verificación

Para verificar que la URL es correcta, puedes:

1. **Abrir el navegador y probar directamente:**
   ```
   https://concerned-annnora-davv-632fa209.koyeb.app/mrp/graphql
   ```
   
   Deberías ver una respuesta (puede ser un error de método, pero confirma que el endpoint existe).

2. **Usar GraphiQL (si está habilitado):**
   ```
   https://concerned-annnora-davv-632fa209.koyeb.app/mrp/graphiql
   ```

3. **Probar desde el frontend:**
   - Abre la consola del navegador (F12)
   - Ve a la pestaña Network
   - Busca peticiones a `/graphql`
   - Verifica que la URL sea correcta

## 🔧 Si Necesitas Cambiar la URL

### Opción 1: Cambiar en `enviroment.ts`
```typescript
export const environment = {
    production: true,
    apiUrl: 'TU_NUEVA_URL_AQUI/mrp/',  // ← Cambia aquí
    stripePublicKey: '...'
};
```

### Opción 2: Para desarrollo local
Si quieres usar el backend local, cambia a:
```typescript
apiUrl: 'http://localhost:8081/mrp/',
```

Y la URL de GraphQL será: `http://localhost:8081/mrp/graphql`

## 📝 Notas Importantes

1. **Context Path:** El backend tiene `context-path=/mrp`, por lo que todas las rutas deben incluir `/mrp/`

2. **GraphQL Path:** El endpoint GraphQL está en `/graphql` (relativo al context path)

3. **URL Final:** Siempre será: `{apiUrl}/graphql` (sin la barra final de apiUrl)

4. **CORS:** El backend tiene CORS configurado para aceptar todas las origines (`*`), así que no debería haber problemas de CORS.

## 🚨 Solución de Problemas

### Error: "Network Error" o CORS
- Verifica que la URL sea exactamente: `https://concerned-annnora-davv-632fa209.koyeb.app/mrp/graphql`
- Verifica que el backend esté corriendo
- Verifica la configuración CORS en el backend

### Error: "404 Not Found"
- Verifica que el context-path sea `/mrp`
- Verifica que `spring.graphql.path=/graphql` en el backend
- Prueba acceder a `/mrp/graphiql` para verificar que GraphQL esté habilitado

### Error: "401 Unauthorized"
- Esto es normal para queries que requieren autenticación
- Verifica que el token JWT se esté enviando correctamente
- Algunas queries pueden ser públicas y no requerir token

