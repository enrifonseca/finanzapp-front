import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// docs/spec/04 §3: ui-system no llama API; core-react no conoce features; app usa core-react/ui-system/layout.
const FORBIDDEN: Record<string, string[]> = {
  'ui-system': ['core-react', 'layout', 'app', 'kernel'],
  'core-react': ['ui-system', 'layout', 'app', 'kernel'],
  layout: ['core-react', 'app', 'kernel'],
  app: ['kernel'],
};

const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [];
  });

describe('dependencias entre capas del frontend', () => {
  for (const [layer, banned] of Object.entries(FORBIDDEN)) {
    it(`${layer} no importa ${banned.join(', ')}`, () => {
      const offenders = walk(join('src', layer)).filter((file) => {
        const src = readFileSync(file, 'utf8');
        return banned.some((b) => new RegExp(`from '@/${b}[/']`).test(src));
      });
      expect(offenders).toEqual([]);
    });
  }

  it('ui-system no hace llamadas HTTP', () => {
    const offenders = walk('src/ui-system').filter((f) => /fetch\(|openapi-fetch|react-query/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('los archivos de ruta de Expo Router solo reexportan pantallas', () => {
    const offenders = walk('app')
      .filter((f) => !f.includes('_layout'))
      .filter((f) => !/^export \{ \w+ as default \} from '@\/app\/[\w/]+';$/.test(readFileSync(f, 'utf8').trim()));
    expect(offenders).toEqual([]);
  });
});

describe('tipografía y colores: una sola fuente de verdad', () => {
  const files = [...walk('src'), ...walk('app')];

  it('ningún componente fija fontFamily fuera de Roboto ni usa fontWeight (el peso va por familia Roboto)', () => {
    const offenders = files.filter((f) => {
      if (f.endsWith('ui-system/fonts.ts')) return false;
      const src = readFileSync(f, 'utf8');
      const badFamily = [...src.matchAll(/fontFamily:\s*([^,}\n]+)/g)].some((m) => !/FONT\.(regular|medium|bold)/.test(m[1]!));
      return badFamily || /fontWeight/.test(src);
    });
    expect(offenders).toEqual([]);
  });

  it('los colores hexadecimales viven solo en el tema', () => {
    const offenders = files.filter((f) => !f.endsWith('ui-system/theme.ts') && /#[0-9A-Fa-f]{6}\b/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('el tema no lee el modo del sistema (useColorScheme): el oscuro es una elección del usuario', () => {
    const offenders = files.filter((f) => /useColorScheme/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
