"""
Attack Type Classifier
Classifies poisoned samples into specific attack categories
"""
import numpy as np
from typing import Tuple

class AttackClassifier:
    """
    Classifies poisoned samples into attack types:
    - Label Flipping Attack
    - Backdoor Attack
    - Outlier Poisoning
    - Noisy Data Poisoning
    """
    
    def classify(self, sample: np.ndarray, poison_score: float) -> Tuple[str, float]:
        """
        Classify attack type based on sample features and poison score
        
        Args:
            sample: Feature vector of the sample
            poison_score: Poison score from detection models
            
        Returns:
            Tuple of (attack_type, confidence)
        """
        if poison_score < 0.3:
            return "Clean", 1.0 - poison_score
        
        # Calculate feature statistics
        feature_mean = np.mean(sample)
        feature_std = np.std(sample)
        feature_max = np.max(np.abs(sample))
        
        # Classification logic based on statistical patterns
        
        # Outlier Poisoning: extreme feature values
        if feature_max > 3.0 or feature_std > 2.0:
            confidence = min(poison_score * 1.2, 1.0)
            return "Outlier Poisoning", confidence
        
        # Backdoor Attack: specific pattern in features
        # Look for unusual feature combinations
        if self._detect_backdoor_pattern(sample):
            confidence = poison_score * 0.9
            return "Backdoor Attack", confidence
        
        # Noisy Data: moderate anomaly with high variance
        if 0.3 <= poison_score < 0.6 and feature_std > 1.0:
            confidence = poison_score * 0.8
            return "Noisy Data", confidence
        
        # Label Flipping: high poison score but normal feature distribution
        if poison_score >= 0.6 and feature_std < 1.5:
            confidence = poison_score * 0.85
            return "Label Flipping", confidence
        
        # Default to most likely based on score
        if poison_score >= 0.7:
            return "Label Flipping", poison_score
        else:
            return "Noisy Data", poison_score * 0.7
    
    def _detect_backdoor_pattern(self, sample: np.ndarray) -> bool:
        """
        Detect potential backdoor trigger patterns
        
        Backdoor attacks often have specific feature patterns
        """
        # Check for suspicious feature patterns
        # Pattern 1: Multiple features with same unusual value
        unique_values = np.unique(sample)
        if len(unique_values) < len(sample) * 0.3:
            return True
        
        # Pattern 2: Specific features with extreme values
        extreme_count = np.sum(np.abs(sample) > 2.5)
        if extreme_count >= 2:
            return True
        
        return False
