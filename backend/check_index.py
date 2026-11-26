import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

index_info = pc.indexes.describe("edution")

print("\nINDEX DETAILS:")
print(index_info)

print("\nINDEX SCHEMA:")
print(index_info.schema)