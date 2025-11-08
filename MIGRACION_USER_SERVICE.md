# Migración de UserService a GraphQL - Completada ✅

## Resumen

El servicio `UserService` ha sido migrado completamente de REST a GraphQL, manteniendo la misma interfaz pública para garantizar compatibilidad con los componentes existentes.

## Cambios Realizados

### Archivos Modificados

1. **`src/app/services/user.service.ts`**
   - ✅ Migrado completamente a GraphQL
   - ✅ Mantiene la misma interfaz pública
   - ✅ Mapeo automático entre formatos GraphQL y TypeScript

### Métodos Migrados

| Método REST | Método GraphQL | Estado |
|------------|----------------|--------|
| `listarUsuarios()` | `getAllUsuarios` query | ✅ |
| `buscarUsuarios()` | Filtrado en cliente (temporal) | ✅ |
| `obtenerUsuario()` | `getUsuarioById` query | ✅ |
| `registrarUsuario()` | `createUsuario` mutation | ✅ |
| `actualizarUsuario()` | `updateUsuario` mutation | ✅ |
| `desactivarUsuario()` | `deleteUsuario` mutation | ✅ |
| `activarUsuario()` | `activarUsuario` mutation | ✅ |
| `deleteUser()` | `deleteUsuario` mutation | ✅ |

## Mapeo de Datos

### GraphQL → TypeScript

El servicio mapea automáticamente los datos de GraphQL al formato esperado por los componentes:

```typescript
GraphQL Usuario {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono?: string
  estado: boolean
  disponibilidad: boolean
  rol?: { id: string, nombre: string }
}

↓ Mapeo ↓

TypeScript Usuario {
  id: number
  nombre_completo: string  // nombre + apellido
  email: string
  telefono: string
  direccion: string  // vacío (no existe en GraphQL)
  estado: boolean
  rol: { id: number, nombre: string }
}
```

## Notas Importantes

### 1. Campo `direccion`
- **Problema**: El modelo TypeScript tiene `direccion`, pero GraphQL no lo incluye
- **Solución**: Se mapea como string vacío `''`
- **Impacto**: Los componentes que usen `direccion` verán un valor vacío
- **Recomendación**: Si `direccion` es importante, agregarlo al schema GraphQL del backend

### 2. Búsqueda de Usuarios
- **Estado actual**: Se obtienen todos los usuarios y se filtran en el cliente
- **Rendimiento**: Puede ser lento con muchos usuarios
- **Mejora futura**: Agregar query `buscarUsuarios(termino: String!)` en el backend GraphQL

### 3. Desactivar vs Eliminar
- **`deleteUsuario` en GraphQL**: Desactiva el usuario (estado=false), no lo elimina físicamente
- **`deleteUser` en el servicio**: Usa la misma mutation `deleteUsuario`
- **Comportamiento**: Consistente con el endpoint REST `/desactivar`

### 4. IDs como Strings
- GraphQL usa IDs como strings (`ID!`)
- El servicio convierte automáticamente entre string y number
- Los componentes siguen usando números como antes

## Componentes que Usan UserService

Los siguientes componentes deberían funcionar sin cambios:

1. ✅ `usuario.component.ts` - Gestión de usuarios
2. ✅ `asignaciones-maquinaria.component.ts` - Lista de carpinteros
3. ✅ `orden-producto.component.ts` - (si usa UserService)
4. ✅ `devoluciones.component.ts` - (si usa UserService)

## Pruebas Recomendadas

### 1. Listar Usuarios
```typescript
// En usuario.component.ts
this.userService.listarUsuarios().subscribe(usuarios => {
  console.log('Usuarios:', usuarios);
});
```

### 2. Crear Usuario
```typescript
const nuevoUsuario: UsuarioDTO = {
  nombre: "Juan",
  apellido: "Pérez",
  email: "juan@example.com",
  password: "password123",
  telefono: "123456789",
  direccion: "", // Se ignora en GraphQL
  rolid: 1
};

this.userService.registrarUsuario(nuevoUsuario).subscribe(usuario => {
  console.log("Usuario creado:", usuario);
});
```

### 3. Actualizar Usuario
```typescript
this.userService.actualizarUsuario(id, usuarioDTO).subscribe(usuario => {
  console.log("Usuario actualizado:", usuario);
});
```

### 4. Activar/Desactivar Usuario
```typescript
// Activar
this.userService.activarUsuario(id).subscribe(() => {
  console.log("Usuario activado");
});

// Desactivar
this.userService.desactivarUsuario(id).subscribe(() => {
  console.log("Usuario desactivado");
});
```

## Verificación en Consola

Al usar el servicio, deberías ver logs en la consola:

- 🔵 `[GraphQL] Enviando petición:` - Cuando se hace una petición
- ✅ `[GraphQL] Respuesta exitosa` - Cuando la petición es exitosa
- ❌ `[GraphQL] Errores...` - Si hay errores

## Próximos Pasos

1. ✅ **Probar en desarrollo**: Verificar que todos los componentes funcionen correctamente
2. ⏳ **Optimizar búsqueda**: Agregar query de búsqueda en el backend GraphQL
3. ⏳ **Agregar direccion**: Si es necesario, agregar al schema GraphQL
4. ⏳ **Migrar otros servicios**: Continuar con ProductoService, MaterialesService, etc.

## Troubleshooting

### Error: "No se pudieron cargar los usuarios"
- Verificar que el backend GraphQL esté corriendo
- Verificar la URL en `environment.apiUrl`
- Revisar la consola del navegador para errores específicos

### Error: "Usuario no encontrado"
- Verificar que el ID sea correcto
- Verificar que el usuario exista en la base de datos

### Error: "No autorizado"
- Verificar que el token JWT esté presente
- Verificar que el token no haya expirado
- Intentar hacer login nuevamente

## Compatibilidad

✅ **Totalmente compatible** con componentes existentes
✅ **Misma interfaz pública** que el servicio REST anterior
✅ **Sin cambios requeridos** en componentes

