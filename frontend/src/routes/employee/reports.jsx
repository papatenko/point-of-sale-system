import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div style={{ padding: '20px' }}>
      <h1>Reports Dashboard</h1>

      <div style={{ marginTop: '20px' }}>
        <h2>Total Orders: {totalOrders}</h2>
        <h2>Total Items Sold: {totalItemsSold}</h2>
        <h2>Gross Income: ${grossIncome.toFixed(2)}</h2>
      </div>
    </div>
}
