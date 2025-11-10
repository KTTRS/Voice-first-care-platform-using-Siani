"use client";

import { useEffect, useState } from "react";
import { fetchGoals, type GoalResponse } from "@/lib/api";

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalResponse[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(
    undefined
  );

  useEffect(() => {
    async function loadGoals() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGoals({
          page: meta.page,
          pageSize: meta.pageSize,
          search: search || undefined,
          isActive: isActiveFilter,
        });
        setGoals(data.data);
        setMeta((prev) => ({ ...prev, ...data.meta }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load goals");
      } finally {
        setLoading(false);
      }
    }
    loadGoals();
  }, [meta.page, meta.pageSize, search, isActiveFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta((m) => ({ ...m, page: 1 })); // Reset to page 1 when searching
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Goals</h1>
        <p className="text-gray-600">Track and manage your personal goals</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <form onSubmit={handleSearchSubmit} className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Goals
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="min-w-[150px]">
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              value={
                isActiveFilter === undefined
                  ? "all"
                  : isActiveFilter
                  ? "active"
                  : "inactive"
              }
              onChange={(e) => {
                const value = e.target.value;
                setIsActiveFilter(
                  value === "all" ? undefined : value === "active"
                );
                setMeta((m) => ({ ...m, page: 1 }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading goals...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No goals found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters or create a new goal
          </p>
        </div>
      ) : (
        <>
          {/* Goals list */}
          <div className="space-y-4 mb-6">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {goal.title}
                      </h2>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          goal.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {goal.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        {goal.points} points
                      </span>
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Created {new Date(goal.createdAt).toLocaleDateString()}
                      </span>
                      {goal.dailyActions && goal.dailyActions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                          {goal.dailyActions.length} daily action
                          {goal.dailyActions.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
                      onClick={() => {
                        /* TODO: Implement view/edit */
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(meta.page - 1) * meta.pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(meta.page * meta.pageSize, meta.total)}
                </span>{" "}
                of <span className="font-medium">{meta.total}</span> goals
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={meta.page === 1}
                onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <span className="text-sm text-gray-700">
                Page <span className="font-medium">{meta.page}</span> of{" "}
                <span className="font-medium">{meta.totalPages}</span>
              </span>

              <button
                disabled={meta.page === meta.totalPages}
                onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
