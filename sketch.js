// Visual variables
let layers = [];
let numLayers = 10;
let numGrains = 100;
let gravity;
let t = 0; // Time variable for evolving patterns
let particleSystem;

// Audio variables
let audioInitialized = false;
let scale = []; // Will hold our current scale notes as frequencies
let rootFrequency = 261.63; // C3 in Hz
let scaleType = "minor"; // Can be "minor" or "pentatonic"
let lastNoteTime = 0;
let noteSpacing = 200; // Minimum ms between notes
let grainActivityLevel = 0; // Track visual activity

// Scale definitions (intervals in semitones)
const scales = {
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  pentatonic: [0, 3, 5, 7, 10, 12, 15, 17]
};

// Root note frequencies to cycle through (in Hz)
const possibleRoots = [
  261.63, // C3
  293.66, // D3
  329.63, // E3
  349.23, // F3
  392.00, // G3
  440.00, // A3
  493.88  // B3
];

// Tone.js instruments
let melodySynth;
let harmonySynth;
let bassSynth;
let masterReverb;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Initialize visual elements with different colors for better flocking visibility
  for (let i = 0; i < numLayers; i++) {
    // More distinct colors for each layer
    let hue = map(i, 0, numLayers-1, 20, 60);
    let sat = map(i, 0, numLayers-1, 40, 70); 
    let bri = map(i, 0, numLayers-1, 50, 80);
    let sandColor = color(hue, sat, bri);
    let sandTexture = random(0.003, 0.041); // Slightly lower texture values for smoother flow
    layers.push(new SandLayer(sandColor, sandTexture));
  }
  
  gravity = createVector(0, 0);
  particleSystem = new ParticleSystem();
  
  // Initialize with some particles
  initializeParticles();
  
  // Prepare for audio initialization on user interaction
  updateScale();
  
  // Show message to click for audio
  textAlign(CENTER, CENTER);
  textSize(24);
  fill(255);
  text("Click to enable audio", width/2, height/2);
}

// Initialize particles with some interesting patterns
function initializeParticles() {
  // Create initial particle pattern
  
  // 1. Center burst
  const centerBurst = 15;
  for (let i = 0; i < centerBurst; i++) {
    const angle = map(i, 0, centerBurst, 0, TWO_PI);
    const radius = random(50, 100);
    const x = width/2 + cos(angle) * radius;
    const y = height/2 + sin(angle) * radius;
    
    // Create particles with color based on position
    const hue = map(angle, 0, TWO_PI, 0, 360);
    particleSystem.addParticle(x, y, color(hue, 80, 90, 200));
  }
  
  // 2. Create a few attractors at interesting positions
  const attractorCount = 3;
  for (let i = 0; i < attractorCount; i++) {
    const x = width * (0.2 + 0.6 * (i / (attractorCount - 1)));
    const y = height * 0.5 + random(-height * 0.3, height * 0.3);
    
    if (random() < 0.7) {
      // Create a particle emitter
      particleSystem.createEmitter(x, y);
    }
  }
  
  // 3. Create some particles at the edges
  const edgeCount = 10;
  for (let i = 0; i < edgeCount; i++) {
    // Choose a random edge
    let x, y;
    const edge = floor(random(4));
    
    switch (edge) {
      case 0: // Top
        x = random(width);
        y = random(10, 50);
        break;
      case 1: // Right
        x = width - random(10, 50);
        y = random(height);
        break;
      case 2: // Bottom
        x = random(width);
        y = height - random(10, 50);
        break;
      case 3: // Left
        x = random(10, 50);
        y = random(height);
        break;
    }
    
    // Create edge particles with cool colors
    let hue = map(edge, 0, 3, 180, 360);
    particleSystem.addParticle(x, y, color(hue, 70, 90, 180));
  }
}

