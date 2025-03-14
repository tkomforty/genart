// Gallery configuration with GitHub-hosted sketch
const artworks = [
  {
    id: 1,
    title: "GitHub Sketch",
    thumbnailColor: "#1a3c8b",
    // Using a CORS proxy to access the GitHub content
    sketchUrl: "https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/tkomforty/genart/refs/heads/main/sketch.js",
    audioUrl: "https://assets.codepen.io/408648/relax.mp3" // Sample audio from CodePen assets
  },
  {
    id: 2,
    title: "Generative Waves",
    thumbnailColor: "#8b1a3c",
    sketchUrl: "waves",
    audioUrl: "https://assets.codepen.io/408648/marimba.mp3"
  },
  {
    id: 3,
    title: "Interactive Particles",
    thumbnailColor: "#3c8b1a",
    sketchUrl: "particles",
    audioUrl: "https://assets.codepen.io/408648/guitar.mp3"
  },
  {
    id: 4,
    title: "Growing Circles",
    thumbnailColor: "#6b3c9a",
    sketchUrl: "circles",
    audioUrl: "https://assets.codepen.io/408648/piano.mp3"
  },
  {
    id: 5,
    title: "Geometric Patterns",
    thumbnailColor: "#3c6b9a",
    sketchUrl: "geometry",
    audioUrl: "https://assets.codepen.io/408648/synth.mp3"
  }
];

// Built-in sketch code for fallback and demo purposes
const sketchCode = {
  "waves": `
    let particles = [];
    const particleCount = 150;
    let time = 0;
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      
      // Initialize particles
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: random(width),
          y: random(height),
          size: random(4) + 1,
          speedX: random(2) - 1,
          speedY: random(2) - 1,
          color: color(random(180, 250), 80, 50)
        });
      }
      
      // Use HSB color mode
      colorMode(HSB, 360, 100, 100, 1);
    }
    
    function draw() {
      // Semi-transparent background for trail effect
      background(0, 0, 0, 0.05);
      
      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > height) particle.speedY *= -1;
        
        // Wave size effect
        const waveSize = 
          particle.size * (1 + 0.5 * sin(time * 0.01 + particle.x * 0.01));
        
        // Draw particle
        noStroke();
        fill(particle.color);
        ellipse(particle.x, particle.y, waveSize * 2);
        
        // Draw connecting lines to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            stroke(220, 80, 100, 0.1 * (1 - distance / 100));
            line(particle.x, particle.y, other.x, other.y);
          }
        }
      });
      
      time++;
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `,
  "particles": `
    let particles = [];
    const numParticles = 200;
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      
      // Create particles
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          position: createVector(random(width), random(height)),
          velocity: createVector(random(-1, 1), random(-1, 1)),
          acceleration: createVector(0, 0),
          size: random(3, 8),
          color: color(random(255), random(255), random(255))
        });
      }
    }
    
    function draw() {
      background(0, 20);
      
      // Create a force towards the mouse
      let mousePosition = createVector(mouseX, mouseY);
      
      // Update and draw particles
      particles.forEach(p => {
        // Create attraction to mouse
        let force = p5.Vector.sub(mousePosition, p.position);
        let distance = force.mag();
        force.normalize();
        
        // Adjust force based on distance
        if (distance < 200) {
          let strength = map(distance, 0, 200, 0.5, 0);
          force.mult(strength);
        } else {
          force.mult(0);
        }
        
        // Apply force
        p.acceleration.add(force);
        
        // Update position
        p.velocity.add(p.acceleration);
        p.velocity.limit(3);
        p.position.add(p.velocity);
        
        // Reset acceleration
        p.acceleration.mult(0);
        
        // Wrap around screen edges
        if (p.position.x < 0) p.position.x = width;
        if (p.position.x > width) p.position.x = 0;
        if (p.position.y < 0) p.position.y = height;
        if (p.position.y > height) p.position.y = 0;
        
        // Draw particle
        noStroke();
        fill(p.color);
        ellipse(p.position.x, p.position.y, p.size);
      });
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `,
  "circles": `
    let circles = [];
    let maxCircles = 100;
    let palette = [];
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      
      // Generate color palette
      palette = [
        color(255, 100, 100),
        color(100, 255, 100),
        color(100, 100, 255),
        color(255, 255, 100),
        color(255, 100, 255)
      ];
      
      noStroke();
      background(10);
    }
    
    function draw() {
      // Fade background
      background(10, 10);
      
      // Try to add a new circle
      if (circles.length < maxCircles) {
        let newCircle = {
          x: random(width),
          y: random(height),
          r: random(5, 30),
          color: random(palette),
          growth: random(0.1, 0.5)
        };
        
        // Check if it overlaps with existing circles
        let valid = true;
        for (let i = 0; i < circles.length; i++) {
          let d = dist(newCircle.x, newCircle.y, circles[i].x, circles[i].y);
          if (d < newCircle.r + circles[i].r) {
            valid = false;
            break;
          }
        }
        
        if (valid) circles.push(newCircle);
      }
      
      // Draw and update circles
      for (let i = circles.length - 1; i >= 0; i--) {
        let c = circles[i];
        
        // Draw circle
        fill(c.color);
        ellipse(c.x, c.y, c.r * 2);
        
        // Update size
        c.r += c.growth;
        
        // Remove if too large
        if (c.r > 80) {
          circles.splice(i, 1);
        }
      }
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
    }
  `,
  "geometry": `
    let triangles = [];
    let cols, rows;
    let cellSize = 50;
    
    function setup() {
      createCanvas(windowWidth, windowHeight);
      background(0);
      
      // Calculate grid
      cols = floor(width / cellSize) + 1;
      rows = floor(height / cellSize) + 1;
      
      // Initialize triangles
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Determine triangle orientation randomly
          const orientation = random() > 0.5;
          
          triangles.push({
            x: x * cellSize,
            y: y * cellSize,
            size: cellSize,
            orientation: orientation,
            color: color(random(100, 255), random(100, 255), random(100, 255), 150),
            rotation: 0,
            rotationSpeed: random(-0.02, 0.02)
          });
        }
      }
      
      noStroke();
    }
    
    function draw() {
      background(0, 10);
      
      // Draw and update triangles
      triangles.forEach(t => {
        push();
        translate(t.x + t.size/2, t.y + t.size/2);
        rotate(t.rotation);
        
        fill(t.color);
        
        if (t.orientation) {
          // First orientation
          triangle(
            -t.size/2, -t.size/2,
            t.size/2, -t.size/2,
            0, t.size/2
          );
        } else {
          // Second orientation
          triangle(
            -t.size/2, t.size/2,
            t.size/2, t.size/2,
            0, -t.size/2
          );
        }
        
        pop();
        
        // Update rotation
        t.rotation += t.rotationSpeed;
      });
    }
    
    function windowResized() {
      resizeCanvas(windowWidth, windowHeight);
      
      // Recalculate grid
      cols = floor(width / cellSize) + 1;
      rows = floor(height / cellSize) + 1;
      
      // Reset triangles
      triangles = [];
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const orientation = random() > 0.5;
          
          triangles.push({
            x: x * cellSize,
            y: y * cellSize,
            size: cellSize,
            orientation: orientation,
            color: color(random(100, 255), random(100, 255), random(100, 255), 150),
            rotation: 0,
            rotationSpeed: random(-0.02, 0.02)
          });
        }
      }
    }
  `
};

