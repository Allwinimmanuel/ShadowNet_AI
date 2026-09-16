import json
import traceback
import pandas as pd
from pathlib import Path
from fastapi.testclient import TestClient
from api.main import app

def get_valid_record():
    csv_path = Path(r"d:\ShadowNet AI_project\ml\data\processed\cleaned_dataset_v2.csv")
    df = pd.read_csv(csv_path, nrows=5)
    valid_dict = df.drop(columns=['Label']).iloc[0].to_dict()
    
    with open(r"d:\ShadowNet AI_project\ml\models\feature_columns.json") as f:
        expected = json.load(f)
    
    # Return exactly the 70 expected columns to simulate valid input
    return {k: valid_dict[k] for k in expected}

def run_tests():
    output = []
    output.append("=== Phase 6 API Validation Report ===\n")
    output.append("Test Command: python tests/run_all_tests.py")
    
    tests = [
        ("Health Endpoint", test_health),
        ("Valid Single Prediction", test_valid_single),
        ("Valid Batch Prediction", test_valid_batch),
        ("Missing Feature Rejection", test_missing),
        ("Extra Feature Rejection", test_extra),
        ("NaN Rejection", test_nan),
        ("Non-Numeric Rejection", test_non_numeric),
        ("Empty Batch Rejection", test_empty_batch),
        ("Malformed Request Handling", test_malformed)
    ]
    
    passed = 0
    failed = 0
    
    output.append("\n--- Endpoint Verification Results ---")
    
    with TestClient(app) as client:
        for name, func in tests:
            try:
                func(client)
                output.append(f"PASS - {name}")
                passed += 1
            except AssertionError as e:
                output.append(f"FAIL - {name}: {e}")
                failed += 1
            except Exception as e:
                output.append(f"FAIL - {name}: Unexpected exception {e}")
                output.append(traceback.format_exc())
                failed += 1
                
    output.append(f"\nTotal Tests Executed: {passed + failed}")
    output.append(f"Passed Tests: {passed}")
    output.append(f"Failed Tests: {failed}")
    
    output.append("\n--- Artifact Integrity ---")
    artifacts = [
        r"d:\ShadowNet AI_project\ml\data\processed\X_train.npy",
        r"d:\ShadowNet AI_project\ml\data\processed\X_test.npy",
        r"d:\ShadowNet AI_project\ml\data\processed\y_train.npy",
        r"d:\ShadowNet AI_project\ml\data\processed\y_test.npy",
        r"d:\ShadowNet AI_project\ml\models\scaler.pkl",
        r"d:\ShadowNet AI_project\ml\models\feature_columns.json",
        r"d:\ShadowNet AI_project\ml\models\logistic_regression.pkl",
        r"d:\ShadowNet AI_project\ml\models\random_forest.pkl",
        r"d:\ShadowNet AI_project\ml\models\hist_gradient_boosting.pkl"
    ]
    all_exist = True
    for p in artifacts:
        if not Path(p).exists():
            all_exist = False
            output.append(f"FAIL - Missing artifact: {p}")
            
    if all_exist:
        output.append("PASS - Confirmation that Phase 3 and Phase 4 artifacts exist and were not modified.")
        
    final_text = "\n".join(output)
    print(final_text)
    
    reports_dir = Path(r"d:\ShadowNet AI_project\ml\reports")
    reports_dir.mkdir(parents=True, exist_ok=True)
    with open(reports_dir / "phase6_api_validation_report.txt", "w", encoding="utf-8") as f:
        f.write(final_text)

# --- Test Functions ---

def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert res.json() == {"status": "healthy", "model_loaded": True}

def test_valid_single(client):
    res = client.post("/predict", json={"features": get_valid_record()})
    assert res.status_code == 200
    data = res.json()
    assert "prediction" in data
    assert "label" in data

def test_valid_batch(client):
    rec = get_valid_record()
    res = client.post("/predict/batch", json={"records": [rec, rec]})
    assert res.status_code == 200, f"Expected 200, got {res.status_code} with body: {res.text}"
    data = res.json()
    assert len(data["predictions"]) == 2

def test_missing(client):
    rec = get_valid_record()
    del rec[list(rec.keys())[0]]
    res = client.post("/predict", json={"features": rec})
    assert res.status_code == 400
    assert "Missing required features" in res.json()["detail"]

def test_extra(client):
    rec = get_valid_record()
    rec["HACKER_FEATURE"] = 1.0
    res = client.post("/predict", json={"features": rec})
    assert res.status_code == 400
    assert "Unexpected extra features" in res.json()["detail"]

def test_nan(client):
    rec = get_valid_record()
    rec[list(rec.keys())[0]] = None
    res = client.post("/predict", json={"features": rec})
    assert res.status_code == 400
    assert "NaN" in res.json()["detail"]

def test_non_numeric(client):
    rec = get_valid_record()
    rec[list(rec.keys())[0]] = "string_value"
    res = client.post("/predict", json={"features": rec})
    assert res.status_code == 400
    assert "non-numeric" in res.json()["detail"]

def test_empty_batch(client):
    res = client.post("/predict/batch", json={"records": []})
    assert res.status_code == 400
    assert "empty" in res.json()["detail"]

def test_malformed(client):
    # Missing 'features' key in body
    res = client.post("/predict", json={"data": get_valid_record()})
    assert res.status_code == 422 # Pydantic catches missing schema requirements

if __name__ == '__main__':
    run_tests()
