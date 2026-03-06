import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/inventory')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/employee/inventory"!</div>
}
