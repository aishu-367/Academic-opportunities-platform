'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Homepage() {
  const router = useRouter();

  const degreeOptions = ['Bachelor', 'Master', 'PhD'];
  const yearOptions = ['2026', '2027', '2028'];
  const oppTypeOptions = ['Internship', 'Research', 'Scholarship'];
  const regionOptions = ['India', 'USA', 'Europe', 'Global'];
  const fundingOptions = ['Fully Funded', 'Partially Funded', 'Unfunded'];

  const [q, setQ] = useState('');
  const [degree, setDegree] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');
  const [oppType, setOppType] = useState('');
  const [region, setRegion] = useState('');
  const [funding, setFunding] = useState('');

  const handleNavigation = () => {
    const query = new URLSearchParams({
      q, degree, year, interests, oppType, region, funding
    }).toString();
    router.push(`/results?${query}`);
  };

  const selectStyle = "w-full p-2 border border-gray-700 rounded bg-white text-black mb-4";

  return (
    <main className="p-10 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-white">Scout</h1>
      <p className="text-gray-400 mb-6">
        Verified research, internship, and scholarship opportunities for
        Indian students — curated so you don&apos;t have to dig.
      </p>

      <input
        placeholder="Search opportunities (e.g. AI research, hackathon)"
        className={selectStyle}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <select className={selectStyle} value={degree} onChange={(e) => setDegree(e.target.value)}>
        <option value="">Select Degree</option>
        {degreeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>

      <select className={selectStyle} value={year} onChange={(e) => setYear(e.target.value)}>
        <option value="">Select Year</option>
        {yearOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>

      <input placeholder="Interests (e.g. CS, AI)" className={selectStyle} value={interests} onChange={(e) => setInterests(e.target.value)} />

      <select className={selectStyle} value={oppType} onChange={(e) => setOppType(e.target.value)}>
        <option value="">Opportunity Type</option>
        {oppTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>

      <select className={selectStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="">Region</option>
        {regionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>

      <select className={selectStyle} value={funding} onChange={(e) => setFunding(e.target.value)}>
        <option value="">Funding Type</option>
        {fundingOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>

      <button
        onClick={handleNavigation}
        className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition"
      >
        Search
      </button>
    </main>
  );
}