// Current audio player
let currentAudio = null;
// Current iframe for p5 sketch
let currentIframe = null;

// Function to create gallery items
function createGallery() {
  const galleryElement = document.getElementById('gallery');
  
  artworks.forEach(artwork => {
    const artworkElement = document.createElement('div');
    artworkElement.className = 'artwork';
    artworkElement.style.backgroundColor = artwork.thumbnailColor;
    artworkElement.setAttribute('data-id', artwork.id);
    
    const titleElement = document.createElement('div');
    titleElement.className = 'artwork-title';
    titleElement.textContent = artwork.title;
    
    artworkElement.appendChild(titleElement);
    galleryElement.appendChild(artworkElement);
    
    // Add click event to expand
    artworkElement.addEventListener('click', (e) => {
      expandArtwork(artwork, e);
    });
  });
}

// Function to expand artwork to fullscreen
function expandArtwork(artwork, clickEvent) {
  const artworkElement = clickEvent.currentTarget;
  const rect = artworkElement.getBoundingClientRect();
  
  // Create transition element (clone of the clicked element)
  const transitionElement = document.createElement('div');
  transitionElement.className = 'transition-element';
  transitionElement.style.backgroundColor = artwork.thumbnailColor;
  transitionElement.style.width = rect.width + 'px';
  transitionElement.style.height = rect.height + 'px';
  transitionElement.style.left = rect.left + 'px';
  transitionElement.style.top = rect.top + 'px';
  
  document.body.appendChild(transitionElement);
  
  // Show the fullscreen container
  const fullscreenContainer = document.getElementById('fullscreen-container');
  const fullscreenContent = document.getElementById('fullscreen-content');
  
  // Clear previous iframe if exists
  fullscreenContent.innerHTML = '';
  
  fullscreenContainer.style.display = 'flex';
  
  // Play audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  
  currentAudio = new Audio(artwork.audioUrl);
  currentAudio.loop = true;
  currentAudio.volume = 0;
  currentAudio.play()
    .then(() => {
      // Fade in audio
      let volume = 0;
      const fadeInterval = setInterval(() => {
        if (volume < 0.7) {
          volume += 0.05;
          currentAudio.volume = volume;
        } else {
          clearInterval(fadeInterval);
        }
      }, 100);
    })
    .catch(error => {
      console.error("Audio playback failed:", error);
    });
  
  // Animate the transition element to fullscreen
  setTimeout(() => {
    transitionElement.style.width = '100vw';
    transitionElement.style.height = '100vh';
    transitionElement.style.left = '0';
    transitionElement.style.top = '0';
    transitionElement.style.borderRadius = '0';
    
    // Create and load the iframe for the p5.js sketch after animation starts
    setTimeout(() => {
      loadP5SketchInIframe(artwork.sketchUrl, fullscreenContent);
      
      // Remove transition element after iframe is loaded
      setTimeout(() => {
        transitionElement.remove();
      }, 500);
    }, 500);
  }, 50);
}