function draw() {
  t += 0.05; // Increment time for evolving patterns
  updateGravity();
  drawGradientBackground();
  
  // Reset grain activity level
  grainActivityLevel = 0;
  
  for (let i = 0; i < numLayers; i++) {
    grainActivityLevel += layers[i].drawLayer() / numLayers;
  }
  
  // Run particle system with the current grain activity level
  particleSystem.run(grainActivityLevel);
  
  // Audio logic
  if (audioInitialized) {
    // Smooth the grain activity level for more stable audio
    grainActivityLevel = lerp(grainActivityLevel, constrain(grainActivityLevel, 0.1, 0.9), 0.05);
    
    // Root note changes - infrequent to prevent overlapping transitions
    if ((frameCount % 360 === 0) || 
        (gravity.mag() > 0.09 && frameCount % 120 === 0)) {
      changeRootNote();
      
      // Create an attractor at a position based on the new root note
      if (random() < 0.7) {
        const rootFreqNormalized = map(rootFrequency, possibleRoots[0], possibleRoots[possibleRoots.length-1], 0, 1);
        
        const attractorX = map(rootFreqNormalized, 0, 1, width * 0.2, width * 0.8);
        const attractorY = map(rootFreqNormalized, 0, 1, height * 0.2, height * 0.8);
        
        // Create a new attractor or update an existing one
        if (particleSystem.attractors.length < 5) {
          particleSystem.attractors.push({
            pos: createVector(attractorX, attractorY),
            strength: random(0.1, 0.4) * (random() < 0.5 ? -1 : 1),
            radius: random(100, 300),
            moving: random() < 0.3,
            velocity: p5.Vector.random2D().mult(random(0.5, 1.5))
          });
        } else {
          // Update a random attractor
          const idx = floor(random(particleSystem.attractors.length));
          particleSystem.attractors[idx].pos = createVector(attractorX, attractorY);
          particleSystem.attractors[idx].strength = random(0.1, 0.4) * (random() < 0.5 ? -1 : 1);
        }
      }
    }
    
    // Musical phrases with 4/4 time signature
    const timeSignature = 4;
    const beatLength = 60; // frames per beat at ~60bpm
    
    // Play notes on specific beats to create coherent phrases
    if (frameCount % beatLength === 0) {
      // Mainly on downbeats (first beat of measure)
      if (frameCount % (beatLength * timeSignature) === 0) {
        if (random() < 0.7) {
          const velocity = map(grainActivityLevel, 0, 1, 0.2, 0.4);
          setTimeout(() => playNote(velocity), random(30, 100));
          
          // Add burst of particles on downbeat (first beat)
          const burstX = width/2 + random(-width/4, width/4);
          const burstY = height/2 + random(-height/4, height/4);
          particleSystem.addParticlesOnBeat(burstX, burstY, floor(random(5, 15)), 
            color(random(200, 255), random(200, 255), random(200, 255), 200));
        }
      }
      // Sometimes on beat 3
      else if (frameCount % (beatLength * timeSignature) === beatLength * 2) {
        if (random() < 0.4) {
          const velocity = map(grainActivityLevel, 0, 1, 0.15, 0.35);
          setTimeout(() => playNote(velocity), random(20, 80));
          
          // Smaller burst on beat 3
          if (random() < 0.5) {
            const burstX = width/2 + random(-width/4, width/4);
            const burstY = height/2 + random(-height/4, height/4);
            particleSystem.addParticlesOnBeat(burstX, burstY, floor(random(3, 8)), 
              color(random(100, 200), random(100, 200), random(200, 255), 180));
          }
        }
      }
      // Rarely on other beats
      else if (random() < 0.15) {
        const velocity = map(grainActivityLevel, 0, 1, 0.1, 0.3);
        setTimeout(() => playNote(velocity), random(10, 50));
      }
    }
    
    // Occasional notes based on particle activity
    if (particleSystem.particles.length > 0 && frameCount % 30 === 0) {
      const noteProb = map(particleSystem.particles.length, 0, 50, 0.03, 0.1);
      if (random() < noteProb) {
        const velocity = map(grainActivityLevel, 0, 1, 0.15, 0.3);
        setTimeout(() => playNote(velocity), random(100, 200));
        
        // Visualize this audio-particle connection with lines
        if (random() < 0.3 && particleSystem.particles.length > 5) {
          // Connect random particles with lines when audio is triggered by particles
          strokeWeight(1);
          stroke(255, 50);
          for (let i = 0; i < min(8, particleSystem.particles.length); i++) {
            const p1 = particleSystem.particles[floor(random(particleSystem.particles.length))];
            const p2 = particleSystem.particles[floor(random(particleSystem.particles.length))];
            line(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y);
          }
        }
      }
    }
    
    // Adjust note spacing based on activity
    noteSpacing = map(grainActivityLevel, 0, 1, 800, 250);
  } else {
    // Show message to click if audio isn't initialized
    textAlign(CENTER, CENTER);
    textSize(24);
    fill(255);
    text("Click to enable audio", width/2, height/2);
  }
  
  // Dynamically adjust max particles based on performance
  if (frameRate() < 30 && particleSystem.maxParticles > 50) {
    particleSystem.maxParticles -= 5;
  } else if (frameRate() > 50 && particleSystem.maxParticles < 150) {
    particleSystem.maxParticles += 1;
  }
}

// Update gravity based on noise
function updateGravity() {
  // Smoother, more gradual gravity changes
  let angle = noise(t * 0.3) * TWO_PI; // Slower change in direction
  let magnitude = noise(t * 0.2 + 10) * 0.05; // Reduced force
  gravity = p5.Vector.fromAngle(angle).mult(magnitude);
}

// Draw gradient background
function drawGradientBackground() {
  let color1 = color(40 + 10 * sin(t), 10, 90);
  let color2 = color(100 + 20 * cos(t), 20, 140);
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color1, color2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}

// Mouse click handler to initialize audio
function mousePressed() {
  if (!audioInitialized) {
    initAudio();
  }
}

// Mouse dragged function to add interactivity
function mouseDragged() {
  // Create particles while dragging
  if (frameCount % 3 === 0) {
    // Create particles with color based on position and time
    const hue = (frameCount * 2) % 360;
    particleSystem.addParticle(mouseX, mouseY, color(hue, 80, 90, 200));
    
    // Occasionally play a note based on mouse position
    if (random() < 0.05 && audioInitialized) {
      // Map mouse position to note index
      const noteIdx = floor(map(mouseX, 0, width, 0, scale.length - 1));
      const velocity = map(abs(movedX) + abs(movedY), 0, 50, 0.1, 0.3);
      
      // Get frequency for custom note
      const noteFreq = Tone.Frequency(scale[noteIdx], "hz");
      
      // Play a short note
      melodySynth.triggerAttackRelease(noteFreq, "16n", Tone.now(), velocity * 0.8);
    }
  }
  
  // Force update for instant feedback
  return false;
}

// Key pressed function for interaction
function keyPressed() {
  if (!audioInitialized) return false;

  if (key === ' ') {
    // Space bar creates a big burst of particles
    const burstCount = 20;
    for (let i = 0; i < burstCount; i++) {
      const angle = random(TWO_PI);
      const radius = random(50, 150);
      const x = width/2 + cos(angle) * radius;
      const y = height/2 + sin(angle) * radius;
      
      // Color based on angle
      const hue = map(angle, 0, TWO_PI, 0, 360);
      particleSystem.addParticle(x, y, color(hue, 80, 90, 200));
    }
    
    // Play a chord with Tone.js
    playChord();
  } else if (key === 'c' || key === 'C') {
    // Clear all particles
    particleSystem.particles = [];
  } else if (key === 'a' || key === 'A') {
    // Add a new attractor at mouse position
    if (particleSystem.attractors.length < 6) {
      particleSystem.attractors.push({
        pos: createVector(mouseX, mouseY),
        strength: random(0.1, 0.4) * (random() < 0.5 ? -1 : 1),
        radius: random(100, 300),
        moving: random() < 0.5,
        velocity: p5.Vector.random2D().mult(random(0.5, 1.5))
      });
    }
  }
  
  return false; // Prevent default behavior
}

