import { Navigate, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"

const PrivateRoute = ({ children }) => {
  const location = useLocation()
  const { isLoggedIn, user } = useSelector((state) => state.auth)

  // 🔐 Not logged in
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 👤 Profile completeness
  const isProfileComplete = user?.name?.trim() && user?.phone?.trim()

  // 🚫 Restrict cart / checkout if profile incomplete
  if (
    (location.pathname.includes("/cart") || location.pathname.includes("/checkout")) &&
    !isProfileComplete
  ) {
    return <Navigate to="/account/profile?complete=true" replace />
  }

  return children
}

export default PrivateRoute
