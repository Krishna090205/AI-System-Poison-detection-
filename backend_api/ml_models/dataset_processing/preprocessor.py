"""
Enhanced Data Preprocessing Pipeline with Robust Error Handling
Handles missing values, normalization, encoding, and scaling
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """
    Robust preprocessing pipeline with comprehensive error handling
    """
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.imputer = SimpleImputer(strategy='mean')
        self.feature_names = []
        self.is_fitted = False
    
    def preprocess(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[str]]:
        """
        Complete preprocessing pipeline with error handling
        
        Args:
            df: Input dataframe
            
        Returns:
            Tuple of (processed_array, feature_names)
        """
        try:
            logger.info(f"🔄 Starting preprocessing: {df.shape[0]} rows, {df.shape[1]} columns")
            
            # Validation
            if df.empty:
                raise ValueError("Dataset is empty")
            
            if df.shape[0] < 2:
                raise ValueError("Need at least 2 samples for analysis")
            
            df_processed = df.copy()
            
            # Step 1: Remove completely empty rows/columns
            df_processed = df_processed.dropna(how='all')
            df_processed = df_processed.dropna(axis=1, how='all')
            
            if df_processed.empty:
                raise ValueError("All data is empty after removing null rows/columns")
            
            logger.info(f"After removing empty: {df_processed.shape[0]} rows, {df_processed.shape[1]} columns")
            
            # Step 2: Handle datetime columns
            df_processed = self._handle_datetime_columns(df_processed)
            
            # Step 3: Handle missing values
            df_processed = self._handle_missing_values(df_processed)
            
            # Step 4: Encode categorical variables
            df_processed = self._encode_categorical(df_processed)
            
            # Step 5: Ensure only numeric data
            df_processed = df_processed.select_dtypes(include=[np.number])
            
            if df_processed.empty or df_processed.shape[1] == 0:
                raise ValueError("No numeric features found after preprocessing")
            
            # Step 6: Remove constant columns
            df_processed = self._remove_constant_columns(df_processed)
            
            if df_processed.empty or df_processed.shape[1] == 0:
                raise ValueError("All columns are constant")
            
            # Step 7: Handle infinite values
            df_processed = df_processed.replace([np.inf, -np.inf], np.nan)
            df_processed = df_processed.fillna(df_processed.median())
            df_processed = df_processed.fillna(0)
            
            # Step 8: Feature scaling
            X_scaled = self._scale_features(df_processed)
            
            # Step 9: Final validation
            X_scaled = np.nan_to_num(X_scaled, nan=0.0, posinf=1e10, neginf=-1e10)
            
            self.feature_names = df_processed.columns.tolist()
            self.is_fitted = True
            
            logger.info(f"✅ Preprocessing complete: {X_scaled.shape[0]} samples, {X_scaled.shape[1]} features")
            
            return X_scaled, self.feature_names
            
        except Exception as e:
            logger.error(f"❌ Preprocessing failed: {str(e)}")
            raise ValueError(f"Data preprocessing failed: {str(e)}")
    
    def _handle_datetime_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle datetime columns by extracting features"""
        df_processed = df.copy()
        datetime_cols = df_processed.select_dtypes(include=['datetime64']).columns.tolist()
        
        for col in datetime_cols:
            try:
                df_processed[col] = pd.to_datetime(df_processed[col], errors='coerce')
                df_processed[f'{col}_year'] = df_processed[col].dt.year
                df_processed[f'{col}_month'] = df_processed[col].dt.month
                df_processed[f'{col}_day'] = df_processed[col].dt.day
                df_processed = df_processed.drop(columns=[col])
                logger.info(f"Converted datetime column: {col}")
            except Exception as e:
                logger.warning(f"Could not process datetime column {col}: {e}")
                df_processed = df_processed.drop(columns=[col])
        
        return df_processed
    
    def _handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values robustly"""
        df_clean = df.copy()
        
        for column in df_clean.columns:
            if df_clean[column].isnull().any():
                if df_clean[column].dtype in ['float64', 'int64', 'float32', 'int32']:
                    # Numeric: fill with median (more robust than mean)
                    median_val = df_clean[column].median()
                    if pd.isna(median_val):
                        median_val = 0
                    df_clean[column].fillna(median_val, inplace=True)
                    logger.info(f"Filled {column} with median: {median_val}")
                else:
                    # Categorical: fill with mode or 'Unknown'
                    mode_value = df_clean[column].mode()
                    if len(mode_value) > 0:
                        df_clean[column].fillna(mode_value[0], inplace=True)
                    else:
                        df_clean[column].fillna('Unknown', inplace=True)
                    logger.info(f"Filled categorical column: {column}")
        
        return df_clean
    
    def _encode_categorical(self, df: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical variables with error handling"""
        df_encoded = df.copy()
        categorical_cols = df_encoded.select_dtypes(include=['object', 'category']).columns.tolist()
        
        for column in categorical_cols:
            try:
                n_unique = df_encoded[column].nunique()
                
                # Skip if too many unique values
                if n_unique > 100:
                    logger.warning(f"Dropping {column} with {n_unique} unique values")
                    df_encoded = df_encoded.drop(columns=[column])
                    continue
                
                # Try numeric conversion first
                try:
                    df_encoded[column] = pd.to_numeric(df_encoded[column], errors='coerce')
                    df_encoded[column] = df_encoded[column].fillna(df_encoded[column].median())
                    logger.info(f"Converted {column} to numeric")
                except:
                    # Label encoding
                    le = LabelEncoder()
                    df_encoded[column] = df_encoded[column].fillna('MISSING')
                    df_encoded[column] = le.fit_transform(df_encoded[column].astype(str))
                    self.label_encoders[column] = le
                    logger.info(f"Label encoded {column}")
                    
            except Exception as e:
                logger.warning(f"Could not encode {column}: {e}. Dropping.")
                df_encoded = df_encoded.drop(columns=[column])
        
        return df_encoded
    
    def _remove_constant_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Remove columns with no variance"""
        constant_cols = [col for col in df.columns if df[col].nunique() == 1]
        if constant_cols:
            logger.warning(f"Removing {len(constant_cols)} constant columns")
            df = df.drop(columns=constant_cols)
        return df
    
    def _scale_features(self, df: pd.DataFrame) -> np.ndarray:
        """Scale features with error handling"""
        try:
            X = df.values.astype(float)
            X = np.nan_to_num(X, nan=0.0, posinf=1e10, neginf=-1e10)
            X_scaled = self.scaler.fit_transform(X)
            return X_scaled
        except Exception as e:
            logger.warning(f"Scaling failed: {e}. Using raw values.")
            return df.values.astype(float)
    
    def get_feature_statistics(self, df: pd.DataFrame) -> dict:
        """Get statistical summary"""
        try:
            stats = {
                'num_samples': len(df),
                'num_features': len(df.columns),
                'missing_values': df.isnull().sum().to_dict(),
                'data_types': df.dtypes.astype(str).to_dict(),
                'numeric_summary': df.describe().to_dict() if not df.empty else {},
                'categorical_columns': [col for col in df.columns if df[col].dtype == 'object']
            }
            return stats
        except Exception as e:
            logger.error(f"Could not generate statistics: {e}")
            return {'error': str(e)}
