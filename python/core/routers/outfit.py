"""Outfit generation endpoint."""
from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Request
from fastapi.responses import FileResponse, Response
from typing import Dict, Optional, List
import io
import logging
import json
import uuid
from PIL import Image

from dto import GenerateOutfitsSimpleResponse, GenerateOutfitsResponse, UploadOutfitResponse

router = APIRouter()
logger = logging.getLogger(__name__)

# Will be injected by app.py
outfit_generator = None
outfit_combiner = None
wearable_repository = None


@router.post("/outfit/generate_outfits_simple", response_model=GenerateOutfitsSimpleResponse)
async def generate_outfits_simple(request: dict):
    """
    Generate outfits from wearables (JSON only).
    
    Args:
        request: JSON body with wearables, filterTags, limitOutfits
    
    Returns:
        JSON response with generated outfits
    """
    if outfit_generator is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        wearables = request.get("wearables", [])
        filter_tags = request.get("filterTags")
        limit_outfits = request.get("limitOutfits")
        
        result = outfit_generator.generate(
            wearables=wearables,
            filter_tags=filter_tags,
            limit_outfits=limit_outfits,
        )
        
        return GenerateOutfitsSimpleResponse(outfits=result.outfits)
    
    except ValueError as e:
        # Filter requirements not met
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outfit generation failed: {str(e)}")


