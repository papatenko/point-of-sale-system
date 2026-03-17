import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  //return <div>Hello "reports"!</div>
  return (
    <div style={{ padding: '20px' }}>
      <h1>Reports Dashboard</h1>

      <div style={{ marginTop: '20px' }}>
        <div>Total Orders: </div>
        <div>Total Items Sold: </div>
        <div>Gross Income: $</div>
      </div>
    </div>
  )
}
