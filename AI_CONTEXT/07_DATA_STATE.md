# 07 - Data and State

- Nodes are stateless per execution and read parameters/credentials from n8n.
- makeApiRequest unwraps a response.result envelope when present.
- POST bodies receive createdFrom: n8n.
- Pagination combines filter and page/pageSize query values.
- Binary uploads bypass Posty5 after receiving a signed URL.

## Contract rule

Types, request/response shapes, serialized route parameters, persisted settings, and public models are contracts. Update producers, consumers, tests, and AI indexes together when they change.
