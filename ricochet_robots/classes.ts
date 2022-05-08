import React, { Component } from 'react';

export class game_piece {
    pos_x : number;
    pos_y : number;
    id : number;
    color : any;

    constructor(id: number, pos_x: number, pos_y: number, color: any) {
        this.id = id;
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.color = color;
    }

    render(p5: any, UNIT_LENGTH: any) {
        p5.fill(this.color);
        p5.strokeWeight(1);
        p5.circle(
            this.pos_x * UNIT_LENGTH + UNIT_LENGTH / 2,
            this.pos_y * UNIT_LENGTH + UNIT_LENGTH / 2,
            UNIT_LENGTH * 0.75
        );
    }
}

export class highlight_piece {
    pos_x : number;
    pos_y : number;
    id : number;
    color : any;

    constructor(id: number, pos_x: number, pos_y: number, color: any) {
        this.id = id;
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.color = color;
    }

    render(p5: any, UNIT_LENGTH: any) {
        p5.strokeWeight(1);
        p5.fill(this.color);
        p5.rect(this.pos_x * UNIT_LENGTH, this.pos_y * UNIT_LENGTH, UNIT_LENGTH, UNIT_LENGTH);
    }
}

export class wall {
    pos_x : number;
    pos_y : number;
    vertical : boolean;
    constructor(vertical: boolean, pos_x: number, pos_y: number) {
        this.vertical = vertical;
        this.pos_x = pos_x;
        this.pos_y = pos_y;
    }

    render(p5: any, UNIT_LENGTH: any) {
        p5.fill(0);
        p5.strokeWeight(5);
        if (this.vertical) {
            p5.line(UNIT_LENGTH * (this.pos_x + 1), UNIT_LENGTH * this.pos_y, UNIT_LENGTH * (this.pos_x + 1), UNIT_LENGTH * (1 + this.pos_y));
        } else {
            p5.line(UNIT_LENGTH * this.pos_x, UNIT_LENGTH * (this.pos_y + 1), UNIT_LENGTH * (this.pos_x + 1), UNIT_LENGTH * (this.pos_y + 1));
        }
    }
}

export class user {
    username : string;
    ishost : boolean;
    hasMovePrivilege : boolean;
    skip: boolean;
    score : number;

    constructor(username : string, ishost : boolean, score : number) {
        this.username = username;
        this.ishost = ishost;
        this.score = score;
        this.hasMovePrivilege = false;
        this.skip = false;
    }
}