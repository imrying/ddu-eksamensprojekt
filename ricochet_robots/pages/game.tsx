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


    //useEffect(() => socketInitializer(), [router.isReady])
    
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

    //Handle calls from server - updating the game board and more
    useEffect(() => {    
        
        socket.on('react-give-point', data => //Give point, [username, point])
        {
            if (Object.keys(room).length != 0)
            {
           
                console.log("REACT GIVE POINT");
                var temp_room = room;
                for (var u of temp_room)
                {
                    if (u.username == data.username)
                    {
                        u.score = data.score;
                    }
                }
                setRoom(temp_room);
            }
        })

    }, [room])
    

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

    useEffect(() => {
        socket.on('react-new-bid', data => //Give move privelege, [bid, username]
        {
            console.log("REACT NEW BID");
            HAS_MOVE_PRIVELEGE = false;

            var temp_room = room;
            for (var u of temp_room)
            {
                if (u.username == data.username)
                {
                    u.hasMovePrivilege = true;
                }
                else {
                    u.hasMovePrivilege = false;
                }
            }
            setRoom(temp_room);
            
        })
    }, [room])

    useEffect(() => {
        socket.on('react-move-piece', movement_data => //Move player, [id, pos_x, pos_y]
        {
            if (Object.keys(gamepieces).length != 0 && (Object.keys(room).length != 0))
            {

                if (!(gamepieces[movement_data.id].x == movement_data.pos_x && gamepieces[movement_data.id].y == movement_data.pos_y))
                {
                    movePlayer(movement_data.id, movement_data.pos_x, movement_data.pos_y);
                    generate_highlight_squares(movement_data.id);
                }
            }
        })

    }, [gamepieces, room])

    useEffect(() => {
        socket.on('react-select-piece', piece_data => //Move player, [id, pos_x, pos_y]
        {
            if (Object.keys(gamepieces).length != 0) {
                if (piece_data.id != -1) //new piece is selected
                {
                    setSelectedPiece(piece_data.id);
                    generate_highlight_squares(piece_data.id);
                }
                else { //deselect piece
                    setSelectedPiece(null as any);//no piece selected
                    setHighlightTargets([]);
                    setPossibleMoves([]);
                }
            }
        })
    }, [gamepieces])


    useEffect(() => {
        socket.on('react-new-target', target_data => //Move player, [id, pos_x, pos_y]
        {
            if (Object.keys(current_target).length != 0)    
            {
                setCurrentTarget(new highlight_piece(0, possible_target_pos[target_data.id][0], possible_target_pos[target_data.id][1], current_target.color));
            }
        })
    }, [current_target])

  


    

    const setup = (p5: any, canvasParentRef: any) => 
    {
        HIGHLIGHT_COLOR_ONE = p5.color(255,255,0);
        HIGHLIGHT_COLOR_TWO = p5.color(255,255,0,90);

        // Calculate window size
        BOARD_LENGTH = window.innerHeight - TOP_BAR_HEIGHT - DIV_DISPLY - 20;
        UNIT_LENGTH = BOARD_LENGTH/16;
        
        // Create main canvas
        p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);
 

        setPossibleMoves([]);

        // Set first target
        setCurrentTarget(new highlight_piece(0, 0, 7, p5.color(50, 50, 99)));
        
        
        var local_game_pieces: Array<game_piece> = [];
            
        local_game_pieces.push(new game_piece(0, 5, 7, p5.color(100, 200, 50)));
        local_game_pieces.push(new game_piece(1, 7, 4, p5.color(200, 0, 9)));
        local_game_pieces.push(new game_piece(2, 15, 15, p5.color(0, 200, 200)));
        local_game_pieces.push(new game_piece(3, 0, 15, p5.color(100, 100, 200)));

        setGamePieces(local_game_pieces);

        //Where can target spawn (x,y)
        setPossTargetPos([
            [0,5], [0,11], [0,15], [1,2], [4,13], [6,1], [6,5], [8,15], [9,0], [10,12],
            [11,4], [12,6], [13,11], [15,0], [15,9], [15,12]
        ]);

        //Construct all walls
        var local_walls: Array<wall> = [];

        // Construct vertical walls
        var wall_pos_vert: Array<[number, number]> = [];
        wall_pos_vert = [
            [4,0], [10,0], [6,1], [8,1],[0,2], [14,2],[10,4], [6,5], [1,6],
            [11,6], [6,7],[6,8],[8,7], [8,8], [5,8], [1,10], [10,10],[12,11],
            [10,12], [3,13], [12,13],[5,14], [4,15], [9,15]
        ];
        
        for (var x of wall_pos_vert)
        {
            local_walls.push(new wall(true, x[0], x[1]));
        }

        // Construct horizontal walls
        var wall_pos_horz: Array<[number, number]> = [];
        wall_pos_horz = [
            [1,1], [6,1], [9,1], [14,1], [0,5], [6,4], [10,4], [15,4], [12,5],
            [2,6], [7,6], [8,6], [5,8], [7,8], [8,8], [2,9], [11,9], [0,11],
            [10,11], [13,11], [15,11], [4,12], [12,13], [6,14]
        ];
        for (var x of wall_pos_horz)
        {
            local_walls.push(new wall(false, x[0], x[1]));
        }

        setWalls(local_walls);

    }

    const draw = (p5: any) =>
    {
        p5.background(255, 255, 255);
        for (const g of highlight_targets) {
            g.render(p5, UNIT_LENGTH);
        }
        current_target.render(p5, UNIT_LENGTH);
        
        for (const g of gamepieces) {
            g.render(p5, UNIT_LENGTH);
        }
        for (const g of walls) {
            g.render(p5, UNIT_LENGTH);
        }

        drawBoard(p5);
    }

    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        if (!HAS_MOVE_PRIVELEGE) { return; }
        let mouseX = Math.floor((e.clientX-DIV_DISPLX)/UNIT_LENGTH);
        let mouseY = Math.floor((e.clientY-TOP_BAR_HEIGHT-DIV_DISPLY)/UNIT_LENGTH);

        // If you try to move a game piece
        if (possible_moves == []) { return; }
        for (var move_pos of possible_moves)
        {
            if (mouseX == move_pos[0] && mouseY == move_pos[1])
            {
                movePlayer(selected_piece, mouseX, mouseY);
                console.log("TELLING SERVER I AM MOVING A PIECE");
                socket.emit('act-move-piece', {id: selected_piece, pos_x: mouseX, pos_y: mouseY}); //Tell server player has moved
                generate_highlight_squares(selected_piece);
                return;
            }
        }

        // If you clicked on a new game piece
        for (var g of gamepieces)
        {
            if (mouseX == g.pos_x && mouseY == g.pos_y && g.id != selected_piece)
            {
                setSelectedPiece(g.id);
                socket.emit('act-select-piece', {id: g.id}); //Tell server a new piece is selected
                generate_highlight_squares(g.id);
                return;
            }
        }
        setSelectedPiece(null as any);//no piece selected
        socket.emit('act-select-piece', {id: -1}); //tell server piece is deselected
        setHighlightTargets([]);
        setPossibleMoves([]);
    }

    const movePlayer = (idx: number, pos_x: number, pos_y: number) =>
    {
        var g: game_piece = gamepieces[idx];
        g.pos_x = pos_x;
        g.pos_y = pos_y;   

        // If your host, and a target is "hit" select a new target.
        if (IS_HOST && pos_x == current_target.pos_x && pos_y == current_target.pos_y)
        {
            let random_index = Math.floor(Math.random() * possible_target_pos.length);
            setCurrentTarget(new highlight_piece(0, possible_target_pos[random_index][0], possible_target_pos[random_index][1], current_target.color));
            socket.emit('act-new-target', {id: random_index});
            var temp_room = room;
            for (var u of temp_room)
            {
                if (u.hasMovePrivilege)
                {
                    u.score += 1;
                    socket.emit('act-give-point', {username: u.username, score: u.score});
                    console.log("TELLING SERVER SOMEONE HAS TO GET A POINT");
                }
            }
            setRoom(temp_room);      
        }
    }

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

    function generate_highlight_squares(idx: number) 
    {
        var piece: game_piece = gamepieces[idx];
        setPossibleMoves([]);
        
        setHighlightTargets([]);

        temp_highlight_targets = [];
        temp_possible_moves = [];

        for (var [x,y] of [[-1,0], [1,0], [0,-1], [0,1]])
        {
            let move = get_move_pos(piece.id, x, y);
            if (move[0] != -1)
            {
                temp_possible_moves.push([move[0], move[1]]);
            }
        }
        setPossibleMoves(temp_possible_moves);
        setHighlightTargets(temp_highlight_targets);
    }
    
    function get_move_pos(idx: number, incr_x: number, incr_y: number) 
    {
        var piece: game_piece = gamepieces[idx];
        var current_x = piece.pos_x;
        var current_y = piece.pos_y;

        let collision = false;

        outer:
        while (true) 
        {
            for (var w of walls) //if collide with walls
            {
                if (w.vertical && incr_x != 0 && (current_x-1+(1+incr_x)/2) == w.pos_x && w.pos_y == current_y) //walk into vertical wall
                {
                    break outer;
                }
                else if (!w.vertical && incr_y != 0 && (current_y-1+(1+incr_y)/2) == w.pos_y && w.pos_x == current_x) //walk into horizontal wall
                {
                    break outer;
                }
            }

            for (var g of gamepieces) //if collide with other game piece
            {
                if (g.pos_x == (current_x + incr_x) && g.pos_y == (current_y + incr_y))
                {
                    break outer;
                }
            }
            if (!(0 <= current_x+incr_x && current_x+incr_x <= 15 && 0 <= current_y+incr_y && current_y+incr_y <= 15))
            {
                break outer;
            }    
            current_x += incr_x;
            current_y += incr_y;

            // Add it to highlightsquare
            temp_highlight_targets.push(new highlight_piece(0, current_x, current_y, HIGHLIGHT_COLOR_TWO));
        }

        if (piece.pos_x == current_x && piece.pos_y == current_y) //if piece did not move
        {
            return [-1,-1];
        }
        temp_highlight_targets[temp_highlight_targets.length-1].color = HIGHLIGHT_COLOR_ONE;
        return [current_x, current_y];
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        if (event.target[0].value == "") {
            return;
        }

        HAS_MOVE_PRIVELEGE = true;

        var temp_room = room;
        for (var u of temp_room)
        {
            if (u.username == username)
            {
                u.hasMovePrivilege = true;
            }
            else {
                u.hasMovePrivilege = false;
            }
        }
        setRoom(temp_room);
        socket.emit('act-new-bid', {bid: bid, username: username}); //Tell server player has moved           
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
                <div className="col-lg-3">
                    
                    {room.length != 0 ? (
                            <>
                            <table className="table">
                            <thead>
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Name</th>
                                    <th scope="col">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {room.map((user, index) => {
                                    return (
                                        <tr key={index}>
                                            <th scope="row">{index+1}</th>
                                            <td>{user.username}</td>
                                            <td>{user.score}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table> 

                        </>
                    
                    ) : (
                        <>
                        </>

                    )}
                   
                    {/* <div className="col-lg-6 mx-auto">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Bid</label>
                                <input type="number" className="form-control" value={bid} onChange={(e) => setBid(e.target.value)} id="bid" />
                            </div>
                            <button type="submit" className="btn btn-primary m-3">Place bid</button>
                        </form>
                    </div>  */}
                </div>
            </div>
        </div> 
        );

}