export const SOURCE_FAILURE_KINDS = [
  'unauthorized',
  'forbidden',
  'not_found',
  'validation',
  'rate_limited',
  'timeout',
  'server',
  'malformed',
  'unavailable',
] as const;

export type SourceFailureKind = (typeof SOURCE_FAILURE_KINDS)[number];

/** Typed failure from an external source. Never means "no barriers". */
export class SourceFailure extends Error {
  readonly name = 'SourceFailure';

  constructor(
    readonly sourceName: string,
    readonly kind: SourceFailureKind,
    readonly httpStatus: number | undefined,
    message: string,
  ) {
    super(message);
  }
}

export type FallbackKind = 'cached' | 'snapshot' | 'none';

export interface FallbackState {
  kind: FallbackKind;
  retrievedAt?: string;
  /** True when the stand-in data is the bundled demo snapshot. */
  isSample: boolean;
}
