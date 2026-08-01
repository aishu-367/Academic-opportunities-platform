import os
import json
from pathlib import Path
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from google import genai
from google.genai import types
from supabase import create_client

# Explicitly load .env.local from the root project directory
env_path = Path(__file__).resolve().parent.parent / '.env.local'
load_dotenv(dotenv_path=env_path)

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# Supabase Configuration
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
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
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json"
        ),
    )
    
    return response.text

def save_to_supabase(ai_response_text):
    try:
        cleaned_text = ai_response_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
            
        data = json.loads(cleaned_text.strip())
        opportunities = data.get("opportunities", [])
        
        for opp in opportunities:
            row_data = {
                "title": opp.get("title"),
                "provider": opp.get("provider"),
                "degree": opp.get("degree"),
                "year": opp.get("year"),
                "interests": opp.get("interests"),
                "opp_type": opp.get("opp_type"),
                "region": opp.get("region"),
                "funding": opp.get("funding"),
                "deadline": opp.get("deadline") if opp.get("deadline") else None,
                "event_dates": opp.get("event_dates"),
                "location": opp.get("location"),
                "intake_term": opp.get("intake_term"),
                "source_url": opp.get("source_url")
            }
            
            supabase.table("staging_opportunities").insert(row_data).execute()
            print(f"Successfully inserted into staging: {opp.get('title')}")
            
    except Exception as e:
        print(f"Error inserting into Supabase: {e}")

def promote_staging_to_production():
    try:
        print("Fetching rows from staging_opportunities...")
        response = supabase.table("staging_opportunities").select("*").execute()
        staging_rows = response.data
        
        if not staging_rows:
            print("No rows found in staging table.")
            return

        for row in staging_rows:
            # 1. Handle Category
            category_name = row.get("opp_type") or "General"
            cat_res = supabase.table("categories").select("id").eq("name", category_name).execute()
            if cat_res.data:
                category_id = cat_res.data[0]["id"]
            else:
                new_cat = supabase.table("categories").insert({"name": category_name}).execute()
                category_id = new_cat.data[0]["id"]

            # 2. Handle Country
            country_name = row.get("region") or row.get("location") or "Global"
            country_res = supabase.table("countries").select("id").eq("name", country_name).execute()
            if country_res.data:
                country_id = country_res.data[0]["id"]
            else:
                new_country = supabase.table("countries").insert({"name": country_name}).execute()
                country_id = new_country.data[0]["id"]

            # 3. Prepare row for main opportunities table
            prod_row = {
                "title": row.get("title"),
                "provider": row.get("provider"),
                "description": f"Event Dates: {row.get('event_dates') or 'N/A'} | Intake: {row.get('intake_term') or 'N/A'}",
                "category_id": category_id,
                "country_id": country_id,
                "funding_type": row.get("funding"),
                "deadline": row.get("deadline"),
                "official_url": row.get("source_url"),
                "degree": row.get("degree"),
                "year": row.get("year"),
                "status": "Active"
            }

            supabase.table("opportunities").insert(prod_row).execute()
            print(f"Promoted to production: {row.get('title')}")
            
    except Exception as e:
        print(f"Error promoting data: {e}")

def run_pipeline():
    for site in TARGET_SITES:
        print(f"Scraping {site['name']} ({site['url']})...")
        text = fetch_page_content(site['url'])
        if text:
            print(f"Parsing content with Gemini for {site['name']}...")
            ai_output = parse_with_ai(text, site['url'])
            save_to_supabase(ai_output)

if __name__ == "__main__":
    run_pipeline()
    promote_staging_to_production()