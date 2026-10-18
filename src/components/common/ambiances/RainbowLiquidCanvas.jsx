import { useEffect, useRef } from 'react'

const BLOBS = [
  { color: '#fec644', size: 78, top: -20, left: -14, duration: 20, delay: -4, opacity: 0.97 },
  { color: '#43b9ef', size: 72, top: 22, left: 18, duration: 25, delay: -9, opacity: 0.94 },
  { color: '#f87171', size: 66, top: -16, left: 50, duration: 19, delay: -5, opacity: 0.95 },
  { color: '#9fe060', size: 70, top: 42, left: 56, duration: 27, delay: -13, opacity: 0.93 },
  { color: '#958ef8', size: 68, top: 54, left: 2, duration: 24, delay: -16, opacity: 0.93 },
  { color: '#3ad5c6', size: 72, top: -2, left: 26, duration: 21, delay: -7, opacity: 0.94 },
  { color: '#f472b6', size: 62, top: 60, left: 36, duration: 26, delay: -11, opacity: 0.9 },
  { color: '#a3e635', size: 70, top: 18, left: 80, duration: 20, delay: -2, opacity: 0.93 },
  { color: '#818cf8', size: 58, top: 2, left: 64, duration: 22, delay: -6, opacity: 0.89 },
  { color: '#22d3ee', size: 60, top: 64, left: 68, duration: 25, delay: -12, opacity: 0.89 },
  { color: '#e879f9', size: 54, top: 30, left: 44, duration: 21, delay: -8, opacity: 0.87 },
  { color: '#fb9b56', size: 56, top: 72, left: 20, duration: 24, delay: -3, opacity: 0.87 },
  { color: '#fca74e', size: 58, top: -6, left: 40, duration: 23, delay: -10, opacity: 0.9 },
  { color: '#6ee787', size: 56, top: 30, left: 66, duration: 26, delay: -15, opacity: 0.88 },
  { color: '#799bfb', size: 54, top: 46, left: 22, duration: 22, delay: -18, opacity: 0.88 },
  { color: '#d07df0', size: 52, top: 8, left: 34, duration: 24, delay: -14, opacity: 0.86 },
  { color: '#38c6dd', size: 56, top: 76, left: 50, duration: 21, delay: -6, opacity: 0.88 },
  { color: '#f97e68', size: 52, top: 66, left: 6, duration: 25, delay: -17, opacity: 0.87 },
  { color: '#b285f5', size: 50, top: 54, left: 76, duration: 23, delay: -19, opacity: 0.86 },
  { color: '#fdd843', size: 48, top: -8, left: 6, duration: 27, delay: -21, opacity: 0.88 },
]

const GRADIENT_STOPS = [
  '#f87171',
  '#fb9b56',
  '#fec644',
  '#9fe060',
  '#3ad5c6',
  '#43b9ef',
  '#958ef8',
  '#f472b6',
]

const VERT_SRC = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

const FRAG_SRC = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform float u_aspect;
uniform vec4 u_bp[20];
uniform vec3 u_col[20];
uniform vec3 u_grad[8];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

