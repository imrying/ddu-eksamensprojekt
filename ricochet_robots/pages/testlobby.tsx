import type { NextPage } from 'next'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router'
import { renderToHTML } from 'next/dist/server/render';
import React from 'react';
import { getSession } from "next-auth/react";




const socket = io();

export default function TestLobby() {

    const router = useRouter();
    const {data: session} = useSession()
    const [users, setUsers] = useState([])
    const [room, setRoom] = useState([])
    const [user, setUser] = useState({})


    useEffect(() =>
    {
        if(!router.isReady) return;
        
        fetch('/api/lobby/test_manager');
        
        socket.on('connect', () => {
            console.log('connected')
        });

        socket.on('react-click', data =>
        {
            console.log("RECEIVING DATA FROM SERVER", data);
        })

        socket.on("update-room", data => {

            let users = [];
            for (let i = 0; i < data.room.users.length; i++) {
                users.push(data.room.users[i].username);
            }
            
            setRoom(data.room);
            setUsers(users);
        });

        socket.on("react-start-game", data => {
            router.push('/game2' + '?room_id=' + data.room_id);
        });


    }, [router.isReady]);




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