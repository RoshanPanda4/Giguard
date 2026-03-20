import sys
import json

def calculate_risk(rainfall, delivery_drop, reports):
    # Base formula: 40% Rain, 30% Drops, 30% Reports
    risk_score = (0.4 * rainfall) + (0.3 * delivery_drop) + (0.3 * reports)
    # Clamp between 0 and 1
    return max(0.0, min(1.0, risk_score))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided"}))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
        rainfall = float(data.get('rainfall', 0))
        delivery_drop = float(data.get('delivery_drop', 0))
        reports = float(data.get('reports', 0))

        score = calculate_risk(rainfall, delivery_drop, reports)
        
        # Return structured JSON for Node backend to parse
        print(json.dumps({
            "success": True,
            "risk_score": score,
            "inputs": {
                "rainfall": rainfall,
                "delivery_drop": delivery_drop,
                "reports": reports
            }
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
