"""Service for outfit generation with hierarchical categories."""
from typing import List, Optional, Dict, Tuple
from pathlib import Path
import json
import logging
import random
from sentence_transformers import SentenceTransformer
from core.dto.outfit_response import WearableItem, Outfit, OutfitResponse

# Setup logging
logger = logging.getLogger(__name__)


class OutfitGenerator:
    """Generate intelligent outfits from wearables with hierarchical category system."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """Initialize with hierarchical category mapping and sentence transformer."""
        self.category_mapping = self._load_category_mapping()
        self.model = SentenceTransformer(model_name)
        self.unknown_categories = {}
        self.error_log = []

    def _load_category_mapping(self) -> Dict:
        """Load hierarchical category mapping from JSON file."""
        mapping_file = Path(__file__).parent / "category_mapping.json"
        if mapping_file.exists():
            try:
                with open(mapping_file, 'r') as f:
                    data = json.load(f)
                    return self._normalize_mapping(data)
            except Exception as e:
                logger.error(f"Failed to load category mapping: {e}")
                return {}
        logger.warning("Category mapping file not found")
        return {}

    def _normalize_mapping(self, mapping: Dict) -> Dict:
        """Normalize all category names to lowercase for consistent lookups."""
        normalized = {}
        for main_category, items in mapping.items():
            if isinstance(items, list):
                normalized[main_category] = [item.lower().strip() for item in items]
            elif isinstance(items, dict):
                normalized[main_category] = {}
                for sub_category, sub_items in items.items():
                    if isinstance(sub_items, list):
                        normalized[main_category][sub_category] = [item.lower().strip() for item in sub_items]
                    elif isinstance(sub_items, dict):
                        normalized[main_category][sub_category] = {}
                        for sub_sub_category, sub_sub_items in sub_items.items():
                            if isinstance(sub_sub_items, list):
                                normalized[main_category][sub_category][sub_sub_category] = [
                                    item.lower().strip() for item in sub_sub_items
                                ]
        return normalized

    def generate(self,
                 wearables: List[Dict],
                 filter_tags: Optional[List[str]] = None,
                 limit_outfits: int = 5) -> OutfitResponse:
        """Generate outfits from wearables with hierarchical rules."""
        if not wearables:
            return OutfitResponse(outfits=[])

        self.error_log = []
        categorized_items = self._categorize_wearables(wearables)

        if self.error_log:
            logger.warning(f"Categorization errors: {self.error_log}")

        has_swimwear_filter = filter_tags and any(tag.lower() == "swimwear" for tag in filter_tags)

        if has_swimwear_filter:
            outfits = self._generate_swimwear_outfits(categorized_items, filter_tags, limit_outfits)
        else:
            outfits = self._generate_regular_outfits(categorized_items, filter_tags, limit_outfits)

        # Deduplicate outfits with same Shoes/Bottom/Top but different Accessories
        outfits = self._deduplicate_outfits(outfits)

        # If filter was applied but no outfits found, return error
        if filter_tags and len(outfits) == 0:
            error_msg = f"Not enough clothing items with filters {filter_tags}"
            logger.warning(error_msg)
            raise ValueError(error_msg)

        return OutfitResponse(outfits=outfits)

    def _categorize_wearables(self, wearables: List[Dict]) -> Dict:
        """Categorize wearables into hierarchical structure."""
        categorized = {
            "BOTTOM": [],
            "TOP": {"SHIRT": [], "HOODIE": [], "JACKET": []},
            "SHOES": [],
            "SWIMWEAR": [],
            "ACCESSORY": {
                "UNDERWEAR": [],
                "HEAD": [],
                "ARMS": [],
                "BAG": [],
                "GENERAL": []
            }
        }

        for wearable_dict in wearables:
            try:
                item = WearableItem(
                    id=wearable_dict.get("id"),
                    category=wearable_dict.get("category", "unknown"),
                    tags=wearable_dict.get("tags", [])
                )

                category_path = self._map_category(item.category, item)
                
                if category_path is None:
                    self.error_log.append(f"Could not categorize item {item.id} ({item.category})")
                    logger.warning(f"Could not categorize item {item.id} ({item.category})")
                    continue

                # Store mapped path for internal logic, keep original category for response
                item.mappedPath = ".".join(category_path)
                
                self._append_to_structure(categorized, category_path, item)

            except Exception as e:
                logger.error(f"Error categorizing wearable {wearable_dict.get('id')}: {e}")
                self.error_log.append(f"Exception for item {wearable_dict.get('id')}: {str(e)}")
                continue

        return categorized

    def _append_to_structure(self, structure: Dict, path: Tuple, item: WearableItem):
        """Append item to correct location in nested categorized structure."""
        if len(path) == 1:
            structure[path[0]].append(item)
        elif len(path) == 2:
            structure[path[0]][path[1]].append(item)
        elif len(path) == 3:
            structure[path[0]][path[1]][path[2]].append(item)

    def _map_category(self, category: str, item: WearableItem = None) -> Optional[Tuple]:
        """Map category string to hierarchical path tuple."""
        category_lower = category.lower().strip()

        path = self._find_exact_match(category_lower)
        if path:
            return path

        path = self._find_substring_match(category_lower)
        if path:
            self.unknown_categories[category_lower] = path
            self._save_unknown_category(category_lower, path, item)
            logger.info(f"Substring match found for '{category_lower}': {path}")
            return path

        # Similarity match (handles saving internally)
        path = self._find_similarity_match(category_lower, item)
        if path:
            self.unknown_categories[category_lower] = path
            return path

        logger.warning(f"No mapping found for category '{category}' - item will be IGNORED")
        return None

    def _find_exact_match(self, category_lower: str) -> Optional[Tuple]:
        """Find exact match in category mapping."""
        for main, items in self.category_mapping.items():
            if isinstance(items, list):
                if category_lower in items:
                    return (main,)
            elif isinstance(items, dict):
                for sub, sub_items in items.items():
                    if isinstance(sub_items, list):
                        if category_lower in sub_items:

                            return (main, sub)
                    elif isinstance(sub_items, dict):
                        for sub_sub, sub_sub_items in sub_items.items():
                            if isinstance(sub_sub_items, list) and category_lower in sub_sub_items:
                                return (main, sub, sub_sub)
        return None

    def _find_substring_match(self, category_lower: str) -> Optional[Tuple]:
        """Find substring match."""
        for main, items in self.category_mapping.items():
            if isinstance(items, list):
                for mapped_cat in items:
                    if mapped_cat in category_lower or category_lower in mapped_cat:
                        return (main,)
            elif isinstance(items, dict):
                for sub, sub_items in items.items():
                    if isinstance(sub_items, list):
                        for mapped_cat in sub_items:
                            if mapped_cat in category_lower or category_lower in mapped_cat:
                                return (main, sub)
                    elif isinstance(sub_items, dict):
                        for sub_sub, sub_sub_items in sub_items.items():
                            if isinstance(sub_sub_items, list):
                                for mapped_cat in sub_sub_items:
                                    if mapped_cat in category_lower or category_lower in mapped_cat:
                                        return (main, sub, sub_sub)
        return None

    def _find_similarity_match(self, category_lower: str, item: WearableItem = None) -> Optional[Tuple]:
        """Find match using sentence transformer similarity."""
        try:
            all_categories = self._flatten_categories()
            if not all_categories:
                return None

            query_embedding = self.model.encode(category_lower)
            category_embeddings = self.model.encode(all_categories)

            from sklearn.metrics.pairwise import cosine_similarity
            similarities = cosine_similarity([query_embedding], category_embeddings)[0]
            best_idx = similarities.argmax()
            best_similarity = similarities[best_idx]

            logger.info(f"Similarity: '{category_lower}' -> '{all_categories[best_idx]}' (score: {best_similarity:.4f})")

            if best_similarity > 0.65:
                best_category = all_categories[best_idx]
                logger.info(f"High confidence match (>0.65): '{category_lower}': '{best_category}' (score: {best_similarity:.4f})")
                path = self._find_exact_match(best_category)
                if path:
                    self._save_unknown_category(category_lower, path, item)
                return path
            else:
                logger.warning(f"Low similarity for '{category_lower}' (score: {best_similarity:.4f}) - rejected")
                return None

        except Exception as e:
            logger.warning(f"Similarity matching failed for '{category_lower}': {e}")

        return None

    def _flatten_categories(self) -> List[str]:
        """Flatten all categories from mapping into single list."""
        categories = []
        for main, items in self.category_mapping.items():
            if isinstance(items, list):
                categories.extend(items)
            elif isinstance(items, dict):
                for sub, sub_items in items.items():
                    if isinstance(sub_items, list):
                        categories.extend(sub_items)
                    elif isinstance(sub_items, dict):
                        for sub_sub, sub_sub_items in sub_items.items():
                            if isinstance(sub_sub_items, list):
                                categories.extend(sub_sub_items)
        return categories

    def _save_unknown_category(self, category: str, path: Tuple, item: WearableItem = None):
        """Save newly discovered category to mapping file."""
        # Special rule: Only save to SWIMWEAR if item has "swimwear" tag
        if path and len(path) == 1 and path[0] == "SWIMWEAR":
            if not item or not item.tags or "swimwear" not in [t.lower() for t in item.tags]:
                logger.warning(f"Cannot save '{category}' to SWIMWEAR: missing 'swimwear' tag")
                return
        
        try:
            if not path or not category:
                logger.warning(f"Invalid path or category: path={path}, category={category}")
                return
            
            mapping_file = Path(__file__).parent / "category_mapping.json"
            logger.debug(f"Attempting to save category '{category}' to path {path} in {mapping_file}")
            
            with open(mapping_file, 'r') as f:
                data = json.load(f)

            saved = False
            
            # Navigate and create if needed
            if len(path) == 1:
                key = path[0]
                if key not in data:
                    logger.warning(f"Key '{key}' not found in mapping, creating as list")
                    data[key] = [category]
                    saved = True
                elif isinstance(data[key], list):
                    if category not in data[key]:
                        data[key].append(category)
                        saved = True
                        logger.info(f"Added '{category}' to {key}")
                    else:
                        logger.debug(f"'{category}' already in {key}")
                else:
                    logger.warning(f"{key} is not a list, cannot add category")
                    
            elif len(path) == 2:
                main_key, sub_key = path
                if main_key in data and isinstance(data[main_key], dict):
                    if sub_key not in data[main_key]:
                        logger.warning(f"Subkey '{sub_key}' not found under '{main_key}'")
                    elif isinstance(data[main_key][sub_key], list):
                        if category not in data[main_key][sub_key]:
                            data[main_key][sub_key].append(category)
                            saved = True
                            logger.info(f"Added '{category}' to {main_key}.{sub_key}")
                        else:
                            logger.debug(f"'{category}' already in {main_key}.{sub_key}")
                    else:
                        logger.warning(f"{main_key}.{sub_key} is not a list")
                else:
                    logger.warning(f"Path {main_key} not found or not a dict")
                    
            elif len(path) == 3:
                main_key, sub_key, sub_sub_key = path
                if (main_key in data and isinstance(data[main_key], dict) and
                    sub_key in data[main_key] and isinstance(data[main_key][sub_key], dict) and
                    sub_sub_key in data[main_key][sub_key] and isinstance(data[main_key][sub_key][sub_sub_key], list)):
                    if category not in data[main_key][sub_key][sub_sub_key]:
                        data[main_key][sub_key][sub_sub_key].append(category)
                        saved = True
                        logger.info(f"Added '{category}' to {main_key}.{sub_key}.{sub_sub_key}")
                    else:
                        logger.debug(f"'{category}' already in {main_key}.{sub_key}.{sub_sub_key}")
                else:
                    logger.warning(f"Complete path {path} not found in mapping")

            if saved:
                with open(mapping_file, 'w') as f:
                    json.dump(data, f, indent=2)
                logger.info(f"Successfully saved category mapping: {category} -> {path}")
            else:
                logger.warning(f"Failed to save category '{category}' to {path} - no changes made")

        except Exception as e:
            logger.error(f"Exception saving category '{category}': {e}", exc_info=True)

    def _generate_swimwear_outfits(self, categorized: Dict, filter_tags: List[str], 
                                   limit: int) -> List[Outfit]:
        """
        Generate swimwear outfits when swimwear filter is active.
        Includes:
        - Items with "swimwear" tag
        - Shoes with category "swimwear"
        - Accessories with tag "swimwear"
        """
        # Ensure limit is valid
        limit = max(1, limit or 5)
        
        # Get swimwear items (items with "swimwear" tag)
        swimwear_items = [
            item for item in categorized.get("SWIMWEAR", [])
            if item.tags and "swimwear" in [t.lower() for t in item.tags]
        ]
        
        # Get swimwear shoes (shoes with category "swimwear")
        swimwear_shoes = [
            item for item in categorized.get("SHOES", [])
            if item.category and "swimwear" in item.category.lower()
        ]
        
        # Get swimwear accessories (accessories with "swimwear" tag)
        swimwear_accessories = []
        for sub_cat, items in categorized.get("ACCESSORY", {}).items():
            if isinstance(items, list):
                swimwear_accessories.extend([
                    item for item in items
                    if item.tags and "swimwear" in [t.lower() for t in item.tags]
                ])
        
        if not swimwear_items:
            logger.warning("No swimwear items with 'swimwear' tag found")
            return []

        outfits = []
        outfit_idx = 1
        
        for swimwear in swimwear_items:
            if outfit_idx > limit:
                break
            
            # Build swimwear outfit: shoes (optional), swimwear, accessories (optional)
            wearables = []
            
            # Add optional swimwear shoe
            if swimwear_shoes:
                wearables.append(swimwear_shoes[0])
            
            # Add swimwear item
            wearables.append(swimwear)
            
            # Add optional swimwear accessories (max 1-2)
            if swimwear_accessories:
                num_accessories = min(len(swimwear_accessories), 2)
                wearables.extend(swimwear_accessories[:num_accessories])
            
            outfit = Outfit(
                id=f"outfit-{outfit_idx}",
                wearables=wearables
            )
            outfits.append(outfit)
            outfit_idx += 1

        return outfits

    def _generate_regular_outfits(self, categorized: Dict, filter_tags: Optional[List[str]] = None,
                                  limit: int = 5) -> List[Outfit]:
        """
        Generate regular outfits with complex rules:
        - Filter BEFORE generation: if filter_tags, only use items with those tags
        - Item reuse: MAX 2x each (but try to use unique items first if no filter)
        - Accessories: 1-5 total with constraints
        - Tops: Min 1 (shirt required), Max 3 (shirt + optional hoodie/jacket)
        """
        import random
        
        # Ensure limit is valid
        limit = max(1, limit or 5)
        
        # PRE-FILTER categorized items if filter_tags active
        if filter_tags:
            filter_tags_lower = [t.lower() for t in filter_tags]
            categorized = self._filter_categorized_by_tags(categorized, filter_tags_lower)
        
        bottom_items = categorized["BOTTOM"]
        shoes_items = categorized["SHOES"]
        top_structure = categorized["TOP"]
        accessory_structure = categorized["ACCESSORY"]

        if not bottom_items or not shoes_items:
            logger.warning("Missing BOTTOM or SHOES items")
            return []

        shirt_items = top_structure.get("SHIRT", [])
        hoodie_items = top_structure.get("HOODIE", [])
        jacket_items = top_structure.get("JACKET", [])

        # Shuffle lists to increase variety (different items used first in each outfit)
        random.shuffle(bottom_items)
        random.shuffle(shoes_items)
        random.shuffle(shirt_items)
        if hoodie_items:
            random.shuffle(hoodie_items)
        if jacket_items:
            random.shuffle(jacket_items)
        
        # Item usage tracking - two-phase approach:
        # Phase 1: max_usage=1 (no item reuse) if no filter
        # Phase 2: max_usage=2 (allow 2x reuse) if needed
        item_usage = {}
        max_usage = 1 if not filter_tags else 2  # If filter active, allow reuse from start

        outfits = []
        outfit_idx = 1

        # Use random sampling instead of sequential loops for better variety
        attempts = 0
        max_attempts = len(bottom_items) * len(shoes_items) * len(shirt_items) * 5  # Reasonable limit
        
        while outfit_idx <= limit and attempts < max_attempts:
            attempts += 1
            
            # Randomly select items
            bottom = random.choice(bottom_items)
            shoe = random.choice(shoes_items)
            
            # Check if it's a dress (includes dress, gown, etc.)
            is_dress = bottom.category and any(term in bottom.category.lower() for term in ["dress", "gown"])

            if is_dress:
                # DRESS: SHOES + DRESS + OPTIONAL JACKET ONLY (NO HOODIE OR SHIRT!)
                jacket = random.choice(jacket_items) if jacket_items and random.random() < 0.5 else None
                
                if not self._can_use_item(item_usage, bottom, max_usage):
                    continue
                if not self._can_use_item(item_usage, shoe, max_usage):
                    continue
                if jacket and not self._can_use_item(item_usage, jacket, max_usage=999):
                    continue

                wearables = [shoe, bottom]
                if jacket:
                    wearables.append(jacket)

                accessories = self._select_constrained_accessories(accessory_structure, item_usage, max_usage)
                wearables.extend(accessories)

                for item in wearables:
                    item_usage[item.id] = item_usage.get(item.id, 0) + 1

                outfit = Outfit(id=f"outfit-{outfit_idx}", wearables=wearables)
                outfits.append(outfit)
                outfit_idx += 1
            else:
                # REGULAR (NOT DRESS): SHOES + BOTTOM + SHIRT + optional HOODIE/JACKET
                if not shirt_items:
                    continue

                shirt = random.choice(shirt_items)
                hoodie = random.choice(hoodie_items) if hoodie_items and random.random() < 0.4 else None
                jacket = random.choice(jacket_items) if jacket_items and random.random() < 0.4 else None

                if not self._can_use_item(item_usage, bottom, max_usage):
                    continue
                if not self._can_use_item(item_usage, shoe, max_usage):
                    continue
                if not self._can_use_item(item_usage, shirt, max_usage):
                    continue
                if hoodie and not self._can_use_item(item_usage, hoodie, max_usage=999):
                    continue
                if jacket and not self._can_use_item(item_usage, jacket, max_usage=999):
                    continue

                wearables = [shoe, bottom, shirt]
                if hoodie:
                    wearables.append(hoodie)
                if jacket:
                    wearables.append(jacket)

                accessories = self._select_constrained_accessories(accessory_structure, item_usage, max_usage)
                wearables.extend(accessories)

                for item in wearables:
                    item_usage[item.id] = item_usage.get(item.id, 0) + 1

                outfit = Outfit(id=f"outfit-{outfit_idx}", wearables=wearables)
                outfits.append(outfit)
                outfit_idx += 1

        # Phase 2: If insufficient outfits and NO filter, retry with item reuse allowed
        if len(outfits) < limit and not filter_tags:
            logger.info(f"Phase 1 produced {len(outfits)} outfits (less than {limit}), retrying Phase 2 with item reuse...")
            item_usage.clear()
            max_usage = 2
            
            # Re-shuffle for different ordering
            random.shuffle(bottom_items)
            random.shuffle(shoes_items)
            random.shuffle(shirt_items)
            if hoodie_items:
                random.shuffle(hoodie_items)
            if jacket_items:
                random.shuffle(jacket_items)
            
            # Generate more outfits with item reuse allowed
            for bottom in bottom_items:
                if outfit_idx > limit:
                    break

                for shoe in shoes_items:
                    if outfit_idx > limit:
                        break

                    for shirt in shirt_items:
                        if outfit_idx > limit:
                            break

                        top_combos = [(shirt, None, None)]
                        if hoodie_items:
                            top_combos.append((shirt, hoodie_items[0], None))
                        if jacket_items:
                            top_combos.append((shirt, None, jacket_items[0]))
                        if hoodie_items and jacket_items:
                            top_combos.append((shirt, hoodie_items[0], jacket_items[0]))

                        for shirt_item, hoodie, jacket in top_combos:
                            if outfit_idx > limit:
                                break

                            if not self._can_use_item(item_usage, bottom, max_usage):
                                continue
                            if not self._can_use_item(item_usage, shoe, max_usage):
                                continue
                            if not self._can_use_item(item_usage, shirt_item, max_usage):
                                continue
                            if hoodie and not self._can_use_item(item_usage, hoodie, max_usage=999):
                                continue
                            if jacket and not self._can_use_item(item_usage, jacket, max_usage=999):
                                continue

                            # Build wearables with reuse allowed
                            wearables = [shoe, bottom, shirt_item]
                            if hoodie:
                                wearables.append(hoodie)
                            if jacket:
                                wearables.append(jacket)

                            accessories = self._select_constrained_accessories(
                                accessory_structure, 
                                item_usage, 
                                max_usage
                            )
                            wearables.extend(accessories)

                            for item in wearables:
                                item_usage[item.id] = item_usage.get(item.id, 0) + 1

                            outfit = Outfit(
                                id=f"outfit-{outfit_idx}",
                                wearables=wearables
                            )
                            outfits.append(outfit)
                            outfit_idx += 1

        return outfits

    def _deduplicate_outfits(self, outfits: List[Outfit]) -> List[Outfit]:
        """Remove duplicate outfits with same Shoes/Bottom/Top but different Accessories."""
        seen_combinations = set()
        deduplicated = []
        
        for outfit in outfits:
            # Extract core items (ignore accessories to find duplicates)
            core_items = []
            
            for item in outfit.wearables:
                # Include SHOES, BOTTOM, and TOP items using mappedPath
                mapped_upper = item.mappedPath.upper() if item.mappedPath else ""
                if mapped_upper.startswith("SHOES") or mapped_upper.startswith("BOTTOM") or mapped_upper.startswith("TOP."):
                    core_items.append(item.id)
            
            # Create a unique key from core items (sorted for consistency)
            core_key = tuple(sorted(core_items))
            
            if core_key not in seen_combinations:
                seen_combinations.add(core_key)
                deduplicated.append(outfit)
        
        if len(deduplicated) < len(outfits):
            logger.info(f"Deduplicated outfits: {len(outfits)} -> {len(deduplicated)}")
        
        return deduplicated

    def _filter_categorized_by_tags(self, categorized: Dict, filter_tags_lower: List[str]) -> Dict:
        """
        Filter all items in categorized structure to only those with ALL required tags.
        Uses AND logic: item must have ALL filter_tags (not just any one).
        """
        filtered = {
            "BOTTOM": [],
            "TOP": {"SHIRT": [], "HOODIE": [], "JACKET": []},
            "SHOES": [],
            "SWIMWEAR": [],
            "ACCESSORY": {
                "UNDERWEAR": [],
                "HEAD": [],
                "ARMS": [],
                "BAG": [],
                "GENERAL": []
            }
        }
        
        # Convert filter tags to lowercase set for efficient checking
        filter_tags_set = set(filter_tags_lower)
        
        # Filter items: must have ALL required tags (AND logic)
        for item in categorized["BOTTOM"]:
            if item.tags:
                item_tags_lower = set(t.lower() for t in item.tags)
                if filter_tags_set.issubset(item_tags_lower):  # Item has ALL filter tags
                    filtered["BOTTOM"].append(item)
        
        for top_cat in ["SHIRT", "HOODIE", "JACKET"]:
            for item in categorized["TOP"].get(top_cat, []):
                if item.tags:
                    item_tags_lower = set(t.lower() for t in item.tags)
                    if filter_tags_set.issubset(item_tags_lower):  # Item has ALL filter tags
                        filtered["TOP"][top_cat].append(item)
        
        for item in categorized["SHOES"]:
            if item.tags:
                item_tags_lower = set(t.lower() for t in item.tags)
                if filter_tags_set.issubset(item_tags_lower):  # Item has ALL filter tags
                    filtered["SHOES"].append(item)
        
        for item in categorized["SWIMWEAR"]:
            if item.tags:
                item_tags_lower = set(t.lower() for t in item.tags)
                if filter_tags_set.issubset(item_tags_lower):  # Item has ALL filter tags
                    filtered["SWIMWEAR"].append(item)
        
        for acc_cat in ["UNDERWEAR", "HEAD", "ARMS", "BAG", "GENERAL"]:
            for item in categorized["ACCESSORY"].get(acc_cat, []):
                if item.tags:
                    item_tags_lower = set(t.lower() for t in item.tags)
                    if filter_tags_set.issubset(item_tags_lower):  # Item has ALL filter tags
                        filtered["ACCESSORY"][acc_cat].append(item)
        
        return filtered

    def _can_use_item(self, item_usage: Dict[str, int], item: WearableItem, max_usage: int) -> bool:
        """Check if item can be used once more (respecting max_usage limit)."""
        current = item_usage.get(item.id, 0)
        return current < max_usage

    def _select_constrained_accessories(self, accessory_structure: Dict, 
                                       item_usage: Dict[str, int], 
                                       max_usage: int) -> List[WearableItem]:
        """
        Select 0-5 accessories with constraints:
        - Max 1 from each of: UNDERWEAR, HEAD, ARMS, BAG
        - Max 1 from each SUB-CATEGORY of GENERAL (scarf, belt, necklace, etc.)
        - Respect item usage limits
        """
        selected = []
        used_item_ids = set()  # Track which items already selected in this outfit
        used_subcategories = set()  # Track which subcategories already used
        
        # Max 1 from each constrained category
        for category in ["UNDERWEAR", "HEAD", "ARMS", "BAG"]:
            items = accessory_structure.get(category, [])
            if isinstance(items, list) and items:
                # Find available items (not yet used in this outfit, respecting max_usage limit)
                available = [i for i in items 
                           if i.id not in used_item_ids and 
                           self._can_use_item(item_usage, i, max_usage)]
                if available:
                    selected_item = random.choice(available)
                    selected.append(selected_item)
                    used_item_ids.add(selected_item.id)
        
        # Add 0-5 from GENERAL to reach 0-5 total (max 1 per sub-category)
        general_items = accessory_structure.get("GENERAL", [])
        if isinstance(general_items, list) and general_items:
            # Calculate target count once (0-5 total accessories allowed)
            target_count = random.randint(0, 5)
            while len(selected) < target_count:
                # Filter available items - not yet used and respecting max_usage
                available = [i for i in general_items 
                           if i.id not in used_item_ids and 
                           self._can_use_item(item_usage, i, max_usage)]
                if available:
                    selected_item = random.choice(available)
                    
                    # Extract sub-category from mappedPath (e.g., "ACCESSORY.GENERAL.SCARF" -> "SCARF")
                    sub_cat = None
                    if selected_item.mappedPath:
                        parts = selected_item.mappedPath.split('.')
                        if len(parts) >= 3:
                            sub_cat = parts[2]  # Get the third part (e.g., SCARF, BELT, NECKLACE)
                    
                    # Only add if we haven't used this sub-category yet
                    if not sub_cat or sub_cat not in used_subcategories:
                        selected.append(selected_item)
                        used_item_ids.add(selected_item.id)
                        if sub_cat:
                            used_subcategories.add(sub_cat)
                else:
                    # No more available items
                    break
        
        return selected[:5]  # Ensure max 5

    def _get_outfit_tags(self, wearables: List[WearableItem]) -> List[str]:
        """Get all tags from all wearables in outfit."""
        tags = set()
        for item in wearables:
            if item.tags:
                tags.update(item.tags)
        return list(tags)
