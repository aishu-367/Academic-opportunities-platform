'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function Results() {
  const searchParams = useSearchParams();

  // Grab all parameters
  const degree = searchParams.get('degree');
  const year = searchParams.get('year');
  const interests = searchParams.get('interests');
  const oppType = searchParams.get('oppType');
  const region = searchParams.get('region');
  const funding = searchParams.get('funding');

  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data, error } = await supabase.from('opportunities').select('*');

      if (error) {
        console.error("Error:", error);
      } else if (data) {
        // Safe Filter logic: Provide fallback empty strings if fields are null/undefined
        const filtered = data.filter((item: any) => {
          const itemDegree = item.degree || '';
          const itemYear = item.year || '';
          const itemInterests = item.interests || '';
          const itemOppType = item.oppType || '';
          const itemRegion = item.region || '';
          const itemFunding = item.funding || '';

          return (
            (!degree || itemDegree.trim() === degree.trim()) &&
            (!year || itemYear.trim() === year.trim()) &&
            (!interests || itemInterests.toLowerCase().includes(interests.toLowerCase())) &&
            (!oppType || itemOppType.trim() === oppType.trim()) &&
            (!region || itemRegion.trim() === region.trim()) &&
            (!funding || itemFunding.trim() === funding.trim())
          );
        });

        setOpportunities(filtered);
      }
      setLoading(false);
    }

    fetchData();
  }, [degree, year, interests, oppType, region, funding]); // Added dependencies

  

  if (loading) return <main className="p-10 text-white">Loading...</main>;

  return (
    <main className="p-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Results</h1>
      {opportunities.length === 0 ? (
        <p className="text-white">No opportunities found matching these criteria</p>
      ) : (
        <ul className="space-y-4">
          {opportunities.map((opp) => (
            <Link key={opp.id} href={`/opportunities/${opp.id}`}>
              <li className="border p-4 rounded shadow-sm bg-white hover:bg-gray-100 cursor-pointer">
                <h2 className="text-xl font-semibold text-black">{opp.title}</h2>
                <p className="text-gray-800">{opp.provider}</p>
              </li>
            </Link>
          ))}
        </ul>
      )}
    </main>
  );
}