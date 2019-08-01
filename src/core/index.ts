import {string, refinement, TypeOf, Type } from 'io-ts';

const uuidCheck = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
const UUIDRefinement = refinement(string, (str: string) => uuidCheck.test(str), 'Uuid');

export type Uuid = TypeOf<typeof UUIDRefinement>;


// All this is testing trying to make the UUID types more specific

// https://github.com/Microsoft/TypeScript/issues/202#issuecomment-498201335

export function branded<T, Brand>() {
  return class Type {
      value: Type;
      '__ kind': Brand;
      static toBranded<Cls extends typeof Type>(this: Cls, t: T) {
        return t as unknown as InstanceType<Cls>;
      }
      static fromBranded<Cls extends typeof Type>(this:Cls, b: InstanceType<Cls>) {
        return b as unknown as T
      }
      static Type: Type;
  }
}

// Modified for UUID
export function uuidType<Brand>() {
  return class Type {
      value: Type;
      '__ kind': Brand;
      static fromUuid<Cls extends typeof Type>(this: Cls, t: Uuid) {
        return t as unknown as InstanceType<Cls>;
      }
      static toUuid<Cls extends typeof Type>(this:Cls, b: InstanceType<Cls>) {
        return b as unknown as Uuid
      }
      static Type: Type;
  }
}

/* THIS CODE WILL ERROR:

class AnimalId extends uuidType<'AnimalId'>() {}
class VegtableId extends uuidType<'VegtableId'>() {}
var x : AnimalId = AnimalId.toUuid('428a6b06-1120-4970-a0dc-3c48102d46ad');
var y : VegtableId = VegtableId.toUuid('928a6b06-1120-4970-a0dc-3c48102d46ad');

x = y;
*/

