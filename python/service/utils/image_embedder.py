"""Image embedding utilities using SentenceTransformers."""
import torch
from sentence_transformers import SentenceTransformer
from PIL import Image
import numpy as np
from pathlib import Path
from typing import List, Union


class ImageEmbedder:
    """Handles image embedding generation using CLIP model."""
    
    def __init__(self, model_name: str = 'clip-ViT-B-32'):
        """
        Initialize the image embedder.
        
        Args:
            model_name: Name of the SentenceTransformer model to use
        """
        print(f"Loading model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model.to(self.device)
        print(f"Model loaded on device: {self.device}")
    
    def embed_image(self, image_path: Union[str, Path]) -> List[float]:
        """
        Generate embedding for a single image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of floats representing the image embedding
        """
        img = Image.open(image_path).convert('RGB')
        embedding = self.model.encode(img, convert_to_numpy=True)
        return embedding.tolist()
    
    def embed_images(self, image_paths: List[Union[str, Path]], batch_size: int = 32) -> List[List[float]]:
        """
        Generate embeddings for multiple images in batches.
        
        Args:
            image_paths: List of paths to image files
            batch_size: Number of images to process at once
            
        Returns:
            List of embeddings
        """
        images = [Image.open(path).convert('RGB') for path in image_paths]
        embeddings = self.model.encode(images, batch_size=batch_size, convert_to_numpy=True, show_progress_bar=True)
        return embeddings.tolist()
    
    @property
    def embedding_dim(self) -> int:
        """Get the dimensionality of embeddings."""
        return self.model.get_sentence_embedding_dimension()
