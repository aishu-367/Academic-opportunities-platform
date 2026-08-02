import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function OpportunityDetailPage({ params }: { params: { id: string } }) {
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !opportunity) {
    return <div className="p-8 text-white">Opportunity not found.</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto text-white">
      <h1 className="text-3xl font-bold mb-2">{opportunity.title}</h1>
      <p className="text-gray-400 mb-4 font-semibold">Provider: {opportunity.provider}</p>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-300">Description</h3>
        <p className="mt-2 text-gray-200 leading-relaxed">{opportunity.description}</p>
      </div>

      {opportunity.deadline && (
        <p className="mb-4 text-gray-400"><strong>Deadline:</strong> {opportunity.deadline}</p>
      )}

      {opportunity.official_url && (
        <a 
          href={opportunity.official_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Visit Official Website &rarr;
        </a>
      )}
    </div>
  );
}