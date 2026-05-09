# ⚙️ NodeFlix - Backend (API y Base de Datos)

API RESTful que conecta nuestra aplicación web con el motor de recomendaciones en grafos (Neo4j) y gestiona el banco de datos extraído de TMDB.

## 🛠️ Tecnologías Utilizadas
* **Entorno:** Node.js 22 LTS
* **Framework:** Express.js
* **Lenguaje:** TypeScript
* **Base de Datos:** Neo4j (Driver oficial)

## 📋 Requisitos Previos
1. **Node.js** (Versión 22 LTS recomendada para usar `fetch` nativo).
2. **Neo4j Desktop** (Local) o cuenta en **Neo4j AuraDB** (Nube).

## 🚀 Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/TU-USUARIO/nodeflix-backend.git](https://github.com/TU-USUARIO/nodeflix-backend.git)
   cd nodeflix-backend


2. **Instalar dependencias:**
   ```bash
   npm install

3. **Configurar variables de entorno:**
  Crea un archivo llamado .env en la raíz del proyecto (al mismo nivel que el package.json). NUNCA subir este archivo a GitHub.
  Copia este formato y pon tus credenciales reales:
  
    ```
    PORT=3000
    NEO4J_URI=bolt://localhost:7687
    NEO4J_USERNAME=neo4j
    NEO4J_PASSWORD=your_password
    TMDB_API_KEY=tu_clave_de_tmdb
    ```

4. **Iniciar el servidor:**

    Asegurarse de agregar `"dev": "nodemon src/index.ts"` a los scripts del `package.json` y ejecutar:

   ```bash
   npm run dev
   ```

    El servidor se ejecutará en `http://localhost:3000` (o el puerto configurado).
