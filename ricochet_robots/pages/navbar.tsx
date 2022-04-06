
import { useSession, signIn, signOut } from "next-auth/react"


export default function NavBar() {
  const {data: session} = useSession()

  return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
            <a className="navbar-brand" href="/">Ricochet Robots</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
            <div className="navbar-nav">
                {!session ? (
                <a className="nav-link" onClick={signIn} href="#">Sign in</a>
                ) : (
                <>
                <a className="nav-link" onClick={signOut} href="#">Sign out</a>
                <a className="nav-link"> <span>{session.user.name}</span> </a>

                </>  
                )}
            </div>
            </div>
        </div>
        </nav>

  );
}

