"""
Fatia a foto do simulador em camadas para a animação de montagem (Ateliê).

Cada camada é um recorte da MESMA foto, com as bordas internas suavizadas.
Posicionadas nas coordenadas originais, as camadas remontam a foto exata —
por isso a montagem fecha sem emenda no fim do scroll.

Uso:
    python build-atelie-layers.py            # gera as camadas
    python build-atelie-layers.py --preview  # gera também um teste visual
"""
import json
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "_fontes", "atelie-montagem-src.png")
OUT = os.path.join(ROOT, "assets", "img", "atelie")

FEATHER = 30          # suavização das bordas internas, em px da imagem original
BG = (7, 16, 30)      # cor de fundo da foto (#07101E) — igual à do CSS

# nome, caixa (x0,y0,x1,y1), bordas a suavizar (esq, topo, dir, baixo)
LAYERS = [
    ("base",      (360, 460, 1260, 768), (1, 1, 1, 0)),
    ("actuators", (860, 270, 1210, 630), (1, 1, 1, 1)),
    ("seat",      (700, 100, 1120, 530), (1, 1, 1, 1)),
    ("body",      (60, 190, 720, 530),   (1, 1, 1, 1)),
    ("halo",      (540, 110, 870, 310),  (1, 1, 1, 1)),
]


def feather_mask(size, edges, radius):
    w, h = size
    m = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(m)
    l, t, r, b = edges
    d.rectangle(
        [l * radius, t * radius, w - 1 - r * radius, h - 1 - b * radius],
        fill=255,
    )
    return m.filter(ImageFilter.GaussianBlur(radius * 0.55))


def main():
    os.makedirs(OUT, exist_ok=True)
    src = Image.open(SRC).convert("RGB")
    W, H = src.size
    meta = {"w": W, "h": H, "layers": []}

    for name, box, edges in LAYERS:
        crop = src.crop(box).convert("RGBA")
        crop.putalpha(feather_mask(crop.size, edges, FEATHER))
        path = os.path.join(OUT, name + ".png")
        crop.save(path, optimize=True)
        meta["layers"].append({
            "name": name,
            "x": round(box[0] / W * 100, 3),
            "y": round(box[1] / H * 100, 3),
            "w": round((box[2] - box[0]) / W * 100, 3),
            "h": round((box[3] - box[1]) / H * 100, 3),
        })
        print("%-10s %-22s %5d KB" % (name, "%dx%d" % crop.size,
                                      os.path.getsize(path) / 1024))

    with open(os.path.join(OUT, "layers.json"), "w", encoding="utf-8") as fh:
        json.dump(meta, fh, indent=1)

    if "--preview" in sys.argv:
        canvas = Image.new("RGB", (W, H), BG)
        for name, _, _ in LAYERS:
            lay = Image.open(os.path.join(OUT, name + ".png"))
            info = next(i for i in meta["layers"] if i["name"] == name)
            canvas.paste(lay, (round(info["x"] / 100 * W), round(info["y"] / 100 * H)), lay)
        p = os.path.join(ROOT, "_fontes", "atelie-preview.jpg")
        canvas.save(p, quality=90)
        print("preview ->", p)


if __name__ == "__main__":
    main()
