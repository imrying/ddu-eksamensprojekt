import '../styles/globals.css'
import 'bootstrap/dist/css/bootstrap.css';

import { SessionProvider } from "next-auth/react"
import NavBar from './navbar';

export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}): JSX.Element {
  return (
    <SessionProvider session={session}>
      <NavBar/>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
