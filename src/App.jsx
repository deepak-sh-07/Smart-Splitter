import Home from './Components/Home.jsx'
import New from './Components/New.jsx'
import Groups from './Components/Groups.jsx'
import Login from './Components/Login.jsx'
import './App.css'

import { createBrowserRouter,RouterProvider} from "react-router-dom"
function App() {
  const router = createBrowserRouter([
    {
      path:"/",
      element:<Home/>
    },
    {
      path:"/Login",
      element:<Login/>
    },
    {
      path:"/New",
      element:<New/>
    },
    {
      path:"Groups",
      element:<Groups/>
    }
  ])
  return (
    <>
      <RouterProvider router={router}/>
    </>
  )
}

export default App
