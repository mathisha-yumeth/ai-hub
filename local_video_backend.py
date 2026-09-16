"""
Local Video Generation API Service
Runs on Windows with CUDA / DirectML or CPU.
Compatible with Local Ollama Studio.
Endpoints:
  GET  /health
  POST /generate_video (image-to-video using SVD / AnimateDiff / Wan)
"""

import io
import os
import base64
import tempfile
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Local Video Studio Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None

def get_pipeline():
    global pipeline
    if pipeline is None:
        try:
            import torch
            from diffusers import StableVideoDiffusionPipeline
            print("Loading Stable Video Diffusion pipeline (stabilityai/stable-video-diffusion-img2vid-xt)...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            dtype = torch.float16 if device == "cuda" else torch.float32
            pipeline = StableVideoDiffusionPipeline.from_pretrained(
                "stabilityai/stable-video-diffusion-img2vid-xt",
                torch_dtype=dtype,
                variant="fp16" if device == "cuda" else None
            )
            pipeline.enable_model_cpu_offload() if device == "cuda" else pipeline.to(device)
            print("Pipeline loaded successfully on", device)
        except Exception as e:
            print(f"Failed to load diffusers pipeline: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    return pipeline

class VideoRequest(BaseModel):
    image_base64: Optional[str] = None
    prompt: Optional[str] = "Cinematic slow motion camera panning"
    num_frames: int = 14
    fps: int = 7
    motion_bucket_id: int = 127
    decode_chunk_size: int = 8
    seed: Optional[int] = None

@app.get("/health")
def health():
    import torch
    cuda_available = torch.cuda.is_available() if "torch" in globals() else False
    return {
        "status": "ready",
        "service": "Local Video Studio",
        "cuda": cuda_available,
        "device": "cuda" if cuda_available else "cpu"
    }

@app.post("/generate_video")
def generate_video(req: VideoRequest):
    try:
        from PIL import Image
        import imageio
        import numpy as np

        pipe = get_pipeline()
        
        if req.image_base64:
            clean_b64 = req.image_base64.split(",")[-1]
            img_data = base64.b64decode(clean_b64)
            image = Image.open(io.BytesIO(img_data)).convert("RGB")
            image = image.resize((1024, 576))
        else:
            # Fallback blank base image with text
            image = Image.new("RGB", (1024, 576), color=(30, 30, 40))

        generator = None
        if req.seed is not None:
            import torch
            generator = torch.manual_seed(req.seed)

        frames = pipe(
            image,
            num_frames=req.num_frames,
            decode_chunk_size=req.decode_chunk_size,
            motion_bucket_id=req.motion_bucket_id,
            generator=generator
        ).frames[0]

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
            temp_path = tmp_file.name
        
        imageio.mimsave(temp_path, [np.array(f) for f in frames], fps=req.fps, format="mp4")

        with open(temp_path, "rb") as f:
            video_bytes = f.read()
        os.remove(temp_path)

        b64_video = base64.b64encode(video_bytes).decode("utf-8")
        return {
            "success": True,
            "video_base64": f"data:video/mp4;base64,{b64_video}",
            "frames": len(frames),
            "fps": req.fps
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Local Video Generation Service on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
