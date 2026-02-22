# What to Wear - Python Service Documentation

## 1. Purpose

This Python project provides AI-powered backend capabilities for the "What to Wear" app:

- Wearable image embedding and vector search
- Metadata prediction (`category`, `tags`) from an uploaded image
- Wearable lifecycle operations (`upload`, `update`, `delete`)
- Outfit generation from user wearables
- AI-assisted outfit item suggestions based on an uploaded reference image
- Outfit image composition for preview/export

The service is implemented with **FastAPI** and uses **Qdrant** as vector database.

## 2. Project Structure

- `core/`: Main API service and business logic
- `core/app.py`: FastAPI entrypoint, startup wiring, dependency injection
- `core/routers/`: HTTP endpoints
- `core/service/`: Outfit generation, AI outfit suggestion, image composition
- `core/repositories/`: Qdrant access layer
- `core/models/`: Domain entities
- `core/dto/`: Response/request DTOs
- `core/utils/`: Embedding utilities
- `embedding/`: Offline indexing assets and scripts for dataset-to-Qdrant loading
- `preprocessed_dataset/`: Local dataset artifacts

## 3. Runtime Architecture

### Startup flow (`core/app.py`)

At startup, the service:

1. Loads the embedding model (`clip-ViT-B-32` by default)
2. Connects to Qdrant (`QDRANT_HOST`, `QDRANT_PORT`)
3. Creates and injects shared services:
   - `WearableRepository`
   - `OutfitGenerator`
   - `OutfitCombiner`
   - `AIOutfitService`
4. Injects dependencies into routers

### Data flow

1. Client uploads image or metadata via FastAPI endpoint
2. Service creates image embeddings using SentenceTransformers
3. Repository reads/writes vectors and metadata in Qdrant
4. Endpoint returns JSON or multipart response to frontend/backend caller

## 4. API Endpoints

Base URL examples assume local run.

### Health

- `GET /health`
  - Basic health check and service availability

### Wearables

- `POST /wearables/upload`
  - Upload image + metadata
  - Stores vector + payload in Qdrant

- `PUT /wearables/update`
  - Updates existing wearable metadata

- `DELETE /wearables/delete`
  - Soft-delete (sets `deleted=true` in payload)

- `POST /wearables/predict`
  - Predicts `category`, `tags`, and confidence from image similarity

### Outfit

- `POST /outfit/generate_outfits_simple`
  - JSON-only outfit generation

- `POST /outfit/generate_outfits`
  - Multipart request with wearable metadata + wearable images
  - Returns multipart response containing JSON + generated outfit PNGs

- `POST /outfit/upload`
  - Combines provided wearable images into one outfit preview image
  - Returns multipart response with JSON + single PNG

- `POST /outfit/ai`
  - AI-based item recommendation from an uploaded image and `user_id`
  - Returns `item_ids` from that user's stored wearables
  - Uses vector similarity + category-aware selection (TOP/BOTTOM/SHOES priority)

## 5. AI Outfit Suggestion Logic

`AIOutfitService` now performs real inference flow:

1. Validates service readiness (embedder + repository)
2. Embeds uploaded image
3. Queries Qdrant with user filter (`user_id`) and excludes soft-deleted items
4. Selects balanced suggestions:
   - prioritize one `TOP`, one `BOTTOM`, one `SHOES` if available
   - fill remaining slots by similarity score
5. Returns `AIOutfitResponse { user_id, item_ids }`

This makes `/outfit/ai` usable even without a separate training pipeline.

## 6. Environment Variables

Main runtime variables:

- `QDRANT_HOST` (default: `wtw-qdrant`)
- `QDRANT_PORT` (default: `6333`)
- `QDRANT_COLLECTION` (default: `wearables`)
- `MODEL_NAME` (default: `clip-ViT-B-32`)

## 7. Local Development

## Install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r core/requirements.txt
```

## Run API

```bash
uvicorn core.app:app --reload --host 0.0.0.0 --port 8084
```

## Run tests

```bash
pytest core/tests -q
```

## 8. Indexing Dataset into Qdrant

Use the script in `embedding/scripts/qdrant_indexer.py` to pre-load vectors from dataset images and metadata.

Typical usage:

```bash
python embedding/scripts/qdrant_indexer.py --help
```

or inside Docker compose according to your environment setup.

## 9. Troubleshooting

- `503 Service not initialized`
  - Startup dependency injection failed, or service crashed while loading model.

- `503 AI outfit service is not ready yet`
  - Embedder/repository not injected correctly, or startup did not complete.

- Empty `/outfit/ai` result (`item_ids: []`)
  - No similar items found for this user in Qdrant, or all candidates are deleted.

- Slow startup
  - Initial model download/loading for SentenceTransformers can take time.

- Qdrant errors
  - Verify `QDRANT_HOST`, `QDRANT_PORT`, and container/network reachability.

## 10. Notes for Integration

- Store uploaded wearables for each user before relying on `/outfit/ai`.
- Use returned `item_ids` to fetch original wearable images from MinIO/backend.
- Pass those images into `/outfit/upload` for composed outfit previews.