@router.post("/outfit/generate_outfits")
async def generate_outfits(
    request: Request
):
    """
    Generate outfits from wearables with images.
    
    Expects multipart form data with:
    - wearables: JSON string [{item_id, category, tags, file}, ...]
    - filterTags: Comma-separated tags (optional)
    - limitOutfits: Number (optional, default 5)
    - Various image files matching the "file" names in wearables
    
    Returns:
        Multipart response with:
        - JSON part containing outfits metadata (items array + image name)
        - PNG parts for each outfit image (outfit_0.png, outfit_1.png, etc)
    """
    if outfit_generator is None or outfit_combiner is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Parse multipart form data
        form_data = await request.form()
        
        # Get wearables JSON
        wearables_json = form_data.get("wearables")
        if not wearables_json:
            raise HTTPException(status_code=400, detail="Missing wearables JSON")
        
        parsed_json = json.loads(wearables_json)
        # Handle both direct array and wrapped {wearables: [...]} format
        if isinstance(parsed_json, dict) and "wearables" in parsed_json:
            wearables_list = parsed_json["wearables"]
        elif isinstance(parsed_json, list):
            wearables_list = parsed_json
        else:
            raise HTTPException(status_code=400, detail="Invalid wearables format")
        logger.info(f"Loaded {len(wearables_list)} wearables")
        
        # Parse optional parameters
        filter_tags_str = form_data.get("filterTags")
        tags_list = None
        if filter_tags_str:
            tags_list = [t.strip() for t in filter_tags_str.split(",")]
        
        limit_outfits = int(form_data.get("limitOutfits", 5))
        
        # Load image files for each wearable
        wearable_images = {}  # Maps item_id -> bytes
        for wearable in wearables_list:
            file_key = wearable.get("file")
            if file_key and file_key in form_data:
                file_obj = form_data[file_key]
                if hasattr(file_obj, 'read'):
                    image_bytes = await file_obj.read()
                    wearable_images[wearable["item_id"]] = image_bytes
                    logger.debug(f"Loaded image for {wearable['item_id']}")
        
        logger.info(f"Loaded {len(wearable_images)} image files")
        
        # Convert wearables format for outfit generator
        # Remove 'file' key and use 'id' instead of 'item_id'
        converted_wearables = [
            {
                "id": w["item_id"],
                "category": w["category"],
                "tags": w.get("tags", [])
            }
            for w in wearables_list
        ]
        
        # Generate outfits
        logger.info(f"Generating {limit_outfits} outfits from {len(converted_wearables)} wearables")
        result = outfit_generator.generate(
            wearables=converted_wearables,
            filter_tags=tags_list,
            limit_outfits=limit_outfits
        )
        
        # For each outfit, combine images and collect outfit metadata + images
        outfits_with_images = []
        outfit_images_bytes = []
        image_idx_counter = 0  # Track actual images added
        
        for outfit_idx, outfit in enumerate(result.outfits):
            logger.info(f"Processing outfit {outfit_idx + 1}/{len(result.outfits)}")
            
            # Group outfit items by main category
            outfit_images = {
                'shoes': None,
                'bottom': None,
                'tops': [],                     # ALL tops for side-by-side display
                'accessories': {}               # Dict: sub-category -> image_bytes (deduplicated)
            }
            
            # Map items to categories based on mappedPath
            items_with_images = 0
            for item in outfit.wearables:
                if not item.mappedPath:
                    logger.warning(f"Item {item.id} has no mappedPath")
                    continue
                
                # Get image bytes for this item
                image_bytes = wearable_images.get(item.id)
                if not image_bytes:
                    logger.warning(f"No image found for item {item.id}")
                    continue
                
                items_with_images += 1
                # Extract main category and sub-category from mappedPath
                # Examples:
                # "TOP.SHIRT" -> main="TOP", sub="SHIRT"
                # "ACCESSORY.BAG.BACKPACK" -> main="ACCESSORY", sub="BACKPACK" (most specific)
                # "ACCESSORY.GENERAL.SCARF" -> main="ACCESSORY", sub="SCARF" (most specific)
                path_parts = item.mappedPath.split('.')
                main_category = path_parts[0].upper()
                # Use the LAST part as sub_category (most specific)
                sub_category = path_parts[-1] if len(path_parts) > 1 else None
                
                # Assign to main category
                if main_category == 'SHOES' and not outfit_images['shoes']:
                    outfit_images['shoes'] = image_bytes
                    logger.debug(f"Added shoes: {item.id}")
                elif main_category == 'BOTTOM' and not outfit_images['bottom']:
                    outfit_images['bottom'] = image_bytes
                    logger.debug(f"Added bottom: {item.id}")
                elif main_category == 'TOP':
                    # Collect ALL tops for side-by-side display
                    outfit_images['tops'].append(image_bytes)
                    logger.debug(f"Added top: {item.id} ({sub_category})")
                elif main_category == 'ACCESSORY':
                    # Only one accessory per sub-category (e.g., only 1 BAG, 1 HEAD, etc.)
                    if sub_category and sub_category not in outfit_images['accessories']:
                        outfit_images['accessories'][sub_category] = image_bytes
                        logger.debug(f"Added accessory: {item.id} ({sub_category})")
                    elif not sub_category:
                        # Fallback if no sub-category
                        if 'OTHER' not in outfit_images['accessories']:
                            outfit_images['accessories']['OTHER'] = image_bytes
                            logger.debug(f"Added accessory: {item.id} (OTHER)")
            
            logger.info(f"Outfit {outfit_idx}: Found images for {items_with_images} items")
            logger.info(f"Outfit {outfit_idx}: shoes={outfit_images['shoes'] is not None}, bottom={outfit_images['bottom'] is not None}, tops={len(outfit_images['tops'])}, accessories={len(outfit_images['accessories'])} dedup'd types")
            
            # Convert accessories dict values to list
            accessory_bytes_list = list(outfit_images['accessories'].values())
            
            # **IMPORTANT**: Build JSON with DEDUPLICATED accessories
            # Only ONE item per category (e.g., only 1 belt, 1 scarf, 1 hat)
            # Use the original category name as dedup key, not mappedPath
            used_accessory_categories = set()
            
            # Map back to item IDs for the shoes/bottom/tops categories we selected
            # Also set size multipliers for visualization
            selected_wearables = []
            
            # Add shoes (if selected) - BIGGER (1.2x)
            shoe_item = None
            for item in outfit.wearables:
                if item.mappedPath and item.mappedPath.split('.')[0].upper() == 'SHOES' and outfit_images['shoes']:
                    shoe_item = item
                    # Set size multiplier for shoes (20% larger)
                    item.size = 1.2
                    selected_wearables.append(item)
                    break
            
            # Add bottom (if selected) - NORMAL (1.0x)
            bottom_item = None
            for item in outfit.wearables:
                if item.mappedPath and item.mappedPath.split('.')[0].upper() == 'BOTTOM' and outfit_images['bottom']:
                    bottom_item = item
                    item.size = 1.0
                    selected_wearables.append(item)
                    break
            
            # Add tops (all that were collected) - NORMAL (1.0x)
            for item in outfit.wearables:
                if item.mappedPath and item.mappedPath.split('.')[0].upper() == 'TOP':
                    item.size = 1.0
                    selected_wearables.append(item)
            
            # Add accessories (only one per category, max 5 total) - SMALLER (0.75x)
            # Use original category name (e.g., "belt", "scarf", "hat") as dedup key
            accessory_count = 0
            max_accessories = 5
            for item in outfit.wearables:
                if item.mappedPath and item.mappedPath.split('.')[0].upper() == 'ACCESSORY':
                    # Use the original category as dedup key, not mappedPath
                    item_category = item.category.lower()
                    
                    # Only add if we haven't seen this category yet and haven't hit max
                    if item_category not in used_accessory_categories and accessory_count < max_accessories:
                        # Set size multiplier for accessories (25% smaller)
                        item.size = 0.75
                        selected_wearables.append(item)
                        used_accessory_categories.add(item_category)
                        accessory_count += 1
            
            # Prepare outfit dict with DEDUPLICATED wearables and size information
            outfit_dict = outfit.to_dict()
            outfit_dict['wearables'] = [item.to_dict() for item in selected_wearables]
            
            # Combine outfit images
            combined_bytes = await outfit_combiner.combine_outfit(
                shoes_bytes=outfit_images['shoes'],
                bottom_bytes=outfit_images['bottom'],
                tops_bytes_list=outfit_images['tops'],       # ALL tops for side-by-side
                accessory_bytes_list=accessory_bytes_list   # Deduplicated accessories
            )
            
            logger.info(f"combine_outfit returned: {type(combined_bytes)} ({len(combined_bytes) if combined_bytes else 0} bytes)")
            
            # Store image bytes and update image reference if successful
            if combined_bytes:
                logger.info(f"Outfit {outfit_idx}: Successfully combined image ({len(combined_bytes)} bytes)")
                outfit_images_bytes.append(combined_bytes)
                outfit_dict["image"] = f"outfit_{image_idx_counter + 1}"  # Reference to multipart file (1-indexed)
                image_idx_counter += 1
            else:
                logger.error(f"Outfit {outfit_idx}: Failed to combine image")
                outfit_dict["image"] = None  # No image for this outfit
            
            outfits_with_images.append(outfit_dict)
        
        # Build multipart response
        return _create_multipart_response(
            outfits=outfits_with_images,
            outfit_images=outfit_images_bytes
        )
        
    except ValueError as e:
        error_msg = str(e)
        logger.error(f"Outfit generation error: {error_msg}")
        
        # Provide helpful error message for filter issues
        if "Not enough clothing items" in error_msg:
            detail = (
                f"Not enough items with the specified filters. "
                f"Filters: {tags_list}. "
                f"Try: (1) reducing limit_outfits, (2) using different tags, "
                f"or (3) removing filters to use all {len(converted_wearables)} items."
            )
        else:
            detail = error_msg
        
        raise HTTPException(status_code=400, detail=detail)
    except Exception as e:
        logger.error(f"Failed to generate outfits: {e}")
        raise HTTPException(status_code=500, detail=f"Outfit generation failed: {str(e)}")


