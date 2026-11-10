import * as THREE from 'three'
import Experience from '../Experience.js'

export default class AudioCore {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.audio = this.experience.audio
    this.time = this.experience.time
    this.debug = this.experience.debug

    this.displacementStrength = 0.85
    this.noiseSpeed = 0.9
    this.coreBaseScale = 1.0
    this.rotationSpeed = 1.0

    this.setGeometry()
    this.setMaterial()
    this.setMesh()
    this.setInnerCore()
    this.setWireframeCage()
    this.setDebug()
  }

  setGeometry() {
    this.geometry = new THREE.IcosahedronGeometry(2.2, 32)
  }

  setMaterial() {
    // Custom Shader with Simplex Noise vertex displacement
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

        // 3D Simplex-like pseudo noise
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

          // Multi-frequency noise sampling
          vec3 noisePos = position * 0.9 + vec3(uTime * 0.4);
          float lowNoise = snoise(noisePos);
          float highNoise = snoise(position * 3.0 + vec3(uTime * 0.8));

          // Heavy displacement from bass, fast ripples from treble
          float displacement = (lowNoise * (0.3 + uBass * 1.4) + highNoise * (0.1 + uTreble * 0.4)) * uDisplacement;
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

        void main() {
          // Fresnel rim lighting
          vec3 viewDirection = normalize(-vPosition);
          float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 2.5);

          // Color blending based on displacement height and fresnel
          float mixFactor = clamp((vDisplacement + 0.4) * 0.8, 0.0, 1.0);
          vec3 baseColor = mix(uColorA, uColorB, mixFactor);

          // Boost glow at edges and displacement peaks
          vec3 finalColor = baseColor + (uColorA * fresnel * (1.2 + uBass * 1.5));

          gl_FragColor = vec4(finalColor, 0.92);
        }
      `
    })
  }

  setMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  setInnerCore() {
    // Glowing internal sphere
    const innerGeo = new THREE.SphereGeometry(1.2, 24, 24)
    this.innerMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      wireframe: false
    })
    this.innerMesh = new THREE.Mesh(innerGeo, this.innerMat)
    this.scene.add(this.innerMesh)
  }

  setWireframeCage() {
    // Outer rotating sci-fi cage
    const cageGeo = new THREE.IcosahedronGeometry(3.6, 1)
    this.cageMat = new THREE.MeshBasicMaterial({
      color: '#00f0ff',
      wireframe: true,
      transparent: true,
      opacity: 0.25
    })
    this.cageMesh = new THREE.Mesh(cageGeo, this.cageMat)
    this.scene.add(this.cageMesh)
  }

  updateTheme(theme) {
    this.material.uniforms.uColorA.value.set(theme.primary)
    this.material.uniforms.uColorB.value.set(theme.secondary)
    this.cageMat.color.set(theme.primary)
  }

  setDebug() {
    if (this.debug.active) {
      const folder = this.debug.ui.addFolder('Audio Core (Central Entity)')
      folder.add(this.material, 'wireframe').name('Wireframe Core')
      folder.add(this.material.uniforms.uDisplacement, 'value', 0.1, 3.0, 0.05).name('Displacement (Waves)')
      folder.add(this, 'coreBaseScale', 0.5, 2.5, 0.1).name('Core Base Size')
      folder.add(this, 'rotationSpeed', 0, 4.0, 0.1).name('Rotation Speed')
      folder.add(this, 'noiseSpeed', 0.1, 3.0, 0.1).name('Noise Frequency')
      folder.add(this.cageMesh, 'visible').name('Outer Cage Visible')
    }
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

    // Slow organic rotation scaled by user rotationSpeed
    this.mesh.rotation.y = elapsed * 0.15 * this.rotationSpeed
    this.mesh.rotation.x = elapsed * 0.08 * this.rotationSpeed

    // Base mesh scaling
    this.mesh.scale.set(this.coreBaseScale, this.coreBaseScale, this.coreBaseScale)

    // Inner core scales with bass
    const coreScale = (1.0 + bass * 0.65) * this.coreBaseScale
    this.innerMesh.scale.set(coreScale, coreScale, coreScale)

    // Outer cage counter-rotation and beat pulse
    this.cageMesh.rotation.y = -elapsed * 0.25 * this.rotationSpeed
    this.cageMesh.rotation.z = elapsed * 0.12 * this.rotationSpeed
    const cageScale = (1.0 + bass * 0.18) * this.coreBaseScale
    this.cageMesh.scale.set(cageScale, cageScale, cageScale)
    this.cageMat.opacity = 0.2 + bass * 0.35
  }

  destroy() {
    this.geometry.dispose()
    this.material.dispose()
    this.innerMesh.geometry.dispose()
    this.innerMat.dispose()
    this.cageMesh.geometry.dispose()
    this.cageMat.dispose()
  }
}

