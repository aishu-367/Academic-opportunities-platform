import os
import json
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from google import genai
from supabase import create_client

load_dotenv('.env.local', override=True)

print("URL:", os.getenv("NEXT_PUBLIC_SUPABASE_URL"))
print("SERVICE KEY EXISTS:", bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY")))
print("GEMINI KEY EXISTS:", bool(os.getenv("GEMINI_API_KEY")))

supabase = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
target_urls = [
    "https://summerofcode.withgoogle.com/programs/2026",
    # Add more individual URLs here whenever you want!
]

def scrape_and_store():
    for url in target_urls:
        print(f"Scraping opportunity page: {url}")
        try:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = requests.get(url, headers=headers, timeout=15)

            if response.status_code != 200:
                print(f"Failed to fetch {url} (Status: {response.status_code})")
                continue

            soup = BeautifulSoup(response.text, 'html.parser')
            raw_text = soup.get_text(separator=' ', strip=True)

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
                model='gemini-3.5-flash-lite',
                contents=prompt,
            )

            clean_text = gemini_response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:-3].strip()
            elif clean_text.startswith("```"):
                clean_text = clean_text[3:-3].strip()

            parsed_data = json.loads(clean_text)

            # This now goes into the STAGING table, never the live one
            staging_row = {
                "title": parsed_data.get("title"),
                "provider": parsed_data.get("provider"),
                "description": parsed_data.get("description"),
                "official_url": url,
                "source_url": url,
                "deadline": parsed_data.get("deadline") if parsed_data.get("deadline") else None,
                "status": "pending_review"
            }

            if not staging_row["title"]:
                print(f"Skipping {url}: Gemini couldn't find a title, likely not an opportunity page")
                continue

            # Check BOTH the live table and the staging table, so we never
            # review or publish the same opportunity twice
            already_live = (
                supabase.table("opportunities")
                .select("id")
                .eq("title", staging_row["title"])
                .eq("official_url", staging_row["official_url"])
                .execute()
            )
            already_staged = (
                supabase.table("staging_opportunities")
                .select("id")
                .eq("title", staging_row["title"])
                .eq("official_url", staging_row["official_url"])
                .execute()
            )

            if (already_live.data and len(already_live.data) > 0) or \
               (already_staged.data and len(already_staged.data) > 0):
                print(f"Skipping duplicate: {staging_row['title']}")
                continue

            supabase.table("staging_opportunities").insert(staging_row).execute()
            print(f"Added to review queue: {staging_row['title']}")

        except Exception as e:
            print(f"Error processing {url}: {e}")

if __name__ == "__main__":
    scrape_and_store()