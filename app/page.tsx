'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Homepage() {
  const router = useRouter();

  // --- MODIFY YOUR LISTS HERE ---
  const degreeOptions = ['Bachelor', 'Master', 'PhD'];
  const yearOptions = ['2026', '2027', '2028'];
  const oppTypeOptions = ['Internship', 'Research', 'Scholarship'];
  const regionOptions = ['India', 'USA', 'Europe', 'Global'];
   const fundingOptions = ['Fully Funded', 'Partially Funded', 'Unfunded'];
  // ------------------------------

  const [degree, setDegree] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');
  const [oppType, setOppType] = useState('');
  const [region, setRegion] = useState('');
  const [funding, setFunding] = useState('');

  const handleNavigation = () => {
    const query = new URLSearchParams({
      degree, year, interests, oppType, region, funding
    }).toString();
    router.push(`/results?${query}`);
  };

  const selectStyle = "w-full p-2 border rounded bg-white text-black mb-4";

  return (
    <main className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Find Opportunities</h1>
      
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