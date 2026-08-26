"""
Gera, via Gemini, as peças isoladas do One Grid Formula usadas na
animação de montagem (seção Ateliê).

Cada peça é gerada sobre um fundo azul-petróleo chapado, com a mesma câmera
e a mesma luz, usando as fotos reais do produto como referência.

Uso:
    python gen-partes.py            # gera as peças que ainda não existem
    python gen-partes.py --force    # regera todas
    python gen-partes.py base body  # gera apenas essas
"""
import os
import sys
import mimetypes
from google import genai
from google.genai import types

ROOT = os.path.dirname(os.path.abspath(__file__))
REF = r"C:\Users\Usuario\Documents\Claude-Projetos\creative-factory\marcas\one-grid\referencias"
OUT = os.path.join(ROOT, "_fontes", "partes")
MODEL = "gemini-2.5-flash-image"

BG = "#0b1020"

BASE_RULES = (
    "Photorealistic studio product render of a part of the ONE GRID FORMULA racing simulator. "
    "IMPORTANT: reproduce the exact same machine shown in the reference photographs — same shapes, "
    "same glossy red bodywork, same black motion platform with rounded corners and casters, "
    "same polished steel actuators. Do not invent a different design. "
    f"Isolate the part on a completely flat, uniform dark navy background (hex {BG}), no floor, "
    "no shadow on the ground, no reflection, no text, no watermark, no people. "
    "Camera: three-quarter side view from slightly above, exactly like the reference photo, "
    "lens 50mm, the part centred and fully inside the frame with generous margin. "
    "Lighting: soft top key light with cool rim light, cinematic, high-end automotive catalogue look."
)

PARTS = {
    "base": (
        "Show ONLY the black motion platform base of the simulator: the low, wide, rounded-corner "
        "black plinth with the recessed textured tread plate on top and small casters underneath. "
        "No red bodywork, no seat, no screens, no actuators standing up — just the empty black base."
    ),
    "actuators": (
        "Show ONLY the pair of polished stainless-steel electric motion actuators with their black "
        "mounting brackets, standing upright as a separate assembly, exactly like the ones under the "
        "rear of the simulator in the reference. No base plinth, no bodywork, no seat."
    ),
    "chassis": (
        "Show ONLY the bare structural chassis of the simulator: a black metal frame with the "
        "carbon-fibre racing seat mounted on it, the three-pedal load-cell pedal box at the front and "
        "the red five-point harness straps. No red outer bodywork covering it, no screens, no base."
    ),
    "body": (
        "Show ONLY the glossy red single-seater outer bodywork shell of the simulator, floating empty: "
        "the long low nose, the raised side pods and the tall rear engine cover, exactly the same shape "
        "as in the reference photographs. Hollow inside, nothing mounted in it, no base, no screens."
    ),
    "wheel": (
        "Show ONLY the black carbon-fibre halo hoop together with the detachable formula steering wheel "
        "(rectangular carbon wheel with a colour display and coloured rotary switches and buttons), "
        "as a floating sub-assembly. No bodywork, no seat, no base."
    ),
    "screens": (
        "Show ONLY the triple curved monitor rig: three large thin-bezel screens side by side in a gentle "
        "curve, mounted on a black steel floor stand, seen from the same three-quarter angle. "
        "The screens show a night race circuit with floodlights. No simulator, no base, no car."
    ),
}

ORDER = ["base", "actuators", "chassis", "body", "wheel", "screens"]

REFS = [
    "Simulador de Fórmula 1 com telas triplas.png",
    "Cockpit vermelho de F1 com telas curvas.png",
]


def ref_parts():
    out = []
    for name in REFS:
        p = os.path.join(REF, name)
        if not os.path.exists(p):
            print("  ! referência não encontrada:", name)
            continue
        mime = mimetypes.guess_type(p)[0] or "image/png"
        with open(p, "rb") as fh:
            out.append(types.Part.from_bytes(data=fh.read(), mime_type=mime))
    return out


def generate(client, key, prompt, refs):
    resp = client.models.generate_content(
        model=MODEL,
        contents=refs + [BASE_RULES + "\n\n" + prompt],
        config=types.GenerateContentConfig(response_modalities=["IMAGE"]),
    )
    for cand in resp.candidates or []:
        for part in cand.content.parts or []:
            if getattr(part, "inline_data", None) and part.inline_data.data:
                path = os.path.join(OUT, key + ".png")
                with open(path, "wb") as fh:
                    fh.write(part.inline_data.data)
                return path
    return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    force = "--force" in sys.argv
    todo = args or ORDER

    os.makedirs(OUT, exist_ok=True)
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    refs = ref_parts()

    for key in todo:
        if key not in PARTS:
            print("peça desconhecida:", key)
            continue
        dest = os.path.join(OUT, key + ".png")
        if os.path.exists(dest) and not force:
            print("%-10s já existe, pulando" % key)
            continue
        print("%-10s gerando…" % key, flush=True)
        try:
            path = generate(client, key, PARTS[key], refs)
            print("%-10s %s" % (key, "ok -> " + path if path else "sem imagem na resposta"))
        except Exception as exc:
            print("%-10s ERRO: %s" % (key, exc))


if __name__ == "__main__":
    main()
