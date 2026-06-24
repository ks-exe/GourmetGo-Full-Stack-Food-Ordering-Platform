from pymongo import MongoClient
import os
from urllib.parse import urlparse

def test():
    # Read URI
    env_path = '../backend/.env'
    mongo_uri = None
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('MONGO_URI='):
                    mongo_uri = line.strip().split('MONGO_URI=')[1].strip()
                    
    if not mongo_uri:
        print("MONGO_URI not found!")
        return

    print("URI found:", mongo_uri.split('@')[-1]) # print host without password
    
    parsed = urlparse(mongo_uri)
    db_name = parsed.path.strip('/')
    print("Parsed Database name:", db_name)
    
    client = MongoClient(mongo_uri)
    db = client[db_name]
    
    print("List of collection names:")
    cols = db.list_collection_names()
    print(cols)
    
    for col_name in cols:
        col = db[col_name]
        count = col.count_documents({})
        print(f"Collection '{col_name}' count: {count}")
        if count > 0:
            sample = col.find_one()
            print(f"Sample from '{col_name}': {list(sample.keys())}")

if __name__ == '__main__':
    test()
