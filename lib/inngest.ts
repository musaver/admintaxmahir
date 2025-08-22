import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'inventory-app',
  name: 'Inventory Management System',
  env: process.env.NODE_ENV,
});
