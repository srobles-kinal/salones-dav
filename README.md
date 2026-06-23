# 🏛️ Sistema de Gestión y Reservación de Salones
## Atención al Vecino – Municipalidad de Guatemala

Aplicación web institucional para administrar salones, espacios de lactancia y capacitaciones.

[![Status](https://img.shields.io/badge/status-listo--para--desplegar-success)]()
[![Node](https://img.shields.io/badge/node-20%20LTS-green)]()
[![React](https://img.shields.io/badge/react-18-blue)]()

---

## 📦 Contenido del repositorio

```
sistema-salones-dav/
├── backend/             # API REST (Node.js + Express + Google Sheets)
├── frontend/            # SPA (React + Vite + TailwindCSS)
└── README.md            # Este archivo
```

## ✨ Funcionalidades

- 🤱 **Lactancia:** 3 cupos simultáneos, timer de 30 min, ticket automático
- 📅 **Capacitaciones:** reservas con validación de traslapes y flujo de aprobación
- 🔐 **Auth JWT** + Refresh Tokens (HttpOnly cookie)
- 🛡️ **RBAC** con 3 roles (SA, ADMIN, USR) y 20 permisos granulares
- 📊 **Dashboard** con KPIs en tiempo real
- 🔍 **Auditoría** completa de operaciones
- ☁️ **Listo para Vercel + Render + Cloudflare**

## 🚀 Inicio rápido

### Prerrequisitos
- Node.js 20 LTS
- Cuenta Google Cloud con Sheets API habilitada
- 2 Google Spreadsheets compartidos con Service Account

### Setup

```bash
# 1. Backend
cd backend
cp .env.example .env
# Editar .env con credenciales
npm install
npm run init-sheets   # Crea estructura de hojas
npm run seed          # Crea usuario admin inicial
npm run dev           # http://localhost:8080

# 2. Frontend (en otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev           # http://localhost:5173
```

### Credenciales iniciales

```
Email:    admin@muniguate.gt
Password: Admin123Cambiar!
```

⚠️ Cambia la contraseña inmediatamente tras el primer login.

## 🔑 Configuración de Google Sheets (paso a paso)

1. Crea proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilita **Google Sheets API** en `APIs & Services > Library`
3. En `IAM & Admin > Service Accounts` crea una Service Account
4. Genera una clave JSON y descárgala
5. Crea 2 spreadsheets nuevos en Google Sheets:
   - Uno para la BD principal
   - Uno para los logs de auditoría
6. Comparte ambos con el email de la Service Account (rol **Editor**)
7. Copia los IDs de los spreadsheets (en la URL: `docs.google.com/spreadsheets/d/<ID>/edit`)
8. Configura `.env` con:
   - `GOOGLE_CLIENT_EMAIL` (del JSON)
   - `GOOGLE_PRIVATE_KEY` (del JSON; mantén los `\n` como están)
   - `SHEETS_DB_ID`
   - `SHEETS_AUDIT_ID`

## 🐳 Docker (opcional)

```bash
cd backend
docker build -t salones-dav-api .
docker run -p 8080:8080 --env-file .env salones-dav-api
```

## ☁️ Despliegue

### Backend (Render)
1. Conectar repo en [render.com](https://render.com)
2. New Web Service → Root: `backend`
3. Build: `npm ci --omit=dev`, Start: `node src/server.js`
4. Configurar variables de entorno
5. Health check: `/api/v1/health`

### Frontend (Vercel)
1. Import en [vercel.com](https://vercel.com)
2. Framework: Vite, Root: `frontend`
3. Variable `VITE_API_URL=https://tu-api.onrender.com/api/v1`
4. Deploy

### Cloudflare
1. Agregar dominio
2. DNS: CNAMEs apuntando a Vercel y Render (proxy ON)
3. SSL: Full (Strict)
4. WAF: managed rules ON

## 🛡️ Seguridad

- Helmet + CORS estricto + CSP
- Rate limiting (global y por endpoint)
- JWT firmados HS256, expiración 15min
- Refresh tokens con hash SHA-256 y revocación
- bcrypt cost 12
- XSS + HPP protection
- Auditoría inmutable en spreadsheet separado
- Lockout tras 5 intentos fallidos

## 📚 Documentación adicional

- `backend/README.md` - Detalles del backend
- `frontend/README.md` - Detalles del frontend
- Documento de arquitectura completo: `ARQUITECTURA_SISTEMA_SALONES.md`

## 🏗️ Arquitectura

**Backend:** Clean Architecture (Domain → Application → Infrastructure → Interfaces)
**Frontend:** Feature-based con Context API y hooks personalizados
**DB:** Google Sheets (migrable a PostgreSQL sin reescritura)

## 🔄 Migración futura a PostgreSQL

Los repositorios son interfaces. Para migrar, basta crear `PgUserRepository`, `PgReservationRepository`, etc. y cambiar el factory. Ver sección 16 del documento de arquitectura.

## 📜 Licencia

Software institucional - Municipalidad de Guatemala

## 👥 Mantenedores

- Dirección de Atención al Vecino
- Coordinación de TI
