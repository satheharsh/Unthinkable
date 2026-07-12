import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ padding: '4rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'bold' }}>🏥 HealthSync Portal</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Welcome to the HealthSync Appointment System. Please select your portal to continue:</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link 
          href="/patient/search"
          style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333', fontWeight: '500' }}
        >
          🔍 Patient Portal (Search & Book)
        </Link>
        <Link 
          href="/doctor/dashboard"
          style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333', fontWeight: '500' }}
        >
          ⚕️ Doctor Dashboard (Manage Schedule & AI Notes)
        </Link>
        <Link 
          href="/admin/dashboard"
          style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px', textDecoration: 'none', color: '#333', fontWeight: '500' }}
        >
          📊 Admin Dashboard (Analytics & Management)
        </Link>
      </div>
    </div>
  )
}
