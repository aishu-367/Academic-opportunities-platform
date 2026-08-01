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
  provider: string
  degree?: string
  year?: string
  interests?: string[]
  opp_type?: string
  region?: string
  funding?: string
  deadline?: string
  source_url?: string
  status: 'approved' | 'pending_review' | 'rejected'
  created_at: string
}

export default function AdminPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOpportunities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('staging_opportunities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching admin data:', error)
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
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Error updating status: ' + error.message)
    } else {
      setOpportunities(prev =>
        prev.map(item => (item.id === id ? { ...item, status: newStatus } : item))
      )
    }
  }

  if (loading) return <div className="p-8 text-center">Loading admin panel...</div>

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Opportunity Admin Review Queue</h1>
      
      <div className="overflow-x-auto bg-white shadow-md rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title & Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Degree / Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {opportunities.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-500">{item.provider}</div>
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      Source Link ↗
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div>{item.degree || 'N/A'}</div>
                  <div className="text-xs text-gray-400">{item.opp_type}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${item.status === 'approved' ? 'bg-green-100 text-green-800' : 
                      item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  {item.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(item.id, 'approved')}
                      className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                  )}
                  {item.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(item.id, 'rejected')}
                      className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {opportunities.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">No opportunities found in staging.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}