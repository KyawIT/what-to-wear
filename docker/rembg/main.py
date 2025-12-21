import io
import os

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from rembg import new_session, remove

app = FastAPI(title="wtw-rembg")

MODEL = os.getenv("REMBG_MODEL", "u2net")
SESSION = new_session(MODEL)


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL}


@app.post("/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload must be an image file")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty upload")

    try:
        img = Image.open(io.BytesIO(data))
        img = img.convert("RGBA")
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="Unsupported or corrupted image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read image: {str(e)}")

    try:
        out = remove(img, session=SESSION)

        # rembg may return bytes or a PIL image depending on version/input
        if isinstance(out, (bytes, bytearray)):
            png_bytes = bytes(out)
        else:
            buf = io.BytesIO()
            out.save(buf, format="PNG")
            png_bytes = buf.getvalue()

        return Response(content=png_bytes, media_type="image/png")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"rembg failed: {str(e)}")
