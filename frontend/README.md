# ⚛️ Frontend – Sistema Salones DAV

SPA en React + Vite + TailwindCSS.

## 🚀 Inicio rápido

```bash
npm install
cp .env.example .env
# Editar VITE_API_URL con la URL del backend
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

## 📦 Build

```bash
npm run build      # Build de producción → dist/
npm run preview    # Preview del build
```

## ☁️ Despliegue en Vercel

1. Crea cuenta en [vercel.com](https://vercel.com)
2. Import Project → seleccionar este repo, root: `frontend`
3. Framework: **Vite**, Build: `npm run build`, Output: `dist`
4. Variable `VITE_API_URL` apuntando al backend (Render)
5. Deploy

## 🔑 Cuenta inicial

Tras correr `npm run seed` en backend:
- Email: `admin@muniguate.gt`
- Password: `Admin123Cambiar!`

⚠️ Cambia la contraseña inmediatamente.
