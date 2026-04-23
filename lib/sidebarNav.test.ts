import { isSidebarRouteActive, normalizeExpoPath } from './sidebarNav';

describe('normalizeExpoPath', () => {
  const cases: Array<[string, string]> = [
    ['/', '/'],
    ['', '/'],
    ['/(admin)', '/'],
    ['/(admin)/dashboard', '/dashboard'],
    ['/(staff)/schedules', '/schedules'],
    ['/(student)/documents', '/documents'],
    ['/(shared)/settings', '/settings'],
    ['/(admin)/(nested)/schedules', '/schedules'],
    ['/dashboard', '/dashboard'],
    ['/a/b/c', '/a/b/c'],
  ];

  it.each(cases)('%s → %s', (input, expected) => {
    expect(normalizeExpoPath(input)).toBe(expected);
  });
});

describe('isSidebarRouteActive', () => {
  it('matches identical paths', () => {
    expect(isSidebarRouteActive('/dashboard', '/dashboard')).toBe(true);
  });

  it('matches when only one side has a group segment', () => {
    expect(isSidebarRouteActive('/(admin)/dashboard', '/dashboard')).toBe(true);
    expect(isSidebarRouteActive('/dashboard', '/(admin)/dashboard')).toBe(true);
  });

  it('matches when both sides have different group segments', () => {
    expect(isSidebarRouteActive('/(admin)/documents', '/(shared)/documents')).toBe(true);
  });

  it('returns false when leaves differ', () => {
    expect(isSidebarRouteActive('/(admin)/dashboard', '/(admin)/schedules')).toBe(false);
  });
});
