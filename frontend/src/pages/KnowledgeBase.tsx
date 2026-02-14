import { useEffect, useState } from 'react';
import api from '../lib/api';

interface Category {
  id: string;
  name: string;
  docCount: number;
}

interface Document {
  id: string;
  categoryId: string;
  title: string;
  summary: string;
}

export default function KnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryId) params.set('category', categoryId);
    api.get(`/knowledge-base?${params}`).then((r) => {
      setCategories(r.data.categories || []);
      setDocuments(r.data.documents || []);
    }).catch(() => { setCategories([]); setDocuments([]); }).finally(() => setLoading(false));
  }, [search, categoryId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Knowledge Base</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="search"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
        />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-48">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.docCount})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-slate-900 mb-3">Categories</h2>
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setCategoryId(c.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${categoryId === c.id ? 'bg-violet-100 text-violet-800 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
                    {c.name} ({c.docCount})
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h2 className="font-semibold text-slate-900 mb-3">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-slate-500 text-sm">No documents match your search.</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((d) => (
                  <li key={d.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                    <p className="font-medium text-slate-900">{d.title}</p>
                    <p className="text-sm text-slate-600 mt-1">{d.summary}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
