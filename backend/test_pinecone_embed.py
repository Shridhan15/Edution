import math
import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
if not api_key:
    raise ValueError("PINECONE_API_KEY is missing from .env")

pc = Pinecone(api_key=api_key)
MODEL = "llama-text-embed-v2"


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    return dot / (norm_a * norm_b)


# 1. Embed sample chapter chunks (use input_type="passage" for stored text)
passages = [
    "Ohm's law states that the current through a conductor is directly proportional to the voltage across it (V = IR).",
    "Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen.",
]

passage_embeddings = pc.inference.embed(
    model=MODEL,
    inputs=passages,
    parameters={"input_type": "passage"},
)

# 2. Embed a search query (use input_type="query" for search queries)
query = "What is photosynthesis?"
query_embedding = pc.inference.embed(
    model=MODEL,
    inputs=query,
    parameters={"input_type": "query"},
)

query_vec = query_embedding[0].values
print(f"Model: {MODEL}")
print(f"Vector dimension: {len(query_vec)}")
print(f"First 5 values: {[round(v, 4) for v in query_vec[:5]]}\n")

# 3. Compare similarity scores
print(f"Query: {query}\n")
for text, emb in zip(passages, passage_embeddings):
    score = cosine_similarity(query_vec, emb.values)
    print(f"Score: {score:.4f} | {text}")
