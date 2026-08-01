import os
import json
import requests
from bs4 import BeautifulSoup
from google import genai
from supabase import create_client

# Initialize Supabase and Gemini API clients using GitHub Actions secrets
supabase = create_client(
    os.environ.get("SUPABASE_URL"), 
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Define your curated list of individual opportunity URLs
target_urls = [
    "https://summerofcode.withgoogle.com/programs/2026",
    # Add more individual URLs here whenever you want!
]

def scrape_and_store():
    for url in target_urls:
        print(f"Scraping opportunity page: {url}")
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"Failed to fetch {url} (Status: {response.status_code})")
                continue

            soup = BeautifulSoup(response.text, 'html.parser')
            raw_text = soup.get_text(separator=' ', strip=True)

   # Temporary manual data to bypass Gemini quota limits and test Supabase
            opportunity_data = {
                "title": "Google Summer of Code 2026",
                "provider": "Google",
                "description": "A global program focused on bringing student developers into open source software development.",
                "official_url": url,
                "deadline": None
            }
            db_response = supabase.table("opportunities").insert(opportunity_data).execute()
            print(f"Successfully inserted into Supabase: {opportunity_data.get('title')}")

        except Exception as e:
            import traceback
            print(f"Error processing {url}: {e}")
            traceback.print_exc()

if __name__ == "__main__":
    scrape_and_store()