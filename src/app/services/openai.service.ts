import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../enviroment';

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class OpenaiService {

  private readonly apiUrl = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) { }

  /**
   * Convierte lenguaje natural a consulta SQL y extrae número de teléfono
   * @param prompt - Descripción que incluye lo que quiere consultar y número de teléfono
   * @returns Observable con objeto que contiene query y phone
   */
  obtenerSugerenciasReportes(prompt: string): Observable<{query: string, phone: string}> {
    if (!environment.openaiApiKey || environment.openaiApiKey === '') {
      throw new Error('OpenAI API Key no configurada. Configúrala en el archivo .env');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openaiApiKey}`
    });

    const systemMessage = `Eres un experto en MySQL especializado en convertir lenguaje natural en español a consultas SQL exactas para un sistema MRP de carpintería.

ESQUEMA COMPLETO DE BASE DE DATOS MYSQL:

USUARIOS Y SEGURIDAD:
- usuario (id, nombre, apellido, email, telefono, password, estado, rol_id, created_at, updated_at)
- rol (id, nombre, created_at, updated_at)
- permiso (id, nombre, created_at, updated_at)
- rol_permiso (rol_id, permiso_id)

PRODUCTOS Y MATERIALES:
- producto (id, nombre, descripcion, stock, stock_minimo, imagen, tiempo, precio_unitario, categoria_id, created_at, updated_at)
- material (id, nombre, descripcion, unidad_medida, precio, stock_actual, stock_minimo, punto_reorden, categoria_text, activo, imagen, categoria_id, sector_id, created_at, updated_at)
- categoria (id, nombre, descripcion, activo, subcategoria_id, created_at, updated_at)
- subcategoria (id, nombre, descripcion, created_at, updated_at)
- producto_material (id, producto_id, material_id, cantidad_necesaria, unidad_medida, created_at)

VENTAS Y PEDIDOS:
- pedido (id, fecha, descripcion, importe_total, importe_total_desc, estado, metodo_pago_id, usuario_id, created_at, updated_at)
- detalle_pedido (id, producto_id, pedido_id, cantidad, estado, importe_total, importe_total_desc, precio_unitario, created_at)
- metodo_pago (id, nombre, descripcion, created_at, updated_at)
- cliente (id, nombre, apellido, email, telefono, direccion, created_at, updated_at)

COMPRAS Y PROVEEDORES:
- compra (id, numero_compra, fecha_compra, proveedor_id, subtotal, impuestos, total, estado, observaciones, created_at, updated_at)
- detalle_pedido_compra (id, compra_id, material_id, cantidad, precio_unitario, subtotal, created_at)
- proveedor (id, nombre, contacto, telefono, email, direccion, activo, created_at, updated_at)
- proveedor_material (id, proveedor_id, material_id, precio, tiempo_entrega_dias, activo, created_at)

PRODUCCIÓN:
- orden_producto (id, fecha_orden, cantidad, estado, fecha_inicio, fecha_fin, observaciones, producto_id, usuario_id, created_at, updated_at)
- orden_preproducto (id, fecha_orden, cantidad, estado, fecha_inicio, fecha_fin, observaciones, pre_producto_id, usuario_id, created_at, updated_at)
- pre_producto (id, nombre, descripcion, categoria_text, tiempo, created_at, updated_at)

MAQUINARIA Y ALMACENES:
- maquinaria (id, nombre, descripcion, modelo, fabricante, fecha_adquisicion, estado, disponible, created_at, updated_at)
- almacen (id, nombre, descripcion, ubicacion, capacidad_maxima, activo, created_at, updated_at)
- sector (id, nombre, descripcion, activo, created_at, updated_at)

INSTRUCCIONES:
1. El usuario te dará una descripción de lo que quiere consultar Y un número de teléfono
2. Extrae el número de teléfono mencionado
3. Convierte la descripción a consulta SQL MySQL usando las tablas exactas del esquema
4. Para fechas usa: CURDATE(), DATE_SUB(), INTERVAL, etc.
5. Incluye JOINs cuando sea necesario para obtener información relacionada
6. Usa ORDER BY para ordenar resultados de manera lógica
7. Responde ÚNICAMENTE en formato JSON: {"query": "consulta aquí", "phone": "número aquí"}

EJEMPLOS:
Usuario: "compras del último mes al número 75512345"
Respuesta: {"query": "SELECT c.*, p.nombre as proveedor FROM compra c JOIN proveedor p ON c.proveedor_id = p.id WHERE c.fecha_compra >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) ORDER BY c.fecha_compra DESC;", "phone": "75512345"}

Usuario: "productos vendidos esta semana enviar al 70123456"
Respuesta: {"query": "SELECT pr.nombre, SUM(dp.cantidad) as total_vendido FROM detalle_pedido dp JOIN producto pr ON dp.producto_id = pr.id JOIN pedido pe ON dp.pedido_id = pe.id WHERE pe.fecha >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK) GROUP BY pr.id, pr.nombre ORDER BY total_vendido DESC;", "phone": "70123456"}`;

    const requestBody: OpenAIRequest = {
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.1
    };

    return new Observable<{query: string, phone: string}>(observer => {
      this.http.post<OpenAIResponse>(this.apiUrl, requestBody, { headers })
        .subscribe({
          next: (response) => {
            try {
              const content = response.choices[0]?.message?.content || '{"query": "", "phone": ""}';
              const resultado = JSON.parse(content);
              observer.next(resultado);
              observer.complete();
            } catch (error) {
              observer.error('Error al procesar la respuesta de OpenAI');
            }
          },
          error: (error) => {
            console.error('Error al consultar OpenAI:', error);
            observer.error('Error al generar consulta SQL. Verifica tu API Key de OpenAI.');
          }
        });
    });
  }
}