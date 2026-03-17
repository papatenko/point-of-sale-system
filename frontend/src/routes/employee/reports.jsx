import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div style={{ padding: '20px' }}>
      <div>Reports Dashboard</div>

      <div style={{ marginTop: '20px' }}>
        <div>Total Orders: </div>
        <div>Total Items Sold: </div>
        <div>Gross Income: $</div>
      </div>
    </div>
  )
}
