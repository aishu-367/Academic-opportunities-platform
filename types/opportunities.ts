export interface Opportunity {
  id: string
  title: string
  organization?: string
  description?: string
  opportunity_type?: string
  field?: string
  subfield?: string
  country?: string
  location?: string
  mode?: string
  start_date?: string
  end_date?: string
  deadline?: string
  duration?: string
  stipend?: string
  funding?: string
  accommodation?: string
  travel_support?: string
  source_name?: string
  source_url?: string
  application_url?: string
  status: 'approved' | 'pending_review' | 'rejected' | 'published'
  first_seen_at?: string
  last_checked_at?: string
  updated_at?: string
}