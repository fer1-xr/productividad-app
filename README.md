# 📊 Productividad Pro

Una aplicación web completa diseñada para transformar tu productividad. Combina gestión de hábitos, control de finanzas, cronograma, metas y anotaciones en una sola plataforma.

## 🌟 Características

- **📌 Gestión de Hábitos**: Construye hábitos positivos con seguimiento diario y rachas
- **💰 Control de Finanzas**: Administra ingresos, gastos y presupuestos
- **📅 Cronograma Semanal**: Organiza tu tiempo de forma efectiva
- **🎯 Metas y Objetivos**: Define metas anuales, mensuales y semanales con seguimiento
- **📝 Anotaciones y Frases**: Guarda notas, recordatorios y frases inspiradoras
- **👤 Autenticación**: Registro seguro con Supabase Auth
- **⭐ Diseño Moderno**: Interfaz intuitiva y responsive

## 🏗️ Stack Tecnológico

### Frontend
- **Next.js 14** - Framework React moderno con SSR
- **TypeScript** - Tipado estático para mayor seguridad
- **Tailwind CSS** - Estilos CSS modernos
- **Lucide React** - Iconos profesionales

### Backend & Base de Datos
- **Supabase** - Backend como servicio (PostgreSQL + Auth)
- **Next.js API Routes** - Rutas API serverless

### Hosting & Deployment
- **Vercel** - Hosting optimizado para Next.js

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+ 
- npm o yarn
- Una cuenta de Supabase
- Una cuenta de Vercel

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/productividad-app.git
cd productividad-app
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Obtén tus credenciales en Project Settings → API

#### Ejecutar Migraciones
1. Ve al SQL Editor en tu proyecto de Supabase
2. Copia todo el contenido de `database/schema.sql`
3. Ejecuta en Supabase SQL Editor
4. Verifica que todas las tablas se hayan creado exitosamente

### 4. Configurar Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

### 5. Ejecutar Localmente

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Estructura del Proyecto

```
productividad-app/
├── app/                      # Aplicación Next.js
│   ├── components/          # Componentes React reutilizables
│   ├── habits/              # Página de hábitos
│   ├── finances/            # Página de finanzas
│   ├── schedule/            # Página de cronograma
│   ├── goals/               # Página de metas
│   ├── notes/               # Página de notas
│   ├── layout.tsx           # Layout principal
│   ├── page.tsx             # Página de inicio
│   └── globals.css          # Estilos globales
├── lib/                     # Utilidades y configuración
│   └── supabase.ts          # Cliente de Supabase
├── types/                   # Tipos TypeScript
│   └── index.ts             # Definiciones de tipos
├── database/                # Migraciones SQL
│   └── schema.sql           # Schema de base de datos
├── public/                  # Archivos estáticos
├── .env.example             # Variables de entorno (ejemplo)
├── .gitignore               # Archivos ignorados por git
├── package.json             # Dependencias del proyecto
├── tsconfig.json            # Configuración de TypeScript
├── tailwind.config.js       # Configuración de Tailwind
└── README.md                # Este archivo
```

## 🚀 Desplegar en Vercel

### Opción 1: Desde GitHub (Recomendado)

1. **Subir a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/productividad-app.git
   git push -u origin main
   ```

2. **Conectar a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es un proyecto Next.js

3. **Configurar Variables de Entorno**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agrega tus credenciales de Supabase:
     ```
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
     ```

4. **Deploy**
   - Vercel desplegará automáticamente tu aplicación
   - Tu sitio estará disponible en `https://tu-proyecto.vercel.app`

### Opción 2: Desde CLI de Vercel

```bash
npm install -g vercel
vercel
```

## 📚 Funcionalidades Principales

### Hábitos
- Crear nuevos hábitos con frecuencia (diario, semanal, mensual)
- Marcar hábitos completados
- Ver rachas de cumplimiento
- Categorizar hábitos (Salud, Productividad, Finanzas, etc.)

### Finanzas
- Registrar ingresos y gastos
- Categorizar transacciones
- Ver balance actual
- Resumen de ingresos vs gastos
- Gestión de presupuestos por categoría

### Cronograma
- Planificar semana completa
- Asignar actividades a días específicos
- Ver horarios por día
- Actividades recurrentes

### Metas
- Crear metas anuales, mensuales y semanales
- Establecer prioridades (baja, media, alta)
- Seguimiento de progreso con porcentaje
- Estados: No iniciado, En progreso, Completado

### Anotaciones
- Crear notas libres
- Guardar frases inspiradoras
- Crear recordatorios
- Fijar notas importantes
- Filtrar por categoría

## 🔐 Seguridad

- **Row Level Security (RLS)**: Los usuarios solo pueden ver sus propios datos
- **Autenticación**: Supabase Auth con contraseña
- **HTTPS**: Todos los datos viajan encriptados
- **Variables de Entorno**: Las credenciales no se exponen en el código

## 🎨 Personalización

### Cambiar Colores
Edita `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      primary: '#tu-color',
      secondary: '#tu-color',
    },
  },
}
```

### Agregar Nuevas Características
1. Crea la página en `app/nueva-caracteristica/page.tsx`
2. Actualiza los tipos en `types/index.ts`
3. Agrega la tabla correspondiente en `database/schema.sql`
4. Actualiza la navegación en `app/components/navbar.tsx`

## 🐛 Troubleshooting

### Error de conexión a Supabase
- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de que el proyecto de Supabase esté activo
- Revisa que las tablas fueron creadas correctamente

### Problemas de autenticación
- Limpia el localStorage del navegador
- Verifica que Supabase Auth esté habilitado
- Revisa los logs en Supabase Dashboard → Authentication

### Build fails en Vercel
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs de build en Vercel Dashboard
- Asegúrate que el `package.json` tiene todas las dependencias

## 📝 Hábitos de la Gente Altamente Efectiva (7 Hábitos)

Esta aplicación ayuda a implementar los hábitos de Stephen Covey:

1. **Ser Proactivo** - Anotaciones y recordatorios
2. **Comenzar con el Fin en Mente** - Sistema de metas anuales
3. **Poner Primero lo Primero** - Cronograma y prioridades
4. **Pensar Ganar/Ganar** - Finanzas balanceadas
5. **Procurar Primero Comprender** - Anotaciones y reflexiones
6. **Cooperación Creativa** - Metas compartidas
7. **Afilar la Sierra** - Hábitos de aprendizaje continuo

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 💬 Soporte

¿Preguntas o sugerencias?
- Crea un issue en GitHub
- Envía un email a tu-email@ejemplo.com
- Sígueme en redes sociales

## 🎯 Roadmap Futuro

- [ ] Integración con Google Calendar
- [ ] Exportar datos a PDF
- [ ] Estadísticas y gráficos avanzados
- [ ] Modo oscuro
- [ ] Aplicación móvil (React Native)
- [ ] Sincronización en tiempo real
- [ ] Consejos de IA basados en hábitos
- [ ] Compartir metas con amigos

---

**¡Gracias por usar Productividad Pro! Que tengas un excelente viaje hacia tu mejor versión.** ✨
