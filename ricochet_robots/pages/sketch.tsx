import React from "react";
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { io } from 'socket.io-client';


// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false,
})


//// CONSTANTS //////////////
var BOARD_LENGTH = 480;
var UNIT_LENGTH = 30;
const TOP_BAR_HEIGHT = 60;
const DIV_DISPLX = 29;
const DIV_DISPLY = 13;

let socket; // socket for lobby

var canvasParentRef; //global reference to canvas parent


export default function Game(props)
{
    var gamepieces: Array<game_piece> = [];
    var walls: Array<wall> = [];
    var current_target: highlight_piece;
    var highlight_targets: Array<highlight_piece> = [];
    
    var selected_piece: game_piece;
    var possible_moves: Array<[number, number]> = [];
    var update_highlight_squares = false;

    var possible_target_pos: Array<[number, number]>;

    useEffect(() => socketInitializer(), [])

    const socketInitializer = async () => {
        await fetch('/api/lobby/lobby_manager')
        socket = io()

        socket.on('connect', () => {
        console.log('connected')
        })

        socket.on('update-player', player_data => {
            gamepieces[player_data[0]].pos_x = player_data[1];
            gamepieces[player_data[0]].pos_y = player_data[2];
            console.log(player_data);
          })
        
        socket.on('update-selection', selection_data => {
            if (selection_data != -1)
            {
                selected_piece = gamepieces[selection_data];
            }   
            highlight_targets = [];
            possible_moves = [];
            if (selection_data != -1)
            {
                update_highlight_squares = true;
            }
        })
    }
        
	const setup = (p5: any, canvasParentRef: any) => 
    {
        BOARD_LENGTH = window.innerHeight-TOP_BAR_HEIGHT-20;
        UNIT_LENGTH = BOARD_LENGTH/16;

		p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);

        gamepieces.push(new game_piece(0, 5, 7, p5.color(100, 200, 50)));
        gamepieces.push(new game_piece(1, 7, 4, p5.color(200, 0, 9)));
        gamepieces.push(new game_piece(2, 15, 15, p5.color(0, 200, 50)));
        gamepieces.push(new game_piece(3, 0, 15, p5.color(100, 100, 200)));

        current_target = new highlight_piece(0, 0, 7, p5.color(50, 50, 99));

        possible_target_pos = [
            [0,5],
            [0,11],
            [0,15],
            [1,2],
            [4,13],
            [6,1],
            [6,5],
            [8,15],
            [9,0],
            [10,12],
            [11,4],
            [12,6],
            [13,11],
            [15,0],
            [15,9],
            [15,12]
        ];


        var wall_pos_vert: Array<[number, number]> = [];
        wall_pos_vert = [[4,0], [10,0], [6,1], [8,1],[0,2], [14,2],[10,4], [6,5], [1,6],[11,6], [6,7], [6,8],[8,7], [8,8], [5,8], [1,10], [10,10],[12,11], [10,12], [3,13], [12,13],[5,14], [4,15], [9,15] ];
        var wall_pos_horz: Array<[number, number]> = [];
        wall_pos_horz = [[1,1], [6,1], [9,1], [14,1], [0,5], [6,4], [10,4], [15,4], [12,5], [2,6], [7,6], [8,6], [5,8], [7,8], [8,8], [2,9], [11,9], [0,11], [10,11], [13,11], [15,11], [4,12], [12,13], [6,14]];
        for (var x of wall_pos_vert)
        {
            walls.push(new wall(true, x[0], x[1]));
        }
        for (var x of wall_pos_horz)
        {
            walls.push(new wall(false, x[0], x[1]));
        }
	};

	const draw = (p5: any) =>
    {
        p5.background(255,255,255);
        for (const g of highlight_targets)
        {
            g.render(p5);
        }
        for (const g of gamepieces)
        {
            g.render(p5);
        }
        for (const g of walls)
        {
            g.render(p5);
        }
        current_target.render(p5);

        drawBoard(p5);

        if (update_highlight_squares)
        {
            update_highlight_squares = false;
            generate_highlight_squares(p5, selected_piece);
        }
	};

    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        var pos_x = Math.floor((e.clientX-DIV_DISPLX)/UNIT_LENGTH);
        var pos_y = Math.floor((e.clientY-TOP_BAR_HEIGHT-DIV_DISPLY)/UNIT_LENGTH);
        var new_selection = false;
        // console.log(e.clientX, e.clientY);
        for (var pos of possible_moves)
        {
            if (pos[0] == pos_x && pos[1] == pos_y)
            {
                // console.log("MOVE TO " + pos_x.toString() + " " + pos_y.toString());
                selected_piece.pos_x = pos_x;
                selected_piece.pos_y = pos_y;
                
                socket.emit('player-move', [selected_piece.id, pos_x, pos_y]);
                if (pos_x == current_target.pos_x && pos_y == current_target.pos_y)
                {
                    let random_index = Math.floor(Math.random() * possible_target_pos.length);

                    current_target.pos_x = possible_target_pos[random_index][0];
                    current_target.pos_y = possible_target_pos[random_index][1];
                }
                new_selection = true;
                highlight_targets = [];
                possible_moves = [];
                generate_highlight_squares(p5, selected_piece);
                socket.emit('select-piece', selected_piece.id);
            }
        }
        for (var g of gamepieces)
        {
            if (g.pos_x == pos_x && g.pos_y == pos_y && g != selected_piece)
            {
                selected_piece = g;
                socket.emit('select-piece', selected_piece.id);
                new_selection = true;
                possible_moves = [];
                highlight_targets = [];
                generate_highlight_squares(p5, selected_piece);
                break;
            }
        }
        if (new_selection == false)
        {
            socket.emit('select-piece', -1);
            selected_piece = null;
            highlight_targets = [];
            possible_moves = [];
        }
    };

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
            p5.line(UNIT_LENGTH*i,0, UNIT_LENGTH*i, BOARD_LENGTH);
            p5.line(0, UNIT_LENGTH*i, BOARD_LENGTH, UNIT_LENGTH*i);
        }
    }


    function generate_highlight_squares(p5, piece)
    {
        highlight_targets.push(new highlight_piece(0, piece.pos_x, piece.pos_y, p5.color(255,255,0, 90)))
        let horz = piece.pos_x; 
        let collision = false;
        while (collision == false)
        {
            for (var w of walls) 
            {
                if (w.vertical == true && w.pos_x == horz -1 && w.pos_y == piece.pos_y) 
                {
                    collision = true;
                    break; 
                }
            }

            for (var g of gamepieces) 
            {
                if (g.pos_x == horz -1 && g.pos_y == piece.pos_y) 
                {
                    collision = true;
                    break; 
                }
            }
            if (horz == 0)
            {
                collision = true;
            }

            if (!collision) 
            {
                highlight_targets.push(new highlight_piece(0, horz-1, piece.pos_y, p5.color(255,255,0, 90)))
            }
            horz --;
        }
        if (horz + 1 != piece.pos_x && piece.pos_x != 0)
        {
            highlight_targets[highlight_targets.length-1].color = p5.color(255,255,0);
            possible_moves.push([highlight_targets[highlight_targets.length-1].pos_x, highlight_targets[highlight_targets.length-1].pos_y]);
        }

        //////////////////////////////////////////////////////////////////////////////////////////////////
        horz = piece.pos_x; 
        collision = false;
        while (collision == false)
        {
            for (var w of walls) 
            {
                if (w.vertical == true && w.pos_x == horz && w.pos_y == piece.pos_y) 
                {
                    collision = true;
                    break; 
                }
            }

            for (var g of gamepieces) 
            {
                if (g.pos_x == horz +1 && g.pos_y == piece.pos_y) 
                {
                    collision = true;
                    break; 
                }
            }
            if (horz == 15)
            {
                collision = true;
            }

            if (!collision) 
            {
                highlight_targets.push(new highlight_piece(0, horz+1, piece.pos_y, p5.color(255,255,0,90)))
            }
            horz++;
        }
        if (horz -1 != piece.pos_x  && piece.pos_x != 15)
        {
            highlight_targets[highlight_targets.length-1].color = p5.color(255,255,0);
            possible_moves.push([highlight_targets[highlight_targets.length-1].pos_x, highlight_targets[highlight_targets.length-1].pos_y]);
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        let vert = piece.pos_y; 
        collision = false;
        while (collision == false)
        {
            for (var w of walls) 
            {
                if (w.vertical == false && w.pos_x == piece.pos_x && w.pos_y == vert) 
                {
                    collision = true;
                    break; 
                }
            }

            for (var g of gamepieces) 
            {
                if (g.pos_x ==piece.pos_x && g.pos_y == vert+1) 
                {
                    collision = true;
                    break; 
                }
            }

            if (vert == 15)
            {
                collision = true;
            }

            if (!collision) 
            {
                highlight_targets.push(new highlight_piece(0, piece.pos_x, vert+1, p5.color(255,255,0,90)))
            }
            vert++;
        }
        if (vert -1 != piece.pos_y  && piece.pos_y != 15)
        {
            highlight_targets[highlight_targets.length-1].color = p5.color(255,255,0); 
            possible_moves.push([highlight_targets[highlight_targets.length-1].pos_x, highlight_targets[highlight_targets.length-1].pos_y]);
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        vert = piece.pos_y; 
        collision = false;
        while (collision == false)
        {
            for (var w of walls) 
            {
                if (w.vertical == false && w.pos_x == piece.pos_x && w.pos_y == vert-1) 
                {
                    collision = true;
                    break; 
                }
            }

            for (var g of gamepieces) 
            {
                if (g.pos_x ==piece.pos_x && g.pos_y == vert-1) 
                {
                    collision = true;
                    break; 
                }
            }

            if (vert == 0)
            {
                collision = true;
            }

            if (!collision) 
            {
                highlight_targets.push(new highlight_piece(0, piece.pos_x, vert-1, p5.color(255,255,0,90)))
            }
            vert--;
        }
        if (vert +1 != piece.pos_y  && piece.pos_y != 0)
        {
            highlight_targets[highlight_targets.length-1].color = p5.color(255,255,0); 
            possible_moves.push([highlight_targets[highlight_targets.length-1].pos_x, highlight_targets[highlight_targets.length-1].pos_y]);
        }
    }

    // Will only render on client-side
    class game_piece {
        constructor(id, pos_x, pos_y, color) {
            this.id = id;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
            this.color = color;
        }

        render(p5) {
            p5.fill(this.color);
            p5.strokeWeight(1);
            p5.circle(
                this.pos_x * UNIT_LENGTH + UNIT_LENGTH / 2,
                this.pos_y * UNIT_LENGTH + UNIT_LENGTH / 2,
                UNIT_LENGTH * 0.75
            );
        }
    }

    class highlight_piece {
        constructor(id, pos_x, pos_y, color) {
            this.id = id;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
            this.color = color;
        }

        render(p5) {
            p5.strokeWeight(1);
            p5.fill(this.color);
            p5.rect(this.pos_x * UNIT_LENGTH, this.pos_y * UNIT_LENGTH, UNIT_LENGTH, UNIT_LENGTH);
        }
    }

    class wall {
        constructor(vertical, pos_x, pos_y) {
            this.vertical = vertical;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
        }

        render(p5) {
            p5.fill(0);
            p5.strokeWeight(5);
            if (this.vertical) {
                p5.line(UNIT_LENGTH * (this.pos_x + 1), UNIT_LENGTH * this.pos_y, UNIT_LENGTH * (this.pos_x + 1), UNIT_LENGTH * (1 + this.pos_y));
            } else {
                p5.line(UNIT_LENGTH * this.pos_x, UNIT_LENGTH * (this.pos_y + 1), UNIT_LENGTH * (this.pos_x + 1), UNIT_LENGTH * (this.pos_y + 1));
            }
        }
    }

	return (
    <div className="container-fluid">
        <div className="row">
            <div className="col-lg-8">
                <div className="m-3">
                    <Sketch setup={setup} draw={draw} mousePressed={mousePressed}/>
                </div>
            </div>
            <div className="col-lg-4">
                <p>WOWOW</p>
            </div>

        </div>
    </div> 


    );
};

