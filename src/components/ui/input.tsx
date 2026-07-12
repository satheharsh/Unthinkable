import * as React from "react"
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input type={type} ref={ref} className={className} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', outline: 'none' }} {...props} />
})
Input.displayName = "Input"
export { Input }
