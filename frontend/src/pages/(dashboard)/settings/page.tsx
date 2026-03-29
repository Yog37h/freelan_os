

import { Button } from '../../../components/ui/Button';
import { Link } from '@/components/router/Link';
import { ChevronLeft } from 'lucide-react';

export default function Page() {
  return (
    <div className='space-y-6'>
      <Link href='/dashboard' className='inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors'>
        <ChevronLeft size={16} className='mr-1' /> Back to Dashboard
      </Link>
      <div className='glass-panel p-12 rounded-2xl border-dashed flex flex-col items-center justify-center text-center'>
        <h1 className='text-3xl font-bold mb-4 uppercase tracking-tighter'>SETTINGS</h1>
        <p className='text-muted-foreground mb-8'>This section is currently under development.</p>
        <Button variant='outline' onClick={() => window.history.back()}>Go Back</Button>
      </div>
    </div>
  );
}
