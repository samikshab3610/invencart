# InvenCart
AI-Powered Inventory & E-Commerce Management System for Small Businesses.

## Security Notes

### Known Vulnerabilities
- **@hono/node-server < 1.19.13** (moderate): Affects Prisma's internal dev tooling (`@prisma/dev`), not application runtime code. The vulnerable `serveStatic` middleware is not used in this Express-based application. Fix requires downgrading Prisma v7 → v6 which is a breaking change. Accepted as low-risk pending a non-breaking Prisma patch release.