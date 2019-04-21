var canv = document.getElementById('myCanvas');
var ctx = canv.getContext('2d');
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
var particles = [];
var masses = [];
var particleSize = 1;
var massSize = 2;//how many px wide are masses
var minDistance = 6;//no force between if distance is less than
var resistance = .2;//not the right term...
var numParticles = 15000;//can handle ~20000 with no color change
var numMasses = 8;
var Mass = 1000;//random between 1 and
var bounceAmount = .75;//amount of velocity component to keep after bounce
var wrap = false;
var Vdrag = .995;//multiplier for components of velocity
var Adrag = 1.005;//"" for acceleration

function clear() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function next() {
  window.requestAnimationFrame(loop);
}

function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.prototype.add = function(vec) {
  this.x += vec.x;
  this.y += vec.y;
};

Vector.prototype.getMagnitude = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.getAngle = function() {
  return Math.atan2(this.y, this.x);//or atan(this.y/this.x)
};

Vector.prototype.checkBounds = function() {
  if(this.x > window.innerWidth) {  
    this.x -= window.innerWidth;
    return true;
  } else if(this.x < 0) {
    this.x += window.innerWidth;
    return true;
  } else if(this.y > window.innerHeight) {
    this.y -= window.innerHeight;
    return true;
  } else if(this.y < 0) {
    this.y += window.innerHeight;
    return true;
  } else {
    return false;
  }
};

Vector.prototype.scale = function(amount) {
  /*
  var magnitude = Math.sqrt(this.x*this.x + this.y*this.y);
  var angle = Math.atan2(this.y, this.x);
  magnitude *= amount;
  this.x = Math.cos(magnitude * angle);
  this.y = Math.sin(magnitude * angle);
  */
  this.x *= amount;
  this.y *= amount;
}

function Particle(mass, pos, vel, acc) {
  this.mass = mass || 1;
  this.position = pos || 0;
  this.velocity = vel || 0;
  this.netAcc = acc || 0;
}

//reflect velocity components
//also adjust position so it doesn't get stuck at the edge
Particle.prototype.bounce = function() {
  if(this.position.x > window.innerWidth) {
    this.velocity.x *= (-1 * bounceAmount);
    this.position.x = window.innerWidth;
  }
  if(this.position.x < 0) {
    this.velocity.x *= (-1 * bounceAmount);
    this.position.x = 0;
  }
  if(this.position.y > window.innerHeight) {
    this.velocity.y *= (-1 * bounceAmount);
    this.position.y = window.innerHeight;
  }
  if(this.position.y < 0) {
    this.velocity.y *= (-1 * bounceAmount); 
    this.position.y = 0;
  }
};

//particles = [new Particle(1, new Vector(300, 150), new Vector(0,.2)), new Particle(5, new Vector(500, 200), new Vector(0,0))];

function makeParticles(number) {
  var mass = 1;
  for(var i = 0; i < number; i++) {
    //if(i%200==0) mass = 70;
    //if(i==499) mass = 100;
    //else mass = 1;
    var signX = Math.random();
    if(signX < .5) signX = -.1;
    else signX = .1;
    var signY = Math.random();
    if(signY < .5) signY = -.1;
    else signY = .1;
    particles.push(new Particle(mass, new Vector(Math.random()*window.innerWidth, Math.random()*window.innerHeight), new Vector(0,0)));//(Math.random()*signX, Math.random()*signY)));
  }
}

function makeMasses(number, mass) {
  for(var i = 0; i < number; i++) {
    masses.push(new Particle(mass*Math.random(), new Vector(Math.random()*window.innerWidth, Math.random()*window.innerHeight), new Vector(Math.random()*.1,Math.random()*.2)));
  }
}

//get center of mass for particles except the one at [index]
//(not really used for anything)
function getCOM() {
  var comX=0, comY=0, tempX=0, tempY=0;
  var totalMass = 0;
  for(i = 0; i < particles.length; i++) {
    //if(i == index) continue;
    tempX += (particles[i].mass * particles[i].position.x);
    tempY += (particles[i].mass * particles[i].position.y);
    totalMass += particles[i].mass;
  }
  comX = tempX / totalMass;
  comY = tempY / totalMass;
  return new Particle(0, new Vector(comX, comY));//have center of mass be massless particle
}

