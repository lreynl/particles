//All particles are attracted to all others.
//Particle' momentum combines when they collide
//(when within a minimum distance)
var canv = document.getElementById('myCanvas');
var ctx = canv.getContext('2d');
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
var particles = [];
var particleSize = 2;
var timeRate = 1;
var minDistance = 3;//no interaction if less than
var resistance = .1;
var maxParticles = 700;
var mergeDist = .5;
var bounceAmount = .5//amount of vector component to keep after bounce

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

//note: forces don't wrap!
Vector.prototype.checkBounds = function() {
  if(this.x > window.innerWidth) this.x -= window.innerWidth;
  if(this.x < 0) this.x += window.innerWidth;
  if(this.y > window.innerHeight) this.y -= window.innerHeight;
  if(this.y < 0) this.y += window.innerHeight;
};

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

function Particle(mass, pos, vel, acc) {
  this.mass = mass || 1;
  this.position = pos || 0;
  this.velocity = vel || 0;
  this.netAcc = acc || 0;
}

//merge passed in particle with current one
//(m_1o*v_1o+m_2o*v_2o)/m_f = v_f
Particle.prototype.mergeParticles = function(part) {
  //average positions
  this.position.x = (this.position.x + part.position.x) / 2;
  this.position.y = (this.position.y + part.position.y) / 2;

  //momentum of this particle
  var momThis = this.mass * this.velocity.getMagnitude();
  var momThisAngle = this.velocity.getAngle();
  var momThisX = momThis * Math.cos(momThisAngle);
  var momThisY = momThis * Math.sin(momThisAngle);
  
  this.mass += part.mass;
  
  //momentum of passed in particle
  var momPart = part.mass * part.velocity.getMagnitude();
  var momPartAngle = part.velocity.getAngle();
  var momPartX = momPart * Math.cos(momPartAngle);
  var momPartY = momPart * Math.sin(momPartAngle);
  
  //add momentum vectors and divide by new mass
  var momTemp = new Vector(momThisX + momPartX, momThisY + momPartY);
  var momTempMag = momTemp.getMagnitude();
  var momTempAngle = momTemp.getAngle();
  var finalVelX = (1/this.mass) * momTempMag * Math.cos(momTempAngle);
  var finalVelY = (1/this.mass) * momTempMag * Math.sin(momTempAngle);
  
  this.velocity.x = finalVelX;
  this.velocity.y = finalVelY;
};

//particles = [new Particle(1, new Vector(300, 300), new Vector(0,0)),
//             new Particle(1, new Vector(320, 300), new Vector(0,0))];

function makeParticles(number) {
  var mass = 1;
  for(var i = 0; i < number; i++) {
    if(i%100==0) mass = Math.random()*100;
    //if(i==499) mass = 100;
    else mass = 1;
    particles.push(new Particle(mass, new Vector(Math.random() * window.innerWidth, Math.random() * window.innerHeight), new Vector(0,0)));
  }
}

//get center of mass for particles except the one at [index]
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


function calculateNext() {
  //console.log(centerOfMass);
  var force = 0, acc = 0, tempX=0, tempY=0;
  var accArr = [];
  for(var i = 0; i < particles.length; i++) {
    //get acceleration vector between this particle and all the others
    //push each of those vectors to an array
    for(var j = 0; j < particles.length; j++) {
      if(i == j) continue;//don't compare to itself
      var distance = new Vector(particles[j].position.x - particles[i].position.x, particles[j].position.y - particles[i].position.y);
      if(distance.getMagnitude() < mergeDist) {
        particles[i].mergeParticles(particles[j]);//merge particle at j with one at i
        particles.splice(j, 1);//delete particle at j
        j--;//since it just deleted the particle at j, make sure to compare the new one at j
        continue;
      }
      if(distance.getMagnitude() < minDistance) continue;
      force = resistance*(particles[i].mass * particles[j].mass) / Math.pow(distance.getMagnitude(), 2);
      acc = force / particles[i].mass;
      var tempVector = new Vector(acc * Math.cos(distance.getAngle()), acc * Math.sin(distance.getAngle()));
      accArr.push(tempVector);
    }
    var accVec = new Vector(0,0);
    accArr.forEach(function(f) {
      accVec.add(f);
    });
    particles[i].netAcc = accVec;//only store each particle's net acceleration; update each in next loop

    accArr = [];
  }
  
  //now loop again to update positions
  for(var i = 0; i < particles.length; i++) {
    particles[i].velocity.add(particles[i].netAcc);//units aren't important, are they? [a(m/s^2)*t(s) -> v(m/s) if t=1]
    particles[i].position.add(particles[i].velocity);
    //particles[i].position.checkBounds();    
    particles[i].bounce();
  }
}

function drawParticles() {
  //show center of mass
  var centerOfMass = getCOM();
  ctx.fillStyle = 'rgb(0, 255, 0)';
  ctx.fillRect(centerOfMass.position.x, centerOfMass.position.y, particleSize, particleSize);
  
  //var position;
  for(var i = 0; i < particles.length; i++) {
    if(particles[i].mass == 1) ctx.fillStyle = 'rgb(0, 200, 255)';
    else ctx.fillStyle = 'rgb(255, 0, 0)';
    var position = particles[i].position;
    ctx.fillRect(position.x, position.y, particleSize, particleSize);
  }
    //var temp = getCOM();
    //ctx.fillStyle = 'rgb(0, 255, 0)';
    //ctx.fillRect(temp.position.x, temp.position.y, particleSize, particleSize);
}

makeParticles(maxParticles);
function loop() {
  clear();
  calculateNext();
  drawParticles();
  next();
}

//console.log(particles);
loop();


