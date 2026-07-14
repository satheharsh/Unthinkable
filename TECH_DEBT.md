# Technical Debt

1. **Error Handling:** Centralized error handling across Server Actions needs standardizing (some throw errors, some return `{ success: false, error: ... }`).
2. **Testing:** No unit or integration tests are present. Testing for the concurrency lock in `db-locks.ts` is highly recommended.
