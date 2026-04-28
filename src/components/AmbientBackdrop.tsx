/** Soft floating gradient orbs that sit behind glass surfaces. */
const AmbientBackdrop = () => (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/25 blur-3xl animate-float-slow" />
    <div
      className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-primary-glow/30 blur-3xl animate-float-slow"
      style={{ animationDelay: "-4s" }}
    />
    <div
      className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-accent/15 blur-3xl animate-float-slow"
      style={{ animationDelay: "-8s" }}
    />
  </div>
);

export default AmbientBackdrop;
