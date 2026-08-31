import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("NVIDIA_API_KEY")

models = [
    "ibm/granite-3.0-8b-instruct",
    "google/gemma-2b",
    "meta/llama-3.2-11b-vision-instruct",
    "mistralai/mistral-large-2-instruct"
]

url = "https://integrate.api.nvidia.com/v1/chat/completions"

for model in models:
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": "Hi"}],
        "max_tokens": 10
    }
    res = requests.post(url, headers={"Authorization": f"Bearer {api_key}"}, json=payload)
    print(f"Model: {model} -> Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Error: {res.text}")
