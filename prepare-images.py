"""
Prepara as imagens do site a partir dos criativos e das fotos em alta.

Alguns criativos têm texto na parte de cima; nesses casos recortamos só a
faixa da fotografia (sem texto). As fotos limpas entram inteiras.

Uso:  python prepare-images.py
"""
import os
from PIL import Image

REF = r"C:\Users\Usuario\Documents\Claude-Projetos\creative-factory\marcas\one-grid\referencias"
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_fontes")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "img")

# (arquivo de origem, nome de saída, corte vertical (y0,y1) em fração, largura final)
JOBS = [
    # -------- criativo com texto: recorta só a faixa fotográfica --------
    (os.path.join(REF, "ChatGPT Image 18 de ago. de 2026, 10_45_20.png"),
     "hero-garagem.jpg", (0.400, 0.855), 2000),
    (os.path.join(REF, "ChatGPT Image 18 de ago. de 2026, 09_22_10.png"),
     "sala-skyline.jpg", (0.395, 1.0), 1600),

    # -------- fotos limpas, sem texto --------
    (os.path.join(REF, "Cockpit vermelho de F1 com telas curvas.png"),
     "cockpit-piloto.jpg", None, 1900),                      # faixa-manifesto
    (os.path.join(REF, "Simulador de Fórmula 1 com telas triplas.png"),
     "telas-triplas.jpg", None, 1600),                       # bloco Movimento
    (os.path.join(REF, "8372d85b-33fa-45ca-b2ac-d4b29f2049f7.png"),
     "volante-detalhe.jpg", None, 1200),                     # bloco Comando
    (os.path.join(REF, "download.jpg"),
     "oficina.jpg", None, 1400),                             # Ateliê
    (os.path.join(REF, "ChatGPT Image 20 de ago. de 2026, 16_08_55.png"),
     "comparativo.jpg", (0.17, 1.0), 1200),                  # Comparativo (sem parte do teto)
    (os.path.join(REF, "ChatGPT_Image_10_de_ago._202608111001.jpeg"),
     "amb-residencia.jpg", None, 1100),                      # Ambientes 1
    (os.path.join(REF, "ChatGPT Image 20 de ago. de 2026, 16_50_58.png"),
     "amb-garagem.jpg", None, 1100),                         # Ambientes 2
    (os.path.join(REF, "Insert_screens_into_simulator_image_202608110959(2).jpeg"),
     "amb-premium.jpg", None, 1100),                         # Ambientes 3
    (os.path.join(REF, "0b9516b0-3a87-4e5d-a623-445f17f25a6d.png"),
     "piloto-capacete.jpg", None, 1400),                     # fechamento
    (os.path.join(SRC, "formula-studio-src.jpg"),
     "formula-studio.jpg", None, 2000),                      # Especificações
    (os.path.join(SRC, "formula-cutaway-src.jpg"),
     "formula-cutaway.jpg", None, 1920),                     # Engenharia
]


def run():
    os.makedirs(OUT, exist_ok=True)
    for src, name, crop, width in JOBS:
        if not os.path.exists(src):
            print("%-24s ORIGEM NÃO ENCONTRADA: %s" % (name, src))
            continue
        im = Image.open(src).convert("RGB")
        if crop:
            y0, y1 = crop
            im = im.crop((0, int(im.height * y0), im.width, int(im.height * y1)))
        if im.width > width:
            im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
        path = os.path.join(OUT, name)
        im.save(path, "JPEG", quality=84, optimize=True, progressive=True)
        print("%-24s %-12s %d KB" % (name, "%dx%d" % im.size,
                                     os.path.getsize(path) / 1024))


if __name__ == "__main__":
    run()
