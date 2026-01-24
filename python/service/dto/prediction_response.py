"""DTO for prediction API response."""
from dataclasses import dataclass
from typing import List


@dataclass
class PredictionResponse:
    """Response for image classification prediction."""
    
    category: str
    tags: List[str]
    confidence: float  # Average similarity score
    
    def to_dict(self):
        """Convert to dictionary for JSON response."""
        return {
            "category": self.category,
            "tags": self.tags,
            "confidence": round(self.confidence, 4)
        }
