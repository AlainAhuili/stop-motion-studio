import createCore from './wasm/core.js';

/**
 * The business rules, written in C++ (core/) and compiled to WebAssembly.
 * The other files in src/domain only declare types and forward calls to it.
 */
export const core = await createCore();
