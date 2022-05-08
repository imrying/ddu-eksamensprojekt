
import { useSession, signIn, signOut } from "next-auth/react";
import Link from 'next/link';

export default function NavBar() {
  const {data: session} = useSession();

  return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
 
            <a href="https://bouncebots.eu.ngrok.io" className="navbar-brand">Ricochet Robots</a>
           
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
                <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                  {session ? (
                    <>
                    <li className="nav-item">
                      <a className="nav-link text-white">
                        <img className="rounded-circle profile-image" src={session.user.image} alt="Profile Picture" />
                      </a>
                    </li>
                    <li className="nav-item mt-1">
                      <a className="nav-link text-white"> {session.user.name}</a>
                    </li>
                    </>
                  ) : null}
                  <li className="nav-item mt-1">
                    <a className="nav-link text-white" href="https://bouncebots.eu.ngrok.io/help">Help</a> 
                  </li>
                </ul>
                <ul className="navbar-nav ml-auto mb-2 mb-lg-0">
                  {!session ? (
                  <li className="nav-item">
                    <a className="nav-link text-white" onClick={signIn} href="#">Sign in</a>
                  </li>
                  ) : (
                  <>
                  <li className="nav-item">
                    <a className="nav-link text-white" onClick={signOut} href="#">Sign out</a>
                  </li>
                  </>
                  )}
                </ul>
            </div>
        </div>
        </nav>

  );
}

