import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { bulkUserImport } from '@/lib/inngest/functions/bulk-user-import';
import { bulkProductImport } from '@/lib/inngest/functions/bulk-product-import';
import { simpleProductImport } from '@/lib/inngest/functions/simple-product-import';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    bulkUserImport,
    bulkProductImport,
    simpleProductImport,
  ],
});
