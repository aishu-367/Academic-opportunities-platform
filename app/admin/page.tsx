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
  official_url?: string
  source_url?: string
  status: 'approved' | 'pending_review' | 'rejected'
  created_at: string
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  const checkPassword = () => {
  
  if (passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD_NEW) {
    setUnlocked(true);
  } else {
    alert('Wrong password');
  }
};

  const fetchOpportunities = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('staging_opportunities')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching admin data:', error)
    setOpportunities(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (unlocked) fetchOpportunities()
  }, [unlocked])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const result = await res.json()

    if (!res.ok) {
      alert('Error: ' + result.error)
      return
    }
    fetchOpportunities()
  }

  if (!unlocked) {
    return (
      <div className="max-w-sm mx-auto mt-20 p-6 text-center">
        <h1 className="text-xl font-bold mb-4">Admin Login</h1>
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && checkPassword()}
          className="border rounded px-3 py-2 w-full mb-3"
          placeholder="Password"
        />
        <button onClick={checkPassword} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Enter
        </button>
      </div>
    )
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
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${item.status === 'approved' ? 'bg-green-100 text-green-800' :
                      item.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                  {item.status !== 'approved' && (
                    <button onClick={() => handleAction(item.id, 'approve')} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded">
                      Approve
                    </button>
                  )}
                  {item.status !== 'rejected' && (
                    <button onClick={() => handleAction(item.id, 'reject')} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded">
                      Reject
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {opportunities.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">No opportunities found in staging.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}