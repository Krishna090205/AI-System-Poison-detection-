"""
Research-Level Hybrid ML Pipeline for Data Poisoning Detection
Uses 7 machine learning models for comprehensive anomaly detection
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.neighbors import LocalOutlierFactor
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.svm import OneClassSVM
from sklearn.neural_network import MLPRegressor
import xgboost as xgb
from typing import Dict, List, Tuple
import logging
import warnings

warnings.filterwarnings('ignore')
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PoisonDetector:
    """
    Research-Level Hybrid Anomaly Detection System
    Uses 7 ML models for comprehensive poisoned data detection
    """
    
    def __init__(self):
        logger.info("Initializing 7-model hybrid AI framework...")
        
        # Model 1: Isolation Forest - Global anomaly detection
        self.isolation_forest = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100,
            max_samples='auto',
            n_jobs=-1
        )
        
        # Model 2: Local Outlier Factor - Density-based anomaly detection
        self.lof = LocalOutlierFactor(
            n_neighbors=20,
            contamination=0.1,
            novelty=False,
            n_jobs=-1
        )
        
        # Model 3: PCA - Reconstruction error based detection
        self.pca = PCA(n_components=0.95, random_state=42)
        
        # Model 4: One-Class SVM - Boundary anomaly detection
        self.one_class_svm = OneClassSVM(
            kernel='rbf',
            gamma='auto',
            nu=0.1
        )
        
        # Model 5: Autoencoder (using MLP as lightweight alternative)
        self.autoencoder = MLPRegressor(
            hidden_layer_sizes=(64, 32, 64),
            activation='relu',
            solver='adam',
            max_iter=100,
            random_state=42,
            early_stopping=True,
            validation_fraction=0.1
        )
        
        # Model 6: XGBoost Classifier - Attack type classification
        self.xgboost_classifier = xgb.XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            n_jobs=-1,
            eval_metric='mlogloss'
        )
        
        # Model 7: Random Forest - Verification and false positive reduction
        self.random_forest = RandomForestClassifier(
            n_estimators=100,
            random_state=42,
            max_depth=10,
            n_jobs=-1
        )
        
        self.scaler = StandardScaler()
        self.is_trained = False
        
        self.poison_types = [
            'Label Flipping Attack',
            'Outlier Poisoning',
            'Noisy Data Injection',
            'Feature Manipulation',
            'Unknown Anomaly'
        ]
        
        logger.info("✓ All 7 models initialized successfully")
    
    def _make_json_safe(self, value):
        """Convert value to JSON-safe format"""
        if isinstance(value, (np.floating, float)):
            if np.isnan(value) or np.isinf(value):
                return 0.0
            return float(value)
        elif isinstance(value, (np.integer, int)):
            return int(value)
        elif isinstance(value, dict):
            return {k: self._make_json_safe(v) for k, v in value.items()}
        elif isinstance(value, (list, tuple)):
            return [self._make_json_safe(v) for v in value]
        else:
            return value
    
    def analyze_dataset(self, X: np.ndarray, original_df=None, feature_names=None) -> Dict:
        """
        Research-level analysis pipeline using 7 ML models
        
        Args:
            X: Feature matrix (n_samples, n_features)
            original_df: Original DataFrame with all columns (optional)
            feature_names: List of feature names (optional)
            
        Returns:
            Dictionary with comprehensive analysis results including exact locations
        """
        logger.info(f"🔬 Starting research-level analysis on {X.shape[0]} samples with {X.shape[1]} features")
        
        # Store feature names for location tracking
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]
        self.feature_names = feature_names
        
        # Step 1: Train all 7 models and get anomaly scores
        logger.info("🤖 Training Model 1/7: Isolation Forest...")
        iso_scores = self._train_isolation_forest(X)
        
        logger.info("🤖 Training Model 2/7: Local Outlier Factor...")
        lof_scores = self._train_lof(X)
        
        logger.info("🤖 Training Model 3/7: PCA Reconstruction...")
        pca_scores = self._train_pca_anomaly(X)
        
        logger.info("🤖 Training Model 4/7: One-Class SVM...")
        svm_scores = self._train_one_class_svm(X)
        
        logger.info("🤖 Training Model 5/7: Autoencoder...")
        autoencoder_scores = self._train_autoencoder(X)
        
        # Step 2: Aggregate anomaly scores from 5 models
        logger.info("📊 Aggregating anomaly scores from 5 models...")
        poison_scores = self._aggregate_anomaly_scores(
            iso_scores, lof_scores, pca_scores, svm_scores, autoencoder_scores
        )
        poison_ratings = self._scores_to_ratings(poison_scores)
        
        # Step 3: Classify poison types using XGBoost (Model 6) and Random Forest (Model 7)
        logger.info("🤖 Training Model 6/7: XGBoost Classifier...")
        logger.info("🤖 Training Model 7/7: Random Forest Classifier...")
        poison_types, confidences = self._classify_with_ensemble(X, poison_scores)
        
        # Step 4: Generate fix recommendations with exact locations
        logger.info("💡 Generating fix recommendations with exact locations...")
        recommendations = self._generate_recommendations(poison_types, poison_scores)
        
        # Step 5: Identify problematic features for each sample
        logger.info("📍 Identifying exact problem locations...")
        problem_locations = self._identify_problem_locations(X, poison_scores, poison_types)
        
        # Step 6: Generate detailed fix instructions
        logger.info("🔧 Generating detailed fix instructions...")
        detailed_fixes = self._generate_detailed_fixes(X, poison_types, poison_scores, problem_locations, original_df)
        
        # Step 7: Compile detailed results
        results = []
        for i in range(len(X)):
            result = {
                'sample_id': i,
                'row_number': i + 1,  # 1-indexed for user display
                'poison_score': self._make_json_safe(poison_scores[i]),
                'poison_rating': int(poison_ratings[i]),
                'poison_type': poison_types[i],
                'confidence_score': self._make_json_safe(confidences[i]),
                'suggested_fix': recommendations[i],
                'problem_location': self._make_json_safe(problem_locations[i]),
                'detailed_fix': self._make_json_safe(detailed_fixes[i]),
                'model_scores': {
                    'isolation_forest': self._make_json_safe(iso_scores[i]),
                    'lof': self._make_json_safe(lof_scores[i]),
                    'pca': self._make_json_safe(pca_scores[i]),
                    'one_class_svm': self._make_json_safe(svm_scores[i]),
                    'autoencoder': self._make_json_safe(autoencoder_scores[i])
                }
            }
            
            # Add original data values if available (make JSON-safe)
            if original_df is not None:
                original_values = original_df.iloc[i].to_dict()
                result['original_values'] = self._make_json_safe(original_values)
            
            results.append(result)
        
        # Calculate summary statistics
        poisoned_count = sum(1 for s in poison_scores if s >= 0.7)
        suspicious_count = sum(1 for s in poison_scores if 0.3 <= s < 0.7)
        clean_count = sum(1 for s in poison_scores if s < 0.3)
        high_risk_count = sum(1 for s in poison_scores if s >= 0.8)
        
        summary = {
            'total_samples': len(X),
            'poisoned_samples': poisoned_count,
            'suspicious_samples': suspicious_count,
            'clean_samples': clean_count,
            'high_risk_samples': high_risk_count,
            'avg_poison_score': self._make_json_safe(np.mean(poison_scores)),
            'max_poison_score': self._make_json_safe(np.max(poison_scores)),
            'min_poison_score': self._make_json_safe(np.min(poison_scores)),
            'models_used': 7
        }
        
        # Attack distribution
        attack_distribution = {}
        for poison_type in poison_types:
            attack_distribution[poison_type] = attack_distribution.get(poison_type, 0) + 1
        
        logger.info(f"✅ Analysis complete: {poisoned_count} poisoned, {suspicious_count} suspicious, {clean_count} clean, {high_risk_count} high-risk")
        
        return {
            'summary': summary,
            'results': results,
            'attack_distribution': attack_distribution
        }
    
    def _train_isolation_forest(self, X: np.ndarray) -> np.ndarray:
        """
        Train Isolation Forest and get anomaly scores
        Returns scores normalized to [0, 1]
        """
        self.isolation_forest.fit(X)
        scores = self.isolation_forest.score_samples(X)
        # Normalize to [0, 1] where 1 is most anomalous
        normalized_scores = 1 - (scores - scores.min()) / (scores.max() - scores.min() + 1e-10)
        return normalized_scores
    
    def _train_lof(self, X: np.ndarray) -> np.ndarray:
        """
        Train Local Outlier Factor and get anomaly scores
        Returns scores normalized to [0, 1]
        """
        lof_scores = self.lof.fit_predict(X)
        negative_factors = self.lof.negative_outlier_factor_
        # Normalize to [0, 1] where 1 is most anomalous
        normalized_scores = 1 - (negative_factors - negative_factors.min()) / (negative_factors.max() - negative_factors.min() + 1e-10)
        return normalized_scores
    
    def _train_pca_anomaly(self, X: np.ndarray) -> np.ndarray:
        """
        Model 3: Use PCA reconstruction error as anomaly score
        Returns scores normalized to [0, 1]
        """
        # Fit PCA
        self.pca.fit(X)
        
        # Transform and inverse transform
        X_transformed = self.pca.transform(X)
        X_reconstructed = self.pca.inverse_transform(X_transformed)
        
        # Calculate reconstruction error
        reconstruction_errors = np.mean((X - X_reconstructed) ** 2, axis=1)
        
        # Normalize to [0, 1]
        normalized_scores = (reconstruction_errors - reconstruction_errors.min()) / (reconstruction_errors.max() - reconstruction_errors.min() + 1e-10)
        return normalized_scores
    
    def _train_one_class_svm(self, X: np.ndarray) -> np.ndarray:
        """
        Model 4: One-Class SVM for boundary anomaly detection
        Returns scores normalized to [0, 1]
        """
        # Train One-Class SVM
        self.one_class_svm.fit(X)
        
        # Get decision function scores (negative for outliers)
        decision_scores = self.one_class_svm.decision_function(X)
        
        # Normalize to [0, 1] where 1 is most anomalous
        normalized_scores = 1 - (decision_scores - decision_scores.min()) / (decision_scores.max() - decision_scores.min() + 1e-10)
        return normalized_scores
    
    def _train_autoencoder(self, X: np.ndarray) -> np.ndarray:
        """
        Model 5: Autoencoder (MLP-based) for reconstruction error detection
        Returns scores normalized to [0, 1]
        """
        try:
            # Train autoencoder to reconstruct input
            self.autoencoder.fit(X, X)
            
            # Get reconstructed data
            X_reconstructed = self.autoencoder.predict(X)
            
            # Calculate reconstruction error
            reconstruction_errors = np.mean((X - X_reconstructed) ** 2, axis=1)
            
            # Normalize to [0, 1]
            normalized_scores = (reconstruction_errors - reconstruction_errors.min()) / (reconstruction_errors.max() - reconstruction_errors.min() + 1e-10)
            return normalized_scores
        except Exception as e:
            logger.warning(f"Autoencoder training failed: {e}. Using PCA fallback.")
            # Fallback to PCA if autoencoder fails
            return self._train_pca_anomaly(X)
    
    def _aggregate_anomaly_scores(self, iso_scores: np.ndarray, lof_scores: np.ndarray, 
                                   pca_scores: np.ndarray, svm_scores: np.ndarray, 
                                   autoencoder_scores: np.ndarray) -> np.ndarray:
        """
        Aggregate anomaly scores from 5 models using weighted average
        Formula: (iso + lof + pca + svm + autoencoder) / 5
        """
        # Equal weighting for all 5 models (can be tuned)
        combined_scores = (
            iso_scores * 0.20 +
            lof_scores * 0.20 +
            pca_scores * 0.20 +
            svm_scores * 0.20 +
            autoencoder_scores * 0.20
        )
        
        # Ensure scores are in [0, 1]
        combined_scores = np.clip(combined_scores, 0, 1)
        
        return combined_scores
    
    def _scores_to_ratings(self, scores: np.ndarray) -> np.ndarray:
        """
        Convert poison scores (0-1) to ratings (0-5)
        """
        ratings = np.round(scores * 5).astype(int)
        return np.clip(ratings, 0, 5)
    
    def _classify_with_ensemble(self, X: np.ndarray, poison_scores: np.ndarray) -> Tuple[List[str], np.ndarray]:
        """
        Model 6 & 7: Classify poison types using XGBoost and Random Forest ensemble
        Both classifiers must agree for high confidence
        """
        poison_types = []
        confidences = []
        
        # Create synthetic labels for training based on poison scores and patterns
        synthetic_labels = []
        for i in range(len(X)):
            score = poison_scores[i]
            sample = X[i]
            
            if score < 0.3:
                synthetic_labels.append(0)  # Clean
            else:
                # Classify based on feature patterns
                label = self._get_synthetic_label(sample, score)
                synthetic_labels.append(label)
        
        synthetic_labels = np.array(synthetic_labels)
        
        # Train both classifiers if we have enough variety
        if len(np.unique(synthetic_labels)) > 1:
            try:
                # Train XGBoost (Model 6)
                self.xgboost_classifier.fit(X, synthetic_labels)
                xgb_predictions = self.xgboost_classifier.predict(X)
                xgb_proba = self.xgboost_classifier.predict_proba(X)
                
                # Train Random Forest (Model 7)
                self.random_forest.fit(X, synthetic_labels)
                rf_predictions = self.random_forest.predict(X)
                rf_proba = self.random_forest.predict_proba(X)
                
                # Ensemble: Both classifiers must agree for high confidence
                for i in range(len(X)):
                    xgb_pred = xgb_predictions[i]
                    rf_pred = rf_predictions[i]
                    
                    if xgb_pred == rf_pred:
                        # High confidence - both agree
                        poison_type = self._label_to_type(xgb_pred)
                        confidence = (xgb_proba[i][xgb_pred] + rf_proba[i][rf_pred]) / 2
                    else:
                        # Low confidence - disagreement
                        poison_type = 'Unknown Anomaly'
                        confidence = 0.5
                    
                    poison_types.append(poison_type)
                    confidences.append(confidence)
                
            except Exception as e:
                logger.warning(f"Ensemble classification failed: {e}. Using heuristic fallback.")
                return self._classify_poison_types_heuristic(X, poison_scores)
        else:
            # Fallback to heuristic method
            return self._classify_poison_types_heuristic(X, poison_scores)
        
        return poison_types, np.array(confidences)
    
    def _get_synthetic_label(self, sample: np.ndarray, score: float) -> int:
        """
        Generate synthetic label for training classifiers
        """
        feature_std = np.std(sample)
        feature_mean = np.mean(sample)
        feature_max = np.max(np.abs(sample))
        
        if feature_max > 3.0:
            return 1  # Outlier Poisoning
        elif feature_std > 2.0:
            return 2  # Noisy Data Injection
        elif feature_mean > 2.0 or feature_mean < -2.0:
            return 3  # Feature Manipulation
        elif score > 0.7:
            return 4  # Label Flipping Attack
        else:
            return 5  # Unknown Anomaly
    
    def _label_to_type(self, label: int) -> str:
        """
        Convert numeric label to poison type string
        """
        label_map = {
            0: 'Clean',
            1: 'Outlier Poisoning',
            2: 'Noisy Data Injection',
            3: 'Feature Manipulation',
            4: 'Label Flipping Attack',
            5: 'Unknown Anomaly'
        }
        return label_map.get(label, 'Unknown Anomaly')
    
    def _classify_poison_types_heuristic(self, X: np.ndarray, poison_scores: np.ndarray) -> Tuple[List[str], np.ndarray]:
        """
        Heuristic-based classification fallback
        """
        poison_types = []
        confidences = []
        
        for i in range(len(X)):
            score = poison_scores[i]
            sample = X[i]
            
            if score < 0.3:
                poison_types.append('Clean')
                confidences.append(1.0 - score)
            elif score < 0.5:
                poison_types.append('Unknown Anomaly')
                confidences.append(0.5)
            else:
                poison_type, confidence = self._detect_poison_pattern(sample, score)
                poison_types.append(poison_type)
                confidences.append(confidence)
        
        return poison_types, np.array(confidences)
    
    def _detect_poison_pattern(self, sample: np.ndarray, score: float) -> Tuple[str, float]:
        """
        Detect specific poison pattern based on feature analysis
        """
        # Calculate feature statistics
        feature_std = np.std(sample)
        feature_mean = np.mean(sample)
        feature_max = np.max(np.abs(sample))
        
        # Heuristic rules for classification
        if feature_max > 3.0:
            # Extreme values suggest outlier poisoning
            return 'Outlier Poisoning', min(score + 0.1, 1.0)
        elif feature_std > 2.0:
            # High variance suggests noisy data
            return 'Noisy Data Injection', min(score + 0.05, 1.0)
        elif feature_mean > 2.0 or feature_mean < -2.0:
            # Shifted distribution suggests feature manipulation
            return 'Feature Manipulation', min(score, 1.0)
        elif score > 0.7:
            # High score with normal features suggests label flipping
            return 'Label Flipping Attack', min(score, 1.0)
        else:
            return 'Unknown Anomaly', score * 0.8
    
    def _generate_recommendations(self, poison_types: List[str], poison_scores: np.ndarray) -> List[str]:
        """
        Generate fix recommendations based on poison type
        """
        recommendations = []
        
        for poison_type, score in zip(poison_types, poison_scores):
            if poison_type == 'Clean':
                recommendations.append('No action needed - sample is clean')
            elif poison_type == 'Label Flipping Attack':
                recommendations.append('Review and verify the label for this sample')
            elif poison_type == 'Outlier Poisoning':
                recommendations.append('Consider removing this outlier sample')
            elif poison_type == 'Noisy Data Injection':
                recommendations.append('Clean or smooth the noisy features')
            elif poison_type == 'Feature Manipulation':
                recommendations.append('Investigate feature values for manipulation')
            elif poison_type == 'Unknown Anomaly':
                if score > 0.5:
                    recommendations.append('Manual review recommended - anomaly detected')
                else:
                    recommendations.append('Monitor this sample - slightly suspicious')
            else:
                recommendations.append('Further investigation needed')
        
        return recommendations
    
    def _identify_problem_locations(self, X: np.ndarray, poison_scores: np.ndarray, 
                                     poison_types: List[str]) -> List[Dict]:
        """
        Identify exact features/columns that are problematic in each sample
        """
        problem_locations = []
        
        for i in range(len(X)):
            sample = X[i]
            score = poison_scores[i]
            poison_type = poison_types[i]
            
            location = {
                'row': i + 1,  # 1-indexed
                'problematic_features': [],
                'feature_issues': {}
            }
            
            if score < 0.3:
                # Clean sample
                location['problematic_features'] = []
                location['feature_issues'] = {}
            else:
                # Identify problematic features
                feature_scores = np.abs(sample)
                feature_std = np.std(sample)
                feature_mean = np.mean(sample)
                
                # Find features that deviate significantly
                for j, (value, feature_name) in enumerate(zip(sample, self.feature_names)):
                    issue = None
                    
                    if np.abs(value) > 3.0:
                        issue = f"Extreme value: {value:.4f} (>3 std deviations)"
                    elif poison_type == 'Noisy Data Injection' and np.abs(value - feature_mean) > 2 * feature_std:
                        issue = f"Noisy value: {value:.4f} (high variance)"
                    elif poison_type == 'Feature Manipulation' and (value > 2.0 or value < -2.0):
                        issue = f"Manipulated value: {value:.4f} (shifted distribution)"
                    
                    if issue:
                        location['problematic_features'].append(feature_name)
                        location['feature_issues'][feature_name] = {
                            'column_index': j,
                            'value': float(value),
                            'issue': issue
                        }
            
            problem_locations.append(location)
        
        return problem_locations
    
    def _generate_detailed_fixes(self, X: np.ndarray, poison_types: List[str], 
                                  poison_scores: np.ndarray, problem_locations: List[Dict],
                                  original_df) -> List[Dict]:
        """
        Generate detailed step-by-step fix instructions with exact locations
        """
        detailed_fixes = []
        
        for i in range(len(X)):
            poison_type = poison_types[i]
            score = poison_scores[i]
            location = problem_locations[i]
            
            fix = {
                'action': '',
                'steps': [],
                'exact_location': f"Row {location['row']}",
                'affected_columns': location['problematic_features'],
                'severity': 'low' if score < 0.3 else 'medium' if score < 0.7 else 'high'
            }
            
            if poison_type == 'Clean':
                fix['action'] = 'No action required'
                fix['steps'] = ['This sample is clean and does not require any fixes.']
            
            elif poison_type == 'Outlier Poisoning':
                fix['action'] = 'Remove or investigate outlier'
                fix['steps'] = [
                    f"1. Locate Row {location['row']} in your dataset",
                    f"2. Problematic columns: {', '.join(location['problematic_features']) if location['problematic_features'] else 'Multiple features'}",
                    "3. Options:",
                    "   a) Delete this entire row if it's clearly invalid",
                    "   b) Replace extreme values with median/mean of the column",
                    "   c) Cap values at 3 standard deviations from mean",
                    "4. Verify the fix doesn't affect data integrity"
                ]
                
                # Add specific column fixes
                if location['feature_issues']:
                    fix['steps'].append("5. Specific column fixes:")
                    for feature_name, issue_info in location['feature_issues'].items():
                        fix['steps'].append(f"   - {feature_name}: Current value {issue_info['value']:.4f} → Replace with column median")
            
            elif poison_type == 'Label Flipping Attack':
                fix['action'] = 'Verify and correct label'
                fix['steps'] = [
                    f"1. Locate Row {location['row']} in your dataset",
                    "2. Check if the label/target column is correct",
                    "3. Compare with similar samples in the dataset",
                    "4. If label is incorrect:",
                    "   a) Correct the label based on domain knowledge",
                    "   b) Or remove the sample if label is uncertain",
                    "5. Document the change for audit trail"
                ]
            
            elif poison_type == 'Noisy Data Injection':
                fix['action'] = 'Clean noisy features'
                fix['steps'] = [
                    f"1. Locate Row {location['row']} in your dataset",
                    f"2. Noisy columns: {', '.join(location['problematic_features']) if location['problematic_features'] else 'Multiple features'}",
                    "3. Apply smoothing techniques:",
                    "   a) Moving average filter",
                    "   b) Median filter",
                    "   c) Gaussian smoothing",
                    "4. Or replace with interpolated values from neighboring samples",
                    "5. Verify cleaned values are within expected range"
                ]
                
                if location['feature_issues']:
                    fix['steps'].append("6. Specific column fixes:")
                    for feature_name, issue_info in location['feature_issues'].items():
                        fix['steps'].append(f"   - {feature_name}: Smooth value {issue_info['value']:.4f}")
            
            elif poison_type == 'Feature Manipulation':
                fix['action'] = 'Investigate and correct manipulated features'
                fix['steps'] = [
                    f"1. Locate Row {location['row']} in your dataset",
                    f"2. Manipulated columns: {', '.join(location['problematic_features']) if location['problematic_features'] else 'Multiple features'}",
                    "3. Check if values are within expected domain range",
                    "4. Compare with distribution of other samples",
                    "5. Options:",
                    "   a) Correct values if you know the true values",
                    "   b) Replace with column mean/median",
                    "   c) Remove the sample if too many features are affected",
                    "6. Investigate source of manipulation to prevent future issues"
                ]
            
            elif poison_type == 'Unknown Anomaly':
                fix['action'] = 'Manual review required'
                fix['steps'] = [
                    f"1. Locate Row {location['row']} in your dataset",
                    "2. Manually inspect all feature values",
                    "3. Compare with similar samples",
                    "4. Check for:",
                    "   a) Data entry errors",
                    "   b) Measurement errors",
                    "   c) Encoding issues",
                    "   d) Missing value indicators (e.g., -999, 0)",
                    "5. Decide whether to:",
                    "   a) Correct specific values",
                    "   b) Remove the sample",
                    "   c) Keep if it's a valid edge case"
                ]
            
            detailed_fixes.append(fix)
        
        return detailed_fixes
    
    def get_top_suspicious_samples(self, results: List[Dict], top_n: int = 10) -> List[Dict]:
        """
        Get top N most suspicious samples
        """
        sorted_results = sorted(results, key=lambda x: x['poison_score'], reverse=True)
        return sorted_results[:top_n]
    
    def filter_by_poison_type(self, results: List[Dict], poison_type: str) -> List[Dict]:
        """
        Filter results by poison type
        """
        return [r for r in results if r['poison_type'] == poison_type]
    
    def filter_by_score_threshold(self, results: List[Dict], threshold: float) -> List[Dict]:
        """
        Filter results by minimum poison score
        """
        return [r for r in results if r['poison_score'] >= threshold]

