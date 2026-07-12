import * as React from "react"
export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={className} style={{ border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} {...props} />
export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={className} style={{ marginBottom: '1rem' }} {...props} />
export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={className} style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }} {...props} />
export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div className={className} {...props} />