// Touch handler for mobile devices
function touchStarted() {
  if (!audioInitialized) {
    initAudio();
    return false;
  }
}

// Window resize handler
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Initialize Tone.js audio system
// Initialize Tone.js audio system - fixed version
function initAudio() {
  if (audioInitialized) return;
  
  try {
    // Start audio context - this needs to be triggered by user interaction
    Tone.start().then(() => {
      console.log("Tone.js started");
      
      // Set initial volume to prevent any startup clicks
      Tone.getDestination().volume.value = -Infinity;
      
      // Create our scale before initializing instruments
      updateScale();
      
      // Add a slight delay before setting up instruments to ensure context is running
      setTimeout(() => {
        setupAudioComponents();
      }, 100);
    }).catch(e => {
      console.error("Could not start Tone.js:", e);
    });
  } catch (e) {
    console.error("Error initializing audio:", e);
  }
}

// Separate function to set up audio components after context is ready
function setupAudioComponents() {
  try {
    // Set up master effects
    masterReverb = new Tone.Reverb({
      decay: 3,
      wet: 0.5, // Slightly lower reverb amount
      preDelay: 0.05
    });
    
    // Create a limiter for preventing clipping
    const limiter = new Tone.Limiter(-2);
    
    // Create a compressor for smoother dynamics
    const compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 3,
      attack: 0.01,
      release: 0.1
    });
    
    // Connect effects chain
    compressor.connect(limiter);
    limiter.connect(masterReverb);
    masterReverb.toDestination();
    
    // Melody synth - clean sine
    melodySynth = new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.6,
        release: 0.8
      }
    }).connect(compressor);
    melodySynth.volume.value = -6;
    
    // Harmony synth - slightly different timbre
    harmonySynth = new Tone.Synth({
      oscillator: {
        type: 'sine',
        partials: [1, 0.5, 0.3]
      },
      envelope: {
        attack: 0.1,
        decay: 0.3,
        sustain: 0.5,
        release: 1.0
      }
    }).connect(compressor);
    harmonySynth.volume.value = -10; // Lower volume for harmony
    
    // Bass synth - fat and warm
    bassSynth = new Tone.Synth({
      oscillator: {
        type: 'sine',
        partials: [1, 0.3, 0.1]
      },
      envelope: {
        attack: 0.08,
        decay: 0.3,
        sustain: 0.7,
        release: 1.2
      }
    }).connect(compressor);
    bassSynth.volume.value = -7; // Bass slightly quieter
    
    // Gradually fade in the master volume to prevent initial clicks
    Tone.getDestination().volume.value = -40;
    Tone.getDestination().volume.rampTo(-15, 1);
    
    console.log("Audio components initialized successfully");
    audioInitialized = true;
  } catch (e) {
    console.error("Error setting up audio components:", e);
  }
}

// Update the musical scale based on root and type
function updateScale() {
  scale = [];
  
  try {
    for (let i = 0; i < scales[scaleType].length; i++) {
      // Calculate equal temperament frequency
      const freq = rootFrequency * Math.pow(2, scales[scaleType][i] / 12);
      scale.push(freq);
    }
  } catch (e) {
    console.error("Error updating scale:", e);
    // Fallback to a simple scale
    scale = [
      rootFrequency,
      rootFrequency * 1.125,
      rootFrequency * 1.25,
      rootFrequency * 1.333,
      rootFrequency * 1.5,
      rootFrequency * 1.667,
      rootFrequency * 1.875,
      rootFrequency * 2
    ];
  }
}