//calculate next position of particles
function calculateNext() {
  //console.log(centerOfMass);
  var force = 0, acc = 0, tempX=0, tempY=0;
  var accArr = [];
  for(var i = 0; i < particles.length; i++) {
    //get acceleration vector between this particle and all the masses
    //push each of those vectors to an array
    for(var j = 0; j < masses.length; j++) {
      if(i == j) continue;//don't compare to itself
      var distance = new Vector(masses[j].position.x - particles[i].position.x, masses[j].position.y - particles[i].position.y);
      if(distance.getMagnitude() < minDistance) continue;
      force = resistance * (particles[i].mass * masses[j].mass) / Math.pow(distance.getMagnitude(), 2);
      acc = force / particles[i].mass;//subtract a small amount from the acc force
      var tempVector = new Vector(acc * Math.cos(distance.getAngle()), acc * Math.sin(distance.getAngle()));
      accArr.push(tempVector);
    }
    var accVec = new Vector(0,0);
    accArr.forEach(function(f) {
      accVec.add(f);
    });
    accVec.scale(Adrag);
    particles[i].velocity.add(accVec);//units aren't important, are they? [a(m/s^2)*t(s) -> v(m/s) if t=1]
    
    //???
    //particles[i].velocity.scale(Vdrag);
    particles[i].velocity.scale(particles[i].velocity.getMagnitude()/Math.pow(particles[i].velocity.getMagnitude(),1.01));
    //and next frame's position
    particles[i].position.add(particles[i].velocity);
    //if wrap is off, delete particle if it's out of bounds
    //if(particles[i].position.checkBounds()) {//if particle moved out of bounds
    //  if(!wrap) particles.splice(i, 1);
    // }
    accArr = [];
    particles[i].bounce();
  }  
}

//calculate next positiom for masses
//masses all interact
function calculateNextM() {
  //console.log(centerOfMass);
  var force = 0, acc = 0, tempX=0, tempY=0;
  var accArr = [];
  for(var i = 0; i < masses.length; i++) {
    //get acceleration vector between this particle and all the masses
    //push each of those vectors to an array
    for(var j = 0; j < masses.length; j++) {
      if(i == j) continue;//don't compare to itself
      var distance = new Vector(masses[j].position.x - masses[i].position.x, masses[j].position.y - masses[i].position.y);
      if(distance.getMagnitude() < minDistance) continue;
      force = resistance*(masses[i].mass * masses[j].mass) / Math.pow(distance.getMagnitude(), 2);
      acc = force / masses[i].mass;
      var tempVector = new Vector(acc * Math.cos(distance.getAngle()), acc * Math.sin(distance.getAngle()));
      accArr.push(tempVector);
    }
    var accVec = new Vector(0,0);
    accArr.forEach(function(f) {
      accVec.add(f);
    });
    accVec.scale(Adrag);
    //store acceleration vector for each particle
    //update position in next loop
    masses[i].netAcc = accVec;
    
    accArr = [];
  }  
  //update position
  for(var i = 0; i < masses.length; i++) {
    masses[i].velocity.add(masses[i].netAcc);//units aren't important, are they? [a(m/s^2)*t(s) -> v(m/s) if t=1]
    masses[i].velocity.scale(Vdrag);
    
    //and next frame's position
    masses[i].position.add(masses[i].velocity);
    //masses[i].position.checkBounds();
    masses[i].bounce();
  }
}

function drawParticles() {
  //show center of mass
  var centerOfMass = getCOM();
  ctx.fillStyle = 'rgb(0, 255, 0)';
  ctx.fillRect(centerOfMass.position.x, centerOfMass.position.y, particleSize, particleSize);
  var position;
  var posMass;
  var velocity = 0;
  for(var i = 0; i < particles.length; i++) {
    //if(particles[i].mass == 1) ctx.fillStyle = 'rgb(0, 200, 255)';
    //else ctx.fillStyle = 'rgb(255, 0, 0)';
    velocity = Math.round(particles[i].velocity.getMagnitude()*100);
    ctx.fillStyle = 'rgb('+velocity+', '+velocity*2+', 255)';
    
    //ctx.fillStyle = 'rgb(0, 200, 255)';
    position = particles[i].position;
    ctx.fillRect(position.x, position.y, particleSize, particleSize);
  }
  for(var i = 0; i < masses.length; i++) {
    ctx.fillStyle = 'rgb(255, 0, 0)';
    position = masses[i].position;
    ctx.fillRect(position.x, position.y, massSize, massSize);
  }
}

//place particles & masses at random
makeMasses(numMasses, Mass);
makeParticles(numParticles);

function loop() {
  clear();
  calculateNext();
  calculateNextM();
  drawParticles();
  next();
}

//console.log(particles);
loop();
