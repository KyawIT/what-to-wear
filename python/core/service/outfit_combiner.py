"""Service for combining outfit images."""
import io
import logging
import traceback
from PIL import Image
from typing import Optional

logger = logging.getLogger(__name__)


class OutfitCombiner:
    """Combine outfit item images into a single outfit visualization."""
    
    def __init__(self):
        """Initialize outfit combiner."""
    
    async def combine_outfit(
        self,
        shoes_bytes: Optional[bytes] = None,
        bottom_bytes: Optional[bytes] = None,
        tops_bytes_list: Optional[list] = None,
        accessory_bytes_list: Optional[list] = None,
        canvas_width: int = 500,
        canvas_height: int = None  # Auto-calculated
    ) -> Optional[bytes]:
        """
        Combine outfit items into tight vertical stacking layout.
        
        **Tight Layout (Bottom to Top, all items touch):**
        1. **SHOES** (bottom, small, centered) - 150x100px
        2. **BOTTOM/PANTS** (above shoes, medium, centered) - 400x180px (or larger if no tops)
        3. **TOPS** (above bottom, all equal size):
           - Shirt (first) in CENTER - LARGEST (300x180px)
           - Other tops (jacket, hoodie) on LEFT/RIGHT - same size, touching shirt
        4. **ACCESSORIES** (optional, above tops):
           - If present: Small items (80x80px), left/right alternating
           - If absent: Layer removed, canvas cropped
        
        All items touch (no gaps). Canvas height auto-calculated.
        
        Args:
            shoes_bytes: Shoe image (PNG)
            bottom_bytes: Bottom/Pants image (PNG)
            tops_bytes_list: List of top images (first is shirt)
            accessory_bytes_list: List of accessory images
            canvas_width: Width (default 500px)
            canvas_height: Auto-calculated if None
            
        Returns:
            Combined PNG bytes or None if failed
        """
        try:
            logger.info("Combining outfit with TIGHT vertical layout (shoes → bottom → tops → accessories)...")
            
            tops_bytes_list = tops_bytes_list or []
            accessory_bytes_list = accessory_bytes_list or []
            
            # LIMIT tops to max 4, accessories to max 6
            tops_bytes_list = tops_bytes_list[:4]
            accessory_bytes_list = accessory_bytes_list[:6]
            
            # Load images
            shoes_img = None
            bottom_img = None
            top_imgs = []
            accessory_imgs = []
            
            if shoes_bytes:
                shoes_img = Image.open(io.BytesIO(shoes_bytes)).convert("RGBA")
            if bottom_bytes:
                bottom_img = Image.open(io.BytesIO(bottom_bytes)).convert("RGBA")
            
            for i, top_bytes in enumerate(tops_bytes_list):
                if top_bytes:
                    try:
                        top_imgs.append(Image.open(io.BytesIO(top_bytes)).convert("RGBA"))
                    except Exception as e:
                        logger.warning(f"Failed to load top {i}: {e}")
            
            for i, acc_bytes in enumerate(accessory_bytes_list):
                if acc_bytes:
                    try:
                        accessory_imgs.append(Image.open(io.BytesIO(acc_bytes)).convert("RGBA"))
                    except Exception as e:
                        logger.warning(f"Failed to load accessory {i}: {e}")
            
            if not any([shoes_img, bottom_img, top_imgs, accessory_imgs]):
                logger.error("No valid images provided")
                return None
            
            # **DIMENSIONS** (all smaller)
            shoes_w, shoes_h = 140, 90       # Small shoes
            bottom_w, bottom_h = 320, 140    # Medium bottom
            top_w, top_h = 150, 160          # Top - SMALLER so fits 3-4 side by side
            side_top_w, side_top_h = 150, 160  # All tops SAME SIZE
            acc_w, acc_h = 90, 90            # Accessories - slightly larger
            
            has_tops = len(top_imgs) > 0
            has_accessories = len(accessory_imgs) > 0
            
            # **Calculate canvas height (compact, no gaps)**
            # Start from bottom and add up
            current_y = 0
            if shoes_img:
                current_y += shoes_h
            if bottom_img:
                current_y += bottom_h
            if has_tops:
                # Main top is LARGEST
                current_y += top_h
                # Additional space for side tops if multiple
                if len(top_imgs) > 1:
                    logger.debug(f"Note: {len(top_imgs)-1} additional tops on sides (same height as main)")
            if has_accessories:
                # Max 5 accessories, but all fit in one row (left/right alternating)
                current_y += acc_h
            
            if canvas_height is None:
                canvas_height = current_y + 20  # +20 padding
            
            canvas = Image.new("RGBA", (canvas_width, canvas_height), (255, 255, 255, 0))
            
            # **PLACEMENT - Bottom to Top**
            current_y = canvas_height  # Start from bottom
            
            # 1. **SHOES** (bottom)
            if shoes_img:
                current_y -= shoes_h
                shoes_resized = self._resize_fit(shoes_img, shoes_w, shoes_h)
                shoes_x = (canvas_width - shoes_w) // 2
                canvas.paste(shoes_resized, (shoes_x, current_y), shoes_resized)
                logger.debug(f"Shoes at y={current_y} (h={shoes_h})")
            
            # 2. **BOTTOM/PANTS**
            if bottom_img:
                current_y -= bottom_h
                # If NO tops: keep bottom same size
                if not has_tops:
                    bottom_h_actual = bottom_h  # Same size as with tops
                    bottom_resized = self._resize_fit(bottom_img, bottom_w, bottom_h_actual)
                    logger.debug(f"Bottom (no tops) at y={current_y} (h={bottom_h_actual})")
                else:
                    bottom_h_actual = bottom_h
                    bottom_resized = self._resize_fit(bottom_img, bottom_w, bottom_h)
                    logger.debug(f"Bottom (with tops) at y={current_y} (h={bottom_h})")
                
                bottom_x = (canvas_width - bottom_w) // 2
                canvas.paste(bottom_resized, (bottom_x, current_y), bottom_resized)
            
            # 3. **TOPS** (all same size, horizontal tight - NO GAPS)
            if has_tops:
                current_y -= top_h  # Reduce once for all tops (same Y level)
                
                # Position tops horizontally with NO gap
                total_top_width = len(top_imgs) * top_w
                top_start_x = (canvas_width - total_top_width) // 2  # Center all tops
                
                for i, top_img in enumerate(top_imgs):
                    top_resized = self._resize_fit(top_img, top_w, top_h)
                    top_x = top_start_x + i * top_w  # NO gap (0 padding)
                    canvas.paste(top_resized, (top_x, current_y), top_resized)
                    logger.debug(f"Top {i+1} at y={current_y} x={top_x}")
            
            # 4. **ACCESSORIES** (top, if present, centered tight - NO GAPS)
            if has_accessories:
                current_y -= acc_h  # All accessories same height
                
                # Position accessories horizontally with NO gap
                total_acc_width = len(accessory_imgs) * (acc_w)
                start_x = (canvas_width - total_acc_width) // 2  # Center all accessories
                
                for i, acc_img in enumerate(accessory_imgs):
                    acc_resized = self._resize_fit(acc_img, acc_w, acc_h)
                    acc_x = start_x + i * acc_w  # NO gap (0 padding)
                    canvas.paste(acc_resized, (acc_x, current_y), acc_resized)
                    logger.debug(f"Accessory {i+1} at y={current_y} x={acc_x}")
            
            if has_tops:
                logger.info(f"Layout complete: {len(top_imgs)} tops + {len(accessory_imgs)} accessories + shoes + bottom")
            else:
                logger.info(f"Layout complete (DRESS): no tops, {len(accessory_imgs)} accessories + shoes + bottom")
            logger.info(f"   Generated {canvas_width}x{canvas_height}px image (tight stacking)")
            
            # Convert to PNG
            output = io.BytesIO()
            canvas.save(output, format="PNG")
            output.seek(0)
            
            return output.getvalue()
            
        except Exception as e:
            import traceback
            logger.error(f"Failed: {e}")
            logger.error(traceback.format_exc())
            return None
    
    async def combine_outfit_multiple(
        self,
        shoes_bytes_list: Optional[list] = None,
        bottom_bytes_list: Optional[list] = None,
        tops_bytes_list: Optional[list] = None,
        accessory_bytes_list: Optional[list] = None,
        canvas_width: int = 500,
        canvas_height: int = None  # Auto-calculated
    ) -> tuple[Optional[bytes], list]:
        """
        Combine outfit items with MULTIPLE shoes, bottoms, tops, and accessories.
        Applies canvas limits and returns warnings for truncated items.
        
        **Layout (Bottom to Top, all items in rows):**
        1. **SHOES** (bottom, horizontal row, max 4)
        2. **BOTTOMS/PANTS** (above shoes, horizontal row, max 4)
        3. **TOPS** (above bottoms, horizontal row, max 4)
        4. **ACCESSORIES** (top, horizontal row, max 6)
        
        Args:
            shoes_bytes_list: List of shoe images (PNG)
            bottom_bytes_list: List of bottom/pants images (PNG) 
            tops_bytes_list: List of top images
            accessory_bytes_list: List of accessory images
            canvas_width: Width (default 500px)
            canvas_height: Auto-calculated if None
            
        Returns:
            Tuple of (Combined PNG bytes, warnings list)
            warnings contains msgs like "Only 4 shoes used, received 6"
        """
        try:
            logger.info("Combining outfit with MULTIPLE items (all categories)...")
            
            shoes_bytes_list = shoes_bytes_list or []
            bottom_bytes_list = bottom_bytes_list or []
            tops_bytes_list = tops_bytes_list or []
            accessory_bytes_list = accessory_bytes_list or []
            
            warnings = []
            
            # Apply canvas limits and generate warnings
            if len(shoes_bytes_list) > 4:
                warnings.append(f"Only 4 shoes used, max 4 shoes allowed (received {len(shoes_bytes_list)})")
                shoes_bytes_list = shoes_bytes_list[:4]
            if len(bottom_bytes_list) > 4:
                warnings.append(f"Only 4 bottoms used, max 4 bottoms allowed (received {len(bottom_bytes_list)})")
                bottom_bytes_list = bottom_bytes_list[:4]
            if len(tops_bytes_list) > 4:
                warnings.append(f"Only 4 tops used, max 4 tops allowed (received {len(tops_bytes_list)})")
                tops_bytes_list = tops_bytes_list[:4]
            if len(accessory_bytes_list) > 6:
                warnings.append(f"Only 6 accessories used, max 6 accessories allowed (received {len(accessory_bytes_list)})")
                accessory_bytes_list = accessory_bytes_list[:6]
            
            # Load images
            shoe_imgs = []
            bottom_imgs = []
            top_imgs = []
            accessory_imgs = []
            
            for i, shoe_bytes in enumerate(shoes_bytes_list):
                if shoe_bytes:
                    try:
                        shoe_imgs.append(Image.open(io.BytesIO(shoe_bytes)).convert("RGBA"))
                    except Exception as e:
                        logger.warning(f"Failed to load shoe {i}: {e}")
            
            for i, bottom_bytes in enumerate(bottom_bytes_list):
                if bottom_bytes:
                    try:
                        bottom_imgs.append(Image.open(io.BytesIO(bottom_bytes)).convert("RGBA"))
                    except Exception as e:
                        logger.warning(f"Failed to load bottom {i}: {e}")
            
            for i, top_bytes in enumerate(tops_bytes_list):
                if top_bytes:
                    try:
                        top_imgs.append(Image.open(io.BytesIO(top_bytes)).convert("RGBA"))
                    except Exception as e:
                        logger.warning(f"Failed to load top {i}: {e}")
            
            for i, acc_bytes in enumerate(accessory_bytes_list):
                if acc_bytes:
                    try:
                        accessory_imgs.append(Image.open(io.BytesIO(acc_bytes)).convert("RGBA"))
                    except Exception as e:
                        logger.warning(f"Failed to load accessory {i}: {e}")
            
            if not any([shoe_imgs, bottom_imgs, top_imgs, accessory_imgs]):
                logger.error("No valid images provided")
                return None, warnings
            
            # **DIMENSIONS** (compact, so 4 can fit horizontally)
            shoe_w, shoe_h = 100, 80         # Small shoes
            bottom_w, bottom_h = 100, 120    # Medium bottoms
            top_w, top_h = 100, 120          # Tops
            acc_w, acc_h = 80, 80            # Accessories
            
            has_shoes = len(shoe_imgs) > 0
            has_bottoms = len(bottom_imgs) > 0
            has_tops = len(top_imgs) > 0
            has_accessories = len(accessory_imgs) > 0
            
            # **Calculate canvas height (compact, no gaps)**
            current_y = 0
            if has_shoes:
                current_y += shoe_h
            if has_bottoms:
                current_y += bottom_h
            if has_tops:
                current_y += top_h
            if has_accessories:
                current_y += acc_h
            
            if canvas_height is None:
                canvas_height = current_y + 20  # +20 padding
            
            canvas = Image.new("RGBA", (canvas_width, canvas_height), (255, 255, 255, 0))
            
            # **PLACEMENT - Bottom to Top**
            current_y = canvas_height  # Start from bottom
            
            # **SHOES row** (bottom)
            if has_shoes:
                current_y -= shoe_h
                total_shoe_width = len(shoe_imgs) * shoe_w
                shoe_start_x = (canvas_width - total_shoe_width) // 2
                
                for i, shoe_img in enumerate(shoe_imgs):
                    shoe_resized = self._resize_fit(shoe_img, shoe_w, shoe_h)
                    shoe_x = shoe_start_x + i * shoe_w
                    canvas.paste(shoe_resized, (shoe_x, current_y), shoe_resized)
                    logger.debug(f"Shoe {i+1} at y={current_y} x={shoe_x}")
            
            # **BOTTOMS row** (above shoes)
            if has_bottoms:
                current_y -= bottom_h
                total_bottom_width = len(bottom_imgs) * bottom_w
                bottom_start_x = (canvas_width - total_bottom_width) // 2
                
                for i, bottom_img in enumerate(bottom_imgs):
                    bottom_resized = self._resize_fit(bottom_img, bottom_w, bottom_h)
                    bottom_x = bottom_start_x + i * bottom_w
                    canvas.paste(bottom_resized, (bottom_x, current_y), bottom_resized)
                    logger.debug(f"Bottom {i+1} at y={current_y} x={bottom_x}")
            
            # **TOPS row** (above bottoms)
            if has_tops:
                current_y -= top_h
                total_top_width = len(top_imgs) * top_w
                top_start_x = (canvas_width - total_top_width) // 2
                
                for i, top_img in enumerate(top_imgs):
                    top_resized = self._resize_fit(top_img, top_w, top_h)
                    top_x = top_start_x + i * top_w
                    canvas.paste(top_resized, (top_x, current_y), top_resized)
                    logger.debug(f"Top {i+1} at y={current_y} x={top_x}")
            
            # **ACCESSORIES row** (top)
            if has_accessories:
                current_y -= acc_h
                total_acc_width = len(accessory_imgs) * acc_w
                acc_start_x = (canvas_width - total_acc_width) // 2
                
                for i, acc_img in enumerate(accessory_imgs):
                    acc_resized = self._resize_fit(acc_img, acc_w, acc_h)
                    acc_x = acc_start_x + i * acc_w
                    canvas.paste(acc_resized, (acc_x, current_y), acc_resized)
                    logger.debug(f"Accessory {i+1} at y={current_y} x={acc_x}")
            
            logger.info(f"Layout complete: {len(shoe_imgs)} shoes + {len(bottom_imgs)} bottoms + {len(top_imgs)} tops + {len(accessory_imgs)} accessories")
            logger.info(f"   Generated {canvas_width}x{canvas_height}px image")
            
            # Convert to PNG
            output = io.BytesIO()
            canvas.save(output, format="PNG")
            output.seek(0)
            
            return output.getvalue(), warnings
            
        except Exception as e:
            logger.error(f"Failed: {e}")
            logger.error(traceback.format_exc())
            return None, []
    
    async def combine_outfit_items(
        self,
        shoes_item = None,
        bottom_item = None,
        top_item = None,
        accessory_item = None
    ) -> Optional[bytes]:
        """
        Combine outfit items from WearableItem objects (loads images from disk).
        
        Args:
            shoes_item: WearableItem (shoes)
            bottom_item: WearableItem (bottom)
            top_item: WearableItem (top/shirt)
            accessory_item: WearableItem (accessory, optional)
            
        Returns:
            Combined outfit image as PNG bytes, or None if failed
        """
        try:
            shoes_bytes = None
            bottom_bytes = None
            top_bytes = None
            accessory_bytes = None
            
            # Load images from items (stub - would need image_path in WearableItem)
            # For now, just pass None to combine_outfit
            
            return await self.combine_outfit(
                shoes_bytes=shoes_bytes,
                bottom_bytes=bottom_bytes,
                top_bytes=top_bytes,
                accessory_bytes=accessory_bytes
            )
            
        except Exception as e:
            logger.error(f"Failed to combine outfit items: {e}")
            return None
    
    def _resize_fit(self, image: Image.Image, width: int, height: int) -> Image.Image:
        """
        Resize image to fit within dimensions while maintaining aspect ratio.
        
        Args:
            image: Input image
            width: Target width
            height: Target height
            
        Returns:
            Resized image padded to exact dimensions
        """
        # Calculate aspect ratios
        img_aspect = image.width / image.height
        target_aspect = width / height
        
        # Resize based on which dimension is limiting
        if img_aspect > target_aspect:
            # Width is limiting
            new_width = width
            new_height = int(width / img_aspect)
        else:
            # Height is limiting
            new_height = height
            new_width = int(height * img_aspect)
        
        # Resize
        resized = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Create canvas and center image
        canvas = Image.new("RGBA", (width, height), (255, 255, 255, 0))
        x = (width - new_width) // 2
        y = (height - new_height) // 2
        canvas.paste(resized, (x, y), resized)
        
        return canvas

