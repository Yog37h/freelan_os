import { PaymentTransaction } from '../types';

export const mockPaymentTransactions: PaymentTransaction[] = [
    {
        txnId: 'txn1',
        projectId: 'p1',
        clientName: 'John Doe',
        projectTitle: 'Website Revamp',
        type: 'upfront',
        direction: 'credit',
        amount: 60000,
        currency: 'INR',
        status: 'success',
        paidAt: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        reference: 'UPI-9876543210',
    },
    {
        txnId: 'txn2',
        projectId: 'p3',
        clientName: 'Mike Ross',
        projectTitle: 'Mobile App CI/CD',
        type: 'milestone',
        direction: 'credit',
        amount: 15000,
        currency: 'INR',
        status: 'success',
        paidAt: new Date(Date.now() - 1728000000).toISOString(), // 20 days ago
        reference: 'SBI-BNK-12345',
    },
    {
        txnId: 'txn3',
        projectId: 'p5',
        clientName: 'Harvey Specter',
        projectTitle: 'Legal SaaS Portal',
        type: 'milestone',
        direction: 'credit',
        amount: 175000,
        currency: 'INR',
        status: 'success',
        paidAt: new Date(Date.now() - 864000000).toISOString(), // 10 days ago
        reference: 'HDFC-PAY-4455',
    },
    {
        txnId: 'txn4',
        projectId: 'p1',
        clientName: 'John Doe',
        projectTitle: 'Website Revamp',
        type: 'milestone',
        direction: 'credit',
        amount: 30000,
        currency: 'INR',
        status: 'pending',
        paidAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    },
    {
        txnId: 'txn5',
        projectId: 'p2',
        clientName: 'Sarah Smith',
        projectTitle: 'Branding Kit',
        type: 'upfront',
        direction: 'credit',
        amount: 25000,
        currency: 'INR',
        status: 'failed',
        paidAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
        reference: 'ICICI-UPI-FAILED',
    },
    {
        txnId: 'txn6',
        projectId: 'p8',
        clientName: 'Tony Stark',
        projectTitle: 'AI Integration',
        type: 'upfront',
        direction: 'credit',
        amount: 125000,
        currency: 'INR',
        status: 'success',
        paidAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
        reference: 'STARK-INDS-001',
    }
];

// Add more mock transactions to reach ~15
for (let i = 7; i <= 15; i++) {
    mockPaymentTransactions.push({
        txnId: `txn${i}`,
        projectId: i % 2 === 0 ? 'p5' : 'p1',
        clientName: i % 2 === 0 ? 'Harvey Specter' : 'John Doe',
        projectTitle: i % 2 === 0 ? 'Legal SaaS Portal' : 'Website Revamp',
        type: 'milestone',
        direction: 'credit',
        amount: 1000 * i,
        currency: 'INR',
        status: 'success',
        paidAt: new Date(Date.now() - 86400000 * i * 3).toISOString(),
        reference: `AUTO-TXN-${i}`,
    });
}
