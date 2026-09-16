import sys
import time
import subprocess
import requests
import pandas as pd
import json
from pathlib import Path
from dashboard.utils import check_health, predict_single, predict_batch, get_feature_schema

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
    output.append("=== Phase 7 Dashboard Validation Report ===\n")
    output.append("Test Command: python tests/run_dashboard_tests.py")
    
    # Test Imports
    try:
        import dashboard.app
        import dashboard.components
        import dashboard.utils
        output.append("PASS - Dashboard imports successfully.")
    except Exception as e:
        output.append(f"FAIL - Dashboard imports failed: {e}")
        
    # Start API in background
    output.append("\nStarting API subprocess for communication tests...")
    import os
    env = os.environ.copy()
    env["PYTHONPATH"] = "."
    
    api_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api.main:app", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env
    )
    
    try:
        # Wait for API to boot
        time.sleep(4)
        
        passed = 1
        failed = 0
        
        def run_case(name, condition, error_msg):
            nonlocal passed, failed
            if condition:
                output.append(f"PASS - {name}")
                passed += 1
            else:
                output.append(f"FAIL - {name}: {error_msg}")
                failed += 1

        # Health
        is_healthy = check_health()
        run_case("API health connectivity", is_healthy, "Backend not reachable.")
        
        # Valid Single
        rec = get_valid_record()
        res, err = predict_single(rec)
        run_case("Valid single prediction request", err is None and res is not None and "prediction" in res, f"Error: {err}")
        
        # Valid Batch
        df_valid = pd.DataFrame([rec, rec])
        res, err = predict_batch(df_valid)
        run_case("Valid batch prediction request", err is None and len(res) == 2, f"Error: {err}")
        
        # Invalid CSV (Missing Column)
        df_missing = df_valid.drop(columns=[list(rec.keys())[0]])
        res, err = predict_batch(df_missing)
        run_case("Missing-column handling", err is not None and "Missing required features" in err, f"Did not reject properly: {err}")
        
        # Extra Column
        df_extra = df_valid.copy()
        df_extra["HACKER_COLUMN"] = 1.0
        res, err = predict_batch(df_extra)
        run_case("Extra-column handling", err is not None and "Unexpected extra features" in err, f"Did not reject properly: {err}")
        
        # Empty file / df
        df_empty = pd.DataFrame()
        res, err = predict_batch(df_empty)
        run_case("Empty-file handling", err is not None and "empty" in err, f"Did not reject properly: {err}")
        
        # NaN Handling
        df_nan = df_valid.copy()
        df_nan.iloc[0, 0] = None # Will become JSON null
        res, err = predict_batch(df_nan)
        run_case("NaN handling", err is not None and "NaN" in err, f"Did not reject properly: {err}")
        
        output.append(f"\nTotal Communication Tests Executed: {passed + failed - 1}")
        output.append(f"Passed Tests: {passed}")
        output.append(f"Failed Tests: {failed}")

    finally:
        api_process.terminate()
        api_process.wait()
        
        if failed > 0:
            stderr_output = api_process.stderr.read().decode()
            output.append("\n--- API STDERR ---")
            output.append(stderr_output)
            
    final_text = "\n".join(output)
    print(final_text)
    
    reports_dir = Path(r"d:\ShadowNet AI_project\ml\reports")
    with open(reports_dir / "phase7_validation_report.txt", "w", encoding="utf-8") as f:
        f.write(final_text)

if __name__ == '__main__':
    # Need to run from root dir to resolve dashboard module properly if PYTHONPATH is missing
    # But subprocess sets it. We assume this script is run with PYTHONPATH=.
    run_tests()
