# 12 - Testing and Debugging

- Jest/ts-jest configuration is in jest.config.js.
- Every registered node has a matching test file; social-post also has account-specific coverage.
- *Get Analytics* (Short Link and QR Code) runs one shared suite, `__tests__/link-analytics.shared.ts` (`describeGetAnalyticsOperation`), from both node test files; it fakes the clock to `ANALYTICS_NOW` (`__tests__/link-analytics.fixture.ts`). Helper units are in `__tests__/analytics.helpers.test.ts`.
- `__mocks__/n8n-workflow.ts` provides `NodeApiError` / `NodeOperationError` stand-ins and `setup.ts` a `getNode()`, for code that throws n8n errors.
- Run build after parameter/type changes because n8n loads compiled dist paths declared in package.json.

## Debugging order

1. Reproduce with the smallest owning module or route/API call.
2. Inspect the exact entrypoint and boundary contract.
3. Check configuration names without printing values.
4. Run the narrow check, then the project build/typecheck.
5. Record any check that could not run and why.
