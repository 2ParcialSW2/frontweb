export interface LoginRequest {
    email: string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
    email: string;
    nombre: string;
    apellido: string;
    id: number;
    role: {
      id: number;
      nombre: string;
      permiso: { id: number; nombre: string }[];
    };
  }
  