# Servicio GraphQL - Guía de Uso

Este documento explica cómo usar el servicio GraphQL base para realizar peticiones al backend.

## Configuración

El servicio `GraphQLService` está configurado automáticamente y está disponible en toda la aplicación mediante inyección de dependencias.

## Uso Básico

### 1. Inyectar el servicio

```typescript
import { GraphQLService } from '../services/graphql.service';

constructor(private graphql: GraphQLService) {}
```

### 2. Realizar una Query (Lectura)

```typescript
// Ejemplo: Obtener todos los usuarios
this.graphql.query<{ getAllUsuarios: Usuario[] }>(`
  query {
    getAllUsuarios {
      id
      nombre
      apellido
      email
      telefono
      estado
      rol {
        id
        nombre
      }
    }
  }
`).subscribe({
  next: (data) => {
    console.log('Usuarios:', data.getAllUsuarios);
    this.usuarios = data.getAllUsuarios;
  },
  error: (error) => {
    console.error('Error al obtener usuarios:', error);
  }
});
```

### 3. Realizar una Query con Variables

```typescript
// Ejemplo: Obtener un usuario por ID
this.graphql.query<{ getUsuarioById: Usuario }>(`
  query GetUsuario($id: ID!) {
    getUsuarioById(id: $id) {
      id
      nombre
      apellido
      email
    }
  }
`, { id: "1" }).subscribe({
  next: (data) => {
    console.log('Usuario:', data.getUsuarioById);
  },
  error: (error) => {
    console.error('Error:', error);
  }
});
```

### 4. Realizar una Mutation (Escritura)

```typescript
// Ejemplo: Crear un nuevo usuario
this.graphql.mutate<{ createUsuario: Usuario }>(`
  mutation CreateUsuario($input: UsuarioInput!) {
    createUsuario(input: $input) {
      id
      nombre
      apellido
      email
    }
  }
`, {
  input: {
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@example.com",
    password: "password123",
    telefono: "123456789",
    rolid: 1
  }
}).subscribe({
  next: (data) => {
    console.log('Usuario creado:', data.createUsuario);
  },
  error: (error) => {
    console.error('Error al crear usuario:', error);
  }
});
```

### 5. Realizar una Mutation de Actualización

```typescript
// Ejemplo: Actualizar un usuario
this.graphql.mutate<{ updateUsuario: Usuario }>(`
  mutation UpdateUsuario($id: ID!, $input: UsuarioInput!) {
    updateUsuario(id: $id, input: $input) {
      id
      nombre
      apellido
      email
    }
  }
`, {
  id: "1",
  input: {
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan.nuevo@example.com",
    password: null, // null para no cambiar la contraseña
    telefono: "987654321",
    rolid: 2
  }
}).subscribe({
  next: (data) => {
    console.log('Usuario actualizado:', data.updateUsuario);
  },
  error: (error) => {
    console.error('Error al actualizar usuario:', error);
  }
});
```

### 6. Realizar una Mutation de Eliminación

```typescript
// Ejemplo: Eliminar un usuario
this.graphql.mutate<{ deleteUsuario: boolean }>(`
  mutation DeleteUsuario($id: ID!) {
    deleteUsuario(id: $id)
  }
`, { id: "1" }).subscribe({
  next: (data) => {
    if (data.deleteUsuario) {
      console.log('Usuario eliminado correctamente');
    }
  },
  error: (error) => {
    console.error('Error al eliminar usuario:', error);
  }
});
```

## Características

### Autenticación Automática

El servicio automáticamente incluye el token JWT en las peticiones si está disponible. No necesitas agregarlo manualmente.

### Manejo de Errores

El servicio maneja automáticamente:
- Errores de conexión
- Errores de autenticación (401)
- Errores de permisos (403)
- Errores del servidor (500+)
- Errores específicos de GraphQL

### Tipado TypeScript

El servicio está completamente tipado. Puedes especificar el tipo de respuesta esperada:

```typescript
interface UsuarioResponse {
  getAllUsuarios: Usuario[];
}

this.graphql.query<UsuarioResponse>(`...`)
```

## Ejemplos Avanzados

### Query con Múltiples Campos

```typescript
this.graphql.query<{
  getAllUsuarios: Usuario[];
  getAllProductos: Producto[];
}>(`
  query {
    usuarios: getAllUsuarios {
      id
      nombre
    }
    productos: getAllProducts {
      id
      nombre
      precioUnitario
    }
  }
`).subscribe(data => {
  console.log('Usuarios:', data.usuarios);
  console.log('Productos:', data.productos);
});
```

### Query con Fragmentos (Reutilización)

```typescript
const usuarioFragment = `
  fragment UsuarioInfo on Usuario {
    id
    nombre
    apellido
    email
    estado
  }
`;

this.graphql.query<{ getAllUsuarios: Usuario[] }>(`
  ${usuarioFragment}
  query {
    getAllUsuarios {
      ...UsuarioInfo
      rol {
        id
        nombre
      }
    }
  }
`).subscribe(data => {
  console.log(data.getAllUsuarios);
});
```

## Migración desde REST

### Antes (REST)

```typescript
// user.service.ts (REST)
listarUsuarios(): Observable<Usuario[]> {
  return this.http.get<Usuario[]>(`${this.apiUrl}/user`);
}
```

### Después (GraphQL)

```typescript
// user.service.ts (GraphQL)
listarUsuarios(): Observable<Usuario[]> {
  return this.graphql.query<{ getAllUsuarios: Usuario[] }>(`
    query {
      getAllUsuarios {
        id
        nombre
        apellido
        email
        telefono
        estado
        rol {
          id
          nombre
        }
      }
    }
  `).pipe(
    map(response => response.getAllUsuarios)
  );
}
```

## Notas Importantes

1. **URL del Endpoint**: El servicio usa automáticamente la URL configurada en `environment.apiUrl` + `/graphql`

2. **Token JWT**: Se incluye automáticamente si está disponible en `AuthService`

3. **Errores GraphQL**: Los errores de GraphQL pueden venir en el campo `errors` de la respuesta, incluso con status 200

4. **Variables**: Los IDs en GraphQL son strings (tipo `ID!`), no números

5. **Null Safety**: Algunos campos pueden ser opcionales (nullable) en GraphQL. Revisa el schema para detalles

## Debugging

El servicio incluye logs de consola para debugging:
- 🔵 Peticiones GraphQL
- ✅ Respuestas exitosas
- ❌ Errores
- ⚠️ Advertencias

Puedes desactivar estos logs en producción si es necesario.

