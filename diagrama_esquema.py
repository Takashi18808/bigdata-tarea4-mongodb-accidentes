"""Genera el diagrama del esquema de accidentes_bga (colecciones y referencias)."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

SALIDA = Path(__file__).resolve().parent.parent / "figuras" / "diagrama_esquema.png"
AZUL, VERDE, NAR, GRIS = "#1F6FB2", "#13804F", "#C27A0E", "#333333"

fig, ax = plt.subplots(figsize=(12.5, 6.2), dpi=200)
ax.set_xlim(0, 131)
ax.set_ylim(0, 62)
ax.axis("off")


def caja(x, y, w, h, titulo, filas, color):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4,rounding_size=1.2",
                                fc="white", ec=color, lw=2))
    ax.add_patch(FancyBboxPatch((x, y + h - 5.2), w, 5.2, boxstyle="round,pad=0.4,rounding_size=1.2",
                                fc=color, ec=color, lw=2))
    ax.text(x + w / 2, y + h - 2.6, titulo, ha="center", va="center", color="white", fontsize=12, fontweight="bold")
    for i, (txt, tipo) in enumerate(filas):
        yy = y + h - 8.4 - i * 3.25
        ax.text(x + 1.8, yy, txt, ha="left", va="center", fontsize=8.6, family="monospace", color=GRIS)
        if tipo:
            ax.text(x + w - 1.5, yy, tipo, ha="right", va="center", fontsize=8, color="#777777", style="italic")


caja(2, 14, 30, 40, "comunas (15 docs)", [
    ("_id", "int  (PK)"), ("nombre", "string"), ("zona", "string"), ("poblacion", "int"),
    ("centro", "GeoJSON Point")], VERDE)
caja(52, 4, 40, 54, "accidentes (151 docs)", [
    ("_id", "ObjectId (PK)"), ("codigo", "string, único"), ("fecha / hora", "date / int"),
    ("comuna_id", "int  → comunas"), ("barrio / clase", "string"), ("gravedad", "enum"),
    ("vehiculos[ ]", "array embebido"), ("   tipo, edad_conductor, servicio", ""),
    ("victimas { }", "heridos, muertos"), ("condiciones { }", "clima, iluminacion"),
    ("ubicacion { }", "GeoJSON Point"), ("agente_id", "string → agentes"),
    ("etiquetas[ ]", "array de string"), ("observaciones", "opcional")], AZUL)
caja(108, 22, 21, 28, "agentes (12)", [
    ("_id", "string  (PK)"), ("nombre", "string"), ("rango", "string"), ("anios_servicio", "int"),
    ("turno", "string")], NAR)

for (x0, y0, x1, y1, txt, ty) in [(52, 36, 32.6, 36, "comuna_id → _id", 38.4),
                                  (92, 30.5, 107.6, 30.5, "agente_id → _id", 32.9)]:
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0), arrowprops=dict(arrowstyle="->", lw=2, color=GRIS))
    ax.text((x0 + x1) / 2, ty, txt, ha="center", fontsize=8, color=GRIS)
ax.text(65, 0.4, "Referencia (usada con $lookup)  ·  Documentos y arreglos embebidos dentro de accidentes",
        ha="center", fontsize=9, color="#555555")
fig.savefig(SALIDA, bbox_inches="tight", facecolor="white")
print("ok", SALIDA)
