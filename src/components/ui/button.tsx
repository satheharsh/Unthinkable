import * as React from "react"
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: string; size?: string }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button ref={ref} className={className} style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }} {...props} />
})
Button.displayName = "Button"
export { Button }
