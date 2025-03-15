import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';

class VoiceAssistant {
  constructor() {
    // Initialize non-audio components first
    this.setupThreeJS();
    this.createSpaceEnvironment();
    this.createWave();
    
    // States
    this.isListening = false;
    this.hasQuery = false;
    this.isSpeaking = false;
    this.isProcessing = false;
    
    // Wave properties
    this.waveFrequency = 0.5;
    this.waveAmplitude = 0.2;
    this.wavePoints = 100;
    this.waveLayers = 50;
    this.time = 0;

    // Sound wave properties
    this.soundWavePoints = 200;
    this.soundWaveAmplitude = 0.3;
    this.soundWaveFrequency = 2;
    this.soundWaveSpeed = 5;

    // Document name
    this.documentName = '';
    
    // Handle start button and document input
    const startButton = document.getElementById('startButton');
    const overlay = document.getElementById('overlay');
    const documentInput = document.getElementById('documentInput');
    
    startButton.addEventListener('click', () => {
      this.documentName = documentInput.value.trim() || 'animal_story'; // Default if empty
      overlay.style.display = 'none';
      this.initializeAudio();
      document.getElementById('info').textContent = 'Say "fox" to activate';
    });

    this.animate();
  }

  async initializeAudio() {
    try {
      // Initialize speech components
      await this.setupSpeechSynthesis();
      await this.setupVoiceRecognition();
      this.startListeningForActivation();
    } catch (error) {
      console.error('Error initializing audio:', error);
      document.getElementById('info').textContent = 'Error: Please check microphone permissions';
    }
  }

  setupThreeJS() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#canvas'), antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000510);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.5;
    this.camera.position.set(0, 3, 8);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(ambientLight, directionalLight);

    // Handle window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  createSpaceEnvironment() {
    // Create starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const starsPositions = new Float32Array(starsCount * 3);
    
    for(let i = 0; i < starsCount * 3; i += 3) {
      const radius = Math.random() * 100;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      starsPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starsPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starsPositions[i + 2] = radius * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(this.stars);

    // Create planets
    this.planets = [];
    for(let i = 0; i < 5; i++) {
      const size = Math.random() * 0.5 + 0.2;
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        shininess: 30,
        metalness: 0.5,
        roughness: 0.5
      });
      const planet = new THREE.Mesh(geometry, material);
      
