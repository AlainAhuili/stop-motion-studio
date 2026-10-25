// Builds the C++ domain core.
//   node scripts/core.mjs test   native build + C++ unit tests (commit stage)
//   node scripts/core.mjs wasm   WebAssembly build -> src/domain/wasm/core.js
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const mode = process.argv[2];
// Build trees live in the temp folder: Visual Studio's build files nest deeply and
// would exceed Windows' 260-character path limit inside a long project path.
const nativeBuild = join(tmpdir(), 'stop-motion-core', 'native');
const wasmBuild = join(tmpdir(), 'stop-motion-core', 'wasm');
const isWindows = process.platform === 'win32';
const run = (cmd, args, env = process.env) =>
  execFileSync(cmd, args, { stdio: 'inherit', env, shell: isWindows && !cmd.includes('\\') });

/** On Windows, Visual Studio's own CMake knows the installed VS version; elsewhere use cmake on PATH. */
function cmake() {
  const vs = 'C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\CMake\\bin';
  return isWindows && existsSync(join(vs, 'cmake.exe'))
    ? { cmake: join(vs, 'cmake.exe'), ctest: join(vs, 'ctest.exe') }
    : { cmake: 'cmake', ctest: 'ctest' };
}

if (mode === 'test') {
  const { cmake: cm, ctest } = cmake();
  run(cm, ['-S', 'core', '-B', nativeBuild, '-DCMAKE_BUILD_TYPE=Release']);
  run(cm, ['--build', nativeBuild, '--config', 'Release', '--parallel']);
  run(ctest, ['--test-dir', nativeBuild, '-C', 'Release', '--output-on-failure']);
} else if (mode === 'wasm') {
  // emcmake comes from the Emscripten SDK: on PATH in CI, or in ~/emsdk locally.
  const emsdk = process.env.EMSDK ?? join(homedir(), 'emsdk');
  const emscripten = join(emsdk, 'upstream', 'emscripten');
  const env = {
    ...process.env,
    EM_CONFIG: process.env.EM_CONFIG ?? join(emsdk, '.emscripten'),
    PATH: `${emscripten}${isWindows ? ';' : ':'}${process.env.PATH}`,
  };
  const emcmake = isWindows ? join(emscripten, 'emcmake.exe') : 'emcmake';
  const generator = isWindows ? ['-G', 'Ninja', `-DCMAKE_MAKE_PROGRAM=${ninja()}`] : [];
  run(emcmake, [cmake().cmake, '-S', 'core', '-B', wasmBuild, '-DCMAKE_BUILD_TYPE=Release', ...generator], env);
  run(cmake().cmake, ['--build', wasmBuild, '--parallel'], env);
  mkdirSync('src/domain/wasm', { recursive: true });
  copyFileSync(join(wasmBuild, 'core.js'), 'src/domain/wasm/core.js');
  console.log('Wrote src/domain/wasm/core.js');
} else {
  console.error('Usage: node scripts/core.mjs <test|wasm>');
  process.exit(2);
}

function ninja() {
  return 'C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\Ninja\\ninja.exe';
}
