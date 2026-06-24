from app import app
import json

def test_endpoints():
    client = app.test_client()
    
    print("Testing /status...")
    res = client.get('/status')
    print("Status:", res.status_code, res.data.decode())
    
    print("\nTesting /api/ml/recommendations?query=burger...")
    res = client.get('/api/ml/recommendations?query=burger')
    print("Status:", res.status_code)
    try:
        data = json.loads(res.data.decode())
        print("Data length:", len(data))
        print("Data sample:", data[:2])
    except Exception as e:
        print("Error parsing response:", e, res.data.decode())

    print("\nTesting /api/ml/trending...")
    res = client.get('/api/ml/trending')
    print("Status:", res.status_code)
    try:
        data = json.loads(res.data.decode())
        print("Data length:", len(data))
        print("Data sample:", data[:2])
    except Exception as e:
        print("Error parsing response:", e, res.data.decode())

    print("\nTesting /api/ml/predict-sales...")
    res = client.post('/api/ml/predict-sales', json={
        "weather": "Hot",
        "temperature": 38,
        "weekend": "Yes",
        "occasion": "Eid"
    })
    print("Status:", res.status_code)
    try:
        data = json.loads(res.data.decode())
        print("Keys in response:", list(data.keys()))
        if 'predictions' in data:
            print("Predictions length:", len(data['predictions']))
            print("First prediction:", data['predictions'][0])
    except Exception as e:
        print("Error parsing response:", e, res.data.decode())

if __name__ == '__main__':
    test_endpoints()
