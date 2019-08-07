import * as t from 'io-ts';

export const uuidCheck = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
export const UUIDRefinement = t.refinement(t.string, (str: string) => uuidCheck.test(str), 'Uuid');

export type Uuid = t.TypeOf<typeof UUIDRefinement>;
