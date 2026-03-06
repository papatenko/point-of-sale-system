import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/search')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/employee/search"!</div>
}
