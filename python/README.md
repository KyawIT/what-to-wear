# Python Module - What to Wear

### Git LFS installieren

**Windows (cmd):**
```cmd
choco install git-lfs
```
Oder manuell von https://git-lfs.com/ herunterladen.

**macOS:**
```bash
brew install git-lfs
```

**Linux:**
```bash
sudo apt install git-lfs
```

## Dataset Struktur

### dataset.csv Format

```csv
image_id,category,tags,color,style
dress_001.jpg,dresses,"[casual, summer]",blue,"casual"
shirt_042.jpg,shirts,"[formal, office]",white,"formal"
pants_123.jpg,pants,"[office, formal]",black,"formal"
```

## Qdrant Indexing

### Parameter Erklärung

| Parameter | Beschreibung | Default |
|-----------|-------------|---------|```

**Nächster Schritt:** Nach dem Predict können die erkannten Kategorie und Tags zum Hochladen des Items mit dem `/wearables/upload` Endpoint verwendet werden.

---
| `--csv-path` | Path zur `dataset.csv` mit Bild-Metadaten | Erforderlich |
| `--images-path` | Path zum Bilder-Ordner | Erforderlich |
| `--collection-name` | Name der Qdrant Collection | `wearables` |
| `--qdrant-host` | Qdrant Host (Docker: `wtw-qdrant`) | `localhost` |
| `--qdrant-port` | Qdrant Port | `6333` |
| `--batch-size` | Anzahl Bilder pro Batch | `32` |
| `--recreate` | Collection löschen & neu erstellen | `False` |


**Indexing starten:**

Windows:
```cmd
docker-compose exec wtw-embeddings python /app/scripts/qdrant_indexer.py --csv-path /data/input/dataset.csv --images-path /data/input/images --collection-name wearables --qdrant-host wtw-qdrant --qdrant-port 6333 --recreate
```

macOS/Linux:
```bash
docker-compose exec wtw-embeddings python /app/scripts/qdrant_indexer.py --csv-path /data/input/dataset.csv --images-path /data/input/images --collection-name wearables --qdrant-host wtw-qdrant --qdrant-port 6333 --recreate
```

### Output Beispiel

```
Initializing image embedder with model: clip-ViT-B-32
Embedding dimension: 512
Reading dataset from preprocessed_dataset/dataset.csv
Found 1,234 images to index
Indexing progress: 100%|███████| 1234/1234 [5:32<00:00, 3.7 images/s]
Indexed 1,234 wearables into Qdrant collection 'wearables'
```

---

## API Endpoints

Das Python Backend läuft auf `http://localhost:8084` und bietet folgende Endpoints:

**Hinweis zu item_id:** Die `id/item_id` in wearables sollte die **MinIO Image ID** sein (oder der Dateiname aus MinIO). Dies ermöglicht es, die Bilder später wieder zu finden.

### 1. **UPLOAD** - Neues Wearable hochladen

**Endpoint:**
```
POST /wearables/upload
```

**Parameter (Form-Data):**
| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `file` | File | Image-Datei (JPG, PNG, etc.) |
| `user_id` | String | Benutzer-ID (z.B. "test") |
| `item_id` | String | Eindeutige Item-ID (z.B. "test-black-shoes") |
| `category` | String | Kategorie (SHOES, BOTTOM, TOP, ACCESSORY) |
| `tags` | String | Komma-separierte Tags (z.B. "casual,black,leather") |

**Response (200 OK):**
```json
{
  "item_id": "test-black-shoes",
  "category": "SHOES",
  "tags": ["casual", "black", "leather"],
  "user_id": "test"
}
```

### 2. **UPDATE (PUT)** - Tags/Category ändern

**Endpoint:**
```
PUT /wearables/update
```

**Body (JSON):**
```json
{
  "user_id": "test",
  "item_id": "test-black-shoes",
  "category": "SHOES",
  "tags": "formal,black,leather"
}
```

**Response (200 OK):**
```json
{
  "item_id": "test-black-shoes",
  "user_id": "test",
  "category": "SHOES",
  "tags": ["formal", "black", "leather"]
}
```

### 3. **DELETE** - Item als gelöscht markieren

**Endpoint:**
```
DELETE /wearables/delete
```

**Body (JSON):**
```json
{
  "user_id": "test",
  "item_id": "test-black-shoes"
}
```

**Response (200 OK):**
```json
{
  "item_id": "test-black-shoes",
  "user_id": "test",
  "deleted": true
}
```

### 4. **PREDICT** - Category & Tags vorhersagen

**Endpoint:**
```
POST /wearables/predict
```

**Parameter (Form-Data):**
| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `file` | File | Image-Datei zum Analysieren |

**Response (200 OK):**
```json
{
  "category": "SHOES",
  "tags": ["casual", "black", "leather"],
  "confidence": 0.87
}
```

**WICHTIG** Nach dem Predict und des Speichern des Kleidungsstück über den User das Items mit dem `/wearables/upload` Endpoint werden (mit den Tags und Kategorie die der User zusätzlich vergeben hat), damit es auch in der Qdrant Datenbank gespeichert ist..

---

## 5. **OUTFIT Endpoints** - Outfit generieren und kombinieren

### 5.1 Generate Outfits Simple - Einfache Outfit-Generierung ohne Bilder

**Endpoint:**
```
POST /outfit/generate_outfits_simple
```

