// by Mehdi Farahani
// SiahMshq based on the trained sound classification model


let song;
let fft;
let particles = [];
let maxRadius = 350;
let minRadius = 10;
let font;
let classifier;
let imgVocal, imgSetar;
let imgSize;

function preload() {
  song = loadSound('2.mp3');
  font = loadFont('MehrNastaliqWebRegular.ttf');
  classifier = ml5.soundClassifier('https://teachablemachine.withgoogle.com/models/oJbFZDRLu/model.json');
  imgVocal = loadImage('1.png');
  imgSetar = loadImage('2.png');
}

function setup() {
  createCanvas(800, 800);
  angleMode(DEGREES);
  rectMode(CENTER);
  fft = new p5.FFT();

  // Calculate image size based on the original dimensions of the images
  const maxSize = min(width, height) * 0.5; // Limit the size to half the canvas dimensions
  const imageSize = maxRadius * 2; // Adjust as needed
  const imageWidth = min(imageSize, imgVocal.width, imgSetar.width);
  const imageHeight = min(imageSize, imgVocal.height, imgSetar.height);
  imgSize = { width: imageWidth, height: imageHeight };

  // Start classifying audio
  classifyAudio();
}

function draw() {
  background(250);
  strokeWeight(2);
  stroke(255);
  noFill();

  translate(width / 2, height / 2);

  // Analyze the audio frequencies
  fft.analyze();
  const amp = fft.getEnergy(200, 200);

  const wave = fft.waveform();

  for (let t = -1; t <= 1; t += 2) {
    for (let i = 0; i <= 180; i++) {
      const index = floor(map(i, 0, 300, 0, wave.length - 1));
      const r = map(wave[index], -0, 0, minRadius, maxRadius);
      const x = r * sin(i) * t;
      const y = r * cos(i);
      point(x, y);
      vertex(x, y);
    }
  }

  const p = new Particle();
  particles.push(p);

  for (let i = particles.length - 1; i >= 0; i--) {
    if (!particles[i].edges()) {
      particles[i].update(amp > 220);
      particles[i].show();
    } else {
      particles.splice(i, 1);
    }
  }
}

function mouseClicked() {
  if (song.isPlaying()) {
    song.pause();
    noLoop();
  } else {
    song.play();
    loop();
  }
}

function classifyAudio() {
  classifier.classify(gotResults);
}

function gotResults(error, results) {
  if (error) {
    console.error(error);
    return;
  }

  const label = results[0].label;

  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].setImage(label);
  }

  classifyAudio(); // Continue classifying
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(random(1, 3));
    this.acc = createVector(0, 0);
    this.size = random(100, 13);
    this.c = color(random(255), random(255), random(255));
    this.direction = random([-1, 1]);
    this.image = null;
  }

  show() {
    noStroke();
    fill(this.c);
    textSize(40);
    textFont(font);
    textAlign(CENTER, CENTER);
    push();
    translate(this.pos.x, this.pos.y);
    rotate(45);
    imageMode(CENTER);
    if (this.image) {
      image(this.image, 0, 0, this.image.width, this.image.height); // Use original image size
    }
    pop();
  }

  update(condition) {
    this.vel.add(this.acc);
    this.pos.add(this.vel);

    if (condition) {
      this.pos.add(this.vel);
      this.pos.add(this.vel);
      this.pos.add(this.vel);
    }
  }

  edges() {
    if (
      (this.direction === -1 && (this.pos.x < -imgSize.width / 2 || this.pos.y > height + imgSize.height / 2)) ||
      (this.direction === 1 && (this.pos.x > width + imgSize.width / 2 || this.pos.y < -imgSize.height / 2))
    ) {
      return true;
    } else {
      return false;
    }
  }

  setImage(label) {
    if (label === 'Vocal') {
      this.image = imgVocal;
    } else if (label === 'Setar') {
      this.image = imgSetar;
    }
  }
}
