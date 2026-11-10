import * as THREE from 'three'
import Experience from '../Experience.js'

export default class ParticleUniverse {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio
    this.time = this.experience.time
    this.debug = this.experience.debug

    this.count = 12000
    this.expansion = 0
    this.particleSize = 1.0
    this.swirlSpeed = 1.0
    this.shockwaveForce = 1.35

    this.setGeometry()
    this.setMaterial()
    this.setPoints()
    this.setDebug()
  }

  setGeometry() {
    this.geometry = new THREE.BufferGeometry()

    this.positions = new Float32Array(this.count * 3)
    this.basePositions = new Float32Array(this.count * 3)
    this.colors = new Float32Array(this.count * 3)
    this.scales = new Float32Array(this.count)

    const color1 = new THREE.Color('#00f0ff')
    const color2 = new THREE.Color('#ff007f')

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3

      // Spherical distribution with logarithmic density near center
      const radius = 3.5 + Math.pow(Math.random(), 2.2) * 28.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi)

      this.positions[i3] = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z

      this.basePositions[i3] = x
      this.basePositions[i3 + 1] = y
      this.basePositions[i3 + 2] = z

      // Color gradient
      const mixedColor = color1.clone().lerp(color2, Math.random())
      this.colors[i3] = mixedColor.r
      this.colors[i3 + 1] = mixedColor.g
      this.colors[i3 + 2] = mixedColor.b

      this.scales[i] = Math.random() * 1.5 + 0.5
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('aScale', new THREE.BufferAttribute(this.scales, 1))
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
        uPixelRatio: { value: this.experience.sizes.pixelRatio }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uTreble;
        uniform float uPixelRatio;

        attribute float aScale;
        varying vec3 vColor;

        void main() {
          vColor = color;

          vec3 pos = position;

          // Subtle vortex twist
          float angle = length(pos.xz) * 0.05 + uTime * 0.1;
          float s = sin(angle);
          float c = cos(angle);
          pos.x = pos.x * c - pos.z * s;
          pos.z = pos.x * s + pos.z * c;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Size attenuation with audio boost
          gl_PointSize = aScale * (12.0 + uBass * 18.0 + uTreble * 8.0) * uPixelRatio;
          gl_PointSize *= (1.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          // Circular particle with soft glow falloff
          float dist = distance(gl_PointCoord, vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.05, dist);
          gl_FragColor = vec4(vColor, alpha * 0.85);
        }
      `
    })
  }

  setDebug() {
    if (this.debug.active) {
      const folder = this.debug.ui.addFolder('Cosmic Particles')
      folder.add(this, 'particleSize', 0.2, 3.0, 0.1).name('Particle Size').onChange((val) => {
        this.material.uniforms.uPixelRatio.value = this.experience.sizes.pixelRatio * val
      })
      folder.add(this, 'swirlSpeed', 0, 4.0, 0.1).name('Swirl Speed')
      folder.add(this, 'shockwaveForce', 1.05, 2.0, 0.05).name('Beat Shockwave Force')
    }
  }

  setPoints() {
    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  updateTheme(theme) {
    const colA = new THREE.Color(theme.primary)
    const colB = new THREE.Color(theme.secondary)

    const colors = this.geometry.attributes.color.array
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const mixed = colA.clone().lerp(colB, Math.random())
      colors[i3] = mixed.r
      colors[i3 + 1] = mixed.g
      colors[i3 + 2] = mixed.b
    }
    this.geometry.attributes.color.needsUpdate = true
  }

  update() {
    const elapsed = this.time.elapsed
    const bass = this.audio.bass
    const treble = this.audio.treble

    this.material.uniforms.uTime.value = elapsed
    this.material.uniforms.uBass.value = bass
    this.material.uniforms.uTreble.value = treble

    // Slowly rotate galaxy scaled by swirlSpeed
    this.points.rotation.y = elapsed * 0.04 * this.swirlSpeed

    // Push particles out during heavy beat drops
    if (this.audio.isBeat) {
      this.expansion = this.shockwaveForce
      this.experience.camera.shake(0.08)
    } else {
      this.expansion += (1.0 - this.expansion) * 0.08
    }

    this.points.scale.set(this.expansion, this.expansion, this.expansion)
  }

  destroy() {
    this.geometry.dispose()
    this.material.dispose()
  }
}