**Body (JSON):**
```json
{
  "wearables": [
    {
      "id": "item-1",
      "category": "SHOES",
      "tags": ["casual", "black"]
    },
    {
      "id": "item-2",
      "category": "TOP",
      "tags": ["formal", "white"]
    },
    {
      "id": "item-3",
      "category": "BOTTOM",
      "tags": ["casual", "blue"]
    }
  ],
  "filterTags": ["casual"],
  "limitOutfits": 5
}
```

**Response (200 OK):**
```json
{
  "outfits": [
    {
      "outfit_id": "outfit-1",
      "wearables": ["item-1", "item-2", "item-3"],
      "tags": ["casual", "black", "white", "blue"]
    }
  ]
}
```

---

### 5.2 Generate Outfits - Outfit-Generierung mit Bildern

**Endpoint:**
```
POST /outfit/generate_outfits
```

**Parameter (Form-Data):**
| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `wearables` | JSON | Wearable Items als JSON Array |
| `filterTags` | String | Komma-separierte Filter-Tags (optional) |
| `limitOutfits` | Integer | Max Anzahl zu generierender Outfits (optional) |
| Image Files | File | Für jedes Wearable eine Datei mit Key `file_<item_id>` |

**Beispiel wearables JSON:**
```json
[
  {
    "id": "item-1",
    "file": "file_item-1",
    "category": "SHOES",
    "tags": ["casual", "black"]
  },
  {
    "id": "item-2",
    "file": "file_item-2",
    "category": "TOP",
    "tags": ["formal", "white"]
  }
]
```

**Response (200 OK):** Multipart form-data mit:
- **JSON Part** (`outfits`): Outfit-Metadaten
- **PNG Parts** (`outfit_1`, `outfit_2`, etc): Kombinierte Outfit-Bilder

JSON-Part Beispiel:
```json
{
  "outfits": [
    {
      "outfit_id": "outfit-1",
      "wearables": [
        {
          "id": "item-1",
          "category": "SHOES",
          "tags": ["casual", "black"]
        },
        {
          "id": "item-2",
          "category": "TOP",
          "tags": ["formal", "white"]
        }
      ],
      "image": "outfit_1"
    }
  ]
}
```

---

### 5.3 Upload/Outfit - Ein Outfit Hochladen

**Endpoint:**
```
POST /outfit/upload
```

**Parameter (Form-Data):**
| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `wearables` | JSON | Items zum kombinieren mit "id", "category", "tags", "file" |
| Image Files | File | Für jedes Item eine Datei mit Key `file_<item_id>` |

**Canvas Limits (automatisch angewendet):**
- **Max 4 Shoes** (horizontal nebeneinander)
- **Max 4 Bottoms** (horizontal nebeneinander)
- **Max 4 Tops** (horizontal nebeneinander)
- **Max 6 Accessories** (horizontal nebeneinander)

**Beispiel wearables JSON:**
```json
[
  {
    "id": "shoe-1",
    "file": "file_shoe-1",
    "category": "SHOES",
    "tags": ["black", "casual"]
  },
  {
    "id": "bottom-1",
    "file": "file_bottom-1",
    "category": "BOTTOM",
    "tags": ["blue", "casual"]
  },
  {
    "id": "top-1",
    "file": "file_top-1",
    "category": "TOP",
    "tags": ["white", "formal"]
  },
  {
    "id": "top-2",
    "file": "file_top-2",
    "category": "TOP",
    "tags": ["red", "casual"]
  },
  {
    "id": "acc-1",
    "file": "file_acc-1",
    "category": "BELT",
    "tags": ["gold"]
  }
]
```

**Response (200 OK):** Multipart form-data mit:
- **JSON Part** (`outfit`): Outfit-Metadaten mit Warnings
- **PNG Part** (`image`): Kombiniertes Outfit-Bild

JSON-Part Beispiel:
```json
{
  "id": "outfit-combined",
  "wearables": [
    {
      "id": "shoe-1",
      "category": "SHOES",
      "tags": ["black", "casual"]
    },
    {
      "id": "bottom-1",
      "category": "BOTTOM",
      "tags": ["blue", "casual"]
    },
    {
      "id": "top-1",
      "category": "TOP",
      "tags": ["white", "formal"]
    }
  ],
  "image": "outfit.png",
  "warnings": [
    "Only 4 tops used, max 4 tops allowed (received 6)"
  ]
}
```

Dateien im Multipart:
- `outfit`: JSON (siehe oben)
- `image`: outfit.png (PNG-Bild)

---

### 5.4 AI Outfit - KI-gestützte Outfit-Vorschlag zu einem Bild

**Endpoint:**
```
POST /outfit/ai
```

**Beschreibung:** 
Das Neuronale Netz analysiert das hochgeladene Bild und schlägt passende Wearables vor, die zum abgebildeten Style/Kleidung passen die der User besitzt. Der Endpoint gibt die IDs der vorgeschlagenen Items zurück.

**Parameter (Form-Data):**
| Parameter | Typ | Beschreibung |
|-----------|-----|-------------|
| `user_id` | String | Benutzer-ID |
| `image` | File | Input-Bild zum Analysieren (PNG/JPG) |

**Response (200 OK):**
```json
{
  "user_id": "test-user",
  "item_ids": [
    "item-black-shoes",
    "item-blue-jeans", 
    "item-white-shirt",
    "item-gold-belt"
  ]
}
```

**Nächster Schritt - Outfit Upload:**  
Mit den zurückgegebenen `item_ids` die Bilder aus MinIO fetchen und anschließend den `/outfit/upload` Endpoint aufrufen mit den echten Item-Daten: