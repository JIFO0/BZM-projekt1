/**
 * Snapshot pipeline (fetch, normalise, conflict check, validate, write) is not
 * implemented yet. Calling this keeps the package in the workspace without
 * pretending a snapshot exists.
 */
export function buildSnapshot(): never {
  throw new Error(
    'Snapshot builder is not implemented. Demo data must be labelled DANE PRZYKŁADOWE when it is added.',
  );
}
