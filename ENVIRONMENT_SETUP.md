# 🔒 CONFIGURACIÓN DE ENVIRONMENT

## ⚡ Setup rápido

1. **Copia el archivo de ejemplo:**
   ```bash
   cp src/app/enviroment.example.ts src/app/enviroment.ts
   ```

2. **Edita `src/app/enviroment.ts` y agrega tus credenciales:**
   ```typescript
   export const environment = {
       production: false,
       apiUrl: 'http://localhost:8081/mrp/',
       mlApiUrl: 'http://localhost:8000',
       stripePublicKey: 'pk_test_TU_CLAVE_STRIPE_AQUI',
       openaiApiKey: 'sk-proj-TU_OPENAI_API_KEY_AQUI'
   };
   ```

3. **¡Listo!** El archivo está en `.gitignore` y no se subirá al repositorio.

## 🔑 Credenciales necesarias

### **OpenAI API Key:**
- Ve a: https://platform.openai.com/api-keys
- Crea una nueva API key
- Pégala en `openaiApiKey`

### **Stripe Public Key:**
- Ve a: https://dashboard.stripe.com/apikeys
- Copia la "Publishable key"
- Pégala en `stripePublicKey`

## ⚠️ IMPORTANTE
- **NUNCA** subas el archivo `enviroment.ts` al repositorio
- **SIEMPRE** usa el archivo `.example.ts` como plantilla
- **VERIFICA** que tus credenciales sean correctas antes de probar