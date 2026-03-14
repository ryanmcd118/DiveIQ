import { useState, useEffect } from "react";

export type CertDefinition = {
  name: string;
  agency: string;
  slug: string;
  levelRank: number;
  category: string;
};

export function useCertificationDefinitions() {
  const [definitions, setDefinitions] = useState<CertDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/certifications/definitions")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: { definitions: CertDefinition[] }) =>
        setDefinitions(data.definitions ?? [])
      )
      .catch(() => setDefinitions([]))
      .finally(() => setLoading(false));
  }, []);

  return { definitions, loading };
}
