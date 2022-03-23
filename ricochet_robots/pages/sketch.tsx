import React from "react";
import dynamic from 'next/dynamic'
import grid from './constants'

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

let x = 50;
let y = 50;
const BOARD_LENGTH = 800;
const UNIT_LENGTH = 50;

export default function Game(props) {

    var gameobjects = [];
    
	const setup = (p5, canvasParentRef) => {
		p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);
        gameobjects.push(new game_piece(0, 5, 7, p5.color(100, 200, 50)));
        gameobjects.push(new game_piece(0, 12, 1, p5.color(100, 200, 9)));
        gameobjects.push(new game_piece(0, 12, 3, p5.color(240, 200, 50)));
        gameobjects.push(new game_piece(0, 2, 7, p5.color(100, 0, 50)));
        gameobjects.push(new target_piece(1, 1, 1, p5.color(50, 50, 99)));
	};

	const draw = (p5) => {
        p5.background(255,255,255);
        drawBoard(p5);
        for (const g of gameobjects)
        {
            g.render(p5);
        }
	};

    const drawBoard = (p5) => {
        for (let i = 0; i < 17; i++)
        {
            p5.line(UNIT_LENGTH*i,0, UNIT_LENGTH*i, BOARD_LENGTH);
            p5.line(0, UNIT_LENGTH*i, BOARD_LENGTH, UNIT_LENGTH*i);
        }
    }

    class game_piece {
        constructor(id, pos_x, pos_y, color) {
            this.id = id;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
            this.color = color;
        }

        render(p5) {
            console.log(this.color);
            p5.fill(this.color);
            p5.circle(
                this.pos_x * UNIT_LENGTH + UNIT_LENGTH / 2,
                this.pos_y * UNIT_LENGTH + UNIT_LENGTH / 2,
                30
            );
        }
    }

    class target_piece {
        constructor(id, pos_x, pos_y, color) {
            this.id = id;
            this.pos_x = pos_x;
            this.pos_y = pos_y;
            this.color = color;
        }

        render(p5)
        {
            p5.fill(this.color);
            p5.rect(this.pos_x * UNIT_LENGTH, this.pos_y * UNIT_LENGTH, UNIT_LENGTH, UNIT_LENGTH);
        }
    }

    class wall {
        constructor()
    }

    // Will only render on client-side
	return <Sketch setup={setup} draw={draw} />;
};

