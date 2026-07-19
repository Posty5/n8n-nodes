# 12 - Testing and Debugging

- Jest/ts-jest configuration is in jest.config.js.
- Every registered node has a matching test file; social-post also has account-specific coverage.
- Run build after parameter/type changes because n8n loads compiled dist paths declared in package.json.

## Debugging order

1. Reproduce with the smallest owning module or route/API call.
2. Inspect the exact entrypoint and boundary contract.
3. Check configuration names without printing values.
4. Run the narrow check, then the project build/typecheck.
5. Record any check that could not run and why.
