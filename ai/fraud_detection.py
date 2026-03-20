import sys
import json

def detect_fraud(claims_count, total_workers, rainfall):
    # Very simple mock logic: If many claims but no rain -> highly suspicious
    ratio = claims_count / max(1, total_workers)
    
    fraud_score = 0.0
    flags = []

    if ratio > 0.30 and rainfall < 0.2:
        fraud_score += 0.8
        flags.append("Mass Bunking Suspected (High claims, low rain)")
    elif ratio > 0.50:
        fraud_score += 0.5
        flags.append("High Claim Ratio (>50%)")

    return min(1.0, fraud_score), flags

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
        claims_count = float(data.get('claims', 0))
        total_workers = float(data.get('total_workers', 100))
        rainfall = float(data.get('rainfall', 0))

        score, flags = detect_fraud(claims_count, total_workers, rainfall)
        
        print(json.dumps({
            "success": True,
            "fraud_score": score,
            "flags": flags
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
