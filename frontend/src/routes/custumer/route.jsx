// routes/custumer/index.jsx
import { createFileRoute, Outlet  } from '@tanstack/react-router'
import { Route as RegisterRoute } from './register' // hijo
import { Route as FlashFoodTruckHome } from './home' //


export const Route = createFileRoute('/custumer')({
  component: CustumerLayoutComponent,
  children: [RegisterRoute,FlashFoodTruckHome], //  así se agrega el hijo
  
})

function CustumerLayoutComponent() {
  return (
    <div>
      <h1>Hello "/custumer"!</h1>
      <Outlet /> {/*  aquí se renderiza /custumer/register */}
    </div>
  )
}