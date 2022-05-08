// Importing libraries
import React from "react";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { game_piece, wall, highlight_piece, user} from '../classes';
import { useRouter } from 'next/router'
import { getSession } from "next-auth/react";
import p5Types from "p5";
import "react-notifications/lib/notifications.css";
import { NotificationManager } from 'react-notifications';
import { useBeforeunload } from 'react-beforeunload';


// Window scale factors
var SKETCH_HEIGHT;
var SKETCH_WIDTH;

var BOARD_HEIGHT;
var BOARD_WIDTH;
var UNIT_LENGTH;
var BOARD_SQUARES_X = 16;
var BOARD_SQUARES_Y = 16;

var SCORE_WIDTH;
var SCORE_HEIGHT;

var DIV_DISPLX = 28;
var DIV_DISPLY = 15;
var TOP_BAR_HEIGHT = 65;

var MARGIN = 20;

var HEADER_TEXT = "";

//Input
var input_field: any;
var vote_button: any;
var vote_text: any;

//Colors
var colors: Array<any> = [];
var HIGHLIGHT_COLOR_ONE;
var HIGHLIGHT_COLOR_TWO;

//Game Control
var HAS_MOVE_PRIVELEGE = false;
var IS_HOST = false;
var SKIP = false;
var RENDER = false;

var current_bid = Infinity;
var current_bidder = "";

// Time management
var TIME;
var TIME_DEADLINE = 0;
var COUNTDOWN = 0;
var SHOWING_SOL = false;

var NEW_TARGET_TIME = 90000;
var NEW_BID_BUFFER = 10000;
var FIRST_BID_TIME = 30000;


// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false
});

//socket connection
let socket = io(); // socket for lobby

var room_id;
var username = "";
var room: Array<any> = [];

//game objects
var gamepieces: Array<game_piece> = [];
var walls: Array<wall> = [];
var highlight_targets: Array<highlight_piece> = [];
var current_target: highlight_piece; 

var selected_piece: number; //piece player tries to move
var possible_moves: any = [];
var possible_target_pos: Array<[number, number]>;   //positions where target can spawn


