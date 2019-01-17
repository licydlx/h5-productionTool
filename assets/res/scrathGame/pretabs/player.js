cc.Class({
    extends: cc.Component,

    properties: {
        root: {
            default: null,
            type: cc.Node
        },

        gameFail: {
            default: null,
            type: cc.Node
        },

        stateButtun: {
            default: null,
            type: cc.Sprite
        },

        startFrame: {
            default: null,
            type: cc.SpriteFrame
        },

        jumpAudio: {
            default: null,
            type: cc.AudioClip
        },

        failAudio: {
            default: null,
            type: cc.AudioClip
        },

        speed: cc.v2(0, 0),
        maxSpeed: cc.v2(2000, 2000),
        gravity: -1000,
        drag: 1000,
        direction: 0,
        jumpSpeed: 300
        
    },

    // use this for initialization
    onLoad: function () {
        //add keyboard input listener to call turnLeft and turnRight
        //cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyPressed, this);
        // cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyReleased, this);
        this.isRun = true;

        this.collisionX = 0;
        this.collisionY = 0;
        this.prePosition = cc.v2();
        this.preStep = cc.v2();
        //this.touchingNumber = 0;

        this.root.on('mousedown', this.jump, this);

        var playerAnimation = this.playerAnimation = this.node.getComponent(cc.Animation);
        // playerAnimation.play('behavior');
        // console.log('onLoad');
        // console.log(playerAnimation);
    },

    jump() {
        cc.audioEngine.play(this.jumpAudio, false, 1);

        if (!this.jumping) {
            this.jumping = true;
            this.speed.y = this.jumpSpeed;
        }

    },

    onEnable: function () {
        cc.director.getCollisionManager().enabled = true;
        //cc.director.getCollisionManager().enabledDebugDraw = true;
    },

    onDisable: function () {
        cc.director.getCollisionManager().enabled = false;
        //cc.director.getCollisionManager().enabledDebugDraw = false;
    },

    // onKeyPressed: function (event) {
    //     let keyCode = event.keyCode;
    //     switch (keyCode) {
    //         case cc.macro.KEY.a:
    //         case cc.macro.KEY.left:
    //         // this.direction = -1;
    //         // break;
    //         case cc.macro.KEY.d:
    //         case cc.macro.KEY.right:
    //         // this.direction = 1;
    //         // break;
    //         case cc.macro.KEY.w:
    //         case cc.macro.KEY.up:
    //             if (!this.jumping) {
    //                 this.jumping = true;
    //                 this.speed.y = this.jumpSpeed;
    //             }
    //             break;
    //     }
    // },

    // onKeyReleased: function (event) {
    //     let keyCode = event.keyCode;
    //     switch(keyCode) {
    //         case cc.macro.KEY.a:
    //         case cc.macro.KEY.left:
    //         case cc.macro.KEY.d:
    //         case cc.macro.KEY.right:
    //             this.direction = 0;
    //             break;
    //     }
    // },
    buttonWork(event, pars) {
        if (this.isRun) {
            this.isRun = false;
            this.jumping = false;
            this.playerAnimation.stop('behavior');
            this.root.off('mousedown', this.jump, this);
            this.node.dispatchEvent(new cc.Event.EventCustom('gameFail', true));
            this.stateButtun.spriteFrame = this.startFrame;
        } else {
            

            var scrathGame = this.node.parent.parent.getChildByName("scrathGame");

            console.log(scrathGame);

            scrathGame.destroy();

            var scrathStart = this.node.parent.parent.getChildByName("scrathStart");
            scrathStart.active = true;
        }
        return;
    },

    fail() {
        this.jumping = false;
        this.playerAnimation.stop('behavior');
        this.root.off('mousedown', this.jump, this);
        this.node.dispatchEvent(new cc.Event.EventCustom('gameFail', true));
        this.gravity = -100;
        this.node.getComponent(cc.CircleCollider).enabled = false;

        cc.audioEngine.play(this.failAudio, false, .2);

        setTimeout(function () {
            this.isRun = false;
            this.gameFail.active = true;
            this.stateButtun.spriteFrame = this.startFrame;
        }.bind(this), 2000);

        return;
    },

    onCollisionEnter: function (other, self) {
        if (other.name !== "floorCollider<BoxCollider>") {
            this.fail();
        }
        // this.node.color = cc.Color.RED;
        // this.touchingNumber++;
        // 1st step 
        // get pre aabb, go back before collision
        var otherAabb = other.world.aabb;
        var otherPreAabb = other.world.preAabb.clone();

        var selfAabb = self.world.aabb;
        var selfPreAabb = self.world.preAabb.clone();

        // 2nd step
        // forward x-axis, check whether collision on x-axis
        selfPreAabb.x = selfAabb.x;
        otherPreAabb.x = otherAabb.x;

        var curCanvas = cc.find("Canvas");
        console.log(curCanvas);

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.x < 0 && (selfPreAabb.xMax > otherPreAabb.xMax)) {
                this.node.x = otherPreAabb.xMax - curCanvas.x;
                this.collisionX = -1;
            }
            else if (this.speed.x > 0 && (selfPreAabb.xMin < otherPreAabb.xMin)) {
                this.node.x = otherPreAabb.xMin - selfPreAabb.width - curCanvas.x;
                this.collisionX = 1;
            }

            this.speed.x = 0;
            other.touchingX = true;
            return;
        }

        // 3rd step
        // forward y-axis, check whether collision on y-axis
        selfPreAabb.y = selfAabb.y;
        otherPreAabb.y = otherAabb.y;

        if (cc.Intersection.rectRect(selfPreAabb, otherPreAabb)) {
            if (this.speed.y < 0 && (selfPreAabb.yMax > otherPreAabb.yMax)) {
                this.node.y = otherPreAabb.yMax - curCanvas.y + 20;
                this.jumping = false;
                this.collisionY = -1;
            }
            else if (this.speed.y > 0 && (selfPreAabb.yMin < otherPreAabb.yMin)) {
                this.node.y = otherPreAabb.yMin - selfPreAabb.height - curCanvas.y + 20;
                this.collisionY = 1;
            }

            this.speed.y = 0;
            other.touchingY = true;
        }

    },

    onCollisionStay: function (other, self) {
        if (this.collisionY === -1) {
            if (other.node.group === 'Platform') {
                var motion = other.node.getComponent('PlatformMotion');
                if (motion) {
                    this.node.x += motion._movedDiff;
                }
            }

            // this.node.y = other.world.aabb.yMax;

            // var offset = cc.v2(other.world.aabb.x - other.world.preAabb.x, 0);

            // var temp = cc.affineTransformClone(self.world.transform);
            // temp.tx = temp.ty = 0;

            // offset = cc.pointApplyAffineTransform(offset, temp);
            // this.node.x += offset.x;
        }
    },

    onCollisionExit: function (other) {
        this.touchingNumber--;
        if (this.touchingNumber === 0) {
            this.node.color = cc.Color.WHITE;
        }

        if (other.touchingX) {
            this.collisionX = 0;
            other.touchingX = false;
        }
        else if (other.touchingY) {
            other.touchingY = false;
            this.collisionY = 0;
            this.jumping = true;
        }
    },

    update: function (dt) {
        if (!this.isRun) return;

        if (this.collisionY === 0) {
            this.speed.y += this.gravity * dt;
            if (Math.abs(this.speed.y) > this.maxSpeed.y) {
                this.speed.y = this.speed.y > 0 ? this.maxSpeed.y : -this.maxSpeed.y;
            }
        }

        if (this.direction === 0) {
            if (this.speed.x > 0) {
                this.speed.x -= this.drag * dt;
                if (this.speed.x <= 0) this.speed.x = 0;
            }
            else if (this.speed.x < 0) {
                this.speed.x += this.drag * dt;
                if (this.speed.x >= 0) this.speed.x = 0;
            }
        }
        else {
            this.speed.x += (this.direction > 0 ? 1 : -1) * this.drag * dt;
            if (Math.abs(this.speed.x) > this.maxSpeed.x) {
                this.speed.x = this.speed.x > 0 ? this.maxSpeed.x : -this.maxSpeed.x;
            }
        }

        if (this.speed.x * this.collisionX > 0) {
            this.speed.x = 0;
        }
        
        this.prePosition.x = this.node.x;
        this.prePosition.y = this.node.y;

        this.preStep.x = this.speed.x * dt;
        this.preStep.y = this.speed.y * dt;
        
        this.node.x += this.speed.x * dt;
        this.node.y += this.speed.y * dt;
    },
});
