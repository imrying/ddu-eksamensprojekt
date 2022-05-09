import '../styles/globals.css'
import 'bootstrap/dist/css/bootstrap.css';

import { SessionProvider } from "next-auth/react"
import NavBar from './navbar';
import { AppProps } from 'next/app';
import "react-notifications/lib/notifications.css";
import { NotificationContainer } from 'react-notifications';


export default function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps): JSX.Element {
  return (

    <div style={{backgroundColor: "#c0c0c0", minHeight:"100vh"}}>
    <SessionProvider session={session}>
      <NavBar/>
      <NotificationContainer />
      <Component {...pageProps} />
    </SessionProvider>
    </div>
  )
}
