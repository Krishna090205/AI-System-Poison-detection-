"""
Autoencoder Neural Network for anomaly detection
Uses reconstruction error to identify poisoned samples
"""
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

class AutoencoderDetector:
    """
    PCA-based anomaly detector (lightweight alternative to neural network autoencoder)
    High reconstruction error indicates anomalous/poisoned data
    """
    
    def __init__(self, input_dim: int, encoding_dim: int = None):
        """
        Initialize autoencoder
        
        Args:
            input_dim: Number of input features
            encoding_dim: Dimension of encoded representation (default: input_dim // 2)
        """
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim or max(input_dim // 2, 8)
        self.pca = PCA(n_components=min(self.encoding_dim, input_dim))
        self.scaler = StandardScaler()
        self.threshold = None
        self.is_trained = False
    
    def train(self, X: np.ndarray, epochs: int = 50, batch_size: int = 32):
        """
        Train autoencoder on data
        
        Args:
            X: Training data
            epochs: Number of training epochs (not used in PCA, kept for compatibility)
            batch_size: Batch size for training (not used in PCA, kept for compatibility)
        """
        # Scale data
        X_scaled = self.scaler.fit_transform(X)
        
        # Fit PCA
        self.pca.fit(X_scaled)
        
        # Calculate reconstruction error threshold
        X_reconstructed = self.pca.inverse_transform(self.pca.transform(X_scaled))
        mse = np.mean(np.square(X_scaled - X_reconstructed), axis=1)
        self.threshold = np.percentile(mse, 95)
        self.is_trained = True
    
    def get_anomaly_scores(self, X: np.ndarray) -> np.ndarray:
        """
        Calculate anomaly scores based on reconstruction error
        
        Args:
            X: Data to score
            
        Returns:
            Normalized anomaly scores (0-1, higher = more anomalous)
        """
        # Scale data
        X_scaled = self.scaler.transform(X)
        
        # Reconstruct
        X_encoded = self.pca.transform(X_scaled)
        X_reconstructed = self.pca.inverse_transform(X_encoded)
        
        # Calculate MSE
        mse = np.mean(np.square(X_scaled - X_reconstructed), axis=1)
        
        # Normalize scores to 0-1
        if self.threshold is not None:
            normalized = mse / (self.threshold + 1e-10)
        else:
            normalized = (mse - mse.min()) / (mse.max() - mse.min() + 1e-10)
        
        return np.clip(normalized, 0.0, 1.0)
    
    def save(self, filepath: str):
        """Save model to disk"""
        import joblib
        joblib.dump({
            'pca': self.pca,
            'scaler': self.scaler,
            'threshold': self.threshold,
            'is_trained': self.is_trained
        }, filepath)
    
    def load(self, filepath: str):
        """Load model from disk"""
        import joblib
        data = joblib.load(filepath)
        self.pca = data['pca']
        self.scaler = data['scaler']
        self.threshold = data['threshold']
        self.is_trained = data['is_trained']
