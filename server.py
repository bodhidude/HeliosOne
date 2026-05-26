import os
import json
import logging
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import aisuite as ai
import httpx

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("helios-backend")

app = FastAPI(
    title="HELIOS-1 AI Analyst Service",
    description="A multi-provider LLM summary proxy using Andrew Ng's aisuite.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure OPENAI_API_KEY is configured as a dummy value if using Ollama
if "OPENAI_API_KEY" not in os.environ:
    os.environ["OPENAI_API_KEY"] = "ollama"

# Initialize aisuite client
client = ai.Client()

class SummaryRequest(BaseModel):
    telemetry: Dict[str, Any]
    provider: Optional[str] = None
    model: Optional[str] = None

@app.get("/api/status")
async def get_status():
    """
    Checks the status of the local Ollama service and lists available models,
    as well as returning the active LLM configurations.
    """
    ollama_url = "http://127.0.0.1:11434/api/tags"
    ollama_status = "OFFLINE"
    available_models = []
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as http_client:
            response = await http_client.get(ollama_url)
            if response.status_code == 200:
                ollama_status = "ONLINE"
                data = response.json()
                available_models = [m.get("name") for m in data.get("models", [])]
    except Exception as e:
        logger.warning(f"Failed to reach Ollama at {ollama_url}: {e}")

    default_provider = os.getenv("LLM_PROVIDER", "ollama")
    default_model = os.getenv("LLM_MODEL", "gemma4:e4b")

    # Get other keys status (obscured for safety)
    keys_status = {
        "gemini": "CONFIGURED" if os.getenv("GEMINI_API_KEY") else "MISSING",
        "openai": "CONFIGURED" if (os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_API_KEY") != "ollama") else "MISSING",
        "anthropic": "CONFIGURED" if os.getenv("ANTHROPIC_API_KEY") not in [None, "not-set"] else "MISSING"
    }

    return {
        "status": "ONLINE",
        "ollama": {
            "status": ollama_status,
            "host": "127.0.0.1:11434",
            "available_models": available_models
        },
        "config": {
            "default_provider": default_provider,
            "default_model": default_model
        },
        "providers_keys": keys_status
    }

@app.post("/api/summary")
async def generate_summary(payload: SummaryRequest):
    """
    Generates a space weather summary using aisuite.
    """
    # Determine which provider and model to use
    provider = payload.provider or os.getenv("LLM_PROVIDER", "ollama")
    model_name = payload.model or os.getenv("LLM_MODEL", "gemma4:e4b")
    
    # Construct the full model string required by aisuite (provider:model)
    full_model_str = f"{provider}:{model_name}"
    
    logger.info(f"Generating summary using LLM: {full_model_str}")
    
    # Replicate telemetry payload extraction logic from client-side code
    telemetry = payload.telemetry
    
    # Format Kp, wind speed, Bz, proton flux, f107 flux
    payload_str = json.dumps(telemetry, indent=2)
    
    # Format the same system prompt
    system_prompt = (
        "You are the HELIOS-1 AI Analyst. Provide a professional, concise 3-sentence summary of the current space weather. "
        "Use a calm 'NASA Mission Control' tone. Focus on the relationship between the measurements (e.g., how wind speed is "
        "affecting the Kp index). If Kp > 4 or Proton Flux is elevated, start with a bold 'CONDITIONAL ALERT'."
    )
    
    user_prompt = f"Dashboard Data: {payload_str}\n\nSummary:"
    
    # Configure provider specific settings if needed
    # For Ollama, the model endpoint needs to know where it is running.
    # aisuite's openai adapter automatically uses the standard localhost:11434 endpoint if provider is ollama.
    # If the provider is gemini, aisuite wraps google-genai, which expects GEMINI_API_KEY. We copy the VITE one to GEMINI_API_KEY.
    if provider == "gemini":
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
        if gemini_key:
            os.environ["GEMINI_API_KEY"] = gemini_key

    try:
        response = client.chat.completions.create(
            model=full_model_str,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7
        )
        
        summary_text = response.choices[0].message.content
        logger.info("Summary successfully generated.")
        return {"summary": summary_text, "model_used": full_model_str}
        
    except Exception as e:
        logger.error(f"Summary generation failed for {full_model_str}: {e}")
        
        # Friendly troubleshooting instructions in case model is missing or ollama is offline
        err_msg = str(e)
        if provider == "ollama":
            raise HTTPException(
                status_code=503,
                detail=(
                    f"HELIOS-AI telemetry offline. Local Ollama server returned an error: '{err_msg}'. "
                    f"Please make sure Ollama is running and you have pulled the model '{model_name}' "
                    f"using: 'ollama pull {model_name}'"
                )
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"HELIOS-AI generation failed: {err_msg}"
            )

if __name__ == "__main__":
    import uvicorn
    # Read host and port from env or default to localhost:8000
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", 8000))
    logger.info(f"Starting HELIOS-1 backend server at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
