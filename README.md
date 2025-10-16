# Sistema MRP Frontend

## Despliegue con Docker

Para desplegar la aplicación usando Docker, sigue estos pasos:

### Prerequisitos
- Docker instalado en tu sistema
- Docker Compose instalado en tu sistema

### Instrucciones de despliegue

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd <nombre-del-repositorio>
```

2. Construye y levanta los contenedores con Docker Compose:
```bash
docker-compose up -d --build
```

3. Accede a la aplicación:
Abre tu navegador y ve a http://localhost:4200

### Comandos útiles

- Ver logs de la aplicación:
```bash
docker-compose logs -f frontend
```

- Detener los contenedores:
```bash
docker-compose down
```

- Reconstruir después de cambios:
```bash
docker-compose up -d --build
```

## Desarrollo local sin Docker

### Prerequisitos
- Node.js (versión 18 o superior)
- npm (viene con Node.js)

### Instrucciones de desarrollo

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar servidor de desarrollo:
```bash
npm run start
```

3. Accede a la aplicación:
Abre tu navegador y ve a http://localhost:4200

# FrontSi2

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.18.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
