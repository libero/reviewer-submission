import {string, refinement, TypeOf } from 'io-ts';

export const uuidCheck = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;
export const UUIDRefinement = refinement(string, (str: string) => uuidCheck.test(str), 'Uuid');

// tslint:disable:max-classes-per-file
export type Uuid = TypeOf<typeof UUIDRefinement>;

// All this is testing trying to make the UUID types more specific
// https://github.com/Microsoft/TypeScript/issues/202#issuecomment-498201335
export function branded<T, Brand>() {
  return class BrandedType {
      value: BrandedType;
      '__ kind': Brand;
      static toBranded<Cls extends typeof BrandedType>(this: Cls, t: T) {
        return t as unknown as InstanceType<Cls>;
      }
      static fromBranded<Cls extends typeof BrandedType>(this: Cls, b: InstanceType<Cls>) {
        return b as unknown as T;
      }
      static Type: BrandedType;
  };
}

// Modified for UUID
export function uuidType<Brand>() {
  return class UuidType {
      value: UuidType;
      '__ kind': Brand;
      static fromUuid<Cls extends typeof UuidType>(this: Cls, t: Uuid) {
        if (!uuidCheck.test(t)) {
          throw new TypeError(`fromUuid was passed a non-uuid: ${t}`);
        }
        return t as unknown as InstanceType<Cls>;
      }
      static toUuid<Cls extends typeof UuidType>(this: Cls, b: InstanceType<Cls>) {
        return b as unknown as Uuid;
      }
      static Type: UuidType;
  };
}
