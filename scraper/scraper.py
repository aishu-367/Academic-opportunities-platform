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

            # Prompt Gemini to match your exact database columns
            prompt = f"""
            Analyze the following webpage text from an opportunity page ({url}) and extract structured details.
            Return ONLY a valid JSON object with these exact keys:
            - "title": (string, name of the program/opportunity)
            - "provider": (string, name of the organization or provider like Google)
            - "description": (string, a clear 2-3 sentence summary)
            - "deadline": (string in YYYY-MM-DD format or null if not found)

            Webpage text:
            {raw_text[:8000]}
            """

            gemini_response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            
            clean_text = gemini_response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:-3].strip()
            
            parsed_data = json.loads(clean_text)

            # Map the parsed data directly to your Supabase schema columns
            opportunity_data = {
                "title": parsed_data.get("title"),
                "provider": parsed_data.get("provider"),
                "description": parsed_data.get("description"),
                "official_url": url,
                "deadline": parsed_data.get("deadline") if parsed_data.get("deadline") else None
            }

            db_response = supabase.table("opportunities").insert(opportunity_data).execute()
            print(f"Successfully inserted into Supabase: {opportunity_data.get('title')}")

        except Exception as e:
            import traceback
            print(f"Error processing {url}: {e}")
            traceback.print_exc()
            
if __name__ == "__main__":
    scrape_and_store()