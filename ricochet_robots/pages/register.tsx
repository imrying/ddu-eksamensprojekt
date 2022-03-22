export default function Form() {
  return (
    <form action="/api/register" method="post">
      <div className="form-group">
        <label htmlFor="first">Email</label>
        <input type="email" className="form-control" id="first" aria-describedby="emailHelp" name="first" placeholder="Enter email" required />
      </div>
      
      <div className="form-group">
        <label htmlFor="last">Password</label>
        <input type="password" className="form-control" id="last" name="last" aria-describedby="passwordHelpBlock" required />
        <small id="passwordHelpBlock" className="form-text text-muted">
          Your password must be 8-20 characters long.
        </small>
      </div>
      
      <button type="submit" className="btn btn-primary">Submit</button>
    </form>
  )
}
