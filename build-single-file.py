"""
Gera uma versão de arquivo único do site One Grid.

Uso:
    python build-single-file.py           -> dist/one-grid-single.html   (site completo, abre com 2 cliques)
    python build-single-file.py artifact  -> dist/one-grid-artifact.html (fragmento para publicar como Artifact)

Tudo (CSS, JS, fontes e imagens) vira base64 embutido — o arquivo funciona
offline, sem servidor e sem pasta de assets ao lado.
"""
import base64
import io
import mimetypes
import os
import re
import sys

from PIL import Image
from fontTools import subset

# Tudo é embutido em base64, o que infla os binários em ~33%. Por isso há dois
# perfis: o arquivo autônomo mantém qualidade cheia; o fragmento do Artifact é
# comprimido para caber no limite de compartilhamento da plataforma.
PERFIL_CHEIO = {"quality": 86, "max_w": None}
PERFIL_LEVE = {"quality": 52, "max_w": 880}
PERFIL = PERFIL_CHEIO   # trocado em build()

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")


def data_uri(rel_path):
    path = os.path.join(ROOT, rel_path.replace("/", os.sep))
    mime = mimetypes.guess_type(path)[0] or "application/octet-stream"
    if path.endswith(".woff2"):
        mime = "font/woff2"
    if path.endswith(".svg"):
        mime = "image/svg+xml"

    if path.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        im = Image.open(path)
        max_w = PERFIL["max_w"]
        if max_w and im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=PERFIL["quality"], method=6)
        return "data:image/webp;base64,%s" % base64.b64encode(buf.getvalue()).decode()

    if path.endswith(".woff2") and PERFIL is PERFIL_LEVE:
        return "data:font/woff2;base64,%s" % base64.b64encode(subset_font(path)).decode()

    with open(path, "rb") as fh:
        return "data:%s;base64,%s" % (mime, base64.b64encode(fh.read()).decode())


_CHARS = None


def caracteres_usados():
    """Todos os caracteres que aparecem no site, nos dois idiomas."""
    global _CHARS
    if _CHARS is None:
        txt = read("index.html") + read("assets/js/i18n.js")
        achados = set(re.sub(r"<[^>]+>", " ", txt))
        achados |= set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
                       "abcdefghijklmnopqrstuvwxyz")
        _CHARS = "".join(sorted(c for c in achados if ord(c) > 31))
    return _CHARS


def subset_font(path):
    """Mantém na fonte só os caracteres que o site realmente usa."""
    out = io.BytesIO()
    opts = subset.Options(flavor="woff2",
                          layout_features=["kern", "liga", "ccmp", "locl"],
                          notdef_outline=True)
    font = subset.load_font(path, opts)
    sub = subset.Subsetter(options=opts)
    sub.populate(text=caracteres_usados())
    sub.subset(font)
    subset.save_font(font, out, opts)
    return out.getvalue()


def read(rel_path):
    with open(os.path.join(ROOT, rel_path.replace("/", os.sep)), encoding="utf-8") as fh:
        return fh.read()


def build(as_artifact=False):
    global PERFIL
    PERFIL = PERFIL_LEVE if as_artifact else PERFIL_CHEIO
    html = read("index.html")

    # CSS + fontes embutidas
    css = read("assets/css/style.css")
    css = re.sub(
        r'url\("\.\./fonts/([^"]+)"\)',
        lambda m: 'url("%s")' % data_uri("assets/fonts/" + m.group(1)),
        css,
    )
    html = html.replace(
        '<link rel="stylesheet" href="assets/css/style.css">',
        "<style>\n%s\n</style>" % css,
    )

    # JS embutido
    js = read("assets/js/i18n.js") + "\n\n" + read("assets/js/app.js")
    html = html.replace(
        '<script src="assets/js/i18n.js"></script>\n<script src="assets/js/app.js"></script>',
        "<script>\n%s\n</script>" % js,
    )

    # Imagens e logos embutidos
    def sub_asset(match):
        attr, path = match.group(1), match.group(2)
        return '%s="%s"' % (attr, data_uri(path))

    html = re.sub(r'(src|href)="(assets/(?:img|logo)/[^"]+)"', sub_asset, html)

    os.makedirs(DIST, exist_ok=True)

    if as_artifact:
        # O Artifact injeta <!doctype>, <html>, <head> e <body> — mandamos só o conteúdo.
        head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
        body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
        # Nome curto para a galeria de Artifacts (o <title> longo do site é para SEO)
        style = re.search(r"<style>.*?</style>", head, re.S).group(0)
        out = "<title>One Grid Formula</title>\n%s\n%s" % (style, body)
        name = "one-grid-artifact.html"
    else:
        out = html
        name = "one-grid-single.html"

    path = os.path.join(DIST, name)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(out)
    print("%s  —  %.1f MB" % (path, os.path.getsize(path) / 1024 / 1024))


if __name__ == "__main__":
    build(as_artifact=("artifact" in sys.argv))
