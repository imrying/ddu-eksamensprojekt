import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useSession, signIn, signOut } from "next-auth/react"
import dynamic from 'next/dynamic';
import { game_piece, wall, highlight_piece, user} from '../classes';
import p5Types from "p5";


import {useRouter} from 'next/router'
import {useState} from 'react'
import { BackgroundImage } from '@mantine/core'

// Will only import `react-p5` on client-side
const Sketch = dynamic(() => import('react-p5').then((mod) => mod.default), 
{
  ssr: false
});

var TOP_BAR_HEIGHT = 65;

var SKETCH_HEIGHT;
var SKETCH_WIDTH;

var MARGIN = 50;

var DIV_DISPLX = 14;
var DIV_DISPLY = 80;

var colors: Array<any> = [];

var BOARD_SQUARES_X = 8;
var BOARD_SQUARES_Y = 8;

var UNIT_LENGTH;

var BOARD_HEIGHT;
var BOARD_WIDTH;

var gamepieces: Array<game_piece> = [];
var walls: Array<wall> = [];
var highlight_targets: Array<highlight_piece> = [];
var possible_moves: any = [];
var possible_target_pos: Array<[number, number]>;   //positions where target can spawn
var selected_piece: number; //piece player tries to move
var current_target: highlight_piece; 



var HIGHLIGHT_COLOR_ONE;
var HIGHLIGHT_COLOR_TWO;



export default function Home() {
  const {data: session} = useSession()
  const router = useRouter()
  const [code, setCode] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    router.push(`/lobby/?code=${code}`)
  }

  const setup = (p5: any, canvasParentRef: any) =>
  {
    MARGIN = 0.031 * window.innerWidth;
    SKETCH_HEIGHT = window.innerHeight - TOP_BAR_HEIGHT - DIV_DISPLY - MARGIN;
    SKETCH_WIDTH = window.innerWidth*2/3 - DIV_DISPLX - MARGIN;
    BOARD_HEIGHT = SKETCH_HEIGHT - MARGIN;
    UNIT_LENGTH = BOARD_HEIGHT / BOARD_SQUARES_Y;
    BOARD_WIDTH = UNIT_LENGTH * BOARD_SQUARES_X;

    p5.createCanvas(SKETCH_WIDTH, SKETCH_HEIGHT).parent(canvasParentRef);

    colors = [p5.color(255,0,0), p5.color(0,255,0)];

    gamepieces.push(new game_piece(0, 5, 7, colors[0]));
    gamepieces.push(new game_piece(1, 7, 4, colors[1]));

    HIGHLIGHT_COLOR_ONE = p5.color(0,0,0,150);
    HIGHLIGHT_COLOR_TWO = p5.color(0,0,0,80);

    // Construct vertical walls
    var wall_pos_vert: Array<[number, number]> = [];
    wall_pos_vert = [
      [4, 0], [3,3], [3,4], [2,7]
    ];

    for (var x of wall_pos_vert) {
      walls.push(new wall(true, x[0], x[1]));
    }

    // Construct horizontal walls
    var wall_pos_horz: Array<[number, number]> = [];
    wall_pos_horz = [
      [1, 1], [3, 3], [4, 3], [6,5]
    ];
    for (var x of wall_pos_horz) {
      walls.push(new wall(false, x[0], x[1]));
    }

    //Where can target spawn (x,y)
    possible_target_pos = [
      [0, 7], [4,3], [3,4], [7,3]
    ];
//airenstoieanrsoietnoi
    current_target = new highlight_piece(0, 0, 7, colors[0]);

    selected_piece = 0;
    generate_highlight_squares(selected_piece);

  }

  const draw = (p5: any) =>
  {
    p5.background(192,192,192);
    p5.push();
    p5.translate((SKETCH_WIDTH-BOARD_WIDTH)/2, MARGIN/2)
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


  const mousePressed = (p5: any, e: MouseEvent) => 
    {
        let mouseX = Math.floor((e.clientX-DIV_DISPLX-(SKETCH_WIDTH-BOARD_WIDTH)/2-window.innerWidth/3)/UNIT_LENGTH);
        let mouseY = Math.floor((e.clientY-TOP_BAR_HEIGHT-DIV_DISPLY-MARGIN/2)/UNIT_LENGTH);

        for (var move_pos of possible_moves)
        {
            if (mouseX == move_pos[0] && mouseY == move_pos[1])
            {
                movePlayer(selected_piece, mouseX, mouseY);
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
                generate_highlight_squares(g.id);
                return;
            }
        }
        selected_piece = -1;
        highlight_targets = [];
        possible_moves = [];
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

  const movePlayer = (idx: number, pos_x: number, pos_y: number) =>
    {
        var g: game_piece = gamepieces[idx];
        g.pos_x = pos_x;
        g.pos_y = pos_y;   

        if ((pos_x == current_target.pos_x && pos_y == current_target.pos_y && current_target.id == g.id)) //If player hit a target
        {
          let random_index = get_random_index(); //GET
          let color_id = Math.floor(Math.random() * 2);
          current_target = new highlight_piece(color_id, possible_target_pos[random_index][0], possible_target_pos[random_index][1], colors[color_id]);
        }
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
        if (!(0 <= current_x+incr_x && current_x+incr_x <= 7 && 0 <= current_y+incr_y && current_y+incr_y <= 7))
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


  return (
    <>
      <Head>
        <title>Ricochet Robots</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {session ? ( <>

          <div className="container-fluid">
            <div className="row">
                <div className="col-lg-4">

                  <div className="bg-dark m-5 text-white rounded">
                    <div className="card-body">
                      <h5 className="card-title text-center">Join Lobby</h5>

                      <form onSubmit={handleSubmit}>
                        <div className="form-group">
                          <label htmlFor="code">Code</label>
                          <input type="text" className="form-control" id="code" name="code" placeholder="1234" pattern="\d{4}" onChange={(e)=>{setCode(e.target.value)}} required />
                          <small id="code" className="form-text text-muted">4 numbers only</small>
                        </div>
                        
                        <button type="submit" className="btn btn-secondary my-1">Join Lobby</button>
                        <a href="https://bouncebots.eu.ngrok.io/api/lobby/create" className="btn btn-secondary my-2 mx-2">Create Lobby</a>
                      </form>
                    </div>
                  </div>

                </div>
                <div className="col-lg-8">
                  <h5 className="text-center mt-5">Learn to play</h5>
                    <Sketch setup={setup} draw={draw} mousePressed={mousePressed}/>
                </div>
            </div>
          </div>

      </>
      ) : <>
        <div className="px-4 py-5 my-5 text-center">
            <h1 className="display-5 fw-bold"> Ricochet Robots</h1>
        <div className="col-lg-6 mx-auto">
          <p className="lead mb-4">A game for the mind</p>
          <small className="text-muted mb-2"> We only save your name, email and profile picture </small>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            
            <button type="button" className="btn btn-dark btn-lg px-4 gap-3" onClick={signIn}>Sign in</button>
          </div>
        </div>
      </div>
      </>
      }
    </>
  );
}