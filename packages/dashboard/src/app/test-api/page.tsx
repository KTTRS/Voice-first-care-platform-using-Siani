"use client";

import { useEffect, useState } from "react";

export default function TestAPIPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testAPI() {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
        const url = `${apiUrl}/api/goals`;

        console.log("Fetching from:", url);

        const response = await fetch(url, {
          headers: {
            Authorization: "Bearer test-token",
            "Content-Type": "application/json",
          },
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Data received:", data);
        setResult(data);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    testAPI();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Connection Test</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <p>
          <strong>API Base URL:</strong>{" "}
          {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}
        </p>
        <p>
          <strong>Full URL:</strong>{" "}
          {(process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000") +
            "/api/goals"}
        </p>
      </div>

      {loading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
          <p>Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <h2 className="font-bold text-red-900">Error</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 p-4 rounded">
          <h2 className="font-bold text-green-900 mb-2">Success!</h2>
          <pre className="bg-white p-3 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