vec3 rainbow(float t) {
  t = fract(t) * 8.0;
  vec3 c = u_grad[0];
  c = mix(c, u_grad[1], clamp(t, 0.0, 1.0));
  c = mix(c, u_grad[2], clamp(t - 1.0, 0.0, 1.0));
  c = mix(c, u_grad[3], clamp(t - 2.0, 0.0, 1.0));
  c = mix(c, u_grad[4], clamp(t - 3.0, 0.0, 1.0));
  c = mix(c, u_grad[5], clamp(t - 4.0, 0.0, 1.0));
  c = mix(c, u_grad[6], clamp(t - 5.0, 0.0, 1.0));
  c = mix(c, u_grad[7], clamp(t - 6.0, 0.0, 1.0));
  c = mix(c, u_grad[0], clamp(t - 7.0, 0.0, 1.0));
  return c;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  uv.y = 1.0 - uv.y;
  vec2 q = vec2(uv.x * u_aspect, uv.y);
  float t = u_time;

  vec2 center = vec2(u_aspect * 0.5, 0.5);
  q = center + (q - center) * (1.0 + 0.025 * sin(t * 0.09));

  vec2 n1 = vec2(
    vnoise(q * 2.9 + vec2(t * 0.075, -t * 0.06)),
    vnoise(q * 2.9 + vec2(5.2 + t * 0.065, 7.7 - t * 0.055))
  );
  float n2 = vnoise(q * 1.8 + (n1 - 0.5) * 1.6 + vec2(t * 0.05, 3.3));
  float n3 = vnoise(q * 4.4 + vec2(-t * 0.08, 8.4 + t * 0.07));
  float s2 = (n2 - 0.5) * 2.0;
  vec2 warp = (n1 - 0.5) * 0.36 + (n3 - 0.5) * 0.16 + s2 * s2 * s2 * 0.38;
  vec2 pw = q + warp;

  vec3 col = rainbow(uv.x * 0.42 + uv.y * 0.18 + 0.12 * sin(t * 0.1));
  float alpha = 0.8;

  for (int i = 0; i < 20; i++) {
    vec4 bp = u_bp[i];
    float d = length(pw - bp.xy) - bp.z;
    float aa = 0.0022;
#ifdef HAS_DERIVATIVES
    aa = clamp(fwidth(d) * 1.4, 0.0018, 0.005);
#endif
    float inside = 1.0 - smoothstep(-aa, aa, d);
    float w = inside * bp.w;
    col = mix(col, u_col[i], w);
    alpha = mix(alpha, 1.0, w);
    float rim = smoothstep(-aa * 3.5, -aa * 0.8, d) * (1.0 - smoothstep(-aa * 0.8, 0.0, d));
    col = mix(col, vec3(1.0), rim * bp.w * 0.07);
  }

  col += (hash(gl_FragCoord.xy * 0.7) - 0.5) * 0.024;

  vec2 vc = (uv - vec2(0.5, 0.45)) * vec2(1.0, 0.9);
  col *= 1.0 - 0.10 * smoothstep(0.42, 0.95, length(vc));

  gl_FragColor = vec4(col * alpha, alpha);
}
`

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

const FALLBACK_BG = `linear-gradient(100deg, ${GRADIENT_STOPS.join(', ')})`

const compileShader = (gl, type, src) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[RainbowLiquid] shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

export default function RainbowLiquidCanvas({ maskId }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const attrs = {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    }
    const gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs)

    if (!gl) {
      canvas.style.background = FALLBACK_BG
      canvas.style.opacity = '0.8'
      return undefined
    }

    const hasDerivatives = !!gl.getExtension('OES_standard_derivatives')
    const fragSrc =
      (hasDerivatives ? '#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVATIVES\n' : '') +
      FRAG_SRC

    let disposed = false
    let raf = 0
    let program = null
    let loc = null

    const motion = BLOBS.map((b) => {
      const w1 = (Math.PI * 2) / b.duration
      return { w1, ph: -b.delay * w1 }
    })
    const state = BLOBS.map((b) => ({ x: 0, y: 0, radius: 0, opacity: b.opacity }))
    const bp = new Float32Array(BLOBS.length * 4)

    const setup = () => {
      const vs = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC)
      const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc)
      if (!vs || !fs) return false

      program = gl.createProgram()
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.linkProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn('[RainbowLiquid] program link error:', gl.getProgramInfoLog(program))
        program = null
        return false
      }

      const buffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      )

      gl.useProgram(program)
      const aPos = gl.getAttribLocation(program, 'a_pos')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      loc = {
        res: gl.getUniformLocation(program, 'u_res'),
        time: gl.getUniformLocation(program, 'u_time'),
        aspect: gl.getUniformLocation(program, 'u_aspect'),
        bp: gl.getUniformLocation(program, 'u_bp[0]'),
        col: gl.getUniformLocation(program, 'u_col[0]'),
        grad: gl.getUniformLocation(program, 'u_grad[0]'),
      }

      const col = new Float32Array(BLOBS.length * 3)
      BLOBS.forEach((b, i) => col.set(hexToRgb(b.color), i * 3))
      gl.uniform3fv(loc.col, col)

      const grad = new Float32Array(24)
      GRADIENT_STOPS.forEach((c, i) => grad.set(hexToRgb(c), i * 3))
      gl.uniform3fv(loc.grad, grad)

      return true
    }

    const updateLayout = () => {
      const parent = canvas.parentElement
      if (!parent || !program) return
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (!w || !h) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(program)

      const aspect = w / h
      gl.uniform1f(loc.aspect, aspect)
      gl.uniform2f(loc.res, canvas.width, canvas.height)

      BLOBS.forEach((b, i) => {
        state[i].radius = (b.size / 200) * aspect
        state[i].x = ((b.left + b.size / 2) / 100) * aspect
        state[i].y = (b.top + (b.size * aspect) / 2) / 100
      })
    }

    if (!setup()) {
      canvas.style.background = FALLBACK_BG
      canvas.style.opacity = '0.8'
      return undefined
    }

    const renderFrame = (t) => {
      gl.uniform1f(loc.time, t)
      for (let i = 0; i < BLOBS.length; i++) {
        const m = motion[i]
        const s = state[i]
        const amp = s.radius * 0.5
        bp[i * 4] = s.x + amp * Math.sin(t * m.w1 + m.ph)
        bp[i * 4 + 1] = s.y + amp * Math.cos(t * m.w1 * 0.83 + m.ph * 1.61)
        bp[i * 4 + 2] = s.radius * (1 + 0.11 * Math.sin(t * m.w1 * 1.27 + m.ph * 2.3))
        bp[i * 4 + 3] = s.opacity
      }
      gl.uniform4fv(loc.bp, bp)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const refresh = () => {
      updateLayout()
      if (reducedMotion) renderFrame(0)
    }

    refresh()

    const ro = new ResizeObserver(refresh)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    let running = false
    let simT = 0
    let lastNow = 0

    const frame = (now) => {
      if (disposed || !running) return
      const dt = Math.min((now - lastNow) / 1000, 0.1)
      lastNow = now
      simT += dt * 2.2
      renderFrame(simT)
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (running || disposed) return
      running = true
      lastNow = performance.now()
      raf = requestAnimationFrame(frame)
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    let io = null
    if (!reducedMotion) {
      io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) start()
        else stop()
      })
      io.observe(canvas)
    }

    const onLost = (e) => e.preventDefault()
    canvas.addEventListener('webglcontextlost', onLost)

    return () => {
      disposed = true
      stop()
      ro.disconnect()
      if (io) io.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      const lose = gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
    }
  }, [])

  const canvasStyle = maskId
    ? {
        WebkitMaskImage: `url(#${maskId})`,
        maskImage: `url(#${maskId})`,
      }
    : undefined

  return (
    <canvas
      ref={canvasRef}
      className="rc-liquid-canvas"
      style={canvasStyle}
      aria-hidden="true"
    />
  )
}
