import type { NextPage } from 'next'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router'
import { renderToHTML } from 'next/dist/server/render';
import React from 'react';
import { getSession } from "next-auth/react";


const socket = io(); // socket for lobby
var username;

export default function Lobby() {
    
    const router = useRouter()
    const {data: session} = useSession()
    const [users, setUsers] = useState([])
    const [room, setRoom] = useState([])
    const [user, setUser] = useState({})

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

        
        

        Login().then(session => {
            if(session) {
                username = session.user.name; 
                setUser(username);
 
                let room_id = router.query.code;

                socketInitializer();
        
                // console.log("ROOM: " + room_id);
                socket.emit('join-room', {room_id: room_id, username: username});
            }
        })

    }, [router.isReady]);

    useEffect(() => {

        socket.on("update-room", data => {
            //console.log(data.username + " joined the lobby");
            // console.log(data.room.users);

            let users = [];
            for (let i = 0; i < data.room.users.length; i++) {
                users.push(data.room.users[i].username);
            }
            
            setRoom(data.room);
            setUsers(users);
        });

        socket.on("react-start-game", data => {
            socket.disconnect();
            router.push('/game2' + '?room_id=' + data.room_id);
        });

        socket.on('react-remove-self', data => {
            if (data.username == username) {
                socket.disconnect();
                router.push('https://bouncebots.eu.ngrok.io/');
            }
        });
    }, [])


    function startGame() {
        for (let i = 0; i < room.users.length; i++) {
            if (room.users[i].host) {
                if (user == room.users[i].username) {
                    //console.log(room.room_id)
                    socket.emit('act-start-game', {room_id: room.room_id}); 
                }
            }
        }
    }

    function isHost() {
        
        if (room.users == undefined) {
            return false
        }

        for (let i = 0; i < room.users.length; i++) {
            if (room.users[i].host) {
                if (user == room.users[i].username) {
                    //console.log(room.room_id)
                    return true;
                }
                else {
                    return false;
                }
            }
        }
    }


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
                        {isHost() ? <th scope="col">Remove</th> : null}
                        
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => {
                            return (
                                <tr key={index}>
                                    <th scope="row">{index+1}</th>
                                    <td>{user}</td>

                                    {isHost() ? <>
                                        {index != 0 ?
                                            <td>
                                                <button className="btn btn-danger" onClick={() => {
                                                   socket.emit('act-remove-user', {room_id: room.room_id, username: room.users[index].username });
                                                }}>Remove</button>
                                            </td>
                                        : null}

                                    </> : null}


                                </tr>
                            )
                        })}
                    </tbody>
                    </table>  
                </div>
                
                {isHost() ? 
                    <div className="col-lg-6 mx-auto">
                        <button type="button" className="btn btn-primary" onClick={startGame}>Start Game</button>  
                    </div>  : <p>Waiting for host to start game</p>}
            </div>
        </>
    );
}


