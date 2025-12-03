'use client';

import { FormEvent, useState } from 'react';

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const values = {
      region: formData.get('region') as string,
      siteName: formData.get('siteName') as string,
      date: formData.get('date') as string,
      maxDepth: Number(formData.get('maxDepth')),
      bottomTime: Number(formData.get('bottomTime')),
      experienceLevel: formData.get('experienceLevel') as PlanData['experienceLevel'],
    };
    
    console.log('Form values:', values);
    setSubmittedPlan(values);
  };

  return (
    <div>
      <h1>Dive Plan</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="region">Region</label>
          <input
            type="text"
            id="region"
            name="region"
            required
          />
        </div>

        <div>
          <label htmlFor="siteName">Site name</label>
          <input
            type="text"
            id="siteName"
            name="siteName"
            required
          />
        </div>

        <div>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            required
          />
        </div>

        <div>
          <label htmlFor="maxDepth">Max depth in meters</label>
          <input
            type="number"
            id="maxDepth"
            name="maxDepth"
            required
          />
        </div>

        <div>
          <label htmlFor="bottomTime">Bottom time in minutes</label>
          <input
            type="number"
            id="bottomTime"
            name="bottomTime"
            required
          />
        </div>

        <div>
          <label htmlFor="experienceLevel">Experience level</label>
          <select
            id="experienceLevel"
            name="experienceLevel"
            required
          >
            <option value="">Select...</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <button type="submit">Submit</button>
      </form>

      {submittedPlan && <PlanSummary plan={submittedPlan} />}
    </div>
  );
}

