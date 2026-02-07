
# Plan: Navbar y Tabs Fijos en el Dashboard

## Objetivo
Modificar el Dashboard para que el header (navbar) y el contenedor de tabs permanezcan fijos en la parte superior de la pantalla, mientras que solo el contenido de cada tab sea desplazable.

## Cambios a Realizar

### Archivo: `src/pages/Dashboard.tsx`

**Estructura actual:**
```
div (min-h-screen)
  └── header (h-16, fluye con scroll)
  └── main (container, fluye con scroll)
        └── Tabs
              └── TabsList (fluye con scroll)
              └── TabsContent (fluye con scroll)
```

**Nueva estructura:**
```
div (h-screen, flex-col, overflow-hidden)
  └── header (h-16, fixed/sticky, flex-shrink-0)
  └── div (sticky tabs container, flex-shrink-0)
        └── TabsList
  └── main (flex-1, overflow-y-auto)
        └── TabsContent (scrollable)
```

### Cambios Específicos:

1. **Contenedor principal**: Cambiar de `min-h-screen` a `h-screen flex flex-col overflow-hidden` para ocupar exactamente la altura de la ventana y evitar scroll global.

2. **Header (Navbar)**: Agregar `flex-shrink-0` para que no se comprima y mantener su altura fija de `h-16`.

3. **Tabs Container**: 
   - Mover el `TabsList` fuera del `main` a un contenedor separado con `sticky top-0` o incluirlo en una sección con `flex-shrink-0`.
   - Agregar fondo y borde inferior para separación visual.

4. **Área de contenido principal**: 
   - Cambiar a `flex-1 overflow-y-auto` para que solo esta área sea scrollable.
   - Los `TabsContent` permanecerán dentro de esta área scrollable.

### Resultado Visual
- El header permanece fijo arriba
- Los tabs (Dashboard, Tickets, Envíos, Buses) permanecen fijos debajo del header
- Solo el contenido de cada tab se desplaza al hacer scroll
