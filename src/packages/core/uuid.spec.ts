import * as fs from 'fs';
import { v4 } from 'uuid';
import { Uuid,  uuidCheck, uuidType} from './uuid';
import * as ts from 'typescript';

// taken from: https://github.com/Microsoft/TypeScript-wiki/blob/master/Using-the-Compiler-API.md#a-minimal-compiler
function compile(fileNames: string[], options: ts.CompilerOptions): { exitCode: number, allDiagnostics: ts.Diagnostic[]} {
  const program = ts.createProgram(fileNames, options);
  const emitResult = program.emit();

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  const exitCode = emitResult.emitSkipped ? 1 : 0;
  return { exitCode , allDiagnostics };
}

describe('core types and utils', () => {
  describe('uuid regex', () => {
    it('passes a valid, generated uuid', () => {
      const testString: Uuid = v4();

      expect(uuidCheck.test(testString)).toBe(true);
    });
    it('fails an invalid uuid', () => {
      const id2: Uuid = 'fekljfslefkjsbef';
      expect(uuidCheck.test(id2)).toBe(false);
    });
  });

  describe('UuidType class', () => {
    const tempFile = './test.tmp.ts';

    class AnimalId extends uuidType<'AnimalId'>() {}
    // tslint:disable-next-line
    class VegtableId extends uuidType<'VegtableId'>() {}

    afterAll(() => {
      fs.unlinkSync(tempFile);
    });

    it('similar types can be assigned', () => {
      let x: AnimalId;
      const y: AnimalId = AnimalId.fromUuid('200a6b06-1120-4970-a0dc-3c48102d46ad');
      const assign = () => {
        x = y;
      };
      expect(assign).not.toThrow();
    });

    it('dissimililar types cannot be assigned', () => {
      const tscode: string = `
      import { uuidType } from './src/packages/core';
      ({
        assign: (): string => {
          class AnimalId extends uuidType<'AnimalId'>() {}
          class VegtableId extends uuidType<'VegtableId'>() {}

          let x : AnimalId = AnimalId.fromUuid('100a6b06-1120-4970-a0dc-3c48102d46ad');
          let y : VegtableId = VegtableId.fromUuid('200a6b06-1120-4970-a0dc-3c48102d46ad');
          x = y;
          return "SUCCESS";
          }
      })`;

      fs.writeFileSync(tempFile, tscode);

      const result = compile([ tempFile ], {
        noEmitOnError: true,
        noImplicitAny: true,
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.CommonJS,
      });

      expect(result.exitCode).toBe(1);
      expect(result.allDiagnostics).toHaveLength(2);

      const message = ts.flattenDiagnosticMessageText(result.allDiagnostics[0].messageText, ' ');
      const expectedError = 'Type \'VegtableId\' is not assignable to type \'AnimalId\'.';
      const expectedErrorCode = 2322;

      expect(result.allDiagnostics[0].code).toBe(expectedErrorCode);
      expect(message).toContain(expectedError);
    });
  });
});
