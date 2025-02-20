/**
 * @component AdvancedVisualizer
 * @description High-performance audio visualization with multiple modes
 * Features:
 * - Mobile-first design with touch optimization
 * - Hardware-accelerated graphics using WebGL
 * - Multiple visualization styles
 * - Adaptive performance based on device capabilities
 * - Smooth animations and transitions
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { Box, useTheme, useBreakpointValue } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
} from '@react-three/postprocessing'
import { useSpring, a } from '@react-spring/three'
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer'

// Performance optimization settings based on device capability
const QUALITY_SETTINGS = {
  high: {
    particleCount: 2000,
    fftSize: 2048,
    postProcessing: true,
    smoothingTimeConstant: 0.8,
  },
  medium: {
    particleCount: 1000,
    fftSize: 1024,
    postProcessing: true,
    smoothingTimeConstant: 0.7,
  },
  low: {
    particleCount: 500,
    fftSize: 512,
    postProcessing: false,
    smoothingTimeConstant: 0.6,
  },
}

/**
 * @component ParticleSystem
 * @description GPU-accelerated particle system for audio visualization
 */
const ParticleSystem = React.memo(({ audioData, quality, color }) => {
  const { gl, camera, size } = useThree()
  const pointsRef = useRef()
  const gpuCompute = useRef()
  const settings = QUALITY_SETTINGS[quality]

  // Initialize GPU computation
  useEffect(() => {
    const WIDTH = 128
    const gpuRenderer = new GPUComputationRenderer(WIDTH, WIDTH, gl)
    
    // Position computation shader
    const positionShader = `
      uniform float time;
      uniform float audioData[64];
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 pos = texture2D(texturePosition, uv).xyz;
        
        // Audio-reactive movement
        float audioIndex = floor(uv.x * 64.0);
        float audioValue = audioData[int(audioIndex)];
        
        pos.y += sin(time * 0.5 + pos.x) * audioValue * 0.1;
        pos.z += cos(time * 0.3 + pos.x) * audioValue * 0.1;
        
        gl_FragColor = vec4(pos, 1.0);
      }
    `

    const positionVariable = gpuRenderer.addVariable(
      'texturePosition',
      positionShader,
      initPositions()
    )

    gpuRenderer.init()
    gpuCompute.current = gpuRenderer

    return () => {
      gpuCompute.current.dispose()
    }
  }, [gl])

  // Initialize particle positions
  const initPositions = useCallback(() => {
    const positions = new Float32Array(settings.particleCount * 3)
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10
      positions[i + 1] = (Math.random() - 0.5) * 10
      positions[i + 2] = (Math.random() - 0.5) * 10
    }
    return positions
  }, [settings.particleCount])

  // Update particles
  useFrame(({ clock }) => {
    if (!pointsRef.current || !gpuCompute.current) return

    // Update GPU computation
    gpuCompute.current.compute()

    // Update particle positions
    const positions = pointsRef.current.geometry.attributes.position.array
    const positionTexture = gpuCompute.current.getCurrentRenderTarget().texture

    for (let i = 0; i < positions.length; i += 3) {
      const audioIndex = Math.floor(i / 3) % audioData.length
      const audioValue = audioData[audioIndex]

      positions[i + 1] += Math.sin(clock.elapsedTime + positions[i]) * audioValue * 0.01
      positions[i + 2] += Math.cos(clock.elapsedTime + positions[i]) * audioValue * 0.01
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attachObject={['attributes', 'position']}
          count={settings.particleCount}
          array={initPositions()}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        sizeAttenuation={true}
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
})

/**
 * @component WaveformMesh
 * @description Smooth waveform visualization
 */
const WaveformMesh = React.memo(({ audioData, color }) => {
  const meshRef = useRef()

  useFrame(() => {
    if (!meshRef.current) return

    const positions = meshRef.current.geometry.attributes.position.array
    const vertexCount = positions.length / 3

    for (let i = 0; i < vertexCount; i++) {
      const audioIndex = Math.floor((i / vertexCount) * audioData.length)
      const audioValue = audioData[audioIndex]

      positions[i * 3 + 1] = audioValue * 2
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[10, 2, 128, 1]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
})

/**
 * @component CircularVisualizer
 * @description Circular frequency visualization
 */
const CircularVisualizer = React.memo(({ audioData, color }) => {
  const meshRef = useRef()
  const { radius, segments } = useMemo(() => ({
    radius: 2,
    segments: 64,
  }), [])

  useFrame(() => {
    if (!meshRef.current) return

    const positions = meshRef.current.geometry.attributes.position.array
    const vertexCount = positions.length / 3

    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / segments) * Math.PI * 2
      const audioIndex = Math.floor((i / vertexCount) * audioData.length)
      const audioValue = audioData[audioIndex]

      const r = radius + audioValue
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = Math.sin(angle) * r
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[radius, segments]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
})

/**
 * @component AdvancedVisualizer
 * @description Main visualizer component with touch controls and responsive design
 */
const AdvancedVisualizer = ({
  audioData = new Float32Array(128),
  isPlaying = false,
  mode = 'particles',
  color = '#00ffff',
  height = '100%',
  width = '100%',
  onModeChange,
  style,
}) => {
  // Detect device capabilities
  const quality = useBreakpointValue({
    base: 'low',
    md: 'medium',
    lg: 'high',
  })

  // Touch interaction handling
  const [touchStartPos, setTouchStartPos] = useState(null)
  const canvasRef = useRef()

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchStartPos) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartPos.x
    const deltaY = touch.clientY - touchStartPos.y

    // Use deltas for interaction (e.g., rotating visualization)
    if (canvasRef.current) {
      canvasRef.current.rotation.y += deltaX * 0.01
      canvasRef.current.rotation.x += deltaY * 0.01
    }

    setTouchStartPos({ x: touch.clientX, y: touch.clientY })
  }, [touchStartPos])

  const handleTouchEnd = useCallback(() => {
    setTouchStartPos(null)
  }, [])

  return (
    <Box
      width={width}
      height={height}
      position="relative"
      overflow="hidden"
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      css={{
        '& canvas': {
          touchAction: 'none',
        },
      }}
    >
      <Canvas
        ref={canvasRef}
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, quality === 'high' ? 2 : 1.5]}
        performance={{ min: 0.5 }}
      >
        <AnimatePresence mode="wait">
          {mode === 'particles' && (
            <ParticleSystem
              audioData={audioData}
              quality={quality}
              color={color}
            />
          )}
          {mode === 'waveform' && (
            <WaveformMesh
              audioData={audioData}
              color={color}
            />
          )}
          {mode === 'circular' && (
            <CircularVisualizer
              audioData={audioData}
              color={color}
            />
          )}
        </AnimatePresence>

        {QUALITY_SETTINGS[quality].postProcessing && (
          <EffectComposer>
            <Bloom
              intensity={1.5}
              luminanceThreshold={0.6}
              luminanceSmoothing={0.9}
            />
            <ChromaticAberration
              offset={[0.002, 0.002]}
            />
            <Noise opacity={0.1} />
          </EffectComposer>
        )}

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
      </Canvas>
    </Box>
  )
}

export default React.memo(AdvancedVisualizer) 