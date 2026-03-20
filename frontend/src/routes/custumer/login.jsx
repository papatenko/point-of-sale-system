import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/custumer/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/custumer/login"!</div>
}
