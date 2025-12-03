'use client';

import { FormEvent, useRef, useState } from 'react';

type PlanData = {
  region: string;
  siteName: string;
  date: string;
  maxDepth: number;
  bottomTime: number;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
};

type RiskLevel = 'Low' | 'Moderate' | 'High';

function calculateRisk(plan: PlanData): RiskLevel {
  const { maxDepth, bottomTime } = plan;

  if (maxDepth > 40 || bottomTime > 50) {
    return 'High';
  }

  if (maxDepth > 30 || bottomTime > 40) {
    return 'Moderate';
  }

  return 'Low';
}

function PlanSummary({ plan }: { plan: PlanData }) {
    const riskLevel = calculateRisk(plan);

  return (
    <div>
      <h2>Dive Plan Summary</h2>
      <div>
        <p><strong>Region:</strong> {plan.region}</p>
        <p><strong>Site name:</strong> {plan.siteName}</p>
        <p><strong>Date:</strong> {plan.date}</p>
        <p><strong>Max depth:</strong> {plan.maxDepth} meters</p>
        <p><strong>Bottom time:</strong> {plan.bottomTime} minutes</p>
        <p><strong>Experience level:</strong> {plan.experienceLevel}</p>
        <p><strong>Estimated risk:</strong> {riskLevel}</p>
      </div>
    </div>
  );
}

export default function PlanPage() {
  const [submittedPlan, setSubmittedPlan] = useState<PlanData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);

  const handleNewPlan = () => {
    setSubmittedPlan(null);
    setAiAdvice(null);
    setApiError(null);
    // reset form fields
    if (formRef.current) {
      formRef.current.reset();
    }
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    setAiAdvice(null);
    setApiError(null);
    setLoading(true);
  
    const formData = new FormData(e.currentTarget);
    const values: PlanData = {
      region: formData.get('region') as string,
      siteName: formData.get('siteName') as string,
      date: formData.get('date') as string,
      maxDepth: Number(formData.get('maxDepth')),
      bottomTime: Number(formData.get('bottomTime')),
      experienceLevel: formData.get('experienceLevel') as PlanData['experienceLevel'],
    };
  
    setSubmittedPlan(values);
  
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
  
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
  
      const data = await res.json();
      setAiAdvice(data.aiAdvice);
  
    } catch (err: any) {
      console.error(err);
      setApiError('Failed to get advice from server.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex justify-center p-6 md:p-10">
      <div className="w-full max-w-5xl grid gap-8 md:grid-cols-2">
        {/* Left: form */}
        <section className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Dive Plan</h1>
          <p className="text-sm text-slate-400">
            Fill out the form to generate a dive plan and get safety-focused feedback from DiveIQ.
          </p>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mt-4 space-y-4 bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <label htmlFor="region" className="text-sm text-slate-300">
                Region
              </label>
              <input
                type="text"
                id="region"
                name="region"
                required
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="siteName" className="text-sm text-slate-300">
                Site name
              </label>
              <input
                type="text"
                id="siteName"
                name="siteName"
                required
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="date" className="text-sm text-slate-300">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                required
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="maxDepth" className="text-sm text-slate-300">
                Max depth in meters
              </label>
              <input
                type="number"
                id="maxDepth"
                name="maxDepth"
                required
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="bottomTime" className="text-sm text-slate-300">
                Bottom time in minutes
              </label>
              <input
                type="number"
                id="bottomTime"
                name="bottomTime"
                required
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="experienceLevel" className="text-sm text-slate-300">
                Experience level
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                required
                className="bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              >
                <option value="">Select...</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Submit plan
            </button>
          </form>
        </section>

        {/* Right: summary + AI advice */}
        <section className="space-y-4">
          {submittedPlan ? (
            <div className="space-y-4">
              <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg">
                <PlanSummary plan={submittedPlan} />
              </div>

              <div className="bg-slate-900/60 p-6 rounded-xl border border-slate-800 shadow-lg">
                <h3 className="text-lg font-semibold mb-2">AI Dive Buddy Advice</h3>

                {loading && (
                  <p className="text-sm text-slate-400">Loading AI advice...</p>
                )}

                {aiAdvice && (
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {aiAdvice}
                  </p>
                )}

                {apiError && (
                  <p className="text-sm text-red-400">{apiError}</p>
                )}

                <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleNewPlan}
                    className="text-xs px-3 py-1 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                    Start a new plan
                </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-700 rounded-xl p-6 text-sm text-slate-400">
              <p>
                Once you submit a dive plan, you&apos;ll see a summary and AI guidance
                here.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );

}