// Play a single note using Tone.js
// Play a single note using Tone.js - with error fixes
function playNote(velocity = 0.5) {
  if (!audioInitialized) return;
  
  const now = millis();
  
  // Ensure enough spacing between notes
  if (now - lastNoteTime < noteSpacing) return;
  lastNoteTime = now;
  
  try {
    // Choose note from scale with musical probabilities
    let noteIndex;
    const r = random();
    if (r < 0.25) {
      noteIndex = 0; // Root
    } else if (r < 0.4) {
      noteIndex = 4; // Fifth
    } else if (r < 0.55) {
      noteIndex = 2; // Third
    } else if (r < 0.7) {
      noteIndex = 5; // Sixth
    } else {
      // Other scale tones occasionally
      const options = [1, 3, 6, 7];
      noteIndex = options[Math.floor(random(options.length))];
    }
    
    // Make sure we have a valid scale and index
    if (!scale || scale.length === 0) {
      console.error("Scale is not properly initialized");
      return;
    }
    
    // Constrain note index to valid range
    noteIndex = constrain(noteIndex, 0, scale.length - 1);
    
    // Get frequency for the note
    const freq = scale[noteIndex];
    
    // Visual feedback - notify particle system
    if (particleSystem) {
      particleSystem.notifyNote(freq, velocity);
    }
    
    // Ensure we're in valid range
    velocity = constrain(velocity, 0.1, 0.6);
    
    // Use fixed duration strings instead of dynamically calculated ones
    // This avoids potential timing issues in Tone.js
    let noteDuration = "8n"; // Default to eighth note
    if (grainActivityLevel < 0.3) {
      noteDuration = "4n"; // Quarter note for slower activity
    } else if (grainActivityLevel > 0.7) {
      noteDuration = "16n"; // Sixteenth note for faster activity
    }
    
    // Check if synths exist before trying to use them
    if (melodySynth) {
      // Play melody note with fixed time reference
      melodySynth.triggerAttackRelease(
        freq, 
        noteDuration, 
        undefined, // Let Tone.js use "now"
        velocity
      );
    }
    
    // Sometimes add harmony
    if (random() < 0.3 && harmonySynth) {
      // Choose harmonic interval
      let harmonyOffset;
      if (scaleType === "minor") {
        const options = [2, 5, 7]; // third, sixth, octave
        harmonyOffset = options[Math.floor(random(options.length))];
      } else {
        const options = [2, 4, 7]; // pentatonic options
        harmonyOffset = options[Math.floor(random(options.length))];
      }
      
      const harmonyIndex = (noteIndex + harmonyOffset) % scale.length;
      const harmonyFreq = scale[harmonyIndex];
      
      // Add a slight delay using setTimeout instead of Tone.js timing
      setTimeout(() => {
        harmonySynth.triggerAttackRelease(
          harmonyFreq, 
          noteDuration, 
          undefined, // Let Tone.js use "now"
          velocity * 0.7 // Lower velocity for harmony
        );
      }, 30); // 30ms delay
    }
    
    // Occasionally add bass
    if (random() < 0.15 && bassSynth) {
      // Use root or fifth for bass
      const bassOptions = [0, 4];
      const bassIndex = bassOptions[Math.floor(random(bassOptions.length))];
      
      // Check if we have a valid bassIndex
      if (bassIndex < scale.length) {
        const bassFreq = scale[bassIndex] * 0.5; // Octave lower
        
        // Add a slight delay for bass
        setTimeout(() => {
          bassSynth.triggerAttackRelease(
            bassFreq, 
            noteDuration, 
            undefined, // Let Tone.js use "now"
            velocity * 0.8 // Slightly lower velocity for bass
          );
        }, 20); // 20ms delay
      }
    }
    
    // Create visual feedback for the note
    if (velocity > 0.15) {
      // Map note to screen position
      const xPos = map(noteIndex, 0, scale.length - 1, width * 0.2, width * 0.8);
      const yPos = map(freq, scale[0], scale[scale.length-1], height * 0.8, height * 0.2);
      
      // Create particles at this position
      const particleCount = floor(map(velocity, 0.15, 0.5, 2, 10));
      const hue = map(noteIndex, 0, scale.length - 1, 0, 360);
      const noteColor = color(hue, 80, 90, 200);
      
      particleSystem.addParticlesOnBeat(xPos, yPos, particleCount, noteColor);
    }
  } catch (e) {
    console.error("Error playing note:", e);
  }
}

// Change the root note of the scale
function changeRootNote() {
  if (!audioInitialized) return;
  
  try {
    // Store previous root
    const previousRoot = rootFrequency;
    
    // Use circle of fifths for musical transitions
    const circleOfFifths = [
      possibleRoots[0], // C
      possibleRoots[4], // G
      possibleRoots[5], // A
      possibleRoots[2], // E
      possibleRoots[6], // B
      possibleRoots[1], // D
      possibleRoots[3]  // F
    ];
    
    // Select new root based on gravity direction
    const idx = Math.floor(map(gravity.heading(), -PI, PI, 0, circleOfFifths.length));
    rootFrequency = circleOfFifths[idx % circleOfFifths.length];
    
    // Choose scale type based on particles
    const previousScaleType = scaleType;
    scaleType = (particleSystem.particles.length > 30) ? "pentatonic" : "minor";
    
    // Only update if something changed
    if (previousRoot !== rootFrequency || previousScaleType !== scaleType) {
      updateScale();
      
      // Play a smooth chord transition to signal key change
      playTransitionChord(previousRoot);
    }
  } catch (e) {
    console.error("Error changing root note:", e);
  }
}

// Play a chord when the spacebar is pressed
// Play a chord when the spacebar is pressed - fixed version
function playChord() {
  if (!audioInitialized || !melodySynth || !harmonySynth || !bassSynth) return;
  
  try {
    // Check if scale is valid
    if (!scale || scale.length < 5) {
      console.error("Scale not properly initialized for chord");
      return;
    }
    
    // Play root with fixed timing
    melodySynth.triggerAttackRelease(scale[0], "2n");
    
    // Add third after slight delay
    setTimeout(() => {
      if (harmonySynth) {
        harmonySynth.triggerAttackRelease(scale[2], "2n", undefined, 0.7);
      }
    }, 50);
    
    // Add fifth after another slight delay
    setTimeout(() => {
      if (harmonySynth) {
        harmonySynth.triggerAttackRelease(scale[4], "2n", undefined, 0.6);
      }
    }, 100);
    
    // Add bass note
    if (bassSynth) {
      setTimeout(() => {
        bassSynth.triggerAttackRelease(scale[0] * 0.5, "2n", undefined, 0.8);
      }, 20);
    }
  } catch (e) {
    console.error("Error playing chord:", e);
  }
}

