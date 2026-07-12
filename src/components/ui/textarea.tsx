import * as React from "react"
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return <textarea ref={ref} className={className} style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', minHeight: '120px', outline: 'none', fontFamily: 'inherit' }} {...props} />
})
Textarea.displayName = "Textarea"
export { Textarea }
