# 📱 Barrio al Día – Aplicativo Móvil (React Native / Expo)

Aplicación móvil oficial de fiscalización ciudadana, reporte de incidentes y seguimiento municipal en tiempo real para los cantones de **Cartago, Turrialba y Tarrazú**.

---

## 🚀 ¿Cómo probar la app en tu teléfono (Android / iOS)?

### Requisitos previos
1. Descarga la aplicación gratuita **Expo Go** en tu celular:
   - [Google Play Store (Android)](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [Apple App Store (iOS)](https://apps.apple.com/app/expo-go/id982107779)
2. Asegúrate de que tu computadora y tu celular estén conectados a la **misma red Wi-Fi**.

### Ejecución
Desde la raíz del repositorio, ejecuta:

```bash
npm run mobile:start
```

O entrando a la carpeta `mobile/`:

```bash
cd mobile
npx expo start
```

### Escanear el código QR
1. La terminal de tu computadora mostrará un **código QR**.
2. **En Android**: Abre la app **Expo Go** y toca en *"Scan QR code"*.
3. **En iPhone**: Abre la cámara nativa de iOS y toca la notificación para abrirlo en **Expo Go**.
4. ¡Listo! La app se cargará nativamente en tu teléfono con recarga en vivo (Fast Refresh).

---

## 🛠️ Características Implementadas

| Módulo | Descripción |
| :--- | :--- |
| **Boletín Cantonal** | Avisos oficiales de CNE, acueductos y obras viales filtrados por cantón (*Cartago, Turrialba, Tarrazú*). |
| **Reporte Ciudadano** | Formulario con captura de fotos nativas (cámara/galería), video corto (máx. 20s), GPS satelital y modo anónimo. |
| **Seguimiento de Ticket** | Consulta por código `TKT-CART-XXXX` con línea de tiempo visual de 4 etapas (*Recibido, En Evaluación, Cuadrilla en Camino, Resuelto*). |
| **Asistencia y Chat** | Canal de mensajería vinculado al ticket con **grabación y reproducción de notas de voz en tiempo real**. |
| **Modo Sin Conexión** | Respaldo automático en almacenamiento local del dispositivo mediante `AsyncStorage`. |
