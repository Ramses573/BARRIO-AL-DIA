# AGENTS.md – Reglas de contexto y comandos esenciales

## 📦 Tecnologías detectadas (genéricas)
- Front‑end: **React / Next.js** (npm)
- Backend: **Node.js (Express)**, **Python (Flask/Django)**, **Java (Spring Boot)** o **.NET 9** (elige la que corresponda)
- DB: **SQL Server / PostgreSQL / MySQL**
> *Si alguna no aplica, elimínala.*

## ⚡ Comandos indispensables
| Acción | Comando (ajusta según stack) |
|--------|------------------------------|
| **Instalar deps** | `npm ci` / `pip install -r requirements.txt` / `mvn install` / `dotnet restore` |
| **Compilar / Build** | `npm run build` / `dotnet build` / `mvn package` |
| **Ejecutar en dev** | `npm run dev` / `flask run --reload` / `dotnet run` |
| **Tests** | `npm test` / `pytest` / `mvn test` / `dotnet test` |
| **Lint / Formateo** | `npm run lint` / `black .` / `dotnet format` |

> **Tip:** Crea scripts npm o Makefile que agrupen los anteriores; la IA usará esos alias.

## 🏗️ Guías de arquitectura y estilo (no negociables)
- Mantener **una capa** de acceso a datos **separada** del resto del código.
- Usar **componentes funcionales** (React) o **controllers/services** (backend).
- No mezclar **HTML/CSS** dentro de archivos de lógica.
- Cada nuevo módulo debe incluir **pruebas unitarias** y **documentación ligera** (`README` o docstring).
- Respetar **eslint / flake8 / StyleCop** configurados por proyecto.

## 💾 Reglas de ahorro de contexto (IA)
1. **Responde** de forma concisa → *sin saludo, sin despedida*.
2. **Lee solo** los archivos directamente involucrados en la tarea; **no indexar** carpetas completas.
3. **Muestra cambios** exclusivamente como *diffs* (`@@ -... +... @@`) o bloques de código relevantes.
4. **No incluyas** contenidos de archivos completos a menos que el usuario lo solicite explícitamente.
5. **Al terminar** una característica o refactor, sugiere **limpiar el contexto** (`/compact`) o reiniciar la sesión.

## 🚦 Parámetros de modelo (opcional)
- Modelo por defecto: **ligero/estándar** (p. ej. `gpt‑oss‑120b‑medium`).
- Limitar **paralelismo** de sub‑agentes a ≤ 2 para evitar sobrecarga de tokens.

---

### 📋 Resumen de medidas de ahorro aplicadas
| Medida | Impacto |
|--------|---------|
| `.gitignore` exhaustivo | Evita que IA procese archivos ignorados, reduciendo tokens en cada escaneo. |
| Comandos resumidos | Sólo los imprescindibles aparecen en prompts. |
| Reglas de contexto | Limita lecturas a archivos relevantes y muestra solo diff. |
| Sugerencia de `/compact` | Permite al usuario liberar espacio de contexto cuando sea necesario. |
| Restricción de sub‑agentes | Menor uso de tokens simultáneos. |

---

## 📌 Plan de implementación (pasos rápidos)
1. **Crear repo** (GitHub o local) y copiar el `.gitignore` arriba.
2. Añadir `AGENTS.md` a la raíz.
3. Revisar `package.json`, `requirements.txt`, `pom.xml` o `.csproj` y ajustar los **comandos** en la tabla según tu stack.
4. Ejecutar `git add .gitignore AGENTS.md && git commit -m "Add CI‑ready ignore and IA context rules"`.
5. (Opcional) Configurar CI (GitHub Actions) para ejecutar `npm ci && npm test` o el equivalente.

¡Todo listo! Simplemente copia ambos archivos en la raíz del proyecto.
