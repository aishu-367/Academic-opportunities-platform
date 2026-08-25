import os
import json
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from google import genai
from supabase import create_client
import re

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
    "https://drdo.gov.in/drdo/en/offerings/vacancies/sag-delhi-invites-applications-paid-internship-engineering-science-ug-pg",
    "https://www.isro.gov.in/InternshipAndProjects.html",
    "https://sih.gov.in/",
    "https://vv.hbcse.tifr.res.in/",
    "https://www.iiserpune.ac.in/SummerStudentProgrammes",
    "https://www.mitacs.ca/our-programs/globalink-research-internship-students/",
    "https://nusgs.nus.edu.sg/page/irisnus/",

    # Add more individual URLs here whenever you want!
]
def clean_deadline(value):
    if value and re.match(r'^\d{4}-\d{2}-\d{2}$', value):
        return value
    return None  # if it's not exactly YYYY-MM-DD, drop it rather than crash the insert

def scrape_and_store():
    for url in target_urls:
        ...
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
            
            # --- CALL GEMINI & EXTRACT DATA ---
            ai_response = client.models.generate_content(
                model="gemini-3.1-flash-lite",
                contents = f"""
Analyze the following webpage text from an opportunity page ({url}) and extract structured details.
Return ONLY a valid JSON object with these exact keys:
- "title": (string, name of the program/opportunity)
- "provider": (string, name of the organization or provider like Google)
- "description": (string, a clear 2-3 sentence summary)
- "deadline": (string in YYYY-MM-DD format or null if not found)
- "degree": (string, one of exactly: "Bachelor", "Master", "PhD", "Any")
- "year": (string, e.g. "1st Year", "2nd Year", "Final Year", or "Any")
- "interests": (string, one or two relevant subject areas, or "General")
- "opportunity_type": (string, one of exactly: "Internship", "Research", "Scholarship")
- "region": (string, one of exactly: "India", "USA", "Europe", "Global")
- "funding_type": (string, one of exactly: "Fully Funded", "Partially Funded", "Unfunded")

Important: for "degree", "opportunity_type", "region", and "funding_type", return EXACTLY one of the listed options with the exact spelling shown — no variations.

Webpage text:
{raw_text[:8000]}
"""
            )
            
            clean_text = ai_response.text.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_text)
            
            # If Gemini returned a list instead of a dictionary, grab the first item
            if isinstance(parsed_data, list):
                parsed_data = parsed_data[0] if parsed_data else {}

            staging_row = {
    "title": parsed_data.get("title"),
    "provider": parsed_data.get("provider"),
    "description": parsed_data.get("description"),
    "official_url": url,
    "source_url": url,
    "deadline": clean_deadline(parsed_data.get("deadline")),
    "degree": parsed_data.get("degree"),
    "year": parsed_data.get("year"),
    "interests": parsed_data.get("interests"),
    "opportunity_type": parsed_data.get("opportunity_type"),
    "region": parsed_data.get("region"),
    "funding_type": parsed_data.get("funding_type"),
    "status": "pending_review"
}

            if not staging_row["title"]:
                print(f"Skipping {url}: Gemini couldn't find a title")
                continue

            # Check BOTH the live table and staging table using ONLY the URL
            already_live = (
                supabase.table("opportunities")
                .select("id")
                .eq("official_url", staging_row["official_url"])
                .execute()
            )
            
            already_staged = (
                supabase.table("staging_opportunities")
                .select("id")
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