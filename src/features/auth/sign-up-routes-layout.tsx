import { Outlet } from 'react-router-dom'

/** Parent layout so `/signup` and `/signup/professional` can share the same outlet tree. */
export function SignUpRoutesLayout() {
  return <Outlet />
}
