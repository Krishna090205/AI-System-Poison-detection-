"""
Generate synthetic test datasets with poisoned samples
"""
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification

def generate_clean_dataset(n_samples=1000, n_features=20):
    """Generate clean dataset"""
    X, y = make_classification(
        n_samples=n_samples,
        n_features=n_features,
        n_informative=15,
        n_redundant=5,
        random_state=42
    )
    
    df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(n_features)])
    df['label'] = y
    
    return df

def inject_label_flipping(df, poison_ratio=0.1):
    """Inject label flipping attack"""
    n_poison = int(len(df) * poison_ratio)
    poison_indices = np.random.choice(len(df), n_poison, replace=False)
    df.loc[poison_indices, 'label'] = 1 - df.loc[poison_indices, 'label']
    return df

def inject_outliers(df, poison_ratio=0.05):
    """Inject outlier poisoning"""
    n_poison = int(len(df) * poison_ratio)
    poison_indices = np.random.choice(len(df), n_poison, replace=False)
    
    for idx in poison_indices:
        df.iloc[idx, :-1] = df.iloc[idx, :-1] * np.random.uniform(5, 10)
    
    return df

def inject_backdoor(df, poison_ratio=0.05):
    """Inject backdoor attack"""
    n_poison = int(len(df) * poison_ratio)
    poison_indices = np.random.choice(len(df), n_poison, replace=False)
    
    # Add trigger pattern
    for idx in poison_indices:
        df.iloc[idx, 0:3] = 999  # Trigger pattern
        df.iloc[idx, -1] = 1  # Target label
    
    return df

def inject_noise(df, poison_ratio=0.1):
    """Inject noisy data"""
    n_poison = int(len(df) * poison_ratio)
    poison_indices = np.random.choice(len(df), n_poison, replace=False)
    
    for idx in poison_indices:
        noise = np.random.normal(0, 2, len(df.columns) - 1)
        df.iloc[idx, :-1] = df.iloc[idx, :-1] + noise
    
    return df

if __name__ == "__main__":
    # Generate test datasets
    print("Generating test datasets...")
    
    # Clean dataset
    df_clean = generate_clean_dataset()
    df_clean.to_csv('clean_dataset.csv', index=False)
    print("✓ clean_dataset.csv")
    
    # Poisoned datasets
    df_label_flip = inject_label_flipping(generate_clean_dataset())
    df_label_flip.to_csv('label_flipping_dataset.csv', index=False)
    print("✓ label_flipping_dataset.csv")
    
    df_outlier = inject_outliers(generate_clean_dataset())
    df_outlier.to_csv('outlier_poisoning_dataset.csv', index=False)
    print("✓ outlier_poisoning_dataset.csv")
    
    df_backdoor = inject_backdoor(generate_clean_dataset())
    df_backdoor.to_csv('backdoor_dataset.csv', index=False)
    print("✓ backdoor_dataset.csv")
    
    df_noisy = inject_noise(generate_clean_dataset())
    df_noisy.to_csv('noisy_dataset.csv', index=False)
    print("✓ noisy_dataset.csv")
    
    print("\nTest datasets generated successfully!")
