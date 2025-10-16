export interface Usuario {
  id: number;
  nombre_completo: string;
  email: string;
  telefono: string;
  direccion: string;
  estado: boolean;
  rol: {
    id: number;
    nombre: string;
  };
}

export interface UsuarioDTO {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
  rolid: number;
}

