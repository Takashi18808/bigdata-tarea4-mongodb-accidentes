/*
 * Tarea 4 - Almacenamiento y Consultas de Datos en Big Data (UNAD)
 * Consultas de MongoDB para la base accidentes_bga (reportes de accidentes de
 * tránsito de Bucaramanga). Se ejecutan en mongosh o en la consola de Compass:
 *     use accidentes_bga
 * Los datos de prueba se cargan antes con cargar_datos.py.
 */

// ---------------------------------------------------------------- 0. Servidor
db.version()                                   // 7.0.14
db.adminCommand({getCmdLineOpts: 1}).argv      // mongod --dbpath C:\data\db
show collections                               // accidentes, agentes, comunas

// --------------------------------------------------------------- 1. INSERCIÓN
// Un documento (con documentos y arreglos embebidos)
db.accidentes.insertOne({
  codigo: "ACC-0151", fecha: new Date("2026-11-18T07:45:00Z"), hora: 7, comuna_id: 3,
  barrio: "Centro", clase: "choque", gravedad: "heridos",
  vehiculos: [
    {tipo: "motocicleta", edad_conductor: 27, servicio: "particular"},
    {tipo: "automóvil", edad_conductor: 41, servicio: "público"}
  ],
  victimas: {heridos: 2, muertos: 0},
  condiciones: {clima: "lluvia", iluminacion: "día"},
  ubicacion: {type: "Point", coordinates: [-73.118, 7.122]},
  agente_id: "AG03", etiquetas: ["moto", "lluvia"]
})

// Varios documentos a la vez; ACC-0152 trae un campo opcional (esquema flexible)
db.accidentes.insertMany([
  {codigo: "ACC-0152", fecha: new Date("2026-11-18T22:10:00Z"), hora: 22, comuna_id: 1, barrio: "Kennedy",
   clase: "atropello", gravedad: "fatal",
   vehiculos: [{tipo: "camioneta", edad_conductor: 35, servicio: "particular"}],
   victimas: {heridos: 0, muertos: 1}, condiciones: {clima: "nublado", iluminacion: "noche sin luz"},
   agente_id: "AG05", etiquetas: ["peatón"], observaciones: "Falta de señalización"},
  {codigo: "ACC-0153", fecha: new Date("2026-11-19T13:30:00Z"), hora: 13, comuna_id: 7, barrio: "Álvarez",
   clase: "choque", gravedad: "solo daños",
   vehiculos: [{tipo: "automóvil", edad_conductor: 52, servicio: "particular"},
               {tipo: "bus", edad_conductor: 46, servicio: "público"}],
   victimas: {heridos: 0, muertos: 0}, condiciones: {clima: "despejado", iluminacion: "día"},
   agente_id: "AG02", etiquetas: ["semáforo"]},
  {codigo: "ACC-0154", fecha: new Date("2026-11-19T18:55:00Z"), hora: 18, comuna_id: 12, barrio: "Girardot",
   clase: "volcamiento", gravedad: "heridos",
   vehiculos: [{tipo: "motocicleta", edad_conductor: 19, servicio: "particular"}],
   victimas: {heridos: 1, muertos: 0}, condiciones: {clima: "lluvia", iluminacion: "noche con luz"},
   agente_id: "AG09", etiquetas: ["moto", "lluvia"]}
])
db.accidentes.countDocuments({})               // 154

// --------------------------------------------------------------- 2. SELECCIÓN
// Filtro simple, proyección, orden y límite
db.accidentes.find({gravedad: "fatal"}, {_id: 0, codigo: 1, clase: 1, comuna_id: 1, barrio: 1})
  .sort({fecha: -1}).limit(4)

// Operadores: $in, $gte, campos anidados (notación de punto) y rango de fechas
db.accidentes.find({
  gravedad: {$in: ["heridos", "fatal"]}, "victimas.heridos": {$gte: 2},
  "condiciones.clima": "lluvia", fecha: {$gte: ISODate("2025-06-01")}
}, {_id: 0, codigo: 1, clase: 1, gravedad: 1}).sort({codigo: 1}).limit(4)

// Arreglos: $elemMatch (misma condición sobre un mismo elemento) y $all
db.accidentes.find({
  vehiculos: {$elemMatch: {tipo: "motocicleta", edad_conductor: {$lt: 25}}},
  etiquetas: {$all: ["moto"]}
}, {_id: 0, codigo: 1, barrio: 1}).limit(4)
db.accidentes.countDocuments({
  vehiculos: {$elemMatch: {tipo: "motocicleta", edad_conductor: {$lt: 25}}}, etiquetas: {$all: ["moto"]}
})

// -------------------------------------------------------------- 3. ACTUALIZACIÓN
// $set cambia valores, $inc suma/resta y $push agrega un elemento al arreglo
db.accidentes.updateOne({codigo: "ACC-0151"}, {
  $set: {gravedad: "fatal", "victimas.muertos": 1},
  $inc: {"victimas.heridos": -1},
  $push: {etiquetas: "actualizado"}
})
db.accidentes.find({codigo: "ACC-0151"}, {_id: 0, codigo: 1, gravedad: 1, victimas: 1, etiquetas: 1})

// Varios documentos a la vez
db.accidentes.updateMany({clase: "choque", "condiciones.clima": "lluvia"}, {$set: {revisado: true}})
db.accidentes.countDocuments({revisado: true})

