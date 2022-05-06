// Importing libraries
import React from "react";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { game_piece, wall, highlight_piece, user} from '../classes';
import { useRouter } from 'next/router'
import { getSession } from "next-auth/react";
import p5Types from "p5";


// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false
});

let socket = io();
var username = "";


export default function Game(props: any)
{
    const router = useRouter();
  
    useEffect(() => {
        if(!router.isReady) return;
        

        Login().then(session => {
            if(session) {
                username = session.user.name;
                socketInitializer()
                let room_id = router.query.room_id;
                socket.emit('act-client-info', {room_id: room_id}); // ask server to send client info
            }
        })
        
    }, [router.isReady]);




    const socketInitializer = async () =>
    {
        await fetch('/api/lobby/lobby_manager') //initialize connection
        socket.on('connect', () => {console.log('connected') })
    }

    async function Login() {
        const session = await getSession()
        return session;
    }


    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        console.log("CS TEST");
        socket.emit("CS-test");
    }


    //return the given sketch
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-lg-7">
                    <div className="m-3">
                        <Sketch setup={setup} draw={draw} mousePressed={mousePressed}/>
                    </div>
                </div>
            </div>
        </div> 
        )

}