@router.post("/outfit/upload")
async def upload_outfit(request: Request):
    """
    Combine a list of wearables with images into a single outfit.
    NO validation/regulation - just combines items as provided.
    
    Canvas limits (handled by combiner, all items shown side-by-side):
    - max 4 shoes (horizontal row)
    - max 4 bottoms (horizontal row)
    - max 4 tops (horizontal row)
    - max 6 accessories (horizontal row)
    
    Expects multipart form data with:
    - wearables: JSON array [{id, category, tags (optional), file}, ...]
    - Various image files matching the "file" names in wearables
    
    Returns:
        Multipart response with:
        - JSON with outfit metadata, wearables, warnings (if any items were truncated)
        - PNG image (outfit.png)
        
    Warnings from combiner include limits (e.g. "Only 4 tops used, max 4 tops allowed (received 6)")
    """
    if outfit_combiner is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    try:
        # Parse multipart form data
        form_data = await request.form()
        
        # Get wearables JSON
        wearables_json = form_data.get("wearables")
        if not wearables_json:
            raise HTTPException(status_code=400, detail="Missing wearables JSON")
        
        parsed_json = json.loads(wearables_json)
        # Handle both direct array and wrapped {wearables: [...]} format
        if isinstance(parsed_json, dict) and "wearables" in parsed_json:
            wearables_list = parsed_json["wearables"]
        elif isinstance(parsed_json, list):
            wearables_list = parsed_json
        else:
            raise HTTPException(status_code=400, detail="Invalid wearables format")
        
        logger.info(f"Loaded {len(wearables_list)} wearables for combining (NO validation)")
        
        # Load image files for each wearable
        wearable_images = {}  # Maps id -> bytes
        for wearable in wearables_list:
            file_key = wearable.get("file")
            if file_key and file_key in form_data:
                file_obj = form_data[file_key]
                if hasattr(file_obj, 'read'):
                    image_bytes = await file_obj.read()
                    wearable_images[wearable["id"]] = image_bytes
                    logger.debug(f"Loaded image for {wearable['id']}")
        
        logger.info(f"Loaded {len(wearable_images)} image files")
        
        # Categorize wearables (no validation - just categorize)
        outfit_images = {
            'shoes': [],
            'bottom': [],
            'tops': [],
            'accessories': []
        }
        
        wearables_response = []  # For JSON response
        
        for item in wearables_list:
            item_id = item["id"]
            category = item.get("category", "").upper()
            image_bytes = wearable_images.get(item_id)
            
            # Add to response regardless of image
            wearables_response.append({
                "id": item_id,
                "category": item.get("category"),
                "tags": item.get("tags", [])
            })
            
            # Skip if no image
            if not image_bytes:
                logger.warning(f"No image for {item_id}")
                continue
            
            # Categorize based on category field
            if "SHOE" in category:
                outfit_images['shoes'].append(image_bytes)
                logger.debug(f"Added shoe: {item_id}")
            elif "BOTTOM" in category or "PANT" in category or "DRESS" in category or "SKIRT" in category:
                outfit_images['bottom'].append(image_bytes)
                logger.debug(f"Added bottom: {item_id}")
            elif "TOP" in category or "SHIRT" in category or "HOODIE" in category or "JACKET" in category:
                outfit_images['tops'].append(image_bytes)
                logger.debug(f"Added top: {item_id}")
            else:  # Treat as accessory
                outfit_images['accessories'].append(image_bytes)
                logger.debug(f"Added accessory: {item_id}")
        
        logger.info(f"Categorized: shoes={len(outfit_images['shoes'])}, bottoms={len(outfit_images['bottom'])}, tops={len(outfit_images['tops'])}, accessories={len(outfit_images['accessories'])}")
        
        # Combine images using the combiner (which handles limits and warnings)
        combined_bytes, warnings = await outfit_combiner.combine_outfit_multiple(
            shoes_bytes_list=outfit_images['shoes'],
            bottom_bytes_list=outfit_images['bottom'],
            tops_bytes_list=outfit_images['tops'],
            accessory_bytes_list=outfit_images['accessories']
        )
        
        if not combined_bytes:
            raise HTTPException(status_code=500, detail="Failed to combine outfit images")
        
        # Build response
        outfit_response = {
            "id": "outfit-combined",
            "wearables": wearables_response,
            "image": "outfit.png",
            "warnings": warnings  # Include any warnings about truncated items
        }
        
        # Create multipart response
        boundary = str(uuid.uuid4())
        body = io.BytesIO()
        
        # Add JSON part
        json_content = json.dumps(outfit_response).encode('utf-8')
        body.write(f"--{boundary}\r\n".encode())
        body.write(b"Content-Disposition: form-data; name=\"outfit\"\r\n")
        body.write(b"Content-Type: application/json\r\n\r\n")
        body.write(json_content)
        body.write(b"\r\n")
        
        # Add image part
        body.write(f"--{boundary}\r\n".encode())
        body.write(b"Content-Disposition: form-data; name=\"image\"; filename=\"outfit.png\"\r\n")
        body.write(b"Content-Type: image/png\r\n\r\n")
        body.write(combined_bytes)
        body.write(b"\r\n")
        
        # Add final boundary
        body.write(f"--{boundary}--\r\n".encode())
        
        response = Response(
            content=body.getvalue(),
            media_type=f"multipart/form-data; boundary={boundary}"
        )
        
        logger.info(f"Combined outfit created: JSON ({len(json_content)} bytes) + PNG ({len(combined_bytes)} bytes)")
        return response
        
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON in wearables: {str(e)}")
    except Exception as e:
        logger.error(f"Failed to combine outfit: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to combine outfit: {str(e)}")


