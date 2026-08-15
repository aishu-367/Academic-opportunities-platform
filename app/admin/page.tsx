'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Opportunity {
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
  source_url?: string
  status: 'approved' | 'pending_review' | 'rejected'
  first_seen_at?: string
}

export default function AdminPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOpportunities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('staging_opportunities')
      .select('*')

    if (error) {
      console.error('Error fetching admin data:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    } else {
      setOpportunities(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('staging_opportunities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      alert('Error updating status: ' + error.message)
      return
    }

    if (newStatus === 'approved') {
      const { data: stagingData, error: fetchError } = await supabase
        .from('staging_opportunities')
        .select('*')
        .eq('id', id)
        .single()

      if (!fetchError && stagingData) {
        const { id: _, ...oppData } = stagingData
        
        const { error: insertError } = await supabase.from('opportunities').insert({
          ...oppData,
          status: 'published'
        })

        if (insertError) {
          console.error('Failed to insert into opportunities table:', insertError)
          alert('Approved in staging, but failed to publish to opportunities table. Check console.')
        }
      }
    }

    setOpportunities(prev =>
      prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
    )
  }

  if (loading) return <div className="p-8 text-center text-white">Loading admin panel...</div>

  return (
    <div className="max-w-7xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Opportunity Admin Review Queue</h1>
      
      <div className="overflow-x-auto bg-gray-900 shadow-md rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Title & Organization</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Type / Field</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {opportunities.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-gray-400">{item.organization}</div>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                      Source Link ↗
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  <div>{item.opportunity_type || 'N/A'}</div>
                  <div className="text-xs text-gray-500">{item.field} {item.subfield ? `/ ${item.subfield}` : ''}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${item.status === 'approved' ? 'bg-green-900 text-green-200' : 
                      item.status === 'rejected' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  {item.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(item.id, 'approved')}
                      className="text-green-300 hover:text-green-100 bg-green-950 px-3 py-1 rounded border border-green-800 cursor-pointer"
                    >
                      Approve
                    </button>
                  )}
                  {item.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(item.id, 'rejected')}
                      className="text-red-300 hover:text-red-100 bg-red-950 px-3 py-1 rounded border border-red-800 cursor-pointer"
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {opportunities.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-400">No opportunities found in staging.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}