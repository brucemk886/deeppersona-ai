/** Shared raster artwork from the selected DeepPersona identity. */
export function BrandLogo() {
  return <img className="brand-lockup" src="/brand/logo-v2.webp" alt="DeepPersona AI" width={660} height={143} decoding="async" />;
}

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return <img className={`brand-symbol${inverse ? " brand-symbol-inverse" : ""}`} src="/brand/mark-v2.png" alt="DeepPersona AI" width={256} height={256} decoding="async" />;
}
