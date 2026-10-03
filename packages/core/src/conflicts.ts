import type { Fact } from './types';

export interface FactConflict {
  subjectRef: string;
  criterion: string;
  facts: Fact[];
}

/** Two different values for the same subject and criterion. Both sides are kept. */
export function findConflicts(facts: Fact[]): FactConflict[] {
  const groups = new Map<string, Fact[]>();
  for (const fact of facts) {
    const key = JSON.stringify([fact.subject.ref, fact.criterion]);
    const list = groups.get(key);
    if (list) list.push(fact);
    else groups.set(key, [fact]);
  }

  const conflicts: FactConflict[] = [];
  for (const group of groups.values()) {
    const values = new Set(group.map((fact) => fact.value));
    if (group.length < 2 || values.size < 2) continue;
    const first = group[0];
    if (!first) continue;
    conflicts.push({
      subjectRef: first.subject.ref,
      criterion: first.criterion,
      facts: group.map((fact) => ({ ...fact, status: 'conflicting' })),
    });
  }
  return conflicts;
}
