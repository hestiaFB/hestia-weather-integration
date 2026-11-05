// Shared build options for cards embedded in a Hestia-FB integration.
// Keep the WHOLE bundle behind this gate: static ESM imports (including Lit)
// would otherwise execute before it and capture HA's pre-polyfill environment.
// HA defines home-assistant after installing its scoped element registry.
// Read the current registry again after awaiting: the original one may have
// been replaced while its native whenDefined promise was pending.
export const haCardBuild = {
  format: 'iife',
  banner: { js: `// Home Assistant frontend#53890: wait for the final custom element registry.
while (!customElements.get('home-assistant')) {
  await customElements.whenDefined('home-assistant');
}` },
};
