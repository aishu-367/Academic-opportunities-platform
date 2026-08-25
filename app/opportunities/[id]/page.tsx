import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !opportunity) {
    return (
      <main className="p-10 max-w-2xl mx-auto text-white">
        <h1 className="text-2xl font-bold mb-4">Opportunity not found</h1>
        <Link href="/results" className="text-blue-400 underline">
          &larr; Back to Results
        </Link>
      </main>
    );
  }

  return (
    <main className="p-10 max-w-2xl mx-auto text-white">
      <Link href="/results" className="text-blue-400 underline mb-6 inline-block">
        &larr; Back to Results
      </Link>

      {opportunity.official_url && (
        <span className="inline-block text-sm text-green-400 mb-2">
          ✓ Verified — source checked
        </span>
      )}

      <h1 className="text-3xl font-bold mb-2">{opportunity.title}</h1>
      <p className="text-gray-300 text-lg mb-6">Provider: {opportunity.provider}</p>

      <div className="bg-gray-800 p-6 rounded-lg shadow space-y-2 mb-6">
        <p><strong>Degree:</strong> {opportunity.degree || 'N/A'}</p>
        <p><strong>Year:</strong> {opportunity.year || 'N/A'}</p>
        <p><strong>Interests:</strong> {opportunity.interests || 'N/A'}</p>
        <p><strong>Opportunity Type:</strong> {opportunity.opportunity_type || 'N/A'}</p>
        <p><strong>Region:</strong> {opportunity.region || 'N/A'}</p>
        <p><strong>Funding:</strong> {opportunity.funding_type || 'N/A'}</p>
        {opportunity.deadline && <p><strong>Deadline:</strong> {opportunity.deadline}</p>}
      </div>

      <div className="bg-gray-900 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Description</h2>
        <p className="text-gray-300 whitespace-pre-line">{opportunity.description || 'No description available.'}</p>
      </div>

      {opportunity.official_url && (
        <a
          href={opportunity.official_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Official Website &rarr;
        </a>
      )}
    </main>
  );
}