// ----------------------------------------------------------------- 4. ELIMINACIÓN
db.accidentes.deleteOne({codigo: "ACC-0154"})
db.accidentes.deleteMany({codigo: {$in: ["ACC-0152", "ACC-0153"]}})
db.accidentes.countDocuments({})               // 151

// --------------------------------------------------- 5. AGREGACIÓN (contar, sumar, promediar)
// Conteo, suma y promedio por gravedad
db.accidentes.aggregate([
  {$group: {_id: "$gravedad", accidentes: {$sum: 1}, heridos: {$sum: "$victimas.heridos"},
            muertos: {$sum: "$victimas.muertos"}, prom_vehiculos: {$avg: {$size: "$vehiculos"}}}},
  {$project: {_id: 0, gravedad: "$_id", accidentes: 1, heridos: 1, muertos: 1,
              prom_vehiculos: {$round: ["$prom_vehiculos", 2]}}},
  {$sort: {accidentes: -1}}
])

// $unwind descompone el arreglo de vehículos: un documento por vehículo
db.accidentes.aggregate([
  {$unwind: "$vehiculos"},
  {$group: {_id: "$vehiculos.tipo", total: {$sum: 1}, edad_prom: {$avg: "$vehiculos.edad_conductor"}}},
  {$project: {_id: 0, tipo: "$_id", total: 1, edad_prom: {$round: ["$edad_prom", 1]}}},
  {$sort: {total: -1}}, {$limit: 4}
])

// $bucket agrupa por franjas horarias
db.accidentes.aggregate([
  {$bucket: {groupBy: "$hora", boundaries: [0, 6, 12, 18, 24], default: "otro",
             output: {accidentes: {$sum: 1},
                      fatales: {$sum: {$cond: [{$eq: ["$gravedad", "fatal"]}, 1, 0]}}}}}
])

// ------------------------------------------------------------ 6. JOIN con $lookup
// Une accidentes con comunas y agentes (referencias)
db.accidentes.aggregate([
  {$match: {gravedad: "fatal"}},
  {$lookup: {from: "comunas", localField: "comuna_id", foreignField: "_id", as: "comuna"}},
  {$unwind: "$comuna"},
  {$lookup: {from: "agentes", localField: "agente_id", foreignField: "_id", as: "agente"}},
  {$unwind: "$agente"},
  {$project: {_id: 0, codigo: 1, clase: 1, comuna: "$comuna.nombre", agente: "$agente.nombre"}},
  {$limit: 3}
])

// Join + agregación: accidentes por cada 10.000 habitantes de cada comuna
db.accidentes.aggregate([
  {$lookup: {from: "comunas", localField: "comuna_id", foreignField: "_id", as: "c"}},
  {$unwind: "$c"},
  {$group: {_id: "$c.nombre", poblacion: {$first: "$c.poblacion"}, accidentes: {$sum: 1},
            heridos: {$sum: "$victimas.heridos"}, muertos: {$sum: "$victimas.muertos"}}},
  {$addFields: {por_10mil: {$round: [{$multiply: [{$divide: ["$accidentes", "$poblacion"]}, 10000]}, 2]}}},
  {$project: {_id: 0, comuna: "$_id", accidentes: 1, muertos: 1, por_10mil: 1}},
  {$sort: {por_10mil: -1}}, {$limit: 4}
])

// ------------------------------------------- 7. GEOESPACIAL, ÍNDICES Y OPTIMIZACIÓN
// Accidentes a menos de 600 m de un punto (usa el índice 2dsphere)
db.accidentes.find({ubicacion: {$near: {$geometry: {type: "Point", coordinates: [-73.12, 7.12]},
                                        $maxDistance: 600}}}, {_id: 0, codigo: 1, barrio: 1}).limit(4)

db.accidentes.getIndexes().map(i => i.name)

// Comparación del plan de ejecución con y sin índice
var f = {comuna_id: 3, gravedad: "heridos"}
var a = db.accidentes.find(f).explain("executionStats")
({con_indice: {etapa: a.queryPlanner.winningPlan.inputStage.stage,
               indice: a.queryPlanner.winningPlan.inputStage.indexName,
               llaves_examinadas: a.executionStats.totalKeysExamined,
               docs_examinados: a.executionStats.totalDocsExamined,
               devueltos: a.executionStats.nReturned}})
var b = db.accidentes.find(f).hint({$natural: 1}).explain("executionStats")
({sin_indice: {etapa: b.queryPlanner.winningPlan.stage,
               docs_examinados: b.executionStats.totalDocsExamined,
               devueltos: b.executionStats.nReturned}})

// ------------------------------------------------ 8. VALIDACIÓN DE ESQUEMA
db.runCommand({
  collMod: "accidentes",
  validator: {$jsonSchema: {
    bsonType: "object",
    required: ["codigo", "fecha", "comuna_id", "gravedad", "vehiculos"],
    properties: {
      codigo: {bsonType: "string"},
      gravedad: {enum: ["solo daños", "heridos", "fatal"]},
      comuna_id: {bsonType: "number"},
      vehiculos: {bsonType: "array", minItems: 1}
    }}},
  validationLevel: "moderate"
})
db.accidentes.insertOne({codigo: "ACC-9999", gravedad: "leve"})   // MongoServerError: Document failed validation
