"use strict";

function BoundingShape() {
}

BoundingShape.prototype = new Object();

BoundingShape.prototype.check = function(relpos) {
    return false;
}

BoundingShape.prototype.getBorderPoint = function(relpos) {
    return new Victor(0,0);
}

BoundingShape.prototype.checkCollision = function(relpos, shape) {
    var border = shape.getBorderPoint(relpos).add(relpos);
    return this.check(border);
}

function BoundingBox(width, height) {
    this.width = width/2;
    this.height = height/2;
}

BoundingBox.prototype = new BoundingShape();

BoundingBox.prototype.check = function(relpos) {
    return relpos.x > -this.width && relpos.x < this.width &&
        relpos.y > -this.height && relpos.y < this.height;
}

BoundingBox.prototype.getBorderPoint = function(relpos) {
    var border = relpos.copy();
    border.inverse();

    var constraints = [{x: this.width, y: 0},
                       {x: -this.width, y: 0},
                       {y: this.height, x: 0},
                       {y: -this.height, x: 0}];

    var chosenConstraint = {c: null, l: Infinity};
    for(var c in constraints) {
        var cx = border.x - constraints[c].x;
	var cy = border.y - constraints[c].y;
	var l = new Victor(cx,cy).lengthSq();
        if(l < chosenConstraint.l) {
            chosenConstraint.c = c;
            chosenConstraint.l = l;
        }
    }
    if(relpos.lengthSq() < chosenConstraint.l) {
        return relpos.copy().inverse();
    }
    var borderPoint = new Victor(0,0);
    if(chosenConstrain.c != null) {
        if(constraints[c].x != 0) {
            x = constraints[c].x;
            y = Math.tan(border.horizontalAngle())*x;
            borderPoint = new Victor(x,y);
        } else {
            y = constraints[c].y;
            x = Math.tan(border.verticalAngle())*y;
            borderPoint = new Victor(x,y);
        }
    }
    return borderPoint; 
}

function BoundingCircle(r) {
    this.radius = r;
}

BoundingCircle.prototype = new BoundingShape();

BoundingCircle.prototype.getBorderPoint = function(relpos) {
    return relpos.copy().normalize().inverse().multiplyScalar(this.radius);
}

// Checks whether a location is within a bounding circle
BoundingCircle.prototype.check = function(relpos) {
    return this.radius * this.radius > relpos.lengthSq()
}

function CollisionEvent(item1, item2, event) {
    this.item1 = item1;
    this.item2 = item2;
    this.event = event;
}

CollisionEvent.prototype = new Object();

CollisionEvent.prototype.check = function() {
    var relpos = this.item1.pos.clone().subtract(this.item2.pos);
    if(this.item1.bbox.checkCollision(relpos, this.item2.bbox))
        this.event();
}

// A collision event is dead if one or the other entities is destroyed
CollisionEvent.prototype.dead = function() {
    return this.item1.isDestroyed() || this.item2.isDestroyed();
}

function CollisionGroup() {
    this.collisionEvents = [];
}

CollisionGroup.prototype = new Object();

CollisionGroup.prototype.checkCollisions = function() {
    // Check the collisions for which events exist
    for(var i = 0; i < this.collisionEvents.length; i++)
        this.collisionEvents[i].check();
}

CollisionGroup.prototype.clean = function() {
    // cleans out dead collision events
    for(var i = 0; i < this.collisionEvents.length; i++)
        if(this.collisionEvents[i].dead()) {
            this.collisionEvents.splice(i, 1);
            i--;
        }
}

CollisionGroup.prototype.addCollisionEvent = function(item1, item2, evt) {
    this.collisionEvents.push(new CollisionEvent(item1, item2, evt));
}

CollisionGroup.prototype.removeCollision = function(event) {
    // Not the fastest thing but this shouldn't happen too often
    for(var i = 0; i < this.collisionEvents.length; i++)
        if(this.collisionEvents[i] == event) {
            this.collisionEvents.splice(i, 1);
            break;
        }
}

