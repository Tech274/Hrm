import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyAuth } from '../middleware/rbac';

const router = Router();
router.use(authMiddleware);
router.use(requireAnyAuth);

const MOCK_CATEGORIES = [
  { id: 'hr-policies', name: 'HR Policies', docCount: 4 },
  { id: 'leave', name: 'Leave & Attendance', docCount: 3 },
  { id: 'code-conduct', name: 'Code of Conduct', docCount: 2 },
  { id: 'benefits', name: 'Benefits', docCount: 3 },
];

const MOCK_DOCS: { id: string; categoryId: string; title: string; summary: string }[] = [
  { id: 'doc-1', categoryId: 'hr-policies', title: 'Leave Policy', summary: 'Eligibility, types, and approval process for leave.' },
  { id: 'doc-2', categoryId: 'hr-policies', title: 'Attendance Policy', summary: 'Working hours, shift, and regularization guidelines.' },
  { id: 'doc-3', categoryId: 'hr-policies', title: 'WFH Policy', summary: 'Work from home eligibility and process.' },
  { id: 'doc-4', categoryId: 'hr-policies', title: 'Expense Policy', summary: 'Reimbursement and travel expense guidelines.' },
  { id: 'doc-5', categoryId: 'leave', title: 'Leave Balance', summary: 'How leave balance is calculated and carried forward.' },
  { id: 'doc-6', categoryId: 'leave', title: 'Holiday List', summary: 'Company holidays and optional holidays.' },
  { id: 'doc-7', categoryId: 'leave', title: 'Comp-off', summary: 'Compensatory off eligibility and application.' },
  { id: 'doc-8', categoryId: 'code-conduct', title: 'Code of Conduct', summary: 'Expected behaviour and ethics at workplace.' },
  { id: 'doc-9', categoryId: 'code-conduct', title: 'Anti-Harassment', summary: 'Policy against harassment and redressal.' },
  { id: 'doc-10', categoryId: 'benefits', title: 'Health Insurance', summary: 'Coverage and claim process.' },
  { id: 'doc-11', categoryId: 'benefits', title: 'Retirement Benefits', summary: 'PF and gratuity information.' },
  { id: 'doc-12', categoryId: 'benefits', title: 'Learning & Development', summary: 'L&D budget and course guidelines.' },
];

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string) || '';
    const categoryId = req.query.category as string;
    let docs = [...MOCK_DOCS];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      docs = docs.filter((d) => d.title.toLowerCase().includes(q) || d.summary.toLowerCase().includes(q));
    }
    if (categoryId) docs = docs.filter((d) => d.categoryId === categoryId);
    const categories = MOCK_CATEGORIES.map((c) => ({ ...c, docCount: docs.filter((d) => d.categoryId === c.id).length }));
    res.json({ categories, documents: docs });
  } catch (e) {
    next(e);
  }
});

export default router;
