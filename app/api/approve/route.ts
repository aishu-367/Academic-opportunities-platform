export const dynamic = 'force-dynamic';


import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// This client uses the PRIVATE key — safe here because this file only ever runs on the server, never in the browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { id, action } = await req.json()

  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { data: stagingRow, error: fetchError } = await supabase
    .from('staging_opportunities')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !stagingRow) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (action === 'reject') {
    await supabase.from('staging_opportunities').update({ status: 'rejected' }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  // action === 'approve': copy the fields we know both tables share into the real table
  const { error: insertError } = await supabase.from('opportunities').insert({
    title: stagingRow.title,
    provider: stagingRow.provider,
    description: stagingRow.description,
    official_url: stagingRow.official_url,
    deadline: stagingRow.deadline,
    degree: stagingRow.degree,
    year: stagingRow.year,
    status: 'approved',
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await supabase.from('staging_opportunities').update({ status: 'approved' }).eq('id', id)
  return NextResponse.json({ success: true })
}