"""
Model Accuracy Evaluation and Metrics
Comprehensive evaluation of the 7-model hybrid ML framework
"""
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error
)
from ml_models.poison_detector import PoisonDetector
import logging

logger = logging.getLogger(__name__)


class ModelEvaluator:
    """Evaluate accuracy and performance of the poison detection models"""
    
    def __init__(self):
        self.detector = PoisonDetector()
        self.metrics = {}
    
    def evaluate_on_synthetic_data(self, n_clean=500, n_poisoned=100):
        """
        Evaluate models on synthetic poisoned and clean data
        
        Args:
            n_clean: Number of clean samples to generate
            n_poisoned: Number of poisoned samples to generate
            
        Returns:
            Dictionary with comprehensive accuracy metrics
        """
        print("\n" + "="*60)
        print("MODEL ACCURACY EVALUATION")
        print("="*60)
        
        # Generate synthetic clean data
        np.random.seed(42)
        X_clean = np.random.randn(n_clean, 10)  # 10 features
        y_clean = np.zeros(n_clean)  # Label: 0 = clean
        
        # Generate synthetic poisoned data (various attack types)
        X_poisoned = np.random.randn(n_poisoned, 10)
        
        # Add different types of poisoning
        # 1. Outlier poisoning (extreme values)
        X_poisoned[:25] = X_poisoned[:25] * 5  # Extreme values
        
        # 2. Label flipping (no feature change, but label is wrong)
        # 3. Noisy injection (add Gaussian noise)
        X_poisoned[25:50] = X_poisoned[25:50] + np.random.randn(25, 10) * 2
        
        # 4. Feature manipulation (shift distribution)
        X_poisoned[50:75] = X_poisoned[50:75] + 3
        
        # 5. Mixed poisoning
        X_poisoned[75:] = X_poisoned[75:] + np.random.randn(n_poisoned-75, 10) * 1.5
        
        y_poisoned = np.ones(n_poisoned)  # Label: 1 = poisoned
        
        # Combine datasets
        X_combined = np.vstack([X_clean, X_poisoned])
        y_true = np.hstack([y_clean, y_poisoned])
        
        print(f"\nDataset Composition:")
        print(f"  Clean samples: {n_clean}")
        print(f"  Poisoned samples: {n_poisoned}")
        print(f"  Total samples: {len(X_combined)}")
        print(f"  Features: {X_combined.shape[1]}")
        
        # Run analysis
        print(f"\nRunning 7-model analysis...")
        analysis_results = self.detector.analyze_dataset(X_combined)
        
        # Extract poison scores
        poison_scores = np.array([r['poison_score'] for r in analysis_results['results']])
        
        # Convert scores to binary predictions (threshold = 0.5)
        y_pred = (poison_scores >= 0.5).astype(int)
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        precision = precision_score(y_true, y_pred, zero_division=0)
        recall = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        
        # ROC-AUC score
        try:
            roc_auc = roc_auc_score(y_true, poison_scores)
        except:
            roc_auc = 0.0
        
        # Confusion matrix
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        
        # Specificity and Sensitivity
        specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
        sensitivity = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        # False Positive Rate and False Negative Rate
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
        fnr = fn / (fn + tp) if (fn + tp) > 0 else 0
        
        # Store metrics
        self.metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'roc_auc': roc_auc,
            'specificity': specificity,
            'sensitivity': sensitivity,
            'false_positive_rate': fpr,
            'false_negative_rate': fnr,
            'true_positives': int(tp),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'threshold': 0.5
        }
        
        # Print results
        print("\n" + "-"*60)
        print("ACCURACY METRICS (Threshold = 0.5)")
        print("-"*60)
        print(f"Accuracy:              {accuracy:.4f} ({accuracy*100:.2f}%)")
        print(f"Precision:             {precision:.4f} ({precision*100:.2f}%)")
        print(f"Recall (Sensitivity):  {recall:.4f} ({recall*100:.2f}%)")
        print(f"F1-Score:              {f1:.4f}")
        print(f"ROC-AUC Score:         {roc_auc:.4f}")
        print(f"Specificity:           {specificity:.4f} ({specificity*100:.2f}%)")
        print(f"False Positive Rate:   {fpr:.4f} ({fpr*100:.2f}%)")
        print(f"False Negative Rate:   {fnr:.4f} ({fnr*100:.2f}%)")
        
        print("\n" + "-"*60)
        print("CONFUSION MATRIX")
        print("-"*60)
        print(f"True Negatives (TN):   {tn}")
        print(f"False Positives (FP):  {fp}")
        print(f"False Negatives (FN):  {fn}")
        print(f"True Positives (TP):   {tp}")
        
        print("\n" + "-"*60)
        print("INTERPRETATION")
        print("-"*60)
        print(f"✓ The model correctly identifies {accuracy*100:.1f}% of all samples")
        print(f"✓ When model predicts poisoned, it's correct {precision*100:.1f}% of the time")
        print(f"✓ The model catches {recall*100:.1f}% of actual poisoned samples")
        print(f"✓ False alarm rate: {fpr*100:.1f}% (clean samples marked as poisoned)")
        print(f"✓ Missed detection rate: {fnr*100:.1f}% (poisoned samples marked as clean)")
        
        # Evaluate at different thresholds
        print("\n" + "-"*60)
        print("PERFORMANCE AT DIFFERENT THRESHOLDS")
        print("-"*60)
        
        thresholds = [0.3, 0.5, 0.7, 0.8]
        threshold_results = []
        
        for threshold in thresholds:
            y_pred_thresh = (poison_scores >= threshold).astype(int)
            acc = accuracy_score(y_true, y_pred_thresh)
            prec = precision_score(y_true, y_pred_thresh, zero_division=0)
            rec = recall_score(y_true, y_pred_thresh, zero_division=0)
            f1_thresh = f1_score(y_true, y_pred_thresh, zero_division=0)
            
            threshold_results.append({
                'threshold': threshold,
                'accuracy': acc,
                'precision': prec,
                'recall': rec,
                'f1': f1_thresh
            })
            
            print(f"\nThreshold = {threshold}:")
            print(f"  Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
            print(f"  Precision: {prec:.4f} ({prec*100:.2f}%)")
            print(f"  Recall:    {rec:.4f} ({rec*100:.2f}%)")
            print(f"  F1-Score:  {f1_thresh:.4f}")
        
        # Per-model accuracy
        print("\n" + "-"*60)
        print("INDIVIDUAL MODEL PERFORMANCE")
        print("-"*60)
        
        model_scores = {
            'Isolation Forest': [],
            'Local Outlier Factor': [],
            'PCA': [],
            'One-Class SVM': [],
            'Autoencoder': []
        }
        
        for result in analysis_results['results']:
            model_scores['Isolation Forest'].append(result['model_scores']['isolation_forest'])
            model_scores['Local Outlier Factor'].append(result['model_scores']['lof'])
            model_scores['PCA'].append(result['model_scores']['pca'])
            model_scores['One-Class SVM'].append(result['model_scores']['one_class_svm'])
            model_scores['Autoencoder'].append(result['model_scores']['autoencoder'])
        
        for model_name, scores in model_scores.items():
            scores_array = np.array(scores)
            y_pred_model = (scores_array >= 0.5).astype(int)
            acc = accuracy_score(y_true, y_pred_model)
            prec = precision_score(y_true, y_pred_model, zero_division=0)
            rec = recall_score(y_true, y_pred_model, zero_division=0)
            
            print(f"\n{model_name}:")
            print(f"  Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
            print(f"  Precision: {prec:.4f} ({prec*100:.2f}%)")
            print(f"  Recall:    {rec:.4f} ({rec*100:.2f}%)")
        
        print("\n" + "="*60)
        print("SUMMARY")
        print("="*60)
        print(f"Overall System Accuracy: {accuracy*100:.2f}%")
        print(f"Ensemble Method: Weighted average of 5 anomaly detection models")
        print(f"Classification Models: XGBoost + Random Forest ensemble")
        print(f"Recommended Threshold: 0.5 (balanced precision/recall)")
        print("="*60 + "\n")
        
        return self.metrics
    
    def get_metrics_summary(self):
        """Get summary of current metrics"""
        if not self.metrics:
            return "No metrics available. Run evaluation first."
        
        summary = f"""
MODEL ACCURACY SUMMARY
======================
Accuracy:              {self.metrics['accuracy']:.4f} ({self.metrics['accuracy']*100:.2f}%)
Precision:             {self.metrics['precision']:.4f} ({self.metrics['precision']*100:.2f}%)
Recall:                {self.metrics['recall']:.4f} ({self.metrics['recall']*100:.2f}%)
F1-Score:              {self.metrics['f1_score']:.4f}
ROC-AUC:               {self.metrics['roc_auc']:.4f}
Specificity:           {self.metrics['specificity']:.4f} ({self.metrics['specificity']*100:.2f}%)
False Positive Rate:   {self.metrics['false_positive_rate']:.4f} ({self.metrics['false_positive_rate']*100:.2f}%)
False Negative Rate:   {self.metrics['false_negative_rate']:.4f} ({self.metrics['false_negative_rate']*100:.2f}%)
"""
        return summary


if __name__ == "__main__":
    evaluator = ModelEvaluator()
    evaluator.evaluate_on_synthetic_data(n_clean=500, n_poisoned=100)
    print(evaluator.get_metrics_summary())
