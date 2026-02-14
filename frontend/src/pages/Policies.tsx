export default function Policies() {
  const governanceRules = [
    'Every interview must have structured feedback before an offer can be released.',
    'All feedback must include scoring (1–5), justification (strengths and concerns), and digital sign-off.',
    'An offer can only be released when:',
  ];

  const offerRequirements = [
    'All assigned interviews have submitted feedback',
    'All feedback entries are digitally signed off',
    'Hiring manager has approved',
    'No high-risk feedback unless manager override',
  ];

  const roles = [
    {
      role: 'Admin',
      description: 'Full system access',
      permissions: [
        'Manage all candidates, interviews, feedback',
        'Release offers',
        'Create approvals',
        'View full audit log',
        'Manage users in Admin Panel',
      ],
    },
    {
      role: 'Manager',
      description: 'Hiring and approval authority',
      permissions: [
        'View all candidates',
        'Approve or reject candidates',
        'Release offers',
        'Validate governance before offer release',
      ],
    },
    {
      role: 'Recruiter',
      description: 'Candidate and interview coordination',
      permissions: [
        'Create and manage candidates',
        'Schedule interviews',
        'Create offers',
        'View candidates and feedback',
      ],
    },
    {
      role: 'Interviewer',
      description: 'Conduct interviews and submit feedback',
      permissions: [
        'View assigned interviews',
        'Submit structured feedback with scoring',
        'Provide recommendation (strong_hire, hire, hold, reject)',
        'Digitally sign off on feedback',
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Policies</h1>

      <div className="space-y-8">
        <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Governance Rules
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            {governanceRules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
          <div className="mt-4 pl-6">
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              {offerRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            If any condition fails, the offer remains locked and a detailed error
            message is returned.
          </p>
        </section>

        <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Role-Based Access
          </h2>
          <div className="space-y-4">
            {roles.map((r) => (
              <div
                key={r.role}
                className="border border-slate-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-slate-900">{r.role}</span>
                  <span className="text-sm text-slate-500">— {r.description}</span>
                </div>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  {r.permissions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Audit & Compliance
          </h2>
          <p className="text-slate-700">
            Every state-changing action is audit logged, including:
          </p>
          <ul className="list-disc list-inside mt-2 text-slate-600 space-y-1">
            <li>Candidate create, update, delete</li>
            <li>Interview create, update</li>
            <li>Feedback submit, update</li>
            <li>Approval create, update</li>
            <li>Offer create, release</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
