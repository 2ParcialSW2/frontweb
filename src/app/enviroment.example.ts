// ARCHIVO DE EJEMPLO - Copia este archivo como enviroment.ts y agrega tus credenciales
export const environment = {
    production: false,
    // URLs desde .env con fallback a desarrollo
    apiUrl: 'http://localhost:8081/mrp/',
    mlApiUrl: 'http://localhost:8000',
    // Configuración de Stripe - REEMPLAZA CON TU CLAVE
    stripePublicKey: 'pk_test_tu_clave_stripe_aqui',
    // Configuración de OpenAI - REEMPLAZA CON TU API KEY
    openaiApiKey: 'sk-proj-tu_openai_api_key_aqui'
};