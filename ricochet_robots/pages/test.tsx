import React from "react";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { game_piece, wall, highlight_piece, user} from './classes';
import { useRouter } from 'next/router'
import { getSession } from "next-auth/react";
import p5Types from "p5"; //Import this for typechecking and intellisense



// GLOBAL CONSTANTS / VARS
var BOARD_LENGTH = 480;
var UNIT_LENGTH = 30;
var TOP_BAR_HEIGHT = 60;
var DIV_DISPLX = 29;
var DIV_DISPLY = 13;
var HIGHLIGHT_COLOR_ONE: any;
var HIGHLIGHT_COLOR_TWO: any;
var HAS_MOVE_PRIVELEGE = false;

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false
})

let socket: any; // socket for lobby
socket = io();


export default function Game(props: any)
{
    //game objects
    // var gamepieces: Array<game_piece> = [];
    // var walls: Array<wall> = [];
    var temp_highlight_targets: Array<highlight_piece> = [];
    // var current_target: highlight_piece; 

    // var selected_piece: game_piece; //piece player tries to move
    var temp_possible_moves: Array<[number, number]> = []; // possible moves the player can move

    // var possible_target_pos: Array<[number, number]>;   //positions where target can spawn

    const router = useRouter()
    // const [users, setUsers] = useState([]);
    const [current_target, setCurrentTarget] = useState({});
    const [walls, setWalls] = useState([]);


    const [gamepieces, setGamePieces] = useState({});
    var local_game_pieces: Array<game_piece> = [];

    const [highlight_targets, setHighlightTargets] = useState([]);
    const [selected_piece, setSelectedPiece] = useState();
    const [possible_moves, setPossibleMoves] = useState({});
    const [possible_target_pos, setPossTargetPos] = useState([]);
    const [username, setUsername] = useState("");
    const [IS_HOST, setHost] = useState(false);

    const [bid, setBid] = useState("");

    const [room, setRoom] = useState([]);

    var xpos1 = 200;
    var xpos2 = 400;
    var ypos1 = 400;
    var ypos2 = 200;


   
    useEffect(() => {
        if(!router.isReady) return;
        

        Login().then(session => {
            if(session) {
                setUsername(session.user.name); 
                socketInitializer()

                let room_id = router.query.room_id;
                socket.emit('get-client-info', {room_id: room_id}); // ask server to send client info
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

    useEffect(() => {
        socket.on('send-client-info', data =>
        {
            if (username != "")
            {
                console.log(username);
                console.log("send-client-info event");
                for (var u of data.users) //check if your client is the host client
                {
                    if (u.username == username)
                    {
                        if (u.host)
                        {
                            console.log("SETTING HOST");
                            setHost(true);
                            // IS_HOST = true;
                        }
                    }
                }
                var temp_room: Array<user> = [];
                for (var u of data.users)
                {
                    temp_room.push(new user(u.username, u.host, u.score));
                }
                
                setRoom(temp_room);
            }
        })
    }, [username])

    const drawBoard = (p5: any) => 
    {
        for (let i = 0; i < 17; i++)
        {
            if (i == 0 || i == 16)
            {
                p5.strokeWeight(5);
            }
            else {
                p5.strokeWeight(1);
            }
            if (i == 8)
            {
                p5.line(UNIT_LENGTH*i,0, UNIT_LENGTH*i, BOARD_LENGTH);
                p5.line(0, UNIT_LENGTH*i, BOARD_LENGTH, UNIT_LENGTH*i);
            }
            else {
                p5.line(UNIT_LENGTH*i,0, UNIT_LENGTH*i, BOARD_LENGTH);
                p5.line(0, UNIT_LENGTH*i, BOARD_LENGTH, UNIT_LENGTH*i);
            }

        }
    }


    socket.on('react-test', data => {
        console.log("RECIEVED MESSAGE")
        console.log(data);
        xpos2 = data;
        ypos2 = data;
        xpos1 = data;
        ypos1 = 1000;
        console.log(xpos1);
      });


    const setup = (p5: any, canvasParentRef: any) => 
    {
        console.log("Running setup");

        p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);
        var usertable = p5.createElement('h1', 'Robot Battle').parent(canvasParentRef);
        usertable.position(BOARD_LENGTH+BOARD_LENGTH/5, BOARD_LENGTH/9);
    }

    const draw = (p5: any) =>
    {
        console.log(xpos2);
        p5.background(255, 255, 255);
        drawBoard(p5);
        p5.fill(255);
        p5.circle(xpos1, ypos1, 100, 100);
        p5.circle(xpos2, ypos2, 100, 100);
    }

    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        console.log(e.clientX, e.clientY);
        if (e.clientX > 500 && e.clientY > 500)
        {
            socket.emit('act-test', 50);
            console.log("emitting message");
        }
        else {
            xpos1 = e.clientX;
            ypos1 = e.clientY;
        }
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
        );
}