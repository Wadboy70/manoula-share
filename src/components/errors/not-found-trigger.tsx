/** Throws a 404 Response so the parent route `errorElement` can render the not-found UI. */
export function NotFoundTrigger(): null {
  throw new Response('Page not found', {
    status: 404,
    statusText: 'Not Found',
  })
}
