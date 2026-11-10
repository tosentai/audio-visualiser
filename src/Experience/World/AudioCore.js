import * as THREE from 'three'
import Experience from '../Experience.js'

export default class AudioCore {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio
    this.time = this.experience.time
    this.debug = this.experience.debug

    // Balanced base dimensions
    this.displacementStrength = 1.0
    this.noiseSpeed = 0.95
    this.coreBaseScale = 1.0
    this.rotationSpeed = 0.85

    // Spring physics for punchy, rhythmic breathing
    this.currentScale = 1.0
    this.scaleVelocity = 0
    this.cageRotation = 0

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.setInnerNucleus()
    this.setWireframeCage()
  }

  setGeometry() {
    // Normal balanced start radius (1.6)
    this.geometry = new THREE.IcosahedronGeometry(1.6, 36)
  }

  setMaterial() {
    this.material = new THREE.ShaderMaterial({
      wireframe: false,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uColorA: { value: new THREE.Color('#00f0ff') },
        uColorB: { value: new THREE.Color('#ff007f') },
        uDisplacement: { value: this.displacementStrength }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uDisplacement;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        varying float vRayIntensity;

        // 3D Simplex noise
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

        float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;

          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

          i = mod(i, 289.0 );
          vec4 p = permute( permute( permute(
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vNormal = normal;
          vPosition = position;

          // Radial energy ray noise calculation
          vec3 rayPos = position * 1.4 + vec3(uTime * 0.45);
          float n1 = snoise(rayPos);
          float n2 = snoise(position * 3.5 - vec3(uTime * 0.8));

          // Sharpen into distinct energetic rays/spikes ("лучи")
          float raySpikes = pow(max(0.0, n1 + 0.35), 2.4);
          vRayIntensity = raySpikes;

          // Huge pulsation: on beats, rays burst outwards violently!
          float rayPulse = raySpikes * (0.15 + pow(uBass, 1.35) * 3.6);
          float ripple = n2 * (0.04 + uTreble * 0.25);

          float displacement = (rayPulse + ripple) * uDisplacement;
          vDisplacement = displacement;

          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uBass;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        varying float vRayIntensity;

        void main() {
          vec3 viewDirection = normalize(-vPosition);
          float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 2.2);

          // Deep sleek crystal base color in crevasses (prevents white blowout)
          vec3 deepBody = mix(vec3(0.04, 0.05, 0.12), uColorA * 0.35, vRayIntensity);

          // Vivid saturated neon on rays and spikes
          vec3 rayGlow = mix(uColorA, uColorB, clamp(vRayIntensity * 1.2, 0.0, 1.0));

          // Blend body into glowing rays
          vec3 finalColor = mix(deepBody, rayGlow * (1.2 + uBass * 1.2), clamp(vRayIntensity * 1.4, 0.0, 1.0));

          // Sharp neon rim lighting
          finalColor += uColorA * fresnel * (0.7 + uBass * 0.9);

          gl_FragColor = vec4(finalColor, 0.95);
        }
      `
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  setInnerNucleus() {
    // Small dark-energy nucleus (not blinding white)
    const nucleusGeo = new THREE.SphereGeometry(0.75, 24, 24)
    this.nucleusMat = new THREE.MeshBasicMaterial({
      color: '#080d20',
      wireframe: false
    })
    this.nucleusMesh = new THREE.Mesh(nucleusGeo, this.nucleusMat)
    this.scene.add(this.nucleusMesh)
  }

  setWireframeCage() {
    // Outer rotating sci-fi cage (balanced radius)
    const cageGeo = new THREE.IcosahedronGeometry(2.6, 1)
    this.cageMat = new THREE.MeshBasicMaterial({
      color: '#00f0ff',
      wireframe: true,
      transparent: true,
      opacity: 0.18
    })
    this.cageMesh = new THREE.Mesh(cageGeo, this.cageMat)
    this.scene.add(this.cageMesh)
  }

  updateTheme(theme) {
    this.material.uniforms.uColorA.value.set(theme.primary)
    this.material.uniforms.uColorB.value.set(theme.secondary)
    this.cageMat.color.set(theme.primary)
  }

  update() {
    const elapsed = this.time.elapsed
    const bass = this.audio.bass
    const mid = this.audio.mid
    const treble = this.audio.treble

    // Update shader uniforms
    this.material.uniforms.uTime.value = elapsed * this.noiseSpeed
    this.material.uniforms.uBass.value = bass
    this.material.uniforms.uMid.value = mid
    this.material.uniforms.uTreble.value = treble

    // Beat kick impulse: punches out the rays and core cleanly
    if (this.audio.isBeat) {
      this.scaleVelocity += 0.35 + this.audio.beatIntensity * 0.7
      this.cageRotation += (Math.random() - 0.5) * 1.2
    }

    // Spring physics: normal scale 0.9x when quiet, expands to 1.7x on drops
    const targetScale = (0.85 + Math.pow(bass, 1.25) * 0.9) * this.coreBaseScale
    const springForce = (targetScale - this.currentScale) * 0.32
    this.scaleVelocity = (this.scaleVelocity + springForce) * 0.75
    this.currentScale += this.scaleVelocity
    this.currentScale = Math.max(0.6, Math.min(2.4, this.currentScale))

    // Apply scale to core
    this.mesh.scale.set(this.currentScale, this.currentScale, this.currentScale)

    // Smooth organic rotation
    this.mesh.rotation.y = elapsed * 0.18 * this.rotationSpeed
    this.mesh.rotation.x = elapsed * 0.10 * this.rotationSpeed

    // Nucleus scales subtly inside
    const nucleusScale = (0.8 + bass * 0.45) * this.currentScale
    this.nucleusMesh.scale.set(nucleusScale, nucleusScale, nucleusScale)

    // Cage scales and turns cleanly
    const cageScale = this.currentScale * (1.1 + bass * 0.25)
    this.cageMesh.scale.set(cageScale, cageScale, cageScale)
    this.cageMesh.rotation.y = -elapsed * 0.22 * this.rotationSpeed + this.cageRotation
    this.cageMesh.rotation.z = elapsed * 0.12 * this.rotationSpeed
    this.cageRotation *= 0.92
    this.cageMat.opacity = 0.12 + bass * 0.35
  }

  destroy() {
    this.geometry.dispose()
    this.material.dispose()
    this.nucleusMesh.geometry.dispose()
    this.nucleusMat.dispose()
    this.cageMesh.geometry.dispose()
    this.cageMat.dispose()
  }
}
