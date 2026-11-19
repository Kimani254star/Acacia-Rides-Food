# Production completion checklist

- [ ] Choose and provision the production backend/database.
- [ ] Implement server-side authentication and role-based authorization.
- [ ] Move users, profiles, vehicles, restaurants, menu items, rides, food orders, parcels, wallet ledger, withdrawals, support tickets and audit events into the database.
- [ ] Add database constraints and transactions for job assignment, wallet holds/captures/refunds and commission splits.
- [ ] Add real-time updates for dispatch and order tracking.
- [ ] Integrate M-Pesa Daraja using server-side secrets and verified callbacks; add idempotency keys and reconciliation.
- [ ] Integrate card payments through a PCI-compliant provider.
- [ ] Add driver and merchant onboarding/verification workflows.
- [ ] Add maps, routing, geocoding, notifications, privacy controls and operational logging.
- [ ] Test all flows in staging with test credentials before any live deployment.