// Play a smooth transition chord when changing root note - fixed version
function playTransitionChord(previousRoot) {
  if (!audioInitialized || !melodySynth || !harmonySynth || !bassSynth) return;
  
  try {
    // Check for valid inputs
    if (!previousRoot || !rootFrequency || !scale || scale.length < 5) {
      console.error("Invalid inputs for transition chord");
      return;
    }
    
    // Calculate old fifth frequency
    const oldFifth = previousRoot * 1.5;
    
    // First play a chord with the old fifth and new root
    setTimeout(() => {
      if (bassSynth) {
        bassSynth.triggerAttackRelease(rootFrequency * 0.5, "2n", undefined, 0.6);
      }
    }, 10);
    
    // Melody plays old fifth
    setTimeout(() => {
      if (melodySynth) {
        melodySynth.triggerAttackRelease(oldFifth, "4n", undefined, 0.5);
      }
    }, 50);
    
    // Harmony plays new root
    setTimeout(() => {
      if (harmonySynth) {
        harmonySynth.triggerAttackRelease(rootFrequency, "2n", undefined, 0.4);
      }
    }, 100);
    
    // Then transition to new chord with delay
    setTimeout(() => {
      // Play root
      if (melodySynth) {
        melodySynth.triggerAttackRelease(scale[0], "2n", undefined, 0.6);
      }
      
      // Play fifth
      setTimeout(() => {
        if (harmonySynth) {
          harmonySynth.triggerAttackRelease(scale[4], "2n", undefined, 0.5);
        }
      }, 100);
      
      // Play third with longer delay
      setTimeout(() => {
        if (harmonySynth) {
          harmonySynth.triggerAttackRelease(scale[2], "2n", undefined, 0.4);
        }
      }, 400);
    }, 800);
  } catch (e) {
    console.error("Error playing transition chord:", e);
  }
}

// Play a smooth transition chord when changing root note
function playTransitionChord(previousRoot) {
  if (!audioInitialized) return;
  
  try {
    const now = Tone.now();
    
    // Calculate old fifth frequency
    const oldFifth = previousRoot * 1.5;
    
    // First play a chord with the old fifth and new root
    bassSynth.triggerAttackRelease(Tone.Frequency(rootFrequency * 0.5, "hz"), "2n", now, 0.5);
    
    // Melody plays old fifth
    melodySynth.triggerAttackRelease(Tone.Frequency(oldFifth, "hz"), "4n", now, 0.4);
    
    // Harmony plays new root
    harmonySynth.triggerAttackRelease(Tone.Frequency(rootFrequency, "hz"), "2n", now + 0.05, 0.3);
    
    // Then transition to new chord with delay
    setTimeout(() => {
      // Play root
      melodySynth.triggerAttackRelease(Tone.Frequency(scale[0], "hz"), "2n", now + 1, 0.5);
      
      // Play fifth
      harmonySynth.triggerAttackRelease(Tone.Frequency(scale[4], "hz"), "2n", now + 1.1, 0.4);
      
      // Play third with longer delay
      setTimeout(() => {
        harmonySynth.triggerAttackRelease(Tone.Frequency(scale[2], "hz"), "2n", now + 1.5, 0.3);
      }, 400);
    }, 800);
  } catch (e) {
    console.error("Error playing transition chord:", e);
  }
}


// Sand layer class
class SandLayer {
  constructor(sandColor, sandTexture) {
    this.color = sandColor;
    this.texture = sandTexture;
    this.grains = [];
    
    // Create the grains with reference to this layer
    for (let i = 0; i < numGrains; i++) {
      this.grains.push(new SandGrain(random(width), random(height), this.color, sandTexture, this));
    }
  }
  
  drawLayer() {
    let activity = 0;
    
    for (let grain of this.grains) {
      grain.applyForce(gravity);
      grain.update();
      grain.display();
      
      // Track grain activity for audio
      activity += grain.vel.mag() / 1000;
      
      // Add particles occasionally
      if (random() < 0.001) {
        let particleColor = lerpColor(this.color, color(0, 0, 100), 0.5 + 0.5 * sin(t));
        particleSystem.addParticle(grain.pos.x, grain.pos.y, particleColor);
        
        // Sometimes play note on particle creation
        if (random() < 0.1 && audioInitialized) {
          // Lower velocity for particle-triggered notes
          const velocity = map(grain.vel.mag(), 0, 1, 0.08, 0.25);
          
          // Significant delay to prevent overlap
          setTimeout(() => {
            if (audioInitialized) {
              // Check spacing again before playing
              const now = millis();
              if (now - lastNoteTime > noteSpacing * 1.5) {
                playNote(velocity);
              }
            }
          }, random(300, 800));
        }
      }
    }
    
    return constrain(activity, 0, 1);
  }
}

