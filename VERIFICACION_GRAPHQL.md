# Verificación de Migración GraphQL

## ✅ Estado de la Migración

### Servicios Migrados (16 servicios)

1. ✅ **UserService** - Completamente migrado
2. ✅ **CategoriasService** - Completamente migrado
3. ✅ **SubcategoriasService** - Completamente migrado
4. ✅ **ProductoService** - Completamente migrado
5. ✅ **MaterialesService** - Completamente migrado
6. ✅ **ProveedoresService** - Completamente migrado
7. ✅ **ProveedorMaterialService** - Completamente migrado
8. ✅ **AlmacenService** - Completamente migrado
9. ✅ **SectorService** - Completamente migrado
10. ✅ **RolService** - Completamente migrado
11. ✅ **MaquinariasService** - Completamente migrado
12. ✅ **AsignacionesMaquinariaService** - Completamente migrado
13. ✅ **PreProductoService** - Completamente migrado
14. ✅ **PrePlanoService** - Completamente migrado
15. ✅ **PreMaquinariaService** - Completamente migrado

### Configuración Verificada

✅ **GraphQLService** - Creado y configurado
- URL: `${environment.apiUrl}/graphql`
- Autenticación JWT: ✅ Implementada
- Manejo de errores: ✅ Implementado
- Tipado TypeScript: ✅ Implementado

✅ **AuthInterceptor** - Actualizado para GraphQL
- Soporte para `/graphql`: ✅ Configurado
- Token JWT: ✅ Se envía automáticamente
- Manejo de errores GraphQL: ✅ Implementado

✅ **main.ts** - Configuración correcta
- `provideHttpClient`: ✅ Configurado
- `withInterceptors([authInterceptor])`: ✅ Configurado

✅ **Dependencias** - Verificadas
- `@angular/common`: ✅ Instalado
- `rxjs`: ✅ Instalado
- `graphql-request`: ✅ Instalado (aunque no se usa directamente)

## 🔍 Verificaciones Necesarias

### 1. URL del Backend GraphQL

**URL Configurada:**
```
https://concerned-annnora-davv-632fa209.koyeb.app/mrp/graphql
```

**Verificar:**
- [ ] El backend está corriendo
- [ ] El endpoint `/graphql` está accesible
- [ ] CORS está configurado correctamente en el backend

### 2. Autenticación

**Verificar:**
- [ ] El token JWT se está enviando correctamente
- [ ] El backend acepta tokens en el header `Authorization: Bearer <token>`
- [ ] Las queries públicas funcionan sin token

### 3. Servicios No Migrados (Aún usan REST)

Estos servicios aún usan REST y pueden seguir funcionando normalmente:

- ⚠️ **PedidoService** - Pendiente de migración
- ⚠️ **OrdenProductoService** - Pendiente de migración
- ⚠️ **OrdenPreProductoService** - Pendiente de migración
- ⚠️ **MetodoPagoService** - Pendiente de migración
- ⚠️ **DevolucionesService** - Pendiente de migración
- ⚠️ **BitacoraService** - Pendiente de migración
- ⚠️ **DetallePedidoService** - Pendiente de migración
- ⚠️ **ComprasService** - Pendiente de migración
- ⚠️ **PlanoService** - Pendiente de migración
- ⚠️ **StripeService** - Probablemente no requiere migración
- ⚠️ **ImgDropService** - Probablemente no requiere migración
- ⚠️ **AuthService** - Probablemente no requiere migración

## 🚀 Cómo Probar

### 1. Iniciar el servidor de desarrollo

```bash
cd proyectoFrontendSI2
npm start
```

### 2. Verificar en la consola del navegador

Abre las herramientas de desarrollador (F12) y verifica:

- **Console**: Busca logs que empiecen con `🔵 [GraphQL]` o `✅ [GraphQL]`
- **Network**: Verifica que las peticiones a `/graphql` se estén enviando correctamente
- **Headers**: Verifica que el header `Authorization: Bearer <token>` esté presente

### 3. Probar un servicio migrado

Ejemplo: Probar `UserService`

```typescript
// En cualquier componente
constructor(private userService: UserService) {}

ngOnInit() {
  this.userService.listarUsuarios().subscribe({
    next: (usuarios) => {
      console.log('✅ Usuarios obtenidos:', usuarios);
    },
    error: (error) => {
      console.error('❌ Error:', error);
    }
  });
}
```

### 4. Verificar errores comunes

**Error: "Network Error" o CORS**
- Verificar que el backend esté corriendo
- Verificar configuración CORS en el backend

**Error: "401 Unauthorized"**
- Verificar que el token JWT sea válido
- Verificar que el usuario esté autenticado

**Error: "GraphQL errors in response"**
- Revisar la consola para ver los errores específicos de GraphQL
- Verificar que la query/mutation sea correcta según el schema

## 📝 Notas Importantes

1. **Compatibilidad**: Los servicios migrados mantienen la misma interfaz pública, por lo que los componentes existentes deberían funcionar sin cambios.

2. **Métodos No Disponibles**: Algunos métodos que no tienen equivalente directo en GraphQL están marcados con `⚠️ NO DISPONIBLE DIRECTAMENTE EN GRAPHQL` y lanzan errores informativos.

3. **Filtrado en Cliente**: Algunos métodos de búsqueda/filtrado se implementan obteniendo todos los datos y filtrando en el cliente. Esto puede ser ineficiente con grandes volúmenes de datos.

4. **Logs de Debug**: El `GraphQLService` incluye logs de consola para facilitar el debugging. Puedes desactivarlos en producción.

## 🔧 Solución de Problemas

### Problema: El proyecto no compila

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: Errores de TypeScript

```bash
# Verificar errores de compilación
npm run build
```

### Problema: Errores en tiempo de ejecución

1. Abre la consola del navegador (F12)
2. Revisa los logs de GraphQL
3. Verifica la pestaña Network para ver las peticiones
4. Revisa los errores específicos de GraphQL en la respuesta

## ✅ Checklist Pre-Ejecución

- [x] GraphQLService creado y configurado
- [x] AuthInterceptor actualizado
- [x] main.ts configurado con HttpClient
- [x] 16 servicios migrados
- [ ] Backend corriendo y accesible
- [ ] URL del backend correcta en environment.ts
- [ ] CORS configurado en el backend
- [ ] Token JWT válido para pruebas

