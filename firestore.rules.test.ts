/**
 * Firestore Security Rules Test Specification for KidHero (/families/{familyCode})
 * Verifies that all Dirty Dozen attack payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED' | 'ALLOWED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated create attempt',
    auth: null,
    operation: 'create',
    path: '/families/HERO-KID-8823',
    payload: { familyCode: 'HERO-KID-8823' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 2,
    name: 'Unverified email spoof attempt',
    auth: { uid: 'u1', email: 'thaotrainner@gmail.com', email_verified: false },
    operation: 'create',
    path: '/families/HERO-KID-8823',
    payload: { familyCode: 'HERO-KID-8823', ownerId: 'u1' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 3,
    name: 'ID poisoning with invalid characters',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'get',
    path: '/families/INVALID$ID!',
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 4,
    name: 'Shadow field injection on create',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'create',
    path: '/families/HERO-KID-8823',
    payload: {
      familyCode: 'HERO-KID-8823',
      ownerId: 'u1',
      stars: 85,
      totalStarsEarned: 135,
      level: 3,
      currentXp: 160,
      payload: {},
      lastSyncTimestamp: 1700000000000,
       isVerifiedShadow: true
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 5,
    name: 'Shadow field injection on update',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'update',
    path: '/families/HERO-KID-8823',
    payload: { ghostField: 'malicious' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 6,
    name: 'Owner spoofing on create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    operation: 'create',
    path: '/families/HERO-KID-8823',
    payload: {
      familyCode: 'HERO-KID-8823',
      ownerId: 'victim_uid',
      stars: 85,
      totalStarsEarned: 135,
      level: 3,
      currentXp: 160,
      payload: {},
      lastSyncTimestamp: 1700000000000
    },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 7,
    name: 'Owner mutation on update',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'update',
    path: '/families/HERO-KID-8823',
    payload: { ownerId: 'another_uid' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 8,
    name: 'Immortal field createdAt mutation on update',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'update',
    path: '/families/HERO-KID-8823',
    payload: { createdAt: '2020-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 9,
    name: 'Client timestamp forgery on update',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'update',
    path: '/families/HERO-KID-8823',
    payload: { updatedAt: '2099-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 10,
    name: 'Negative star balance value poisoning',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'update',
    path: '/families/HERO-KID-8823',
    payload: { stars: -999 },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 11,
    name: 'Invalid payload type (string instead of map)',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'update',
    path: '/families/HERO-KID-8823',
    payload: { payload: 'not_a_map' },
    expectedResult: 'PERMISSION_DENIED'
  },
  {
    id: 12,
    name: 'Collection list query enumeration attempt',
    auth: { uid: 'u1', email: 'parent@example.com', email_verified: true },
    operation: 'list',
    path: '/families',
    expectedResult: 'PERMISSION_DENIED'
  }
];
