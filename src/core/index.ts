import {string, refinement, TypeOf, Type } from 'io-ts';

const uuidCheck = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
const UUIDRefinement = refinement(string, (str: string) => uuidCheck.test(str), 'Uuid');

export type Uuid = TypeOf<typeof UUIDRefinement>;
