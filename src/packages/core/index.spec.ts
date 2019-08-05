// Test that uuids are correctly evaluated;
import { v4 } from 'uuid';
import { Uuid, UUIDRefinement, uuidCheck} from '.';

describe('core types and utils', () => {
  describe('uuid type', () => {
    it('passes a valid, generated uuid', () => {
      const testString: Uuid = v4();

      expect(uuidCheck.test(testString)).toBe(true);

      const id2: Uuid = 'fekljfslefkjsbef'; // this should fail?
    });

  });
});
