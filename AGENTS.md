# AGENTS.md – Reglas de contexto y arquitectura: Barrio al Día

## 📦 Stack Tecnológico
- **Frontend**: React 18 (Vite SPA)
- **Capa de Servicios / Datos**: `frontend/src/services/` (desacoplada de UI)
- **Backend (Planeado)**: Node.js (Express) o .NET Web API
- **Base de Datos**: MySQL / SQL Server

## ⚡ Comandos indispensables (Ejecutables desde la raíz)
| Acción | Comando |
|--------|---------|
| **Instalar dependencias** | `npm install` |
| **Ejecutar en desarrollo** | `npm run dev` |
| **Compilar para producción** | `npm run build` |
| **Pruebas unitarias** | `npm test` |
| **Linter y validación** | `npm run lint` |

## 🏗️ Guías de arquitectura y estilo (no negociables)
- **Capa de acceso a datos**: Todo acceso o mock de datos reside en `frontend/src/services/`. Los componentes de React no deben incluir datos estáticos quemados directamente.
- **Componentes funcionales**: Usar React Hooks y componentes funcionales.
- **Separación visual**: Estilos desacoplados en archivos `.css` correspondientes a cada componente o vista.
- **Pruebas unitarias**: Nuevos módulos y servicios deben incluir pruebas unitarias en `src/services/*.test.js`.
- **Estándares**: Respetar configuración de ESLint en `.eslintrc.json`.

## 💾 Reglas de ahorro de contexto (IA)
1. **Responde de forma concisa**: sin saludos ni despedidas innecesarias.
2. **Lectura específica**: Lee solo los archivos directamente involucrados en la tarea.
3. **Muestra cambios específicos**: Cambios en diffs o bloques relevantes; no archivos completos a menos que se solicite.
4. **Respeto a las indicaciones del usuario**: Priorizar instrucciones activas de la conversación.
