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
   * @returns Observable con objeto que contiene SQL y teléfono
   */
  obtenerSugerenciasReportes(prompt: string): Observable<{sql: string, telefono: string}> {
    if (!environment.openaiApiKey || environment.openaiApiKey === '') {
      throw new Error('OpenAI API Key no configurada. Configúrala en el archivo .env');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${environment.openaiApiKey}`
    });

    const systemMessage = `Eres un experto en PostgreSQL que convierte lenguaje natural en español a consultas SQL y extrae números de teléfono.

    INSTRUCCIONES:
    1. El usuario te dará una descripción de lo que quiere consultar Y un número de teléfono
    2. Extrae el número de teléfono mencionado
    3. Convierte la descripción a consulta SQL de PostgreSQL
    4. Usa nombres de tablas comunes: compras, productos, proveedores, usuarios, categorias, detalles_compra
    5. Responde ÚNICAMENTE en formato JSON: {"sql": "consulta aquí", "telefono": "número aquí"}
    6. Para fechas usa: CURRENT_DATE, INTERVAL '1 month', etc.
    7. Incluye JOINs cuando sea necesario
    8. Usa ORDER BY para ordenar resultados
    
    EJEMPLO:
    Usuario: "compras del último mes al número 75512345"
    Respuesta: {"sql": "SELECT * FROM compras WHERE fecha >= CURRENT_DATE - INTERVAL '1 month' ORDER BY fecha DESC;", "telefono": "75512345"}`;

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

    return new Observable<{sql: string, telefono: string}>(observer => {
      this.http.post<OpenAIResponse>(this.apiUrl, requestBody, { headers })
        .subscribe({
          next: (response) => {
            try {
              const content = response.choices[0]?.message?.content || '{"sql": "", "telefono": ""}';
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