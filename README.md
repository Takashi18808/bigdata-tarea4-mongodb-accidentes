# Tarea 4 – Almacenamiento y Consultas de Datos en Big Data (MongoDB)

Base de datos `accidentes_bga`: reportes de accidentes de tránsito de Bucaramanga
(continuación del conjunto de datos de la Tarea 3). Autora: María Alejandra Herrera.

## Archivos

| Archivo | Descripción |
|---|---|
| `cargar_datos.py` | Crea la base `accidentes_bga` y carga 15 comunas, 12 agentes y 150 accidentes (datos de prueba con semilla fija) y los índices. |
| `consultas_mongosh.js` | Todas las consultas del informe, comentadas: inserción, selección, actualización, eliminación, filtros, `$lookup` (join), agregaciones, geoespacial, `explain` y validación de esquema. |
| `diagrama_esquema.py` | Genera el diagrama de colecciones y referencias. |

## Cómo ejecutarlo

1. Iniciar MongoDB 7.0: `"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath C:\data\db`
2. Instalar el controlador: `pip install pymongo`
3. Cargar los datos: `python cargar_datos.py`
4. Abrir mongosh (o MongoDB Compass) y ejecutar `use accidentes_bga`; después, las consultas de `consultas_mongosh.js`.
