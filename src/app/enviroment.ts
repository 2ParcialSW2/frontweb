// Función auxiliar para obtener variables de entorno
function getEnvVar(name: string, defaultValue: string): string {
  // En desarrollo, las variables están disponibles a través del proceso de build
  return (window as any)?.env?.[name] || defaultValue;
}

export const environment = {
    production: getEnvVar('NG_APP_ENVIRONMENT', 'development') === 'production',
    // URLs desde .env con fallback a desarrollo
    apiUrl: getEnvVar('NG_APP_API_URL', 'http://localhost:8081/mrp/'),
    mlApiUrl: getEnvVar('NG_APP_ML_API_URL', 'http://localhost:8000'),
    // Configuración de Stripe desde .env
    stripePublicKey: getEnvVar('NG_APP_STRIPE_PUBLIC_KEY', 'pk_test_51RbW0M2ekOb04oTVyGnNI0OoBkIzl66nkwgKoFpLe2LpB40O0kRyDxQSlUHajTs7D6NBSRpNHOIHQUpKNwTCubYR00UjRpGiLB'),
    // Configuración de OpenAI desde .env
    openaiApiKey: getEnvVar('NG_APP_OPENAI_API_KEY', '')
};