export default function Game(props: any)
{
    const router = useRouter();
    useEffect(() => {
        if(!router.isReady) return;
        
        Login().then(session => {
            if(session) {
                //First time initilization
                username = session.user.name;
                fetch('/api/lobby/lobby_manager');
                socket.on('connect', () => {console.log('connected') });
                socket.on('react-client-info', data =>
                {
                    room = [];
                    for (var u of data.users) //check if your client is the host client
                    {
                        if (u.username == username && u.host)
                        {
                            IS_HOST = true;
                        }
                    }
                    for (var u of data.users)
                    {
                        room.push(new user(u.username, u.host, u.score));
                    }
                    vote_text.html(`0 / ${room.length} voted skip`);
                });

                //Game state events
                socket.on('react-gamestate', data =>
                {
                    SHOWING_SOL = data;
                });

                socket.on('react-new-bid', data => {
                    if (data.bid == -1)
                    {
                        current_bid = Infinity;
                    }
                    else {
                        current_bid = data.bid;
                    }
                    if (TIME_DEADLINE - TIME < NEW_BID_BUFFER)
                    {
                        TIME_DEADLINE = TIME + NEW_BID_BUFFER;
                    }
                    if (TIME_DEADLINE - TIME > FIRST_BID_TIME)
                    {
                        TIME_DEADLINE = TIME + FIRST_BID_TIME;
                    }
                    current_bidder = data.username;
                    RENDER = true;
                });

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
                    RENDER = true;
                });

                //Movement action
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
                    RENDER = true;
                })
            
                socket.on('react-move-piece', movement_data => //Move player, [id, pos_x, pos_y]
                {
                    movePlayer(movement_data.id, movement_data.pos_x, movement_data.pos_y);
                    generate_highlight_squares(movement_data.id);
                    RENDER = true;
                })
            
                socket.on('react-new-target', target_data => //Move player, [id, pos_x, pos_y]
                {
                    HAS_MOVE_PRIVELEGE = false;
                    TIME_DEADLINE = TIME + NEW_TARGET_TIME;
                    current_target = new highlight_piece(target_data.color_id, possible_target_pos[target_data.id][0], possible_target_pos[target_data.id][1], colors[target_data.color_id]);
                    RENDER = true;
                    for (let u of room) {
                        u.skip = false;
                    }
                    vote_button.show();
                    vote_text.html(`0 / ${room.length} voted skip`);
                    RENDER = true;
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
                    RENDER = true;
                })

                socket.on('react-skip', data => {
                    let count = 0;
                    for (var u of room) {
                        if (u.username == data.username) {
                            u.skip = true;
                        }
                        count += u.skip ? 1 : 0;
                    }
                    SKIP = (count == room.length) ? true : false;
                    vote_text.html(`${count} / ${room.length} voted skip`);
                    RENDER = true;
                })

                room_id = router.query.room_id;
                socket.emit('act-client-info', {room_id: room_id}); // ask server to send client info
            }
        })
        
    }, [router.isReady]); //Call everytime router changes status

    async function Login() {
        const session = await getSession()
        return session;
    }

    const renderTable = (p5: any, text_size: number) =>
    {
        let name_column_width = SCORE_WIDTH*1/3;
        let score_column_width = 4 * text_size;
        p5.strokeWeight(1);
        p5.textStyle(p5.BOLD);
        p5.textSize(text_size);

        p5.text("Username", 0, 0);
        p5.text("score", name_column_width, 0);
        p5.line(-text_size/2, text_size/2, name_column_width + score_column_width - text_size/2, text_size/2);

        p5.textStyle(p5.NORMAL);
        
        for (let i = 1; i < room.length+1; i++)
        {
            p5.text(room[i-1].username, 0, text_size * 1.5 * i);
            p5.text(room[i-1].score, name_column_width, text_size * 1.5 * i);
            p5.line(-text_size/2, text_size * 1.5 * i + text_size/2, name_column_width + score_column_width - text_size/2, text_size * 1.5 * i + text_size/2);
        }
        p5.line(name_column_width - text_size/2, text_size/2, name_column_width - text_size/2, room.length * text_size * 1.5 + text_size/2)
    }
    
    const setup = (p5: any, canvasParentRef: any) => 
    {
        //UI Scaling management
        MARGIN = 0.011 * window.innerWidth;
        SKETCH_HEIGHT = window.innerHeight - TOP_BAR_HEIGHT - DIV_DISPLY - MARGIN;
        SKETCH_WIDTH = window.innerWidth - DIV_DISPLX - MARGIN;

        BOARD_HEIGHT = SKETCH_HEIGHT - MARGIN;
        UNIT_LENGTH = BOARD_HEIGHT / BOARD_SQUARES_Y;
        BOARD_WIDTH = UNIT_LENGTH * BOARD_SQUARES_X;

        SCORE_HEIGHT = BOARD_HEIGHT;
        SCORE_WIDTH = SKETCH_WIDTH - BOARD_WIDTH - MARGIN;

        p5.createCanvas(SKETCH_WIDTH, SKETCH_HEIGHT).parent(canvasParentRef);

        //TIME MANAGEMENT
        TIME_DEADLINE = p5.millis() + NEW_TARGET_TIME;
    
        // COLOR INITILIZATION
        colors = [p5.color(255,0,0), p5.color(0,255,0), p5.color(0,0,255), p5.color(255,255,0)];
        HIGHLIGHT_COLOR_ONE = p5.color(0,0,0,150);
        HIGHLIGHT_COLOR_TWO = p5.color(0,0,0,80);

        possible_moves = [];

        // Set first target
        current_target = new highlight_piece(0, 0, 7, colors[0]);
        

        gamepieces.push(new game_piece(0, 5, 7, colors[0]));
        gamepieces.push(new game_piece(1, 7, 4, colors[1]));
        gamepieces.push(new game_piece(2, 15, 15, colors[2]));
        gamepieces.push(new game_piece(3, 0, 15, colors[3]));

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

        //Bidding button
        let button;
        button = p5.createElement('button', 'Submit Bid').parent(canvasParentRef);
        button.style('background-color', '#212529');
        button.style('color', '#FFFFFF');
        button.style('padding', '10px');
        button.style('border', 'none');
        button.style('border-radius', '6px');
        button.style('font-size', '16px');
        button.position(DIV_DISPLX + MARGIN + BOARD_WIDTH, TOP_BAR_HEIGHT + DIV_DISPLY + MARGIN + BOARD_HEIGHT - 130);
        button.mousePressed(submit_bid);

        input_field = p5.createInput().parent(canvasParentRef).attribute('placeholder', 'Bid (eg. 3)');
        input_field.style('background-color', '#212529');
        input_field.style('color', '#FFFFFF');
        input_field.style('border', 'none');
        input_field.style('padding', '10px');
        input_field.style('width', '230px');
        input_field.style('border-radius', '6px');
        input_field.position(DIV_DISPLX + MARGIN + BOARD_WIDTH, TOP_BAR_HEIGHT + DIV_DISPLY + MARGIN + BOARD_HEIGHT - 60);


        // skip button
        vote_button = p5.createElement('button', 'Skip').parent(canvasParentRef);
        vote_button.style('background-color', '#212529');
        vote_button.style('color', '#FFFFFF');
        vote_button.style('padding', '10px');
        vote_button.style('border', 'none');
        vote_button.style('width', '100px');
        vote_button.style('border-radius', '6px');
        vote_button.style('font-size', '16px');
        vote_button.position(DIV_DISPLX + MARGIN + BOARD_WIDTH + 130, TOP_BAR_HEIGHT + DIV_DISPLY + MARGIN + BOARD_HEIGHT - 130);
        vote_button.mousePressed(skip);

        // Skip text
        vote_text = p5.createElement('h5', `0 / ${room.length}`).parent(canvasParentRef);
        vote_text.style('color', '#000000');
        vote_text.position(DIV_DISPLX + MARGIN + BOARD_WIDTH + 250, TOP_BAR_HEIGHT + DIV_DISPLY + MARGIN + BOARD_HEIGHT - 120);
        RENDER = true; //Render on first frame
    }

    const draw = (p5: any) =>
    {
        TIME = p5.millis();
        if (COUNTDOWN != Math.ceil((TIME_DEADLINE-TIME)/1000)) //If the timer changed, rerender
        {
            RENDER = true;
            COUNTDOWN = Math.ceil((TIME_DEADLINE-TIME)/1000);
            if ((COUNTDOWN == 0 || SKIP) && !SHOWING_SOL && IS_HOST) // If the time ran out
            {
                SKIP = false;
                if (current_bid == Infinity) //If noone found a solution
                {
                    select_new_target();
                    TIME_DEADLINE = TIME + NEW_TARGET_TIME;
                    COUNTDOWN = Math.ceil((TIME_DEADLINE-TIME)/1000);
                    for (let u of room) {
                        u.skip = false;
                    }
                    vote_button.show();
                    vote_text.html(`0 / ${room.length} voted skip`);
                }
                else { //If someone found a solution
                    SHOWING_SOL = true;
                    socket.emit('act-gamestate', {room_id: room_id, SHOWING_SOL: SHOWING_SOL});
                    socket.emit('act-give-move-privilege', {room_id: room_id, current_bidder: current_bidder});
                    for (var u of room)
                    {
                        u.hasMovePrivilege = (u.username == current_bidder) ? true : false;
                    }
                    if (current_bidder == username)
                    {
                        HAS_MOVE_PRIVELEGE = true;
                    }
                }
            }
        }
        if (RENDER)
        {
            RENDER = false;
            render(p5);
        }
    }

    const render = (p5: any) =>
    {
        //RENDERING
        p5.background(192, 192, 192);
        render_gameboard(p5);
        render_scoreboard(p5); 
    }

    const render_gameboard = (p5: any) =>
    {
        p5.push();
        p5.translate(MARGIN/2, MARGIN/2);
        current_target.render(p5, UNIT_LENGTH);
        for (const g of highlight_targets) {
            g.render(p5, UNIT_LENGTH);
        }
        renderBoard(p5);
        for (const g of gamepieces) {
            g.render(p5, UNIT_LENGTH);
        }
        for (const g of walls) {
            g.render(p5, UNIT_LENGTH);
        }
        p5.pop();
    }

    const render_scoreboard = (p5: any) =>
    {
        p5.push();
        let text_size = 0.08*SCORE_WIDTH-22; //found in geogebra
        p5.translate(BOARD_WIDTH + 3*MARGIN/2, MARGIN/2+text_size);
        p5.textSize(text_size);
        p5.text(HEADER_TEXT, 0, 0);

        p5.translate(0, 5*MARGIN);
        text_size = text_size/3;
        renderTable(p5, text_size);

        text_size = text_size * 2;
        p5.textSize(text_size);
        p5.translate(0, room.length * text_size * 1.5 + 1 * MARGIN);
        if (!SHOWING_SOL)
        {
            HEADER_TEXT = "BIDDING STAGE";
            p5.text("Timer: " + COUNTDOWN.toString() + "s", 0, 0);

            if (current_bid != Infinity) {
                // Vote skip here
                skip
            }
                
            text_size = text_size / 2;
            p5.textSize(text_size);
            p5.translate(0, text_size + 1 * MARGIN);
            if (current_bid != Infinity) {
                let message = `${current_bidder} bids: ${current_bid.toString()}`;
                p5.text(message, 0, 0);
            }
        }
        else {
            HEADER_TEXT = "SOLUTION STAGE";
            text_size = text_size / 2;
            p5.textSize(text_size);
            p5.text(`${current_bidder} showing his ${current_bid} move solution.`, 0, 0);
        }
        p5.pop();
    }

    const select_new_target = () =>
    {
        let random_index = get_random_index(); //GET
        let color_id = Math.floor(Math.random() * 4);
        current_target = new highlight_piece(color_id, possible_target_pos[random_index][0], possible_target_pos[random_index][1], colors[color_id]);
        socket.emit('act-new-target', {room_id: room_id, id: random_index, color_id: color_id});
    }

    const keyPressed = (p5: any, e: KeyboardEvent) => {

        if (e.key == "Enter") {
            submit_bid();
        }
    }

    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        if (!HAS_MOVE_PRIVELEGE) { return; }
        RENDER = true;
        
        let mouseX = Math.floor((e.clientX-DIV_DISPLX-MARGIN/2)/UNIT_LENGTH);
        let mouseY = Math.floor((e.clientY-TOP_BAR_HEIGHT-DIV_DISPLY-MARGIN/2)/UNIT_LENGTH);

        // If you try to move a game piece
        for (var move_pos of possible_moves)
        {
            if (mouseX == move_pos[0] && mouseY == move_pos[1])
            {
                movePlayer(selected_piece, mouseX, mouseY);
                socket.emit('act-move-piece', {room_id: room_id, id: selected_piece, pos_x: mouseX, pos_y: mouseY}); //Tell server player has moved
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
                socket.emit('act-select-piece', {room_id: room_id, id: g.id}); //Tell server a new piece is selected
                generate_highlight_squares(g.id);
                return;
            }
        }
        selected_piece = -1;
        socket.emit('act-select-piece', {room_id: room_id, id: -1}); //tell server piece is deselected
        highlight_targets = [];
        possible_moves = [];
    }

    const movePlayer = (idx: number, pos_x: number, pos_y: number) =>
    {
        var g: game_piece = gamepieces[idx];
        g.pos_x = pos_x;
        g.pos_y = pos_y;   

        current_bid--;

        if (IS_HOST)
        {
            if ((pos_x == current_target.pos_x && pos_y == current_target.pos_y && current_target.id == g.id) || current_bid == 0) //If player hit a target
            {
                SHOWING_SOL = false;
                socket.emit('act-gamestate', {SHOWING_SOL: SHOWING_SOL, room_id: room_id});
                let increment = (pos_x == current_target.pos_x && pos_y == current_target.pos_y && current_target.id == g.id) ? 1 : -1; //1 if target is hit else -1
                for (var u of room)
                {
                    if (u.hasMovePrivilege)
                    {
                        u.score += increment;
                        socket.emit('act-give-point', {room_id: room_id, username: u.username, incr: increment});
                        u.hasMovePrivilege = false;
                    }
                }
                socket.emit('act-new-bid', {room_id: room_id, bid: -1, username: ""}); //Tell server player has moved   
                current_bid = Infinity;
                current_bidder = "";
                select_new_target();
                HAS_MOVE_PRIVELEGE = false;
                TIME_DEADLINE = TIME + NEW_TARGET_TIME;
                for (let u of room) {
                    u.skip = false;
                }
                vote_button.show();
                vote_text.html(`0 / ${room.length} voted skip`);
            }

        }
        RENDER = true;
    }

    function get_random_index()
    {
        let random_index;
        while (true) {
            random_index = Math.floor(Math.random() * possible_target_pos.length);
            let position_errors = false;
            for (let i = 0; i < gamepieces.length; i++) {
                let g = gamepieces[i];
                let target_pos_x = possible_target_pos[random_index][0],
                    target_pos_y = possible_target_pos[random_index][1];
                

                if (g.pos_x == target_pos_x && g.pos_y == target_pos_y) {
                    position_errors = true;
                }
            }
            if (!position_errors) {
                break;
            }
        }
        return random_index;
    }

    const renderBoard = (p5: any) => //Draws base layer of game board;
    {
        for (let i = 0; i <= BOARD_SQUARES_X; i++)
        {
            let stroke = (i == 0 || i == BOARD_SQUARES_X) ? 5 : 1;
            p5.strokeWeight(stroke);
            p5.line(UNIT_LENGTH*i, 0, UNIT_LENGTH*i, BOARD_HEIGHT);
        }
        for (let i = 0; i <= BOARD_SQUARES_Y; i++)
        {
            let stroke = (i == 0 || i == BOARD_SQUARES_Y) ? 5 : 1;
            p5.strokeWeight(stroke);
            p5.line(0, UNIT_LENGTH*i, BOARD_WIDTH, UNIT_LENGTH*i);
        }
    }

    function generate_highlight_squares(idx: number) 
    {
        var piece: game_piece = gamepieces[idx];
        possible_moves = [];
        highlight_targets = [];

        highlight_targets.push(new highlight_piece(0, piece.pos_x, piece.pos_y, HIGHLIGHT_COLOR_TWO));

        for (var [x,y] of [[-1,0], [1,0], [0,-1], [0,1]])
        {
            let move = get_move_pos(piece.id, x, y);
            if (move[0] != -1)
            {
                possible_moves.push([move[0], move[1]]);
            }
        }
        RENDER = true;
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
        if (SHOWING_SOL) {
            return;
        }
        var reg = /^\d+$/;
        if (!reg.test(input_field.value()))
        {
            showNotification('Bid is not a number');
            return; //can only submit positive integers.
        }
        let value = Number(input_field.value())     
        if (value == 0)
        {
            showNotification('You cannot bid 0');
            return;
        }
        
        if ( value >= current_bid)
        {
            showNotification('Bid is not better than the current bid');
            return;
        }

        current_bid = value;
        current_bidder = username;
        socket.emit('act-new-bid', {room_id: room_id, bid: current_bid, username: username}); //Tell server player has moved   

        input_field.value("");
        for (var u of room)
        {
            u.hasMovePrivilege = (u.username == username) ? true : false;
        }
        if (TIME_DEADLINE - TIME < NEW_BID_BUFFER)
        {
            TIME_DEADLINE = TIME + NEW_BID_BUFFER;
        }

        if (TIME_DEADLINE - TIME > FIRST_BID_TIME)
        {
            TIME_DEADLINE = TIME + FIRST_BID_TIME;
        }
    }

    function skip()
    {
        socket.emit('act-skip', {room_id: room_id, username: username});
        let count = 0;
        for (var u of room) {
            if (u.username == username) {
                u.skip = true;
            }
            count += u.skip ? 1 : 0;
        }
        SKIP = (count == room.length) ? true : false;
        vote_button.hide();
        vote_text.html(`${count} / ${room.length} voted skip`);
        RENDER = true;
    }

    const showNotification = (message) => {
        NotificationManager.error(message, 'Error', 3000);
    }

    useBeforeunload(disconnect);


    function disconnect() {
        socket.disconnect();
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
 
        )

}