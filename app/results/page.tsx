'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

const badgeColors: Record<string, string> = {
  Internship: 'bg-blue-600',
  Research: 'bg-purple-600',
  Scholarship: 'bg-green-600',
};

export default function Results() {
  const searchParams = useSearchParams();

  const q = searchParams.get('q') || '';
  const degree = searchParams.get('degree') || '';
  const year = searchParams.get('year') || '';
  const interests = searchParams.get('interests') || '';
  const oppType = searchParams.get('oppType') || '';
  const region = searchParams.get('region') || '';
  const funding = searchParams.get('funding') || '';

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      let query = supabase.from('opportunities').select('*');

      if (degree) query = query.eq('degree', degree);
      if (year) query = query.eq('year', year);
      if (oppType) query = query.eq('opportunity_type', oppType);
      if (region) query = query.eq('region', region);
      if (funding) query = query.eq('funding_type', funding);
      if (interests) query = query.ilike('interests', `%${interests}%`);
      if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error("Error:", error);
      } else if (data) {
        setOpportunities(data);
      }
      setLoading(false);
    }

    fetchData();
  }, [q, degree, year, interests, oppType, region, funding]);

  if (loading) return <main className="p-10 text-white">Loading...</main>;

  return (
    <main className="p-10 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Results</h1>
      {opportunities.length === 0 ? (
        <p className="text-gray-400">No opportunities found matching these criteria</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {opportunities.map((opp) => (
            <Link key={opp.id} href={`/opportunities/${opp.id}`}>
              <div className="border border-gray-700 p-5 rounded-lg shadow-sm bg-gray-900 hover:bg-gray-800 transition cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {opp.opportunity_type && (
                    <span className={`text-xs text-white px-2 py-0.5 rounded-full ${badgeColors[opp.opportunity_type] || 'bg-gray-600'}`}>
                      {opp.opportunity_type}
                    </span>
                  )}
                  {opp.official_url && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-white">{opp.title}</h2>
                <p className="text-gray-400 text-sm mb-2">{opp.provider}</p>
                {opp.deadline && (
                  <p className="text-sm text-amber-400 mt-auto pt-2">Deadline: {opp.deadline}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}