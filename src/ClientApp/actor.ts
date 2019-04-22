/// <reference path="../node_modules/phaser/typescript/phaser.d.ts" />

import { Layers } from "./layers"
import { UIMediator } from "./ui-mediator"

declare var gameInfo: any;

export class Actor {

    private WALK_SPEED_FACTOR = 4;

    private text: Phaser.Text;
    private sprite: Phaser.Sprite;

    private moveTween: Phaser.Tween;

    private game: Phaser.Game;

    public constructor(
        public id: string,
        public name: string,
        public classes: string[],
        public usePosition: string,
        public useDirection: string,
        private faceDirection: string,
        private talkColor: string) {
    }

    public get x() {
        return this.sprite.x;
    }

    public get y() {
        return this.sprite.y;
    }

    public create(game: Phaser.Game, uiMediator: UIMediator, x: number, y: number, layers: Layers) {
        
        this.game = game;

        this.sprite = this.game.add.sprite(x, y, "sprites", `actors/${this.id}/${this.faceDirection}`);
        this.sprite.anchor.set(0.5, 1);
        this.sprite.data.z = y;

        // Animations
        this.sprite.animations.add('walk-left',
            Phaser.Animation.generateFrameNames(`actors/${this.id}/walk/left/`, 1, 6, '', 4), 9, true, false);

        this.sprite.animations.add('walk-right',
            Phaser.Animation.generateFrameNames(`actors/${this.id}/walk/right/`, 1, 6, '', 4), 9, true, false);

        this.sprite.animations.add('talk',
            Phaser.Animation.generateFrameNames(`actors/${this.id}/talk/`, 1, 6, '', 4), 9, true, false);

        this.text = this.game.add.text(x, y - this.sprite.height - 40, "", this.createTextStyle());
        this.text.anchor.setTo(0.5);
        this.text.lineSpacing = -30;
        this.text.scale.x = 0.5;
        this.text.scale.y = 0.5; 

        if (this.classes.indexOf("class_untouchable") == -1) {
            this.sprite.inputEnabled = true;
            this.sprite.input.pixelPerfectClick = true;
            this.sprite.input.pixelPerfectOver = true;

            this.sprite.events.onInputOver.add(() => uiMediator.focusObject(this));
            this.sprite.events.onInputOut.add(() => uiMediator.focusObject(null));
            this.sprite.events.onInputDown.add(() => uiMediator.selectObject(this));
        }

        layers.objects.add(this.sprite);
        layers.text.add(this.text);
    }

    public changeDirection(direction: string) {
        this.sprite.frameName = `actors/${this.id}/${direction}`;
        this.faceDirection = direction;
    }

    public focusCamera() {
        this.game.camera.focusOn(this.sprite);
        this.game.camera.follow(this.sprite, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    }

    public sayLine(text: string) {

        // TODO Constant
        if (this.faceDirection == "front") {
            this.sprite.animations.play("talk");
        }

        this.text.setText(text);

        return new Promise((resolve) => {
            
            this.game.time.events.add(
                Math.max(text.length * gameInfo.textSpeed, gameInfo.minTextDuration),
                () => {
                    this.text.setText('');
                    if (this.faceDirection == "front") {
                        this.sprite.animations.stop("talk", true);

                        // Reset the frame.
                        this.changeDirection(this.faceDirection);
                    }
                    resolve();
                });
        });
    }

    public walkTo(path: Phaser.Point[], faceDirection: string): Promise<void> {

        if (this.moveTween) {
            this.moveTween.stop();
        }

        var i = 0;

        return new Promise((resolve) => {

            var move = () => {

                this.sprite.animations.stop();

                const animation = (this.sprite.x < path[i].x) ? "walk-right" : "walk-left";
                this.sprite.animations.play(animation);

                const tweenDuration = Phaser.Math.distance(this.sprite.x, this.sprite.y, path[i].x, path[i].y)
                    * this.WALK_SPEED_FACTOR;

                this.moveTween = this.game.add.tween(this.sprite).to({ x: path[i].x, y: path[i].y }, tweenDuration).start();
        
                this.moveTween.onUpdateCallback(() => {
                    this.sprite.scale.set(this.sprite.y / 400) // TODO
                    this.sprite.data.z = this.sprite.y;
                });
                this.moveTween.onComplete.add(() => {
                    i += 1;
                    if (i < path.length) {
                        move();
                    } else {
                        this.moveTween = null;
                        this.sprite.animations.stop();
                        this.changeDirection(faceDirection);
                        resolve();
                    }
                });
            };

            move();
        });
    }

    public update() {
        this.text.x = Math.floor(this.sprite.x);
        this.text.y = Math.floor(this.sprite.y - this.sprite.height - 40);
    }

    public kill() {
        this.sprite.destroy();
        this.text.destroy();
    }

    // TODO Extract
    private createTextStyle() {

        return {
            font: "54px Onesize", // Using a large font-size and scaling it back looks better.
            fill: this.talkColor,
            stroke: "black",
            strokeThickness: 12,
            align: "center",
            wordWrap: "true",
            wordWrapWidth: 600 // Account for scaling.
        };
    }
}