// Sand grain class
class SandGrain {
  constructor(x, y, baseColor, texture, parent) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-0.5, 0.5), random(-0.5, 0.5));
    this.acc = createVector(0, 0);
    this.size = random(2, 7);
    this.baseColor = baseColor;
    this.texture = texture;
    this.parent = parent; // Reference to parent layer for neighbor access
  }
  
  applyForce(force) {
    this.acc.add(force);
  }
  
  update() {
    // Apply flocking behavior
    let separation = this.separate();
    let alignment = this.align();
    let cohesion = this.cohere();
    
    // Apply noise-based flow field
    let noiseX = this.pos.x * this.texture + t * 0.1;
    let noiseY = this.pos.y * this.texture + t * 0.1;
    let noiseForce = createVector(
      map(noise(noiseX, noiseY), 0, 1, -0.9, 0.9),
      map(noise(noiseY, noiseX), 0, 1, -0.9, 0.9)
    );
    
    // Apply forces with weights
    separation.mult(1.5);
    alignment.mult(0.5);
    cohesion.mult(0.3);
    noiseForce.mult(0.8);
    
    this.acc.add(separation);
    this.acc.add(alignment);
    this.acc.add(cohesion);
    this.acc.add(noiseForce);
    this.acc.add(gravity);
    
    // Update physics
    this.vel.add(this.acc);
    this.vel.limit(1.2); // Slightly higher speed limit
    this.pos.add(this.vel);
    
    // Reset acceleration for next frame
    this.acc.mult(0);
    
    // Wrap around screen edges for continuous flow
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
  }
  
  // Separation: steer away from close neighbors
  separate() {
    let desiredSeparation = 15;
    let steer = createVector(0, 0);
    let count = 0;
    
    // Check for neighbors within separation radius
    for (let grain of this.parent.grains) {
      let d = p5.Vector.dist(this.pos, grain.pos);
      if ((d > 0) && (d < desiredSeparation)) {
        // Calculate vector pointing away from neighbor
        let diff = p5.Vector.sub(this.pos, grain.pos);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++;
      }
    }
    
    // Average steering force
    if (count > 0) {
      steer.div(count);
    }
    
    // If vector has magnitude, normalize and scale
    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(1.2); // Max speed
      steer.sub(this.vel);
      steer.limit(0.3); // Max steering force
    }
    
    return steer;
  }
  
  // Alignment: steer towards average heading of neighbors
  align() {
    let neighborDistance = 25;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let grain of this.parent.grains) {
      let d = p5.Vector.dist(this.pos, grain.pos);
      if ((d > 0) && (d < neighborDistance)) {
        sum.add(grain.vel);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(1.0); // Max speed
      let steer = p5.Vector.sub(sum, this.vel);
      steer.limit(0.2); // Max steering force
      return steer;
    } else {
      return createVector(0, 0);
    }
  }
  
  // Cohesion: steer towards center of neighbors
  cohere() {
    let neighborDistance = 30;
    let sum = createVector(0, 0);
    let count = 0;
    
    for (let grain of this.parent.grains) {
      let d = p5.Vector.dist(this.pos, grain.pos);
      if ((d > 0) && (d < neighborDistance)) {
        sum.add(grain.pos);
        count++;
      }
    }
    
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    } else {
      return createVector(0, 0);
    }
  }
  
  // Seek target position
  seek(target) {
    let desired = p5.Vector.sub(target, this.pos);
    desired.normalize();
    desired.mult(0.8); // Max speed
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(0.1); // Max steering force
    return steer;
  }
  
  display() {
    let evolvingColor = lerpColor(this.baseColor, color(0, 0, 100, 10), 0.75 + 0.5 * sin(t));
    fill(evolvingColor);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
}

