import type { NextPage } from 'next'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router'
import { renderToHTML } from 'next/dist/server/render';
import React from 'react';
import { getSession } from "next-auth/react";


const socket = io(); // socket for lobby


export default function Lobby() {
    
    const router = useRouter()
    const {data: session} = useSession()
    const [users, setUsers] = useState([])

    

    useEffect(() => {
        if(!router.isReady) return;

        const socketInitializer = async () => {
            await fetch('/api/lobby/lobby_manager')
            
    
            socket.on('connect', () => {            
                console.log('connected')
             })
        }

        async function Login() {
            const session = await getSession()
            return session;
            /* ... */
          }

        
        var username;

        Login().then(session => {
            if(session) {
                username = session.user.name; 
                let room_id = router.query.code;

                socketInitializer();
        
                console.log("ROOM: " + room_id);
                socket.emit('join-room', {room_id: room_id, username: username});
            }
        })

    }, [router.isReady]);

    useEffect(() => {

        socket.on("update-room", data => {
            //console.log(data.username + " joined the lobby");
            console.log(data.room.usernames)
            
            setUsers(data.room.usernames);            
        });
    }, [])


    return (
        <>
            <div className="px-4 py-5 my-5 text-center">
            <h1 className="display-5 fw-bold"> Game Lobby </h1>
            <div className="col-lg-6 mx-auto">
                <p className="lead mb-4">Join code: {router.query.code}</p>
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
                        {users.map((user, index) => {
                            return (
                                <tr key={index}>
                                    <th scope="row">{index+1}</th>
                                    <td>{user}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                    </table>  
                </div>          
            </div>
        </>
    );
}


