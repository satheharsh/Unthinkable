import * as React from "react"
export const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => <table className={className} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }} {...props} />
export const TableHeader = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <thead className={className} style={{ background: '#f9fafb' }} {...props} />
export const TableBody = ({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody className={className} {...props} />
export const TableRow = ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => <tr className={className} style={{ borderBottom: '1px solid #e5e7eb' }} {...props} />
export const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={className} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '500', color: '#4b5563' }} {...props} />
export const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={className} style={{ padding: '0.75rem', color: '#1f2937' }} {...props} />