// Particle class with enhanced behavior
class Particle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0.05);
    this.lifespan = 255;
    this.color = col;
    this.baseSize = random(4, 12);
    this.size = this.baseSize;
    this.oscillationSpeed = random(0.02, 0.08);
    this.oscillationAmplitude = random(0.5, 2);
    this.birthTime = frameCount;
    this.maxSpeed = random(1.5, 3.5);
    
    // Assign a musical note to each particle
    const noteIndices = [0, 2, 4, 5, 7]; // Pentatonic indices within scale
    this.noteIndex = random(noteIndices);
    
    // Special effects probability
    this.hasTail = random() < 0.3;
    this.tailLength = this.hasTail ? floor(random(3, 12)) : 0;
    this.trail = [];
    
    // Particle behavior type
    this.behaviorType = floor(random(4)); // 0: normal, 1: orbiter, 2: follower, 3: repeller
    
    // For orbiter behavior
    if (this.behaviorType === 1) {
      this.orbitRadius = random(30, 80);
      this.orbitSpeed = random(0.01, 0.05);
      this.orbitCenter = createVector(x, y);
      this.orbitOffset = random(TWO_PI);
      this.lifespan = 300; // Longer lifespan
    }
  }
  
  applyForce(force) {
    // Apply force with mass consideration (size-based)
    let f = p5.Vector.div(force, this.baseSize / 8);
    this.acc.add(f);
  }
  
  // React to audio level
  respondToAudio(activityLevel) {
    // Scale size based on audio activity
    this.size = this.baseSize * (1 + activityLevel);
    
    // Add directional impulse based on activity
    if (activityLevel > 0.5 && frameCount % 30 === 0) {
      const impulse = p5.Vector.random2D();
      impulse.mult(activityLevel * 0.8);
      this.applyForce(impulse);
    }
  }
  
  // New method for particles to respond to notes
  respondToNote(noteFreq) {
    // Create a short burst in the direction matching the note frequency
    const noteDirection = map(noteFreq, scale[0], scale[scale.length-1], 0, TWO_PI);
    const noteImpulse = p5.Vector.fromAngle(noteDirection);
    noteImpulse.mult(0.5);
    this.applyForce(noteImpulse);
    
    // Brief size pulse
    this.size = this.baseSize * 1.5;
    
    // Add velocity in the musical direction
    if (random() < 0.3) {
      this.vel.add(p5.Vector.fromAngle(noteDirection, random(0.1, 0.4)));
    }
  }
  
  // Flock with other particles
  flock(particles) {
    if (this.behaviorType === 2) { // Follower behavior
      // Find nearest particles
      let nearest = null;
      let minDist = 100;
      
      for (let other of particles) {
        if (other !== this) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if (d < minDist) {
            minDist = d;
            nearest = other;
          }
        }
      }
      
      // Follow the nearest particle
      if (nearest) {
        let desired = p5.Vector.sub(nearest.pos, this.pos);
        if (desired.mag() > 20) {
          desired.normalize();
          desired.mult(this.maxSpeed);
          let steer = p5.Vector.sub(desired, this.vel);
          steer.limit(0.3);
          this.applyForce(steer);
        }
      }
    } 
    else if (this.behaviorType === 3) { // Repeller behavior
      // Repel from other particles
      for (let other of particles) {
        if (other !== this) {
          let d = p5.Vector.dist(this.pos, other.pos);
          if (d < 50 && d > 0) {
            let repel = p5.Vector.sub(this.pos, other.pos);
            repel.normalize();
            repel.div(d * 0.05);
            this.applyForce(repel);
          }
        }
      }
    }
  }
  
  update() {
    // Update trail
    if (this.hasTail && frameCount % 2 === 0) {
      this.trail.push(createVector(this.pos.x, this.pos.y));
      if (this.trail.length > this.tailLength) {
        this.trail.shift();
      }
    }
    
    // Different update logic based on behavior type
    if (this.behaviorType === 1) { // Orbiter behavior
      // Calculate position on orbit
      let angle = this.orbitOffset + (frameCount - this.birthTime) * this.orbitSpeed;
      this.pos.x = this.orbitCenter.x + sin(angle) * this.orbitRadius;
      this.pos.y = this.orbitCenter.y + cos(angle) * this.orbitRadius;
      
      // Slowly shrink orbit over time
      this.orbitRadius = max(5, this.orbitRadius * 0.997);
    } 
    else {
      // Normal physics update
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.pos.add(this.vel);
    }
    
    // Reset acceleration
    this.acc.mult(0);
    
    // Common updates for all types
    this.lifespan -= random(1, 3);
    
    // Oscillate size
    this.size = this.baseSize * (1 + sin(frameCount * this.oscillationSpeed) * this.oscillationAmplitude * 0.3);
  }
  
  display() {
    // Draw trail if it exists
    if (this.hasTail && this.trail.length > 0) {
      noFill();
      stroke(this.color, this.lifespan * 0.7);
      beginShape();
      for (let i = 0; i < this.trail.length; i++) {
        let pos = this.trail[i];
        let alpha = map(i, 0, this.trail.length - 1, 50, this.lifespan);
        stroke(this.color, alpha);
        strokeWeight(map(i, 0, this.trail.length - 1, 1, this.size * 0.7));
        vertex(pos.x, pos.y);
      }
      vertex(this.pos.x, this.pos.y);
      endShape();
    }
    
    // Draw particle
    noStroke();
    
    // Different display based on behavior type
    switch(this.behaviorType) {
      case 0: // Normal
        fill(this.color, this.lifespan);
        ellipse(this.pos.x, this.pos.y, this.size);
        break;
      case 1: // Orbiter
        fill(this.color, this.lifespan);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(frameCount * 0.1);
        ellipse(0, 0, this.size);
        // Add small accent
        fill(255, this.lifespan * 0.8);
        ellipse(this.size * 0.3, 0, this.size * 0.3);
        pop();
        break;
      case 2: // Follower
        // Triangle follower
        fill(this.color, this.lifespan);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading() + PI/2);
        triangle(0, -this.size/2, -this.size/2, this.size/2, this.size/2, this.size/2);
        pop();
        break;
      case 3: // Repeller
        // Star repeller
        fill(this.color, this.lifespan);
        push();
        translate(this.pos.x, this.pos.y);
        rotate(frameCount * 0.05);
        for (let i = 0; i < 5; i++) {
          let angle = TWO_PI * i / 5;
          let x1 = cos(angle) * this.size/2;
          let y1 = sin(angle) * this.size/2;
          let x2 = cos(angle + TWO_PI/10) * this.size/4;
          let y2 = sin(angle + TWO_PI/10) * this.size/4;
          line(0, 0, x1, y1);
          line(0, 0, x2, y2);
        }
        pop();
        break;
    }
    
    // Add glow effect for bright particles
    if (brightness(this.color) > 70) {
      drawingContext.shadowBlur = 10;
      drawingContext.shadowColor = color(red(this.color), green(this.color), blue(this.color), 150);
      ellipse(this.pos.x, this.pos.y, this.size * 0.7);
      drawingContext.shadowBlur = 0;
    }
  }
  
  isDead() {
    return this.lifespan < 0;
  }
  
  // Screen edge behavior
  checkEdges() {
    // Bounce off the edges with damping
    if (this.pos.x < 0 || this.pos.x > width) {
      this.vel.x *= -0.8;
      // Keep within bounds
      this.pos.x = constrain(this.pos.x, 0, width);
    }
    
    if (this.pos.y < 0 || this.pos.y > height) {
      this.vel.y *= -0.8;
      // Keep within bounds
      this.pos.y = constrain(this.pos.y, 0, height);
    }
  }
}

