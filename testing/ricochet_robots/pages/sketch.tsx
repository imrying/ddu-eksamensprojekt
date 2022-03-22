import React from "react";
import dynamic from 'next/dynamic'
import grid from './constants'

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), {
  ssr: false,
})

let x = 50;
let y = 50;
const BOARD_LENGTH = 720;

export default (props) => {
	const setup = (p5, canvasParentRef) => {
		p5.createCanvas(BOARD_LENGTH, BOARD_LENGTH).parent(canvasParentRef);
    drawBoard(p5)
	};

	const draw = (p5) => {
	};

   const drawBoard = (p5) => {
        for (let x = 0; x < 16; x++) {
            for (let y = 0; y < 16; y++) {
                if (grid[y][x] == 'blank') {
                    blank(p5, x*45,y*45);
                } else if (grid[y][x] == 't_wall') {
                    t_wall(p5, x*45,y*45);
                } else if (grid[y][x] == 'tl_wall') {
                    t_wall(p5, x * 45, y * 45);
                    l_wall(p5, x * 45, y * 45);
                } else if (grid[y][x] == 'tr_wall') {
                    t_wall(p5, x  *  45 ,   y * 45);
                    r_wall(p5, x * 45, y * 45);
                } else if (grid[y][x] == 'b_wall') {
                    b_wall(p5, x*45,y*45);
                } else if (grid[y][x] == 'bl_wall') {
                    b_wall(p5, x*45,y*45);
                    l_wall(p5, x*45,y*45);
                } else if (grid[y][x] == 'br_wall') {
                    b_wall(p5, x * 45, y * 45);
                    r_wall(p5, x * 45, y * 45);
                } else if (grid[y][x] == 'l_wall') {
                    l_wall(p5, x*45,y*45);
                } else if (grid[y][x] == 'r_wall') {
                    r_wall(p5, x * 45, y * 45);
                }
            }
        }
        p5.strokeWeight(1);
        p5.line(0, BOARD_LENGTH, BOARD_LENGTH, BOARD_LENGTH);
        p5.line(BOARD_LENGTH, 0, BOARD_LENGTH, BOARD_LENGTH);
        p5.line(0, 0, 0, BOARD_LENGTH);
    };

    const blank = (p5, x, y) => {
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.line(x, 0, x, x*45);
      p5.line(0, y, x*45, y);
    };

    const t_wall = (p5, x, y) => {
      p5.stroke(0);
      p5.strokeWeight(5);
      p5.line(x, y, x+45, y);
    };

    const b_wall = (p5, x, y) => {
        p5.stroke(0);
        p5.strokeWeight(5);
        p5.line(x, y+45, x+45, y+45);
    };

    const l_wall = (p5, x, y) => {
        p5.stroke(0);
        p5.strokeWeight(5);
        p5.line(x, y, x, y+45);
    };

    const r_wall = (p5, x, y) => {
        p5.stroke(0);
        p5.strokeWeight(5);
        p5.line(x+45, y, x+45, y+45);
    };

// Will only render on client-side
	return <Sketch setup={setup} draw={draw} />;
};
