# Security Specification — KidHero Family Sync (`security_spec.md`)

## 1. Data Invariants
1. **Default Deny**: All paths not explicitly matched in `/families/{familyCode}` are denied for both `read` and `write`.
2. **Verified Identity**: Only authenticated users with verified emails (`request.auth != null && request.auth.token.email_verified == true`) or the bootstrapped admin (`thaotrainner@gmail.com`) may read or write family documents.
3. **Path Variable Hardening**: Every `{familyCode}` document ID must satisfy `isValidId(familyCode)` (`familyCode is string && familyCode.size() >= 3 && familyCode.size() <= 64 && familyCode.matches('^[a-zA-Z0-9_\\-]+$')`).
4. **Schema Blueprint Enforcement (`isValidFamilyRoom`)**:
   - Strict keys on `create`: `hasAll(['familyCode', 'ownerId', 'stars', 'totalStarsEarned', 'level', 'currentXp', 'payload', 'lastSyncTimestamp', 'createdAt', 'updatedAt'])` and `hasOnly([...])`.
   - `familyCode == familyCodePath` (path-to-body binding).
   - `ownerId == request.auth.uid` on `create`, and `incoming().ownerId == existing().ownerId` on `update`.
   - `createdAt == request.time` on `create`, and `incoming().createdAt == existing().createdAt` on `update`.
   - `updatedAt == request.time` on both `create` and `update`.
   - Numeric bounds on `stars`, `totalStarsEarned`, `level`, `currentXp`, `lastSyncTimestamp`.
   - `payload is map && payload.size() <= 30`.
5. **No Blanket List**: `allow list: if false;` — clients only subscribe to a specific `doc(db, 'families', familyCode)` by its exact `familyCode`, preventing enumeration of other families' rooms.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, creating `/families/HERO-KID-8823` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'u1', token: { email: 'thaotrainner@gmail.com', email_verified: false } }` -> `PERMISSION_DENIED`.
3. **ID Poisoning**: Document path `/families/INVALID$PATH!@#` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Payload includes extra key `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection on Update**: Update modifies unauthorized key `hackedField` -> `PERMISSION_DENIED`.
6. **Owner Spoofing on Create**: `ownerId: 'victim_uid'` when `request.auth.uid == 'attacker_uid'` -> `PERMISSION_DENIED`.
7. **Owner Mutation on Update**: Changing `ownerId` on update -> `PERMISSION_DENIED`.
8. **CreatedAt Mutation on Update**: Changing `createdAt` on update -> `PERMISSION_DENIED`.
9. **Client Timestamp Forgery**: Setting `updatedAt` to a past/future timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **Negative Star Balance**: Setting `stars: -500` -> `PERMISSION_DENIED`.
11. **Oversized Payload Map**: Setting `payload` to a string or oversized map (> 30 keys) -> `PERMISSION_DENIED`.
12. **Collection Enumeration (List Query)**: Calling `getDocs(collection(db, 'families'))` -> `PERMISSION_DENIED`.
