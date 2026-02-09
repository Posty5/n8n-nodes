# N8N Nodes Refactor Plan
**Issue:** n8n community nodes cannot use external npm dependencies  
**Current Problem:** Package rejected because of @posty5/* dependencies  
**Solution:** Internalize all SDK logic using n8n's native HTTP helpers

---

## 📋 Current Architecture Analysis

### Current Dependencies (To Remove)
```json
"@posty5/core": "^2.0.0",
"@posty5/html-hosting": "^2.0.0",
"@posty5/html-hosting-form-submission": "^2.0.0",
"@posty5/html-hosting-variables": "^2.0.0",  // Already deleted
"@posty5/qr-code": "^2.0.0",
"@posty5/short-link": "^2.0.0",
"@posty5/social-publisher-task": "^2.0.0",
"@posty5/social-publisher-workspace": "^2.0.0"
```

### Current Node Files
1. ✅ **Posty5ShortLink.node.ts** - Uses ShortLinkClient
2. ✅ **Posty5QrCode.node.ts** - Uses QRCodeClient
3. ✅ **Posty5HtmlHosting.node.ts** - Uses HtmlHostingClient
4. ❌ **Posty5HtmlHostingVariables/** - DELETED (not needed)
5. ✅ **Posty5FormSubmission.node.ts** - Uses HtmlHostingFormSubmissionClient
6. ✅ **Posty5SocialPublisherWorkspace.node.ts** - Uses SocialPublisherWorkspaceClient
7. ✅ **Posty5SocialPublisherTask.node.ts** - Uses SocialPublisherTaskClient

---

## 🎯 Refactoring Strategy

### **Approach: Use N8N Native HTTP Helpers**
✅ **Recommended** - This is the standard n8n community node pattern

#### Why This Approach?
- ✅ No external dependencies (n8n requirement)
- ✅ Uses n8n's built-in `this.helpers.httpRequest()` 
- ✅ Direct API calls without middleware
- ✅ Smaller package size
- ✅ Easier n8n approval process
- ✅ Full control over requests
- ✅ Better integration with n8n ecosystem

#### What We Keep from npm-sdk
1. **TypeScript Interfaces** - Copy all type definitions
2. **API Knowledge** - Endpoints, parameters, response structures
3. **Business Logic** - Request building, validation

#### What We Replace
1. ~~HttpClient~~ → `this.helpers.httpRequest()`
2. ~~axios~~ → n8n's native request handling
3. ~~SDK Client Classes~~ → Direct API utilities

---

## 📁 New Internal Structure

```
n8n-nodes/
├── package.json              # Remove all @posty5/* deps
├── tsconfig.json
├── nodes/
│   ├── Posty5ShortLink/
│   ├── Posty5QrCode/
│   ├── Posty5HtmlHosting/
│   ├── Posty5FormSubmission/
│   ├── Posty5SocialPublisherWorkspace/
│   └── Posty5SocialPublisherTask/
├── utils/                    # NEW - Internal utilities
│   ├── api.helpers.ts        # HTTP request wrappers
│   ├── constants.ts          # API base URL, endpoints
│   └── validators.ts         # Input validation
└── types/                    # NEW - Type definitions
    ├── common.ts             # Shared types (pagination, etc.)
    ├── short-link.types.ts
    ├── qr-code.types.ts
    ├── html-hosting.types.ts
    ├── form-submission.types.ts
    ├── workspace.types.ts
    └── task.types.ts
```

---

## 🔧 Implementation Plan

### Phase 1: Create Internal Infrastructure (2-3 hours)

#### Step 1.1: Create `utils/constants.ts`
```typescript
export const POSTY5_API_BASE_URL = 'https://api.posty5.com';

export const API_ENDPOINTS = {
  SHORT_LINK: '/api/short-link',
  QR_CODE: '/api/qr-code',
  HTML_HOSTING: '/api/html-hosting',
  FORM_SUBMISSION: '/api/html-hosting-form-submission',
  WORKSPACE: '/api/social-publisher-workspace',
  TASK: '/api/social-publisher-task',
};
```

#### Step 1.2: Create `utils/api.helpers.ts`
```typescript
import { IExecuteFunctions } from 'n8n-workflow';

export interface IApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  body?: any;
  qs?: any;
}

export async function makeApiRequest(
  this: IExecuteFunctions,
  apiKey: string,
  options: IApiRequestOptions,
) {
  const baseUrl = process.env.POSTY5_BASE_URL || 'https://api.posty5.com';
  
  const requestOptions = {
    method: options.method,
    url: `${baseUrl}${options.endpoint}`,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: options.body,
    qs: options.qs,
    json: true,
  };

  try {
    const response = await this.helpers.httpRequest(requestOptions);
    return response;
  } catch (error) {
    throw new Error(`Posty5 API Error: ${error.message}`);
  }
}
```

#### Step 1.3: Create Type Files
Copy interfaces from npm-sdk to `types/` folder:
- Extract all interfaces from npm-sdk packages
- Remove SDK client imports
- Keep only data structures

### Phase 2: Refactor Each Node (3-4 hours)

#### Example: ShortLink Node Refactoring

**BEFORE:**
```typescript
import { ShortLinkClient } from '@posty5/short-link';

const { HttpClient } = await import('@posty5/core');
const http = new HttpClient({ apiKey: credentials.apiKey as string });
const client = new ShortLinkClient(http);

const shortLink = await client.get(id);
```

**AFTER:**
```typescript
import { makeApiRequest } from '../../utils/api.helpers';
import { API_ENDPOINTS } from '../../utils/constants';
import { IShortLinkResponse } from '../../types/short-link.types';

const apiKey = credentials.apiKey as string;

const shortLink = await makeApiRequest.call(this, apiKey, {
  method: 'GET',
  endpoint: `${API_ENDPOINTS.SHORT_LINK}/${id}`,
}) as IShortLinkResponse;
```

#### Refactoring Steps for Each Node:
1. Remove @posty5 imports
2. Add internal imports (utils, types)
3. Replace client.method() calls with makeApiRequest()
4. Update type annotations to use internal types
5. Test compilation

### Phase 3: Update Package Configuration (30 min)

#### Update package.json:
1. Remove all `@posty5/*` from dependencies
2. Remove deleted node from n8n.nodes array:
```json
"nodes": [
  "dist/nodes/Posty5ShortLink/Posty5ShortLink.node.js",
  "dist/nodes/Posty5QrCode/Posty5QrCode.node.js",
  "dist/nodes/Posty5HtmlHosting/Posty5HtmlHosting.node.js",
  // REMOVED: "dist/nodes/Posty5HtmlHostingVariables/...",
  "dist/nodes/Posty5FormSubmission/Posty5FormSubmission.node.js",
  "dist/nodes/Posty5SocialPublisherWorkspace/Posty5SocialPublisherWorkspace.node.js",
  "dist/nodes/Posty5SocialPublisherTask/Posty5SocialPublisherTask.node.js"
]
```
3. Verify no other dependencies needed
4. Update version to 2.1.0 (breaking change)

#### Update tsconfig.json:
- Ensure `utils/` and `types/` are included
- Verify path mappings if needed

### Phase 4: Testing & Validation (1-2 hours)

1. **Build Test:**
   ```bash
   npm run build
   ```
   - Verify 0 TypeScript errors
   - Check dist/ output

2. **Node-by-Node Testing:**
   - Start with simplest: ShortLink
   - Test each operation (create, get, list, update, delete)
   - Verify error handling
   - Test pagination

3. **Integration Testing:**
   - Install locally in n8n
   - Test actual API calls
   - Verify responses match expected types

4. **N8N Validation:**
   - Run n8n community node checks
   - Verify no external dependencies
   - Check package size

---

## 📊 Comparison: npm-sdk vs n8n-nodes

| Aspect | npm-sdk | n8n-nodes (New) |
|--------|---------|-----------------|
| **HTTP Client** | axios + custom HttpClient | n8n helpers.httpRequest() |
| **Dependencies** | axios, axios-retry | None (n8n built-in) |
| **Code Organization** | Separate packages | Single package with utils |
| **Type Safety** | Full TypeScript | Full TypeScript (copied) |
| **Maintenance** | SDK updates needed | Independent |
| **Bundle Size** | ~50KB+ per SDK | ~5-10KB total |
| **N8n Approval** | ❌ Rejected | ✅ Accepted |

---

## 🚀 Migration Benefits

### For Users
- ✅ Approved by n8n
- ✅ Available in n8n community nodes
- ✅ Faster loading (smaller size)
- ✅ Better n8n integration

### For Developers
- ✅ No dependency management
- ✅ Direct control over HTTP
- ✅ Easier debugging
- ✅ Standard n8n patterns

### For Maintenance
- ✅ Independent from npm-sdk
- ✅ Can update separately
- ✅ No version conflicts
- ✅ Simplified deployment

---

## ⚠️ Considerations

### Code Duplication
- **Issue:** Type definitions duplicated between npm-sdk and n8n-nodes
- **Impact:** Low - types change infrequently
- **Mitigation:** Document which npm-sdk version types are from

### Maintenance Sync
- **Issue:** API changes need updates in 2 places
- **Impact:** Medium - requires documentation
- **Mitigation:** 
  - Keep changelog of API changes
  - Update n8n-nodes when npm-sdk major versions release
  - Document npm-sdk → n8n-nodes type mapping

### Feature Parity
- **Issue:** npm-sdk might have features n8n-nodes doesn't
- **Impact:** Low - n8n nodes expose main features
- **Mitigation:** Focus on common use cases in n8n

---

## 📝 Implementation Checklist

### Pre-Implementation
- [x] Analyze current architecture
- [ ] Review n8n community node guidelines
- [ ] Backup current code
- [ ] Create feature branch

### Phase 1: Infrastructure
- [ ] Create `utils/constants.ts`
- [ ] Create `utils/api.helpers.ts`
- [ ] Create `utils/validators.ts`
- [ ] Create `types/common.ts`
- [ ] Create `types/short-link.types.ts`
- [ ] Create `types/qr-code.types.ts`
- [ ] Create `types/html-hosting.types.ts`
- [ ] Create `types/form-submission.types.ts`
- [ ] Create `types/workspace.types.ts`
- [ ] Create `types/task.types.ts`

### Phase 2: Node Refactoring
- [ ] Refactor Posty5ShortLink.node.ts
- [ ] Refactor Posty5QrCode.node.ts
- [ ] Refactor Posty5HtmlHosting.node.ts
- [ ] Refactor Posty5FormSubmission.node.ts
- [ ] Refactor Posty5SocialPublisherWorkspace.node.ts
- [ ] Refactor Posty5SocialPublisherTask.node.ts

### Phase 3: Configuration
- [ ] Update package.json (remove deps)
- [ ] Update n8n.nodes array
- [ ] Update tsconfig.json
- [ ] Update version to 2.1.0
- [ ] Update README.md

### Phase 4: Testing
- [ ] Build test (npm run build)
- [ ] TypeScript compilation (0 errors)
- [ ] Test ShortLink operations
- [ ] Test QRCode operations
- [ ] Test HtmlHosting operations
- [ ] Test FormSubmission operations
- [ ] Test Workspace operations
- [ ] Test Task operations
- [ ] Install in n8n locally
- [ ] Integration tests with real API
- [ ] N8n community checks

### Phase 5: Documentation
- [ ] Update node documentation
- [ ] Document API helper usage
- [ ] Add migration guide
- [ ] Update changelog
- [ ] Document type sync process

---

## ⏱️ Estimated Timeline

| Phase | Tasks | Time | Complexity |
|-------|-------|------|------------|
| **Phase 1** | Infrastructure | 2-3 hours | Medium |
| **Phase 2** | Node Refactoring | 3-4 hours | High |
| **Phase 3** | Configuration | 30 min | Low |
| **Phase 4** | Testing | 1-2 hours | Medium |
| **Phase 5** | Documentation | 1 hour | Low |
| **Total** | | **7-10 hours** | |

---

## 🎬 Next Steps

1. **Review This Plan** - Confirm approach with team
2. **Get Approval** - Verify this solves n8n rejection
3. **Start Phase 1** - Create infrastructure files
4. **Implement Iteratively** - One node at a time
5. **Test Continuously** - Validate after each node
6. **Submit to N8N** - Publish updated package

---

## 📚 References

- [N8N Creating Nodes](https://docs.n8n.io/integrations/creating-nodes/)
- [N8N Community Nodes Guidelines](https://docs.n8n.io/integrations/community-nodes/)
- [N8N HTTP Request Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/)
- [Posty5 API Documentation](https://api.posty5.com/docs)

---

**Status:** 📋 **PLAN COMPLETE - AWAITING APPROVAL**  
**Created:** February 8, 2026  
**Version:** 1.0
