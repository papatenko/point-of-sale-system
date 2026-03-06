import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/reports')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/employee/reports"!</div>
}
