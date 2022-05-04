import React from "react";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { game_piece, wall, highlight_piece, user} from '../classes';
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
var SCREEN_WIDTH = 0;
var IS_HOST = false;
var current_bid = Infinity;
var current_bidder = "";

// Time management
var TIME;
var TIME_DEADLINE = 0;
var COUNTDOWN = 0;
var SHOWING_SOL = false;





var input_field: any;
var table = [];


// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false
})

let socket: any; // socket for lobby
socket = io();

//game objects
var gamepieces: Array<game_piece> = [];
var walls: Array<wall> = [];
var highlight_targets: Array<highlight_piece> = [];
var current_target: highlight_piece; 

var selected_piece: number; //piece player tries to move
var temp_possible_moves: Array<[number, number]> = []; // possible moves the player can move

var possible_target_pos: Array<[number, number]>;   //positions where target can spawn

var possible_moves: any = [];

//const [username, setUsername] = useState("");
var username = "";

//var room = {"room_id": "123", users: [{"username": "test", "host": "true", "score": 0}, {"username": "wowo", "host": "true", "score": 2}]};

var room: Array<any> = [];


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

    const createTable = (p5: any) =>
    {
        table = [];
        for (let i = 0; i < room.length; i++)
        {
            var row = []
            row.push(room[i].username, room[i].score);
            table.push(row);
        }

        showTable(p5);
        
    }

    const showTable = (p5: any) =>
    {
        let SHIFT_X = BOARD_LENGTH+50;
        let SHIFT_Y = 100;

        p5.strokeWeight(1);

        p5.textStyle(p5.BOLD);
        p5.textSize(20);
        p5.text("Username", SHIFT_X, SHIFT_Y);
        p5.text("score", (SHIFT_X)+335, SHIFT_Y);
        p5.textStyle(p5.NORMAL);
        
        for (let i=0; i<table.length; i++) {
            p5.text(table[i][0], SHIFT_X, SHIFT_Y+(i+1)*25);
            p5.text(table[i][1], SHIFT_X+350, SHIFT_Y+(i+1)*25);
            p5.line(SHIFT_X-20, SHIFT_Y+5+(i)*25, SHIFT_X+400, SHIFT_Y+5+(i)*25);
        }
        p5.line(SHIFT_X-20, SHIFT_Y+5+((table.length))*25, SHIFT_X+400, SHIFT_Y+5+(table.length)*25);
        p5.line(SHIFT_X+325, SHIFT_Y+5, SHIFT_X+325, SHIFT_Y+5+(table.length)*25);
    }

    socket.on('react-client-info', data =>
    {
        room = [];
        for (var u of data.users) //check if your client is the host client
        {
            if (u.username == username)
            {
                if (u.host)
                {
                    IS_HOST = true;
                }
            }
        }
        for (var u of data.users)
        {
            room.push(new user(u.username, u.host, u.score));
        }
    })

    socket.on('react-select-piece', piece_data => //Move player, [id, pos_x, pos_y]
    {
        if (piece_data.id != -1) //new piece is selected
        {
            selected_piece = piece_data.id;
            generate_highlight_squares(piece_data.id);
        }
        else { //deselect piece
            selected_piece = -1;//no piece selected
            highlight_targets = [];
            possible_moves = [];
        }
    })

    socket.on('react-move-piece', movement_data => //Move player, [id, pos_x, pos_y]
    {
        movePlayer(movement_data.id, movement_data.pos_x, movement_data.pos_y);
        generate_highlight_squares(movement_data.id);
    })

    socket.on('react-new-target', target_data => //Move player, [id, pos_x, pos_y]
    {
        HAS_MOVE_PRIVELEGE = false;
        TIME_DEADLINE = TIME + 45000;
        current_target = new highlight_piece(0, possible_target_pos[target_data.id][0], possible_target_pos[target_data.id][1], current_target.color);
    })

    socket.on('react-new-bid', data => {
        if (data.bid == -1)
        {
            current_bid = Infinity;
        }
        else {
            current_bid = data.bid;
        }
        if (TIME_DEADLINE - TIME < 10000)
        {
            TIME_DEADLINE = TIME + 10000;
        }
        if (TIME_DEADLINE - TIME > 20000)
        {
            TIME_DEADLINE = TIME + 20000;
        }
        current_bidder = data.username;
    })

    socket.on('react-give-point', data => //Give point, [username, point])
    {
        for (var u of room)
        {
            if (u.username == data.username)
            {
                u.score += data.incr;
            }
        }
    })

    socket.on('react-give-move-privilege', data =>
    {
        for (var u of room)
        {
            u.hasMovePrivilege = (u.username == data) ? true : false;
        }
        if (data == username)
        {
            HAS_MOVE_PRIVELEGE = true;
        }
        
    })

    socket.on('react-gamestate', data =>
    {
        SHOWING_SOL = data;
    })
    

    const setup = (p5: any, canvasParentRef: any) => 
    {
        TIME_DEADLINE = p5.millis() + 45000;

        HIGHLIGHT_COLOR_ONE = p5.color(255,255,0);
        HIGHLIGHT_COLOR_TWO = p5.color(255,255,0,90);

        // Calculate window size
        BOARD_LENGTH = window.innerHeight - TOP_BAR_HEIGHT - DIV_DISPLY - 20;
        UNIT_LENGTH = BOARD_LENGTH/16;
        SCREEN_WIDTH = window.innerWidth - 100;
        
        // Create main canvas
        p5.createCanvas(SCREEN_WIDTH, BOARD_LENGTH).parent(canvasParentRef);
 

        possible_moves = [];

        // Set first target
        current_target = new highlight_piece(0, 0, 7, p5.color(50, 50, 99));
        

        gamepieces.push(new game_piece(0, 5, 7, p5.color(100, 200, 50)));
        gamepieces.push(new game_piece(1, 7, 4, p5.color(200, 0, 9)));
        gamepieces.push(new game_piece(2, 15, 15, p5.color(0, 200, 200)));
        gamepieces.push(new game_piece(3, 0, 15, p5.color(100, 100, 200)));

        //Where can target spawn (x,y)
        possible_target_pos = [
            [0,5], [0,11], [0,15], [1,2], [4,13], [6,1], [6,5], [8,15], [9,0], [10,12],
            [11,4], [12,6], [13,11], [15,0], [15,9], [15,12]
        ];

        // Construct vertical walls
        var wall_pos_vert: Array<[number, number]> = [];
        wall_pos_vert = [
            [4,0], [10,0], [6,1], [8,1],[0,2], [14,2],[10,4], [6,5], [1,6],
            [11,6], [6,7],[6,8],[8,7], [8,8], [5,8], [1,10], [10,10],[12,11],
            [10,12], [3,13], [12,13],[5,14], [4,15], [9,15]
        ];
        
        for (var x of wall_pos_vert)
        {
            walls.push(new wall(true, x[0], x[1]));
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
            walls.push(new wall(false, x[0], x[1]));
        }
        let button;
        button = p5.createElement('button', 'Submit Bid').parent(canvasParentRef);
        button.style('background-color', '#0d6efd');
        button.style('color', '#ffffff');
        button.style('border-radius', '5px');
        button.style('font-size', '16px');
        button.position(BOARD_LENGTH+50, BOARD_LENGTH-50);
        button.mousePressed(submit_bid);
        input_field = p5.createInput().parent(canvasParentRef);
        input_field.position(BOARD_LENGTH+50, BOARD_LENGTH);
    }

    const draw = (p5: any) =>
    {        
        TIME = p5.millis();
        COUNTDOWN = Math.ceil((TIME_DEADLINE-TIME)/1000);

        if (TIME_DEADLINE < TIME && !SHOWING_SOL && IS_HOST)
        {
            if (current_bid != Infinity)
            {
                SHOWING_SOL = true;
                socket.emit('act-gamestate', SHOWING_SOL);
                socket.emit('act-give-move-privilege', current_bidder);
                for (var u of room)
                {
                    u.hasMovePrivilege = (u.username == current_bidder) ? true : false;
                }
                if (current_bidder == username)
                {
                    HAS_MOVE_PRIVELEGE = true;
                }
            }
            else {
                let random_index = Math.floor(Math.random() * possible_target_pos.length);
                current_target = new highlight_piece(0, possible_target_pos[random_index][0], possible_target_pos[random_index][1], current_target.color);
                socket.emit('act-new-target', {id: random_index});
                TIME_DEADLINE = TIME + 45000;
            }
        }

        // if (IS_HOST)

        if (IS_HOST && current_bid == 0 && SHOWING_SOL)
        {
            SHOWING_SOL = false;
            socket.emit('act-gamestate', SHOWING_SOL);
            for (var u of room)
            {
                if (u.hasMovePrivilege)
                {
                    u.score -= 1;
                    socket.emit('act-give-point', {username: u.username, incr: -1});
                }
            }
            socket.emit('act-new-bid', {bid: -1, username: ""}); //Tell server player has moved   
            current_bid = Infinity;
            current_bidder = "";

            let random_index = Math.floor(Math.random() * possible_target_pos.length);
            current_target = new highlight_piece(0, possible_target_pos[random_index][0], possible_target_pos[random_index][1], current_target.color);
            socket.emit('act-new-target', {id: random_index});
            TIME_DEADLINE = TIME + 45000;
            for (var u of room)
            {
                u.hasMovePrivilege = false;
            }
            HAS_MOVE_PRIVELEGE = false;
        }

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

        if (room.length != 0) {
            createTable(p5); 
        }
        


        p5.textSize(64);
        if (!SHOWING_SOL)
        {
            p5.text("Timer: " + COUNTDOWN.toString() + "s", BOARD_LENGTH+50, 200+(table.length)*25);
            p5.text("BIDDING STAGE", BOARD_LENGTH+100, 50);


            if (current_bid != Infinity) {
                p5.textSize(20);
                let message = `${current_bidder} bids: ${current_bid.toString()}`;
                p5.text(message, BOARD_LENGTH+50, 300+(table.length)*25);
            }
        }

        else {
            p5.text("SOLUTION STAGE", BOARD_LENGTH+100, 50);
            p5.textSize(20);
            p5.text(`${current_bidder} showing his ${current_bid} solution.`, BOARD_LENGTH+50, 200+(table.length)*25);

        }


    }

    const keyPressed = (p5: any, e: KeyboardEvent) => {
        console.log(e)

        if (e.key == "Enter") {
            submit_bid();
        }
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
                selected_piece = g.id;
                socket.emit('act-select-piece', {id: g.id}); //Tell server a new piece is selected
                generate_highlight_squares(g.id);
                return;
            }
        }
        selected_piece = -1;
        socket.emit('act-select-piece', {id: -1}); //tell server piece is deselected
        highlight_targets = [];
        possible_moves = [];
    }

    const movePlayer = (idx: number, pos_x: number, pos_y: number) =>
    {
        var g: game_piece = gamepieces[idx];
        g.pos_x = pos_x;
        g.pos_y = pos_y;   

        // If your host, and a target is "hit" select a new target.
        if (IS_HOST && pos_x == current_target.pos_x && pos_y == current_target.pos_y)
        {
            SHOWING_SOL = false;
            socket.emit('act-gamestate', SHOWING_SOL);
            for (var u of room)
            {
                if (u.hasMovePrivilege)
                {
                    u.score += 1;
                    socket.emit('act-give-point', {username: u.username, incr: +1});
                }
            }
            socket.emit('act-new-bid', {bid: -1, username: ""}); //Tell server player has moved   
            current_bid = Infinity;
            current_bidder = "";

            let random_index = Math.floor(Math.random() * possible_target_pos.length);
            current_target = new highlight_piece(0, possible_target_pos[random_index][0], possible_target_pos[random_index][1], current_target.color);
            socket.emit('act-new-target', {id: random_index});
            TIME_DEADLINE = TIME + 45000;
            for (var u of room)
            {
                u.hasMovePrivilege = false;
            }
            HAS_MOVE_PRIVELEGE = false;
        }
        current_bid--;

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
        possible_moves = [];
        highlight_targets = [];

        for (var [x,y] of [[-1,0], [1,0], [0,-1], [0,1]])
        {
            let move = get_move_pos(piece.id, x, y);
            if (move[0] != -1)
            {
                possible_moves.push([move[0], move[1]]);
            }
        }
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
            highlight_targets.push(new highlight_piece(0, current_x, current_y, HIGHLIGHT_COLOR_TWO));
        }

        if (piece.pos_x == current_x && piece.pos_y == current_y) //if piece did not move
        {
            return [-1,-1];
        }
        highlight_targets[highlight_targets.length-1].color = HIGHLIGHT_COLOR_ONE;
        return [current_x, current_y];
    }

    function submit_bid()
    {
        var reg = /^\d+$/;
        if (!reg.test(input_field.value())) {
            console.log("Bid is not a number")
            return; //can only submit positive integers.
        }
        let value = Number(input_field.value())     
        
        if ( value >= current_bid || value == 0) {
            console.log("Bid is not the better than the current bid");
            return;
        }

        current_bid = value;
        current_bidder = username;
        socket.emit('act-new-bid', {bid: current_bid, username: username}); //Tell server player has moved   

        input_field.value("");
        for (var u of room)
        {
            u.hasMovePrivilege = (u.username == username) ? true : false;
        }
        if (TIME_DEADLINE - TIME < 10000)
        {
            TIME_DEADLINE = TIME + 10000;
        }

        if (TIME_DEADLINE - TIME > 20000)
        {
            TIME_DEADLINE = TIME + 20000;
        }
        // socket.emit('act-give-move-privilege', username);
        // HAS_MOVE_PRIVELEGE = true;
    }


    //return the given sketch
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-lg-7">
                    <div className="m-3">
                        <Sketch setup={setup} draw={draw} mousePressed={mousePressed} keyPressed={keyPressed}/>
                    </div>
                </div>
            </div>
        </div> 
        );

}