// Particle system class with enhanced behavior
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.lastCreationTime = 0;
    this.emitters = [];
    this.maxParticles = 100; // Limit particles to prevent slowdown
    this.attractors = [];
    
    // Create some fixed attractors
    for (let i = 0; i < 3; i++) {
      this.attractors.push({
        pos: createVector(random(width), random(height)),
        strength: random(0.1, 0.4) * (random() < 0.5 ? -1 : 1), // Negative means repulsion
        radius: random(100, 300),
        moving: random() < 0.3,
        velocity: p5.Vector.random2D().mult(random(0.5, 1.5))
      });
    }
  }
  
  createEmitter(x, y) {
    // Create particle emitters at specific locations
    this.emitters.push({
      pos: createVector(x, y),
      rate: random(0.02, 0.1),
      color: color(random(200, 255), random(200, 255), random(200, 255)),
      lifespan: 300 + random(300)
    });
  }
  
  updateEmitters() {
    // Update and remove dead emitters
    for (let i = this.emitters.length - 1; i >= 0; i--) {
      let emitter = this.emitters[i];
      
      // Emit particles based on rate
      if (random() < emitter.rate && this.particles.length < this.maxParticles) {
        this.addParticle(
          emitter.pos.x + random(-10, 10),
          emitter.pos.y + random(-10, 10),
          emitter.color
        );
      }
      
      // Reduce emitter lifespan
      emitter.lifespan--;
      
      // Remove dead emitters
      if (emitter.lifespan <= 0) {
        this.emitters.splice(i, 1);
      }
    }
  }
  
  updateAttractors() {
    // Update attractors
    for (let attractor of this.attractors) {
      if (attractor.moving) {
        // Move the attractor
        attractor.pos.add(attractor.velocity);
        
        // Bounce off edges
        if (attractor.pos.x < 0 || attractor.pos.x > width) {
          attractor.velocity.x *= -1;
        }
        if (attractor.pos.y < 0 || attractor.pos.y > height) {
          attractor.velocity.y *= -1;
        }
      }
      
      // Visualize attractors with more subtle artistic effects
      if (attractor.strength > 0) {
        // Attractive force - gentle pulse
        noFill();
        for (let i = 0; i < 3; i++) {
          let pulseSize = (sin(frameCount * 0.02 + i * TWO_PI/3) * 10) + 15;
          let alpha = map(i, 0, 2, 15, 5);
          
          stroke(255, 180, 100, alpha);
          strokeWeight(1);
          
          // Draw subtle point at center
          point(attractor.pos.x, attractor.pos.y);
          
          // Draw subtle rays instead of big circle
          let rayCount = 8;
          for (let j = 0; j < rayCount; j++) {
            let angle = j * TWO_PI / rayCount + frameCount * 0.01;
            let rayLength = attractor.radius * 0.4 + pulseSize;
            let x2 = attractor.pos.x + cos(angle) * rayLength;
            let y2 = attractor.pos.y + sin(angle) * rayLength;
            
            // Gradient stroke
            let steps = 5;
            for (let s = 0; s < steps; s++) {
              let t = s / (steps - 1);
              let x = lerp(attractor.pos.x, x2, t);
              let y = lerp(attractor.pos.y, y2, t);
              let pointAlpha = alpha * (1 - t);
              stroke(255, 180, 100, pointAlpha);
              point(x, y);
            }
          }
        }
      } else {
        // Repulsive force - subtle ripple
        noFill();
        let rippleCount = 2;
        for (let i = 0; i < rippleCount; i++) {
          let t = ((frameCount * 0.01) + i/rippleCount) % 1;
          let rippleSize = attractor.radius * t;
          let alpha = 15 * (1 - t);
          
          stroke(100, 180, 255, alpha);
          strokeWeight(0.8);
          
          // Draw expanding dotted circle instead of solid
          let pointCount = 24;
          for (let j = 0; j < pointCount; j++) {
            if (j % 2 === 0) { // Skip every other point for dotted effect
              let angle = j * TWO_PI / pointCount;
              let x = attractor.pos.x + cos(angle) * rippleSize;
              let y = attractor.pos.y + sin(angle) * rippleSize;
              point(x, y);
            }
          }
        }
      }
    }
  }
  
  addParticle(x, y, col) {
    if (this.particles.length < this.maxParticles) {
      this.particles.push(new Particle(x, y, col || color(255, 255, 255, 200)));
      this.lastCreationTime = millis();
    }
  }
  
  addParticlesOnBeat(x, y, count, col) {
    // Add a burst of particles on musical beats
    for (let i = 0; i < count; i++) {
      let angle = random(TWO_PI);
      let dist = random(5, 20);
      this.addParticle(
        x + cos(angle) * dist,
        y + sin(angle) * dist,
        col || color(255, 255, 255, 200)
      );
    }
    
    // Sometimes create an emitter
    if (random() < 0.2) {
      this.createEmitter(x, y);
    }
  }
  
  applyAttractors() {
    // Apply forces from attractors
    for (let particle of this.particles) {
      for (let attractor of this.attractors) {
        let force = p5.Vector.sub(attractor.pos, particle.pos);
        let distance = force.mag();
        
        if (distance < attractor.radius) {
          let strength = attractor.strength / distance;
          force.normalize();
          force.mult(strength);
          particle.applyForce(force);
        }
      }
    }
  }
  
  applyForceField() {
    // Apply a noise-based force field
    for (let particle of this.particles) {
      let noiseScale = 0.01;
      let noiseVal = noise(
        particle.pos.x * noiseScale + t * 0.05,
        particle.pos.y * noiseScale + t * 0.05
      );
      
      let angle = map(noiseVal, 0, 1, 0, TWO_PI * 2);
      let force = p5.Vector.fromAngle(angle);
      force.mult(0.1);
      particle.applyForce(force);
    }
  }
  
  run(grainActivityLevel) {
    // Update emitters
    this.updateEmitters();
    
    // Update attractors
    this.updateAttractors();
    
    // Apply forces
    this.applyAttractors();
    this.applyForceField();
    
    // Flocking behavior
    for (let particle of this.particles) {
      particle.flock(this.particles);
    }
    
    // Update and display particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      
      // Apply global forces
      p.applyForce(gravity);
      
      // Audio response
      p.respondToAudio(grainActivityLevel);
      
      // Update and display
      p.update();
      p.checkEdges();
      p.display();
      
      // Remove dead particles
      if (p.isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  // Notify particles of a musical note being played
  notifyNote(noteFreq, velocity) {
    // Scale number of particles to respond based on velocity
    let respondCount = floor(map(velocity, 0, 1, 3, this.particles.length * 0.5));
    
    // Select random particles to respond
    for (let i = 0; i < min(respondCount, this.particles.length); i++) {
      let randomIndex = floor(random(this.particles.length));
      this.particles[randomIndex].respondToNote(noteFreq);
    }
    
    // Add new particles on strong notes
    if (velocity > 0.4) {
      let burstCount = floor(map(velocity, 0.4, 1, 3, 10));
      let x = random(width);
      let y = random(height);
      
      // Generate color based on note frequency
      let hue = map(noteFreq, scale[0], scale[scale.length-1], 20, 320);
      let noteColor = color(hue, 80, 90, 200);
      
      this.addParticlesOnBeat(x, y, burstCount, noteColor);
    }
  }
}

