import os
import json
from pathlib import Path
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from google import genai
from google.genai import types

# Explicitly load .env.local from the root project directory
env_path = Path(__file__).resolve().parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

# Configured Target Sites for Academic & Student Opportunities
TARGET_SITES = [
    {
        "name": "Buddy4Study", 
        "url": "https://www.buddy4study.com/"
    },
    {
        "name": "ScholarsBox", 
        "url": "https://scholarsbox.in/"
    },
    {
        "name": "Unstop Scholarships", 
        "url": "https://unstop.com/scholarships"
    }
    
]

def fetch_page_content(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        # Clean and extract text, capping it to avoid massive token limits
        return soup.get_text(separator=' ', strip=True)[:15000]
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_with_ai(raw_text, source_url):
    prompt = f"""
    Extract academic opportunities, scholarships, conferences, summer/winter schools, or admissions from the following text.
    Return them strictly as a JSON object with a key 'opportunities' containing a list of objects with these exact keys:
    title, provider, degree, year, interests (array of strings), opp_type, region, funding, deadline (YYYY-MM-DD or null), event_dates, location, intake_term, source_url.
    
    Source URL to assign: {source_url}
    
    Text content:
    {raw_text}
    """
    
    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        ),
    )
    
    return response.text
def insert_into_staging(opportunities_data):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    for opp in opportunities_data:
        opp['status'] = 'pending_review'
        res = requests.post(f"{SUPABASE_URL}/rest/v1/staging_opportunities", json=opp, headers=headers)
        if res.status_code >= 400:
            print(f"Failed to insert item: {res.text}")
        else:
            print(f"Successfully staged: {opp.get('title')}")

def run_pipeline():
    for site in TARGET_SITES:
        print(f"\nScraping {site['name']} ({site['url']})...")
        text = fetch_page_content(site['url'])
        if text:
            print(f"Parsing content with OpenAI for {site['name']}...")
            ai_output = parse_with_ai(text, site['url'])
            try:
                parsed_json = json.loads(ai_output)
                items = parsed_json.get('opportunities', []) if isinstance(parsed_json, dict) else parsed_json
                if isinstance(items, dict):
                    items = [items]
                insert_into_staging(items)
            except json.JSONDecodeError as e:
                print(f"Failed to parse JSON output from AI: {e}")

if __name__ == "__main__":
    run_pipeline()