      const radius = Math.random() * 10 + 5;
      const angle = Math.random() * Math.PI * 2;
      planet.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 5,
        Math.sin(angle) * radius
      );
      
      this.planets.push({
        mesh: planet,
        rotationSpeed: Math.random() * 0.02 - 0.01,
        orbitSpeed: Math.random() * 0.001 + 0.001,
        orbitRadius: radius,
        orbitAngle: angle
      });
      
      this.scene.add(planet);
    }

    // Create asteroids
    this.asteroids = [];
    for(let i = 0; i < 50; i++) {
      const geometry = new THREE.IcosahedronGeometry(Math.random() * 0.1 + 0.05, 0);
      const material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        roughness: 0.8
      });
      const asteroid = new THREE.Mesh(geometry, material);
      
      const radius = Math.random() * 15 + 8;
      const angle = Math.random() * Math.PI * 2;
      asteroid.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.5) * 8,
        Math.sin(angle) * radius
      );
      
      this.asteroids.push({
        mesh: asteroid,
        rotationSpeed: Math.random() * 0.05 - 0.025,
        orbitSpeed: Math.random() * 0.002 + 0.001,
        orbitRadius: radius,
        orbitAngle: angle
      });
      
      this.scene.add(asteroid);
    }

    // Create nebula
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaCount = 1000;
    const nebulaPositions = new Float32Array(nebulaCount * 3);
    const nebulaSizes = new Float32Array(nebulaCount);
    const nebulaColors = new Float32Array(nebulaCount * 3);
    
    for(let i = 0; i < nebulaCount; i++) {
      const radius = Math.random() * 20 + 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      nebulaPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      nebulaPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      nebulaPositions[i * 3 + 2] = radius * Math.cos(phi);
      
      nebulaSizes[i] = Math.random() * 0.5 + 0.1;
      
      const color = new THREE.Color().setHSL(Math.random() * 0.2 + 0.5, 0.8, 0.5);
      nebulaColors[i * 3] = color.r;
      nebulaColors[i * 3 + 1] = color.g;
      nebulaColors[i * 3 + 2] = color.b;
    }
    
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPositions, 3));
    nebulaGeometry.setAttribute('size', new THREE.BufferAttribute(nebulaSizes, 1));
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3));
    
    const nebulaMaterial = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    this.nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
    this.scene.add(this.nebula);
  }

  createWave() {
    this.waveGroup = new THREE.Group();
    this.scene.add(this.waveGroup);

    // Create wave geometry with more dynamic appearance
    for(let j = 0; j < this.waveLayers; j++) {
      const points = [];
      for(let i = 0; i <= this.wavePoints; i++) {
        points.push(new THREE.Vector3(
          (i - this.wavePoints/2) * 0.1,
          0,
          j * 0.05 - this.waveLayers * 0.025
        ));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 1 - (j/this.waveLayers) * 0.5,
        blending: THREE.AdditiveBlending
      });

      const line = new THREE.Line(geometry, material);
      this.waveGroup.add(line);
    }

    // Position the wave group in front of the camera
    this.waveGroup.position.y = -1;
    this.waveGroup.position.z = -3;

    // Create sound wave visualization
    this.createSoundWave();
  }

  createSoundWave() {
    // Create a smooth curve for the sound wave
    const points = [];
    for(let i = 0; i <= this.soundWavePoints; i++) {
      points.push(new THREE.Vector3(
        (i - this.soundWavePoints/2) * 0.02,
        0,
        0
      ));
    }

    const soundWaveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const soundWaveMaterial = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
      linewidth: 2,
      blending: THREE.AdditiveBlending
    });

    this.soundWave = new THREE.Line(soundWaveGeometry, soundWaveMaterial);
    this.soundWave.position.set(0, 1.5, -3); // Position above the existing wave
    this.scene.add(this.soundWave);
  }

  updateWaveColor(color) {
    this.waveGroup.children.forEach(line => {
      line.material.color.set(color);
    });
    
    // Update sound wave color
    if (this.soundWave) {
      this.soundWave.material.color.set(color);
    }
  }

  updateWave() {
    this.time += 0.016;
    
    this.waveGroup.children.forEach((line, layerIndex) => {
      const positions = line.geometry.attributes.position.array;
      
      for(let i = 0; i <= this.wavePoints; i++) {
        const x = (i - this.wavePoints/2) * 0.1;
        positions[i * 3 + 1] = Math.sin(x * this.waveFrequency + this.time + layerIndex * 0.2) 
                             * this.waveAmplitude 
                             * (1 + (this.isSpeaking ? Math.sin(this.time * 10) * 0.5 : 0))
                             * (1 - Math.abs(x) / (this.wavePoints * 0.05)); // Fade out at edges
      }
      
      line.geometry.attributes.position.needsUpdate = true;
    });
  }

  updateSoundWave() {
    if (!this.soundWave) return;

    const positions = this.soundWave.geometry.attributes.position.array;
    const amplitude = this.soundWaveAmplitude * (this.isSpeaking ? 1.5 : 1);
    const frequency = this.soundWaveFrequency * (this.isSpeaking ? 2 : 1);
    
    for(let i = 0; i <= this.soundWavePoints; i++) {
      const x = (i - this.soundWavePoints/2) * 0.02;
      const phase1 = this.time * this.soundWaveSpeed;
      const phase2 = this.time * this.soundWaveSpeed * 0.5;
      
      // Combine multiple sine waves for more complex motion
      positions[i * 3 + 1] = (
        Math.sin(x * frequency + phase1) * 0.6 +
        Math.sin(x * frequency * 0.5 + phase2) * 0.4
      ) * amplitude * (1 - Math.abs(x) / 2); // Fade out at edges
    }
    
    this.soundWave.geometry.attributes.position.needsUpdate = true;
  }

  updateSpaceEnvironment() {
    // Rotate and move planets
    this.planets.forEach(planet => {
      planet.mesh.rotation.y += planet.rotationSpeed;
      planet.orbitAngle += planet.orbitSpeed;
      planet.mesh.position.x = Math.cos(planet.orbitAngle) * planet.orbitRadius;
      planet.mesh.position.z = Math.sin(planet.orbitAngle) * planet.orbitRadius;
    });

    // Rotate and move asteroids
    this.asteroids.forEach(asteroid => {
      asteroid.mesh.rotation.x += asteroid.rotationSpeed;
      asteroid.mesh.rotation.y += asteroid.rotationSpeed * 0.5;
      asteroid.orbitAngle += asteroid.orbitSpeed;
      asteroid.mesh.position.x = Math.cos(asteroid.orbitAngle) * asteroid.orbitRadius;
      asteroid.mesh.position.z = Math.sin(asteroid.orbitAngle) * asteroid.orbitRadius;
    });

    // Rotate stars and nebula slowly
    this.stars.rotation.y += 0.0001;
    this.nebula.rotation.y += 0.0002;
  }

  setupVoiceRecognition() {
    return new Promise((resolve, reject) => {
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
          console.log('Speech recognition started');
        };

        this.recognition.onend = () => {
          console.log('Speech recognition ended');
          if (this.isListening && !this.hasQuery && !this.isProcessing) {
            console.log('Restarting query listening...');
            setTimeout(() => {
              try {
                this.recognition.start();
              } catch (error) {
                console.error('Error restarting recognition:', error);
              }
            }, 100);
          } else if (!this.isProcessing && !this.isSpeaking) {
            console.log('Going back to listening for activation...');
            this.startListeningForActivation();
          }
        };

        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            document.querySelector('#info').textContent = 'Please allow microphone access';
          }
        };

        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          console.log('Heard:', transcript);

          if (!this.isListening) {
            if (transcript.includes('fox')) {
              this.recognition.stop(); // Stop before starting new mode
              setTimeout(() => this.startListeningForQuery(), 100);
            }
          } else if (!this.hasQuery) {
            this.hasQuery = true;
            this.sendQuery(transcript);
          }
        };

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async setupSpeechSynthesis() {
    return new Promise((resolve) => {
      this.synthesis = window.speechSynthesis;
      this.voice = null;

      // Function to handle voice loading
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        this.voice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') && 
          voice.lang.startsWith('en')
        ) || voices.find(voice => voice.lang.startsWith('en'));
        
        console.log('Available voices:', voices.map(v => v.name));
        if (this.voice) {
          console.log('Selected voice:', this.voice.name);
        }
        resolve();
      };

      // Handle both immediate and async voice loading
      if (speechSynthesis.getVoices().length) {
        loadVoices();
      } else {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    });
  }

  startListeningForActivation() {
    this.isListening = false;
    this.hasQuery = false;
    this.updateWaveColor(0xff0000); // Red
    const infoElement = document.querySelector('#info');
    infoElement.textContent = 'Say "fox" to activate';
    infoElement.className = 'listening-activation';
    try {
      console.log('Starting activation listening...');
      this.recognition.stop(); // Make sure it's stopped first
      setTimeout(() => {
        this.recognition.start();
      }, 100);
    } catch (error) {
      console.error('Error starting activation listening:', error);
    }
  }

  startListeningForQuery() {
    this.isListening = true;
    this.hasQuery = false;
    this.updateWaveColor(0x0088ff); // Blue
    const infoElement = document.querySelector('#info');
    infoElement.textContent = 'Listening for your query...';
    infoElement.className = 'listening-query';
    try {
      console.log('Starting query listening...');
      this.recognition.start();
    } catch (error) {
      console.error('Error starting query listening:', error);
    }
  }

  async sendQuery(query) {
    try {
      this.isProcessing = true;
      this.updateWaveColor(0xffff00); // Yellow
      const infoElement = document.querySelector('#info');
      infoElement.textContent = 'Processing...';
      infoElement.className = 'processing';
      console.log('Sending query:', query);
      
      // Stop recognition while processing
      this.recognition.stop();
      
      const response = await axios.post('http://localhost:8000/query', {
        name: this.documentName,
        query: query
      });

      console.log('Received response:', response.data.response);
      this.speakResponse(response.data.response);
    } catch (error) {
      console.error('Error:', error);
      this.speakResponse('Sorry, there was an error processing your request.');
    } finally {
      this.isProcessing = false;
    }
  }

  async speakResponse(text) {
    this.isSpeaking = true;
    this.updateWaveColor(0x00ff00); // Green
    const infoElement = document.querySelector('#info');
    infoElement.textContent = 'Speaking...';
    infoElement.className = 'speaking';
    console.log('Speaking response:', text);
    
    this.waveFrequency = 1;
    this.waveAmplitude = 0.4;

    return new Promise((resolve) => {
      // Split text into smaller chunks if it's too long
      const chunks = this.splitTextIntoChunks(text);
      let currentChunk = 0;

      const speakChunk = () => {
        if (currentChunk >= chunks.length) {
          this.isSpeaking = false;
          this.waveFrequency = 0.5;
          this.waveAmplitude = 0.2;
          this.startListeningForActivation();
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
        if (this.voice) {
          utterance.voice = this.voice;
        }
        
        utterance.onstart = () => {
          console.log('Speech synthesis started for chunk:', currentChunk + 1);
        };
        
        utterance.onend = () => {
          console.log('Speech synthesis ended for chunk:', currentChunk + 1);
          currentChunk++;
          // Small delay between chunks
          setTimeout(speakChunk, 100);
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          if (event.error === 'not-allowed') {
            console.log('Attempting to recover from not-allowed error...');
            // Try to restart synthesis after a small delay
            setTimeout(() => {
              this.synthesis.cancel(); // Clear any pending speech
              speakChunk(); // Try again
            }, 100);
          }
        };

        try {
          this.synthesis.speak(utterance);
        } catch (error) {
          console.error('Error in speak:', error);
        }
      };

      // Start speaking chunks
      speakChunk();
    });
  }

  // Helper method to split text into smaller chunks
  splitTextIntoChunks(text, maxLength = 200) {
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = '';

    for (const word of words) {
      if (currentChunk.length + word.length + 1 <= maxLength) {
        currentChunk += (currentChunk ? ' ' : '') + word;
      } else {
        chunks.push(currentChunk);
        currentChunk = word;
      }
    }
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    return chunks;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.updateWave();
    this.updateSoundWave(); // Add sound wave update
    this.updateSpaceEnvironment();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application
new VoiceAssistant();