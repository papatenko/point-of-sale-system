import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/pos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/employee/pos"!</div>
}
