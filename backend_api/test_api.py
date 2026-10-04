"""
API Testing Script
Run this to test all endpoints
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test health check endpoint"""
    print("\n1. Testing Health Check...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    print("✓ Health check passed")

def test_upload_dataset():
    """Test dataset upload"""
    print("\n2. Testing Dataset Upload...")
    
    # Create a test CSV file
    import pandas as pd
    import numpy as np
    
    df = pd.DataFrame({
        'feature_1': np.random.randn(100),
        'feature_2': np.random.randn(100),
        'feature_3': np.random.randn(100),
        'label': np.random.randint(0, 2, 100)
    })
    df.to_csv('test_upload.csv', index=False)
    
    # Upload file
    with open('test_upload.csv', 'rb') as f:
        files = {'file': ('test_upload.csv', f, 'text/csv')}
        response = requests.post(f"{BASE_URL}/upload_dataset", files=files)
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Dataset ID: {data.get('dataset_id')}")
    print(f"Samples: {data.get('num_samples')}")
    
    assert response.status_code == 200
    print("✓ Upload passed")
    
    return data['dataset_id']

def test_analyze_dataset(dataset_id):
    """Test dataset analysis"""
    print("\n3. Testing Dataset Analysis...")
    print(f"Analyzing dataset: {dataset_id}")
    
    response = requests.post(f"{BASE_URL}/analyze_dataset/{dataset_id}")
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Analysis ID: {data.get('analysis_id')}")
    print(f"Total Samples: {data.get('total_samples')}")
    print(f"Poisoned: {data.get('poisoned_samples')}")
    print(f"Suspicious: {data.get('suspicious_samples')}")
    print(f"Clean: {data.get('clean_samples')}")
    print(f"Avg Score: {data.get('avg_poison_score'):.3f}")
    print(f"Attack Distribution: {data.get('attack_distribution')}")
    
    assert response.status_code == 200
    print("✓ Analysis passed")
    
    return data['analysis_id']

def test_get_results(analysis_id):
    """Test getting analysis results"""
    print("\n4. Testing Get Results...")
    
    response = requests.get(f"{BASE_URL}/analysis_results/{analysis_id}")
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Retrieved {len(data.get('detailed_results', []))} detailed results")
    
    assert response.status_code == 200
    print("✓ Get results passed")

def test_history():
    """Test history endpoint"""
    print("\n5. Testing History...")
    
    response = requests.get(f"{BASE_URL}/history")
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"History records: {len(data.get('history', []))}")
    
    assert response.status_code == 200
    print("✓ History passed")

def run_all_tests():
    """Run all API tests"""
    print("="*50)
    print("API Testing Suite")
    print("="*50)
    
    try:
        test_health_check()
        dataset_id = test_upload_dataset()
        time.sleep(1)  # Brief pause
        analysis_id = test_analyze_dataset(dataset_id)
        time.sleep(1)
        test_get_results(analysis_id)
        test_history()
        
        print("\n" + "="*50)
        print("✓ ALL TESTS PASSED")
        print("="*50)
        
    except Exception as e:
        print(f"\n✗ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
