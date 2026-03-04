import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

interface OrgNode {
  id: string;
  name: string;
  email: string;
  employeeId: string | null;
  designation: string | null;
  department: string;
  location: string | null;
  managerId: string | null;
  children: OrgNode[];
}

interface OrgTreeResponse {
  tree: OrgNode[];
  flat: OrgNode[];
}

function OrgTreeNode({ node, depth }: { node: OrgNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-4">
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-slate-50 ${depth > 0 ? 'border-l-2 border-slate-200 ml-2' : ''}`}
        style={{ marginLeft: depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 shrink-0"
          >
            {expanded ? '−' : '+'}
          </button>
        ) : (
          <span className="w-6 shrink-0" />
        )}
        <Link
          to={`/people/${node.id}`}
          className="flex-1 flex items-center gap-3 p-2 -m-2 rounded hover:bg-violet-50 group"
        >
          <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold shrink-0 group-hover:bg-violet-200">
            {node.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-900 group-hover:text-violet-700">{node.name}</p>
            <p className="text-sm text-slate-500">
              {node.designation || '—'} · {node.department}
              {node.location && ` · ${node.location}`}
            </p>
          </div>
        </Link>
        <Link
          to={`/people/${node.id}`}
          className="text-sm text-violet-600 font-medium hover:underline shrink-0"
        >
          View details
        </Link>
      </div>
      {hasChildren && expanded && (
        <div className="border-l border-slate-200 ml-5 pl-2">
          {node.children.map((child) => (
            <OrgTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [data, setData] = useState<OrgTreeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .get<OrgTreeResponse>('/people/org-tree')
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        Unable to load organization chart.
      </div>
    );
  }

  const filteredTree = search.trim()
    ? filterTree(data.tree, search.toLowerCase())
    : data.tree;

  function filterTree(nodes: OrgNode[], q: string): OrgNode[] {
    const result: OrgNode[] = [];
    for (const n of nodes) {
      const matches =
        n.name.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        (n.designation && n.designation.toLowerCase().includes(q)) ||
        (n.email && n.email.toLowerCase().includes(q));
      const filteredChildren = filterTree(n.children, q);
      if (matches || filteredChildren.length > 0) {
        result.push({ ...n, children: filteredChildren });
      }
    }
    return result;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Organization Chart</h1>
      <p className="text-slate-600 mb-6">
        View reporting structure and employee details. Click a name to view full profile.
      </p>

      <div className="mb-6">
        <input
          type="search"
          placeholder="Search by name, department, designation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {filteredTree.length === 0 ? (
          <p className="text-slate-500 py-4">No matching employees.</p>
        ) : (
          filteredTree.map((node) => (
            <OrgTreeNode key={node.id} node={node} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
