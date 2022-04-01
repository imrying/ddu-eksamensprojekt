import type { NextPage } from 'next'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router'




let socket; // socket for lobby



export default function Lobby() {
    const {data: session} = useSession()
    const router = useRouter()
    //const room_id = router.query.code

    useEffect(() => {
        if(!router.isReady) return;

        socketInitializer(router.query.code);

    }, [router.isReady]);

    const socketInitializer = async (room_id) => {
        await fetch('/api/lobby/lobby_manager')
        socket = io()

        socket.on('connect', () => {            
            console.log('connected')
         })

        
        socket.on("update-room", () => {
            console.log("WOOWOW");
        })

        console.log("ROOM: " + room_id);
        socket.emit('join-room', room_id)
        
    }

    


  return (
    <>
        <div className="px-4 py-5 my-5 text-center">
          <h1 className="display-5 fw-bold"> NAME Game lobby </h1>
          <div className="col-lg-6 mx-auto">
            <p className="lead mb-4">Join code: CODE</p>
          </div>
          <div className="col-lg-4 mx-auto">  
            <table className="table">
                <thead>
                    <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                    <th scope="row">1</th>
                    <td>Mark</td>
                    </tr>
                    <tr>
                    <th scope="row">2</th>
                    <td>Jacob</td>
                    </tr>
                    <tr>
                    <th scope="row">3</th>
                    <td>Larry</td>
                    </tr>
                </tbody>
                </table>  
            </div>          
        </div>
    </>

  );
}



