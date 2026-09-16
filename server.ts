import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Basic Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint status checker
app.post("/api/check-endpoints", async (req, res) => {
  const ollamaUrl = req.body.ollamaUrl || "http://127.0.0.1:11434";
  const videoUrl = req.body.videoUrl || "http://127.0.0.1:8000";
  const comfyUrl = req.body.comfyUrl || "http://127.0.0.1:8188";
  const sdUrl = req.body.sdUrl || "http://127.0.0.1:7860";

  const check = async (url: string, path = "") => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    try {
      const response = await fetch(`${url}${path}`, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(id);
      return { online: response.ok || response.status < 500, status: response.status };
    } catch {
      clearTimeout(id);
      return { online: false, status: 0 };
    }
  };

  const [ollama, video, comfy, sd] = await Promise.all([
    check(ollamaUrl, "/api/tags"),
    check(videoUrl, "/health"),
    check(comfyUrl, "/system_stats"),
    check(sdUrl, "/sdapi/v1/sd-models"),
  ]);

  res.json({
    ollama: { ...ollama, url: ollamaUrl },
    video: { ...video, url: videoUrl },
    comfy: { ...comfy, url: comfyUrl },
    sd: { ...sd, url: sdUrl },
  });
});

// Download Windows Launchers
app.get("/api/download-launcher", (_req, res) => {
  const filePath = path.join(process.cwd(), "run_ollama_studio.bat");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "run_ollama_studio.bat");
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/api/download-video-launcher", (_req, res) => {
  const filePath = path.join(process.cwd(), "start_video_backend.bat");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "start_video_backend.bat");
  } else {
    res.status(404).send("File not found");
  }
});

app.get("/api/download-video-python", (_req, res) => {
  const filePath = path.join(process.cwd(), "local_video_backend.py");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "local_video_backend.py");
  } else {
    res.status(404).send("File not found");
  }
});

// Ollama API Proxy (Handles CORS, streaming, and model commands)
app.all("/api/ollama/*", async (req, res) => {
  const targetPath = req.originalUrl.replace(/^\/api\/ollama/, "");
  const customHost = (req.headers["x-ollama-host"] as string) || "http://127.0.0.1:11434";
  const targetUrl = `${customHost.replace(/\/$/, "")}${targetPath}`;

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Set response headers
    res.status(response.status);
    const contentType = response.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    // Stream body if available
    if (response.body) {
      // Pipe stream
      const reader = response.body.getReader();
      const pump = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
        res.end();
      };
      await pump();
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error(`Error proxying to Ollama at ${targetUrl}:`, err.message);
    res.status(503).json({
      error: "Could not connect to local Ollama service",
      details: err.message,
      targetUrl,
      help: "Ensure Ollama is running on your Windows machine ('ollama serve' or launch run_ollama_studio.bat)",
    });
  }
});

// Local Video Generation Proxy (FastAPI or ComfyUI bridge)
app.post("/api/video/generate", async (req, res) => {
  const videoServiceUrl = (req.headers["x-video-host"] as string) || "http://127.0.0.1:8000";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for video frame gen

    const response = await fetch(`${videoServiceUrl}/generate_video`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(503).json({
      error: "Local video generation service is not reachable",
      details: err.message,
      videoServiceUrl,
      instruction: "Run 'start_video_backend.bat' on your Windows machine to start the local SVD / Wan video server on port 8000.",
    });
  }
});

// Setup Vite / Static handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Local Ollama Studio server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
