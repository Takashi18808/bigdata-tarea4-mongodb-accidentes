"""Tarea 4 - Big Data (UNAD). Carga de datos de prueba en MongoDB.

Caso de uso: reportes de accidentes de tránsito de Bucaramanga (continuación del
conjunto de datos de la Tarea 3). Crea la base 'accidentes_bga' con tres
colecciones: comunas, agentes y accidentes (150 documentos).
Los datos son sintéticos (semilla fija) y se generan para practicar consultas.

Uso:  python cargar_datos.py
"""
import random
from datetime import datetime, timedelta

from pymongo import ASCENDING, DESCENDING, GEOSPHERE, MongoClient

random.seed(2026)
cliente = MongoClient("mongodb://127.0.0.1:27017")
cliente.drop_database("accidentes_bga")          # parte siempre de cero
db = cliente["accidentes_bga"]

# ---------------------------------------------------------------- comunas
COMUNAS = [
    ("Norte", "Norte", 52000, 7.1500, -73.1200), ("Nororiental", "Norte", 61000, 7.1450, -73.1050),
    ("San Francisco", "Centro", 38000, 7.1220, -73.1180), ("Occidental", "Centro", 34000, 7.1300, -73.1330),
    ("García Rovira", "Centro", 29000, 7.1190, -73.1260), ("La Concordia", "Centro", 27000, 7.1160, -73.1210),
    ("La Ciudadela", "Oriente", 45000, 7.1190, -73.1090), ("Suroccidente", "Sur", 41000, 7.1050, -73.1300),
    ("Sur", "Sur", 36000, 7.0950, -73.1200), ("Oriental", "Oriente", 33000, 7.1100, -73.1050),
    ("Morrorrico", "Norte", 24000, 7.1380, -73.1400), ("Provenza", "Sur", 47000, 7.1000, -73.1070),
    ("Cabecera del Llano", "Centro", 39000, 7.1110, -73.1120), ("Mutis", "Norte", 26000, 7.1330, -73.1250),
    ("Lagos del Cacique", "Oriente", 31000, 7.1050, -73.1000),
]
comunas = [{"_id": i + 1, "nombre": n, "zona": z, "poblacion": p,
            "centro": {"type": "Point", "coordinates": [lon, lat]}}
           for i, (n, z, p, lat, lon) in enumerate(COMUNAS)]
db.comunas.insert_many(comunas)

# ---------------------------------------------------------------- agentes
NOMBRES = ["Carlos Ruiz", "Andrea Mejía", "Luis Cárdenas", "Paola Ortiz", "Jorge Pinto", "Marcela Díaz",
           "Hernán Rojas", "Diana Quintero", "Mauricio León", "Sandra Prada", "Iván Vargas", "Natalia Pérez"]
agentes = [{"_id": f"AG{i + 1:02d}", "nombre": n, "rango": random.choice(["Patrullero", "Subintendente", "Intendente"]),
            "anios_servicio": random.randint(1, 22), "turno": random.choice(["mañana", "tarde", "noche"])}
           for i, n in enumerate(NOMBRES)]
db.agentes.insert_many(agentes)

# ------------------------------------------------------------- accidentes
CLASES = ["choque", "atropello", "volcamiento", "caída de ocupante", "choque con objeto fijo"]
TIPOS_VEH = ["automóvil", "motocicleta", "bus", "camioneta", "bicicleta", "camión"]
CLIMA = ["despejado", "lluvia", "nublado"]
ILUM = ["día", "noche con luz", "noche sin luz"]
BARRIOS = ["Centro", "Cabecera", "Real de Minas", "La Universidad", "Álvarez", "Café Madrid", "Kennedy",
           "San Alonso", "Mutis", "Bolarquí", "Campo Hermoso", "Girardot"]
GRAV_PESOS = [("solo daños", 0.55), ("heridos", 0.38), ("fatal", 0.07)]

inicio = datetime(2025, 1, 1)
accidentes = []
for n in range(1, 151):
    fecha = inicio + timedelta(days=random.randint(0, 560), hours=random.randint(0, 23), minutes=random.randint(0, 59))
    c = random.choice(comunas)
    gravedad = random.choices([g for g, _ in GRAV_PESOS], [w for _, w in GRAV_PESOS])[0]
    veh = [{"tipo": random.choices(TIPOS_VEH, [30, 40, 7, 12, 8, 3])[0],
            "edad_conductor": random.randint(18, 70), "servicio": random.choice(["particular", "público"])}
           for _ in range(random.choices([1, 2, 3], [20, 65, 15])[0])]
    muertos = random.randint(1, 2) if gravedad == "fatal" else 0
    heridos = random.randint(1, 4) if gravedad == "heridos" else (random.randint(0, 2) if muertos else 0)
    doc = {
        "codigo": f"ACC-{n:04d}",
        "fecha": fecha,
        "hora": fecha.hour,
        "comuna_id": c["_id"],
        "barrio": random.choice(BARRIOS),
        "clase": random.choice(CLASES),
        "gravedad": gravedad,
        "vehiculos": veh,
        "victimas": {"heridos": heridos, "muertos": muertos},
        "condiciones": {"clima": random.choices(CLIMA, [60, 25, 15])[0], "iluminacion": random.choice(ILUM)},
        "ubicacion": {"type": "Point", "coordinates": [round(c["centro"]["coordinates"][0] + random.uniform(-.008, .008), 6),
                                                          round(c["centro"]["coordinates"][1] + random.uniform(-.008, .008), 6)]},
        "agente_id": random.choice(agentes)["_id"],
        "etiquetas": random.sample(["moto", "peatón", "lluvia", "exceso de velocidad", "embriaguez", "semáforo", "ciclista"],
                                   random.randint(1, 3)),
    }
    if random.random() < 0.3:                      # campo opcional: esquema flexible
        doc["observaciones"] = random.choice(["Vía en mal estado", "Falta de señalización", "Conductor se dio a la fuga"])
    accidentes.append(doc)
db.accidentes.insert_many(accidentes)

# ---------------------------------------------------------------- índices
db.accidentes.create_index([("fecha", DESCENDING)], name="idx_fecha")
db.accidentes.create_index([("comuna_id", ASCENDING), ("gravedad", ASCENDING)], name="idx_comuna_gravedad")
db.accidentes.create_index([("ubicacion", GEOSPHERE)], name="idx_ubicacion_2dsphere")
db.accidentes.create_index([("codigo", ASCENDING)], unique=True, name="idx_codigo_unico")

for nombre in db.list_collection_names():
    print(f"{nombre:12s} -> {db[nombre].count_documents({})} documentos")
