export default function Button({ children, href, variant, type, className = '', ...props }) {
  const Component = href ? 'a' : 'button'
  const buttonVariant = variant || (['primary', 'secondary', 'accent'].includes(type) ? type : 'primary')
  const buttonType = href ? undefined : ['button', 'submit', 'reset'].includes(type) ? type : 'button'
  const variantClass = buttonVariant === 'secondary' ? 'btn-secondary' : buttonVariant === 'accent' ? 'btn-accent' : 'btn-primary'

  return (
    <Component className={`btn ${variantClass} ${className}`} href={href} type={buttonType} {...props}>
      {children}
    </Component>
  )
}
