import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employee/creation')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/employee/creation"!</div>
}
