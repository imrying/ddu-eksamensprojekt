import React from "react";
import dynamic from 'next/dynamic'
import grid from './constants'
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
var canvasParentRef;

export default function Game(props)
{
    
    var gamepieces: Array<game_piece> = [];
    var walls: Array<wall> = [];
    var targets: Array<target_piece> = [];
    
	const setup = (p5: any, canvasParentRef: any) => 
    {
        BOARD_LENGTH = window.innerHeight-TOP_BAR_HEIGHT-20;
        UNIT_LENGTH = BOARD_LENGTH/16;
		p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);
        gamepieces.push(new game_piece(0, 5, 7, p5.color(100, 200, 50)));
        gamepieces.push(new game_piece(0, 12, 1, p5.color(100, 200, 9)));
        gamepieces.push(new game_piece(0, 12, 3, p5.color(240, 200, 50)));
        gamepieces.push(new game_piece(0, 2, 7, p5.color(100, 0, 50)));
        targets.push(new target_piece(1, 1, 1, p5.color(50, 50, 99)));
        walls.push(new wall(true, 4, 4));
        walls.push(new wall(false, 4, 4));
	};

	const draw = (p5: any) =>
    {
        p5.background(255,255,255);
        drawBoard(p5);
        for (const g of gamepieces)
        {
            g.render(p5);
        }
        for (const g of walls)
        {
            g.render(p5);
        }
        for (const g of targets)
        {
            g.render(p5);
        }
	};

    const mousePressed = (p5: any, e: MouseEvent) => 
    {
        var pos_x = Math.floor(e.clientX/UNIT_LENGTH);
        var pos_y = Math.floor((e.clientY-TOP_BAR_HEIGHT)/UNIT_LENGTH);
        for (const g of gamepieces)
        {
            if (g.pos_x == pos_x && g.pos_y == pos_y)
            {
                console.log("HOLLO BOLLO");
            }
        }
    };

    const drawBoard = (p5: any) => 
    {
        p5.strokeWeight(1);
        for (let i = 0; i < 17; i++)
        {
            p5.line(UNIT_LENGTH*i,0, UNIT_LENGTH*i, BOARD_LENGTH);
            p5.line(0, UNIT_LENGTH*i, BOARD_LENGTH, UNIT_LENGTH*i);
        }
    }

    class game_piece
    {
        constructor(id, pos_x, pos_y, color)
        {
            this.id = id;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
            this.color = color;
        }

        render(p5) 
        {
            p5.fill(this.color);
            p5.circle(
                this.pos_x * UNIT_LENGTH + UNIT_LENGTH / 2,
                this.pos_y * UNIT_LENGTH + UNIT_LENGTH / 2,
                UNIT_LENGTH * 0.75
            );
        }
    }

    class target_piece 
    {
        constructor(id, pos_x, pos_y, color) 
        {
            this.id = id;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
            this.color = color;
        }

        render(p5) 
        {
            p5.strokeWeight(1);
            p5.fill(this.color);
            p5.rect(this.pos_x * UNIT_LENGTH, this.pos_y * UNIT_LENGTH, UNIT_LENGTH, UNIT_LENGTH);
        }
    }

    class wall 
    {
        constructor(vert, pos_x, pos_y) 
        {
            this.vert = vert;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
        }

        render(p5) {
            p5.fill(0);
            p5.strokeWeight(5);
            if (this.vert) 
            {
                p5.line(UNIT_LENGTH * (this.pos_x+1), UNIT_LENGTH * this.pos_y,UNIT_LENGTH * (this.pos_x+1), UNIT_LENGTH * (1+this.pos_y));
            } else {
                p5.line(UNIT_LENGTH*this.pos_x, UNIT_LENGTH*(this.pos_y+1), UNIT_LENGTH*(this.pos_x+1), UNIT_LENGTH*(this.pos_y+1));
            }
        }
    }


    // Will only render on client-side
	return <Sketch setup={setup} draw={draw} mousePressed={mousePressed}/>;
};

