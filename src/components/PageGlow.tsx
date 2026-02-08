/**
 * Ambient background glow effect for page layouts.
 * Adds subtle primary-colored radial gradients that create depth.
 */
export const PageGlow = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
    <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />
    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
    <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />
  </div>
);
