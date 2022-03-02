
const BOARD_LENGTH = 720;


function blank(x,y) {
    stroke(0);
    strokeWeight(1);
    line(x, 0, x, x*45);
    line(0, y, x*45, y);
}

function t_wall(x,y) {
    stroke(0);
    strokeWeight(5);
    line(x, y, x+45, y);
}

function b_wall(x,y) {
    stroke(0);
    strokeWeight(5);
    line(x, y+45, x+45, y+45);
}

function l_wall(x,y) {
    stroke(0);
    strokeWeight(5);
    line(x, y, x, y+45);
}

function r_wall(x,y) {
    stroke(0);
    strokeWeight(5);
    line(x+45, y, x+45, y+45);
}


function createGrid() {
    var grid = [
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],

        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'tl_wall', 'tr_wall', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],

        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'bl_wall', 'br_wall', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],

        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
        ['blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank', 'blank'],
    ];
    return grid
}

grid = createGrid();
console.log(grid)

function setup() {
    createCanvas(BOARD_LENGTH, BOARD_LENGTH);

    drawBoard();
}

function draw() {}

function drawBoard() {

    for (let x = 0; x < 16; x++) {
        for (let y = 0; y < 16; y++) {
            if (grid[y][x] == 'blank') {
                blank(x*45,y*45);
            } else if (grid[y][x] == 't_wall') {
                t_wall(x*45,y*45);
            } else if (grid[y][x] == 'tl_wall') {
                t_wall(x * 45, y * 45);
                l_wall(x * 45, y * 45);
            } else if (grid[y][x] == 'tr_wall') {
                t_wall(x  *  45 ,   y * 45);
                r_wall(x * 45, y * 45);
            } else if (grid[y][x] == 'b_wall') {
                b_wall(x*45,y*45);
            } else if (grid[y][x] == 'bl_wall') {
                b_wall(x*45,y*45);
                l_wall(x*45,y*45);
            } else if (grid[y][x] == 'br_wall') {
                b_wall(x * 45, y * 45);
                r_wall(x * 45, y * 45);
            } else if (grid[y][x] == 'l_wall') {
                l_wall(x*45,y*45);
            } else if (grid[y][x] == 'r_wall') {
                r_wall(x * 45, y * 45);
            } 
        }
    }

    strokeWeight(1);
    
    line(0, BOARD_LENGTH, BOARD_LENGTH, BOARD_LENGTH);
    line(BOARD_LENGTH, 0, BOARD_LENGTH, BOARD_LENGTH);
    line(0, 0, 0, BOARD_LENGTH);
    
}
