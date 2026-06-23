# 🔧 Backend – Sistema Salones DAV

API REST en Node.js + Express con Google Sheets como base de datos.

## 🚀 Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
# Editar .env con tus credenciales

# 3. Inicializar Google Sheets (crea hojas y encabezados)
npm run init-sheets

# 4. Crear usuario administrador y salones iniciales
npm run seed

# 5. Iniciar en desarrollo
npm run dev
```

## 🔑 Configuración de Google Sheets

1. Crea proyecto en [console.cloud.google.com](https://console.cloud.google.com)
2. Habilita **Google Sheets API**
3. Crea **Service Account** → descarga JSON
4. Crea 2 spreadsheets:
   - **Principal:** tu BD (usuarios, salones, lactancia, reservas, tokens)
   - **Auditoría:** logs (separado para mejor performance)
5. Comparte ambos spreadsheets con el email del Service Account (rol **Editor**)
6. Copia los IDs de los spreadsheets a `.env`

## 📁 Estructura

```
src/
├── config/              # env, logger, constants
├── domain/              # entities, repository interfaces
├── application/         # services, dtos, validators
├── infrastructure/      # google sheets, jwt, bcrypt
├── interfaces/http/     # controllers, routes, middlewares
└── shared/              # utils, errors
```

## 🛡️ Endpoints principales

| Método | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/v1/auth/login` | público |
| POST | `/api/v1/auth/refresh` | cookie |
| GET | `/api/v1/lactation/active` | autenticado |
| POST | `/api/v1/lactation/checkin` | USR+ |
| POST | `/api/v1/reservations` | USR+ |
| PATCH | `/api/v1/reservations/:id/approve` | ADMIN+ |
| GET | `/api/v1/audit/logs` | SA |

Ver documentación completa en `/docs/ARQUITECTURA_SISTEMA_SALONES.md`.

## 🐳 Docker

```bash
docker build -t salones-dav-api .
docker run -p 8080:8080 --env-file .env salones-dav-api
```

## ☁️ Despliegue en Render

Ver sección 12 del documento de arquitectura.
