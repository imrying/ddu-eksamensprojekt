import type { NextPage } from 'next'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router'
import { renderToHTML } from 'next/dist/server/render';
import React from 'react';

let socket; // socket for lobby


export default function Lobby() {
    const {data: session} = useSession()
    const router = useRouter()
    const [users, setUsers] = useState([])


    useEffect(() => {
        if(!router.isReady) return;

        socketInitializer(router.query.code, router.query.username);

    }, [router.isReady]);

    const socketInitializer = async (room_id, username) => {
        await fetch('/api/lobby/lobby_manager')
        socket = io()

        socket.on('connect', () => {            
            console.log('connected')
         })

        
        socket.on("update-room", data => {
            //console.log(data.username + " joined the lobby");
            console.log(data.room.usernames)
            
            setUsers(data.room.usernames);            
        })

        console.log("ROOM: " + room_id);
        socket.emit('join-room', {room_id: room_id, username: username});
    }

    // return table of users
    // const renderUsers = () => {
    //     return users.map((user, index) => {
    //         <tr>
    //             <th scope="row">{index}</th>
    //             <td>{user}</td>
    //         </tr>
    //     })
    // }

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
                                    <th scope="row">{index}</th>
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



// class Lobby extends React.Component {

//     users : Array<string>;

//     constructor(props) {
//         super(props);
//         this.state = {
//             users: []
//         }
//     }
    
//     componentDidMount() {
//         const {data: session} = useSession()
//         const router = useRouter()

//         useEffect(() => {
//             if(!router.isReady) return;

//             socketInitializer(router.query.code, router.query.username);

//         }, [router.isReady]);

//         const socketInitializer = async (room_id, username) => {
//             await fetch('/api/lobby/lobby_manager')
//             socket = io()

//             socket.on('connect', () => {            
//                 console.log('connected')
//             })

            
//             socket.on("update-room", data => {
//                 console.log(data.username + " joined the lobby");
//                 this.users.push(data.username);
//                 this.setState({
//                     users: this.users
//                 })
                
//                 console.log(this.users);
//             })

//             console.log("ROOM: " + room_id);
//             socket.emit('join-room', {room_id: room_id, username: username});
//         }
//         console.log("OOGA BOOGA");
//     }

//     render() {
//         return (
//             <>
//                 <div className="px-4 py-5 my-5 text-center">
//                 <h1 className="display-5 fw-bold"> {this.state.users.length} </h1>
//                 <div className="col-lg-6 mx-auto">
//                     <p className="lead mb-4">Join code: CODE</p>
//                 </div>
//                 <div className="col-lg-4 mx-auto">  
//                     <table className="table">
//                         <thead>
//                             <tr>
//                             <th scope="col">#</th>
//                             <th scope="col">Name</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             <tr>
//                             <th scope="row">1</th>
//                             <td>Mark</td>
//                             </tr>
//                             <tr>
//                             <th scope="row">2</th>
//                             <td>Jacob</td>
//                             </tr>
//                             <tr>
//                             <th scope="row">3</th>
//                             <td>Larry</td>
//                             </tr>
//                         </tbody>
//                         </table>  
//                     </div>          
//                 </div>
//             </>
//         );
//     }
// }

// export default Lobby;
