type AssetIconProps = {
  src: string
  className?: string
}

export function AssetIcon({ src, className = '' }: AssetIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`asset-icon ${className}`}
      style={{ maskImage: `url("${src}")` }}
    />
  )
}
