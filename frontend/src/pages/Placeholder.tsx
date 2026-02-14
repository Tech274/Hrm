import { useLocation } from 'react-router-dom';

const pathToTitle: Record<string, string> = {
  '/team': 'My Team',
  '/performance': 'My Performance',
  '/tasks': 'My Task Management',
  '/exit': 'My Exit',
  '/alerts': 'Alerts',
  '/calendar': 'My Calendar',
  '/people': 'People',
  '/knowledge-base': 'Knowledge Base',
};

export default function Placeholder() {
  const { pathname } = useLocation();
  const title = pathToTitle[pathname] || 'Page';
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{title}</h1>
      <p className="text-slate-600">This section will be available in a later phase.</p>
    </div>
  );
}
