"""
Pydantic models for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime

class DatasetInfo(BaseModel):
    """Dataset information response"""
    dataset_id: str
    filename: str
    num_samples: int
    num_features: int
    columns: List[str]
    upload_time: datetime

class SampleResult(BaseModel):
    """Individual sample analysis result"""
    sample_id: int
    poison_score: float = Field(..., ge=0.0, le=1.0)
    poison_type: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    fix_recommendation: str
    isolation_score: float
    autoencoder_score: float
    lof_score: float

class AnalysisResponse(BaseModel):
    """Complete analysis response"""
    analysis_id: str
    dataset_id: str
    filename: Optional[str] = "Dataset"
    dataset_name: Optional[str] = "Dataset"
    total_samples: int
    poisoned_samples: int
    suspicious_samples: int
    clean_samples: int
    duplicate_samples: Optional[int] = 0
    avg_poison_score: float
    attack_distribution: Dict[str, int]
    detailed_results: List[Dict]

class AnalysisResult(BaseModel):
    """Single analysis summary"""
    analysis_id: str
    dataset_id: str
    analysis_time: datetime
    total_samples: int
    poisoned_samples: int
    duplicate_samples: Optional[int] = 0
    avg_poison_score: float

class HistoryResponse(BaseModel):
    """Analysis history response"""
    history: List[Dict]

class ErrorResponse(BaseModel):
    """Error response model"""
    detail: str
    error_code: Optional[str] = None
