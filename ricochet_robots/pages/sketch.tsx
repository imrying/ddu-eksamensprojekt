import React from "react";
import dynamic from 'next/dynamic';
import grid from './constants';
import game_piece from './game_classes';
import { Redirect } from 'react-router-dom';

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false,
})
import { useSession } from "next-auth/react"


let x = 50;
let y = 50;
var BOARD_LENGTH = 480;
var UNIT_LENGTH = 30;
const TOP_BAR_HEIGHT = 60;
const DIV_DISPL = 16;
var canvasParentRef;

export default function Game(props)
{
    var gamepieces: Array<game_piece> = [];
    var walls: Array<wall> = [];
    var targets: Array<highlight_piece> = [];
    var highlight_targets: Array<highlight_piece> = [];
    var selected_piece: game_piece;
    var possible_moves: Array<[number, number]> = [];
    
	const setup = (p5: any, canvasParentRef: any) => 
    {
        BOARD_LENGTH = window.innerHeight-TOP_BAR_HEIGHT-20;
        UNIT_LENGTH = BOARD_LENGTH/16;
		p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);
        gamepieces.push(new game_piece(0, 5, 7, p5.color(100, 200, 50)));
        gamepieces.push(new game_piece(0, 7, 4, p5.color(100, 200, 9)));
        gamepieces.push(new game_piece(0, 12, 4, p5.color(240, 200, 50)));
        gamepieces.push(new game_piece(0, 6, 4, p5.color(240, 200, 50)));
        gamepieces.push(new game_piece(0, 2, 7, p5.color(100, 0, 50)));
        targets.push(new highlight_piece(1, 1, 1, p5.color(50, 50, 99)));
        walls.push(new wall(true, 4, 4));
        walls.push(new wall(false, 4, 4));
	};

	const draw = (p5: any) =>
    {
        p5.background(255,255,255);
        for (const g of targets)
        {
            g.render(p5);
        }
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
        drawBoard(p5);
	};

    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        var pos_x = Math.floor((e.clientX-DIV_DISPL)/UNIT_LENGTH);
        var pos_y = Math.floor((e.clientY-TOP_BAR_HEIGHT-DIV_DISPL)/UNIT_LENGTH);
        var new_selection = false;
        for (var pos of possible_moves)
        {
            if (pos[0] == pos_x && pos[1] == pos_y)
            {
                // console.log("MOVE TO " + pos_x.toString() + " " + pos_y.toString());
                selected_piece.pos_x = pos_x;
                selected_piece.pos_y = pos_y;
            }
        }
        for (var g of gamepieces)
        {
            if (g.pos_x == pos_x && g.pos_y == pos_y && g != selected_piece)
            {
                selected_piece = g;
                new_selection = true;
                possible_moves = [];
                highlight_targets = [];
                generate_highlight_squares(p5, selected_piece);
                break;
            }
        }
        if (new_selection == false)
        {
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
    <div className="m-3">
        <Sketch setup={setup} draw={draw} mousePressed={mousePressed}/>
    </div>
    );
};