def _create_multipart_response(outfits: List[Dict], outfit_images: List[Optional[bytes]]) -> Response:
    """
    Create a multipart form-data response with JSON + PNG images.
    
    Args:
        outfits: List of outfit dictionaries with metadata
        outfit_images: List of combined outfit PNG bytes
        
    Returns:
        FastAPI Response with multipart/form-data content
    """
    boundary = str(uuid.uuid4())
    
    # Build multipart body
    body = io.BytesIO()
    
    # Add JSON part
    json_content = json.dumps({"outfits": outfits}).encode('utf-8')
    body.write(f"--{boundary}\r\n".encode())
    body.write(b"Content-Disposition: form-data; name=\"outfits\"\r\n")
    body.write(b"Content-Type: application/json\r\n\r\n")
    body.write(json_content)
    body.write(b"\r\n")
    logger.debug(f"Added JSON part: {len(json_content)} bytes")
    
    # Add image parts
    valid_images = 0
    for idx, image_bytes in enumerate(outfit_images):
        if image_bytes:
            body.write(f"--{boundary}\r\n".encode())
            body.write(f"Content-Disposition: form-data; name=\"outfit_{idx + 1}\"; filename=\"outfit_{idx + 1}.png\"\r\n".encode())
            body.write(b"Content-Type: image/png\r\n\r\n")
            body.write(image_bytes)
            body.write(b"\r\n")
            valid_images += 1
            logger.debug(f"Added image outfit_{idx + 1}: {len(image_bytes)} bytes, PNG header: {image_bytes[:8].hex()}")
        else:
            logger.warning(f"Skipping outfit_{idx + 1}: image bytes are None")
    
    # Add final boundary
    body.write(f"--{boundary}--\r\n".encode())
    
    # Create response
    total_size = len(body.getvalue())
    response = Response(
        content=body.getvalue(),
        media_type=f"multipart/form-data; boundary={boundary}"
    )
    
    logger.info(f"Created multipart response: {total_size} bytes total ({valid_images} PNG images + JSON)")
    logger.info(f"   Boundary: {boundary}")
    return response
