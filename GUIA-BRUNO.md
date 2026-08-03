# Guía: probar la API del foro con Bruno

Guía paso a paso para levantar el backend y probar todos los endpoints con
[Bruno](https://www.usebruno.com/). Al final tienes la tabla completa de rutas.

---

### 0.1 Crea tu `.env`

```bash
cp .env.example .env
```

Y genera un secreto de verdad:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Pega el resultado en `JWT_SECRET`.

### 0.2 Asegura MongoDB corriendo

Local: que el servicio `mongod` esté activo. O usa una cadena de MongoDB Atlas
en `MONGODB_URI`.

### 0.3 Levanta el servidor

```bash
npm run start:dev
```

Deberías ver `🚀 API corriendo en http://localhost:3000`.

---

## 1. Configurar Bruno

### 1.1 Crea la colección

Abre Bruno → **Create Collection** → nómbrala `Foro API` y elige una carpeta
(quedará versionada en git como archivos `.bru`, por eso Bruno es tan cómodo).

### 1.2 Crea un Environment

Arriba a la derecha → **Configure** → **Environments** → nuevo, llamado `Local`.
Agrega estas dos variables:

| Variable  | Valor inicial            |
|-----------|--------------------------|
| `baseUrl` | `http://localhost:3000`  |
| `token`   | *(déjalo vacío)*         |

Selecciona el environment `Local` en el selector de arriba. A partir de aquí
usarás `{{baseUrl}}` y `{{token}}` en todas las peticiones.

---

## 2. El flujo de pruebas (en orden)

Sigue este orden: cada paso depende del anterior.

### Paso 1 — Health check (¿está vivo?)

- **Método:** `GET`
- **URL:** `{{baseUrl}}/`
- Debe responder `200` con `{ "status": "ok", ... }`.

Si esto falla, el servidor no arrancó. Revisa la consola antes de seguir.

### Paso 2 — Registro

- **Método:** `POST`
- **URL:** `{{baseUrl}}/auth/register`
- **Body → JSON:**

```json
{
  "nombre": "Odin",
  "username": "lightsinside",
  "email": "odin@example.com",
  "password": "clave1234"
}
```

Respuesta `201` con `{ accessToken, user }`.

> **Truco clave:** capturar el token automáticamente. En la pestaña **Script**
> de esta petición, en *Post Response*, pega:
>
> ```js
> const body = res.getBody();
> if (body && body.accessToken) {
>   bru.setEnvVar("token", body.accessToken);
> }
> ```
>
> Así, tras registrarte, `{{token}}` queda cargado solo. Repite lo mismo en el
> login del Paso 3.

### Paso 3 — Login

- **Método:** `POST`
- **URL:** `{{baseUrl}}/auth/login`
- **Body → JSON:**

```json
{
  "identificador": "lightsinside",
  "password": "clave1234"
}
```

`identificador` acepta username **o** email. Responde `200` con un token nuevo.
Pega el mismo script de captura del Paso 2 aquí también.

### Paso 4 — ¿Quién soy? (primera ruta protegida)

- **Método:** `GET`
- **URL:** `{{baseUrl}}/auth/me`
- **Auth:** pestaña **Auth** → tipo **Bearer** → valor `{{token}}`

Responde tu `{ id, username, rol }`. Si da `401`, el token no se cargó: revisa
el script del Paso 2/3 o pega el token a mano en la variable de entorno.

### Paso 5 — Crear un post

- **Método:** `POST`
- **URL:** `{{baseUrl}}/posts`
- **Auth:** Bearer `{{token}}`
- **Body → JSON:**

```json
{
  "titulo": "Mi primer post en el foro",
  "cuerpo": "Probando la API con Bruno. Va increíble.",
  "tags": ["nestjs", "mongodb"]
}
```

Responde `201` con el post creado. **Copia el `_id`** que devuelve: lo necesitas
para el siguiente paso.

> Fíjate: nunca mandaste `autor` en el body. El backend lo saca del token.
> Eso es intencional y es seguridad, no un olvido.

### Paso 6 — Listar posts (público)

- **Método:** `GET`
- **URL:** `{{baseUrl}}/posts?page=1&limit=20`
- Sin Auth. Prueba también `?tag=nestjs`.

### Paso 7 — Comentar un post

- **Método:** `POST`
- **URL:** `{{baseUrl}}/posts/PEGA_EL_ID_DEL_POST/comments`
- **Auth:** Bearer `{{token}}`
- **Body → JSON:**

```json
{
  "contenido": "¡Buen post! Yo también estoy probando esto."
}
```

Responde `201`. Ahora vuelve al Paso 6 y verás que ese post tiene
`comentariosCount: 1`. Ese contador es el detalle "difícil" del que hablamos.

### Paso 8 — Listar comentarios de un post

- **Método:** `GET`
- **URL:** `{{baseUrl}}/posts/PEGA_EL_ID_DEL_POST/comments`

### Paso 9 — Editar y borrar (opcionales)

- `PATCH {{baseUrl}}/posts/:id` (Bearer) — cambia título o cuerpo.
- `DELETE {{baseUrl}}/posts/:id` (Bearer) — soft delete, responde `204`.
- `PATCH {{baseUrl}}/comments/:id` (Bearer)
- `DELETE {{baseUrl}}/comments/:id` (Bearer)

Solo el autor (o un admin) puede editar/borrar; si intentas con otro usuario,
responde `403`.

---

## 3. Tabla completa de endpoints

| Método | Ruta                             | Auth        | Qué hace                          |
|--------|----------------------------------|-------------|-----------------------------------|
| GET    | `/`                              | —           | Health check                      |
| POST   | `/auth/register`                 | —           | Crear cuenta + token              |
| POST   | `/auth/login`                    | —           | Iniciar sesión + token            |
| GET    | `/auth/me`                       | Bearer      | Datos del usuario del token       |
| GET    | `/users/:id`                     | —           | Perfil público                    |
| GET    | `/users`                         | Bearer+admin| Listar usuarios (solo admin)      |
| PATCH  | `/users/:id`                     | Bearer      | Editar perfil (dueño/admin)       |
| DELETE | `/users/:id`                     | Bearer      | Borrar cuenta (dueño/admin)       |
| POST   | `/posts`                         | Bearer      | Crear post                        |
| GET    | `/posts`                         | —           | Listar posts (`?page&limit&tag`)  |
| GET    | `/posts/:id`                     | —           | Ver un post                       |
| PATCH  | `/posts/:id`                     | Bearer      | Editar post (autor/admin)         |
| DELETE | `/posts/:id`                     | Bearer      | Borrar post (autor/admin)         |
| POST   | `/posts/:postId/comments`        | Bearer      | Comentar un post                  |
| GET    | `/posts/:postId/comments`        | —           | Listar comentarios de un post     |
| PATCH  | `/comments/:id`                  | Bearer      | Editar comentario (autor/admin)   |
| DELETE | `/comments/:id`                  | Bearer      | Borrar comentario (autor/admin)   |

---

## 4. Cómo probar los errores (que también hay que probarlos)

| Qué hacer                                          | Respuesta esperada |
|----------------------------------------------------|--------------------|
| Registrar el mismo username/email dos veces        | `409 Conflict`     |
| Registrar con `password` de 3 letras               | `400 Bad Request`  |
| Mandar un campo extra no declarado en el DTO        | `400` (whitelist)  |
| Llamar `/auth/me` sin token                        | `401 Unauthorized` |
| Editar el post de OTRO usuario                     | `403 Forbidden`    |
| `GET /posts/123` (id inválido)                     | `404 Not Found`    |

Probar los caminos que fallan es tan importante como los que funcionan. Si tu
API devuelve `500` donde debería devolver `400/401/403/404`, algo está mal
manejado.

---

## 5. Tip: convertir el token en variable de colección

Si no quieres el script de captura, puedes:
1. Hacer login, copiar el `accessToken` de la respuesta.
2. Pegarlo a mano en la variable de entorno `token`.

El script automático es más cómodo, pero saber hacerlo a mano ayuda a entender
qué está pasando por debajo.

---

## 6. Errores comunes al probar

- **Todo da 400 con "property X should not exist":** mandaste un campo que el
  DTO no declara. Es el `whitelist: true` funcionando. Quita el campo o agrégalo
  al DTO.
- **401 en rutas protegidas pese a tener token:** revisa que el header sea
  `Authorization: Bearer <token>` (con el espacio) y que el token no haya
  expirado (`JWT_EXPIRES_IN`).
- **`Cannot read properties of undefined (reading 'accessToken')`** en el
  script: la petición no devolvió 2xx. Revisa el body de la respuesta primero.
- **El servidor no conecta a Mongo:** revisa `MONGODB_URI` y que `mongod` esté
  corriendo. Con Atlas, agrega tu IP a la whitelist del cluster.

---

## 7. Sobre el contador de comentarios y las transacciones

Al comentar, el código hace **dos** operaciones: inserta el comentario y luego
incrementa `comentariosCount` con `$inc` (atómico a nivel de documento). Para un
foro académico esto es más que suficiente y funciona en un MongoDB local normal.

Si quisieras atomicidad TOTAL (que ambas cosas ocurran o ninguna, como el
rollback de una venta), necesitarías envolverlas en una **transacción con
session**. Pero ojo: **las transacciones de Mongo requieren un replica set**;
un `mongod` local suelto NO las soporta y lanzaría error en runtime. Por eso el
código las deja fuera por defecto. Es el mismo concepto de ACID/rollback que ya
manejaste en otros proyectos, solo que aquí tiene ese requisito de infraestructura.
