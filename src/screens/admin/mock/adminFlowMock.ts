export type MockAdminUserRow = {
  id: string;
  name: string;
  role: 'Contractor' | 'Painter' | 'Dealer';
  balance: number;
  avatarColor: string;
};

export const MOCK_ADMIN_USERS: MockAdminUserRow[] = [
  {
    id: '1',
    name: 'Vikram Singh',
    role: 'Contractor',
    balance: 45280,
    avatarColor: '#93C5FD',
  },
  {
    id: '2',
    name: 'Rahul Kumar',
    role: 'Painter',
    balance: 120000,
    avatarColor: '#FCA5A5',
  },
  {
    id: '3',
    name: 'Priya Sharma',
    role: 'Dealer',
    balance: 8900,
    avatarColor: '#C4B5FD',
  },
  {
    id: '4',
    name: 'Amit Patel',
    role: 'Painter',
    balance: 22100,
    avatarColor: '#86EFAC',
  },
];

export type MockApprovalRow = {
  id: string;
  code: string;
  points: number;
  itemName: string;
  requester: string;
  pendingLabel: string;
  duplicate?: boolean;
};

export const MOCK_APPROVALS: MockApprovalRow[] = [
  {
    id: 'a1',
    code: 'REQ-9012',
    points: 120000,
    itemName: 'Apple iPhone 15',
    requester: 'Rahul Kumar',
    pendingLabel: 'Pending Review (2h ago)',
  },
  {
    id: 'a2',
    code: 'REQ-9011',
    points: 85000,
    itemName: 'MacBook Pro 14"',
    requester: 'Vikram Singh',
    pendingLabel: 'Pending Review (5h ago)',
  },
  {
    id: 'a3',
    code: 'REQ-9008',
    points: 45000,
    itemName: 'Sony WH-1000XM5',
    requester: 'Priya Sharma',
    pendingLabel: 'Duplicate Request Detected',
    duplicate: true,
  },
];

export function mockUserById(userId: string) {
  return MOCK_ADMIN_USERS.find(u => u.id === userId) ?? MOCK_ADMIN_USERS[0];
}

export function mockApprovalById(id: string) {
  return MOCK_APPROVALS.find(a => a.id === id) ?? MOCK_APPROVALS[0];
}