// Function to load p5.js sketch in an iframe
function loadP5SketchInIframe(sketchUrl, container) {
  // Create an iframe to load the sketch
  const iframe = document.createElement('iframe');
  iframe.id = 'sketch-iframe';
  iframe.allowTransparency = true;
  
  // Store iframe reference for cleanup
  currentIframe = iframe;
  container.appendChild(iframe);
  
  // Determine if this is a URL or an internal sketch key
  const isExternalUrl = sketchUrl.startsWith('http');

  // If using a GitHub URL, we'll fetch it first to avoid CORS issues
  if (isExternalUrl) {
    // Fetch the sketch code first
    fetch(sketchUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to load sketch from URL");
        }
        return response.text();
      })
      .then(sketchCodeText => {
        // Now load the iframe with the fetched code
        loadIframeWithCode(iframe, sketchCodeText, false);
      })
      .catch(error => {
        console.error("Error loading sketch:", error);
        // Fallback to using an internal sketch if there's an error
        loadIframeWithCode(iframe, sketchCode["waves"], false);
      });
  } else {
    // For internal sketches, use them directly
    loadIframeWithCode(iframe, sketchCode[sketchUrl], false);
  }
}

// Helper function to load iframe with code
function loadIframeWithCode(iframe, code, isExternalUrl) {
  // Generate HTML content for the iframe
  const sketchHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/addons/p5.sound.min.js"></script>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: black;
        }
        canvas {
          display: block;
        }
        
        /* Style for interaction message */
        #interaction-message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-family: Arial, sans-serif;
          font-size: 24px;
          text-align: center;
          background-color: rgba(0,0,0,0.7);
          padding: 20px;
          border-radius: 10px;
          pointer-events: none; /* Allow clicks to pass through */
          transition: opacity 0.5s;
          z-index: 1000;
        }
        
        #click-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 999;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <!-- Add interaction message overlay -->
      <div id="interaction-message">Click or tap anywhere to interact with the sketch</div>
      
      <!-- Add an invisible overlay to capture clicks -->
      <div id="click-overlay"></div>
      
      <script>
        // Show interaction message for 3 seconds then fade out
        setTimeout(() => {
          const message = document.getElementById('interaction-message');
          message.style.opacity = 0;
          setTimeout(() => {
            message.style.display = 'none';
          }, 500);
        }, 3000);
        
        // Create a variable to store the p5 instance
        let p5Instance = null;
        
        // This function ensures canvas resize to fit iframe
        function windowResized() {
          if (typeof resizeCanvas === 'function') {
            resizeCanvas(windowWidth, windowHeight);
          }
        }
        
        // Override createCanvas to ensure it's full size
        const originalCreateCanvas = window.createCanvas;
        window.createCanvas = function() {
          const canvas = originalCreateCanvas(windowWidth, windowHeight);
          return canvas;
        };

        // Function to simulate mouse events in p5.js
        function simulateMouseEvent(eventType, x, y) {
          // Create an event object similar to what p5.js expects
          const event = {
            clientX: x,
            clientY: y,
            detail: 1,
            preventDefault: function() {},
            stopPropagation: function() {}
          };
          
          // Update mouse position variables
          if (typeof mouseX !== 'undefined') mouseX = x;
          if (typeof mouseY !== 'undefined') mouseY = y;
          
          // Trigger the appropriate p5.js event handler
          if (eventType === 'click') {
            if (typeof mouseClicked === 'function') mouseClicked(event);
            if (typeof mouseIsPressed !== 'undefined') {
              mouseIsPressed = true;
              setTimeout(() => { mouseIsPressed = false; }, 100);
            }
          } else if (eventType === 'down') {
            if (typeof mousePressed === 'function') mousePressed(event);
            if (typeof mouseIsPressed !== 'undefined') mouseIsPressed = true;
          } else if (eventType === 'up') {
            if (typeof mouseReleased === 'function') mouseReleased(event);
            if (typeof mouseIsPressed !== 'undefined') mouseIsPressed = false;
          }
        }
        
        // Click overlay event handlers
        document.getElementById('click-overlay').addEventListener('click', function(e) {
          simulateMouseEvent('click', e.clientX, e.clientY);
          
          // After a successful click, remove the overlay if it seems the sketch is working
          if (document.querySelector('canvas')) {
            setTimeout(() => {
              const overlay = document.getElementById('click-overlay');
              if (overlay) overlay.remove();
            }, 1000);
          }
        });
        
        document.getElementById('click-overlay').addEventListener('mousedown', function(e) {
          simulateMouseEvent('down', e.clientX, e.clientY);
        });
        
        document.getElementById('click-overlay').addEventListener('mouseup', function(e) {
          simulateMouseEvent('up', e.clientX, e.clientY);
        });
        
        // Auto-click after a delay to start the sketch
        setTimeout(() => {
          const overlay = document.getElementById('click-overlay');
          if (overlay) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            simulateMouseEvent('click', centerX, centerY);
            
            // Create a visual feedback for the auto-click
            const feedback = document.createElement('div');
            feedback.style.position = 'absolute';
            feedback.style.width = '20px';
            feedback.style.height = '20px';
            feedback.style.borderRadius = '50%';
            feedback.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
            feedback.style.top = (centerY - 10) + 'px';
            feedback.style.left = (centerX - 10) + 'px';
            feedback.style.zIndex = '1000';
            document.body.appendChild(feedback);
            
            // Animate and remove the feedback
            feedback.animate([
              { transform: 'scale(1)', opacity: 0.5 },
              { transform: 'scale(3)', opacity: 0 }
            ], {
              duration: 500,
              iterations: 1
            }).onfinish = () => feedback.remove();
          }
        }, 500);
        
        // The actual p5.js sketch code
        ${code}
      </script>
    </body>
    </html>
  `;
  
  // Write the HTML content to the iframe
  iframe.onload = function() {
    console.log("Iframe loaded for sketch");
  };
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(sketchHtml);
  iframeDoc.close();
}

// Function to close fullscreen view
function closeFullscreen() {
  const fullscreenContainer = document.getElementById('fullscreen-container');
  
  // Fade out audio
  if (currentAudio) {
    let volume = currentAudio.volume;
    const fadeInterval = setInterval(() => {
      if (volume > 0.05) {
        volume -= 0.05;
        currentAudio.volume = volume;
      } else {
        clearInterval(fadeInterval);
        currentAudio.pause();
        currentAudio = null;
      }
    }, 50);
  }
  
  // Clear the iframe content
  if (currentIframe) {
    try {
      // Try to stop any audio context in the iframe
      const iframeWindow = currentIframe.contentWindow;
      if (iframeWindow && iframeWindow.p5 && iframeWindow.p5.prototype && iframeWindow.p5.prototype.getAudioContext) {
        const audioContext = iframeWindow.p5.prototype.getAudioContext();
        if (audioContext && audioContext.state === 'running') {
          audioContext.suspend();
        }
      }
    } catch (e) {
      console.log("Error stopping audio context:", e);
    }
    
    currentIframe.src = 'about:blank';
    currentIframe = null;
  }
  
  // Hide the container
  fullscreenContainer.style.display = 'none';
}

// Initialize the gallery when the page loads
window.addEventListener('DOMContentLoaded', () => {
  createGallery();
  
  // Add close button event listener
  document.getElementById('close-button').addEventListener('click', closeFullscreen);
  
  // Add return button event listener
  document.getElementById('return-button').addEventListener('click', closeFullscreen);
  
  // Also close when ESC key is pressed
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFullscreen();
    }
  });
});