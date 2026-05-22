"use client";
import React, { useRef, useEffect } from "react";
import ShaderBackground from "@/components/ui/shader-background";

// ── Types ─────────────────────────────────────────────────────────────────────
interface HeroProps {
  trustBadge?: { text: string; icon?: string };
  headline: { line1: string; line2: string };
  subtitle: string;
  buttons?: {
    primary?: { text: string; onClick?: () => void };
    secondary?: { text: string; onClick?: () => void };
  };
  stats?: { value: string; label: string }[];
  className?: string;
}

// ── Shader source (warm fire / amber atmosphere) ───────────────────────────
const SHADER_SRC = `#version 300 es
precision highp float;
out vec4 O;
uniform vec2 resolution;
uniform float time;
#define FC gl_FragCoord.xy
#define T time
#define R resolution
#define MN min(R.x,R.y)

float rnd(vec2 p) {
  p = fract(p * vec2(12.9898, 78.233));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}
float noise(in vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
  float a = rnd(i), b = rnd(i + vec2(1,0)), c = rnd(i + vec2(0,1)), d = rnd(i + 1.);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float t = .0, a = 1.; mat2 m = mat2(1., -.5, .2, 1.2);
  for (int i = 0; i < 5; i++) { t += a * noise(p); p *= 2. * m; a *= .5; }
  return t;
}
float clouds(vec2 p) {
  float d = 1., t = .0;
  for (float i = .0; i < 3.; i++) {
    float a = d * fbm(i * 10. + p.x * .2 + .2 * (1. + i) * p.y + d + i * i + p);
    t = mix(t, d, a); d = a; p *= 2. / (i + 1.);
  }
  return t;
}
void main(void) {
  vec2 uv = (FC - .5 * R) / MN, st = uv * vec2(2, 1);
  vec3 col = vec3(0);
  float bg = clouds(vec2(st.x + T * .5, -st.y));
  uv *= 1. - .3 * (sin(T * .2) * .5 + .5);
  for (float i = 1.; i < 12.; i++) {
    uv += .1 * cos(i * vec2(.1 + .01 * i, .8) + i * i + T * .5 + .1 * uv.x);
    vec2 p = uv;
    float d = length(p);
    col += .00125 / d * (cos(sin(i) * vec3(1, 2, 3)) + 1.);
    float b = noise(i + p + bg * 1.731);
    col += .002 * b / length(max(p, vec2(b * p.x * .02, p.y)));
    col = mix(col, vec3(bg * .25, bg * .137, bg * .05), d);
  }
  O = vec4(col, 1);
}`;

// ── WebGL Renderer ─────────────────────────────────────────────────────────
class WebGLRenderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private vs: WebGLShader | null = null;
  private fs: WebGLShader | null = null;
  private buffer: WebGLBuffer | null = null;
  private scale: number;
  private mouseCoords = [0, 0];
  private pointerCoords = [0, 0];
  private nbrOfPointers = 0;
  private moves = [0, 0];

  private readonly VERT = `#version 300 es
precision highp float;
in vec4 position;
void main(){ gl_Position = position; }`;

  constructor(
    private canvas: HTMLCanvasElement,
    scale: number
  ) {
    this.scale = scale;
    this.gl = canvas.getContext("webgl2")!;
    this.gl.viewport(0, 0, canvas.width * scale, canvas.height * scale);
  }

  private compile(shader: WebGLShader, src: string) {
    const gl = this.gl;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      console.error(gl.getShaderInfoLog(shader));
  }

  setup() {
    const gl = this.gl;
    this.vs = gl.createShader(gl.VERTEX_SHADER)!;
    this.fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    this.compile(this.vs, this.VERT);
    this.compile(this.fs, SHADER_SRC);
    this.program = gl.createProgram()!;
    gl.attachShader(this.program, this.vs);
    gl.attachShader(this.program, this.fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(this.program));
  }

  init() {
    const gl = this.gl;
    const prog = this.program!;
    const verts = [-1, 1, -1, -1, 1, 1, 1, -1];
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    (prog as any).resolution = gl.getUniformLocation(prog, "resolution");
    (prog as any).time = gl.getUniformLocation(prog, "time");
    (prog as any).move = gl.getUniformLocation(prog, "move");
    (prog as any).touch = gl.getUniformLocation(prog, "touch");
    (prog as any).pointerCount = gl.getUniformLocation(prog, "pointerCount");
    (prog as any).pointers = gl.getUniformLocation(prog, "pointers");
  }

  updateScale(s: number) {
    this.scale = s;
    this.gl.viewport(0, 0, this.canvas.width * s, this.canvas.height * s);
  }
  updateMouse(c: number[]) { this.mouseCoords = c; }
  updatePointerCount(n: number) { this.nbrOfPointers = n; }
  updatePointerCoords(c: number[]) { this.pointerCoords = c; }
  updateMove(m: number[]) { this.moves = m; }

  render(now = 0) {
    const gl = this.gl;
    const prog = this.program;
    if (!prog || gl.getProgramParameter(prog, gl.DELETE_STATUS)) return;
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.uniform2f((prog as any).resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f((prog as any).time, now * 1e-3);
    gl.uniform2f((prog as any).move, this.moves[0], this.moves[1]);
    gl.uniform2f((prog as any).touch, this.mouseCoords[0], this.mouseCoords[1]);
    gl.uniform1i((prog as any).pointerCount, this.nbrOfPointers);
    gl.uniform2fv((prog as any).pointers, this.pointerCoords);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  reset() {
    const gl = this.gl;
    if (this.program && !gl.getProgramParameter(this.program, gl.DELETE_STATUS)) {
      if (this.vs) { gl.detachShader(this.program, this.vs); gl.deleteShader(this.vs); }
      if (this.fs) { gl.detachShader(this.program, this.fs); gl.deleteShader(this.fs); }
      gl.deleteProgram(this.program);
    }
  }
}

// ── Pointer Handler ────────────────────────────────────────────────────────
class PointerHandler {
  private active = false;
  private pointers = new Map<number, number[]>();
  private lastCoords = [0, 0];
  private _moves = [0, 0];

  constructor(element: HTMLCanvasElement, private scale: number) {
    const map = (x: number, y: number) =>
      [x * this.scale, element.height - y * this.scale];

    element.addEventListener("pointerdown", (e) => {
      this.active = true;
      this.pointers.set(e.pointerId, map(e.clientX, e.clientY));
    });
    element.addEventListener("pointerup", (e) => {
      if (this.pointers.size === 1) this.lastCoords = this.first;
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });
    element.addEventListener("pointerleave", (e) => {
      if (this.pointers.size === 1) this.lastCoords = this.first;
      this.pointers.delete(e.pointerId);
      this.active = this.pointers.size > 0;
    });
    element.addEventListener("pointermove", (e) => {
      if (!this.active) return;
      this.pointers.set(e.pointerId, map(e.clientX, e.clientY));
      this._moves = [this._moves[0] + e.movementX, this._moves[1] + e.movementY];
    });
  }

  get count() { return this.pointers.size; }
  get move() { return this._moves; }
  get coords() {
    return this.pointers.size > 0
      ? Array.from(this.pointers.values()).flat()
      : [0, 0];
  }
  get first() {
    return this.pointers.values().next().value ?? this.lastCoords;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────
function useShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const pointersRef = useRef<PointerHandler | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      rendererRef.current?.updateScale(dpr);
    };

    const loop = (now: number) => {
      const r = rendererRef.current;
      const p = pointersRef.current;
      if (!r || !p) return;
      r.updateMouse(p.first);
      r.updatePointerCount(p.count);
      r.updatePointerCoords(p.coords);
      r.updateMove(p.move);
      r.render(now);
      rafRef.current = requestAnimationFrame(loop);
    };

    rendererRef.current = new WebGLRenderer(canvas, dpr);
    pointersRef.current = new PointerHandler(canvas, dpr);
    rendererRef.current.setup();
    rendererRef.current.init();
    resize();
    rafRef.current = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
      rendererRef.current?.reset();
    };
  }, []);

  return canvasRef;
}

// ── Hero Component ─────────────────────────────────────────────────────────
const AnimatedShaderHero: React.FC<HeroProps> = ({
  trustBadge,
  headline,
  subtitle,
  buttons,
  stats,
  className = "",
}) => {
  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>
      {/* Wave shader background */}
      <ShaderBackground className="absolute inset-0 w-full h-full touch-none" />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white pt-16 px-4">
        {/* Trust badge */}
        {trustBadge && (
          <div className="mb-8 hero-fade-down">
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm backdrop-blur-md"
              style={{
                background: "rgba(37,99,235,0.2)",
                border: "1px solid rgba(147,197,253,0.4)",
              }}
            >
              {trustBadge.icon && (
                <span style={{ color: "#93c5fd" }}>{trustBadge.icon}</span>
              )}
              <span style={{ color: "#e0f2fe" }}>{trustBadge.text}</span>
            </div>
          </div>
        )}

        {/* Headline */}
        <div className="text-center space-y-2 mb-6 max-w-5xl">
          <h1 className="text-5xl md:text-7xl lg:text-[80px] font-bold leading-tight">
            <span
              className="block bg-clip-text text-transparent hero-fade-up hero-delay-200 hero-gradient-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #ffffff, #bfdbfe, #93c5fd, #ffffff)",
              }}
            >
              {headline.line1}
            </span>
            <span
              className="block bg-clip-text text-transparent hero-fade-up hero-delay-400 hero-gradient-text"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #60a5fa, #3b82f6, #93c5fd, #60a5fa)",
              }}
            >
              {headline.line2}
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="max-w-2xl text-center text-lg md:text-xl font-light leading-relaxed hero-fade-up hero-delay-600 mb-10"
          style={{ color: "rgba(224,242,254,0.9)" }}
        >
          {subtitle}
        </p>

        {/* CTAs */}
        {buttons && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center hero-fade-up hero-delay-800">
            {buttons.primary && (
              <button
                onClick={buttons.primary.onClick}
                className="px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                  color: "#fff",
                  boxShadow: "0 4px 24px rgba(37,99,235,0.5)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(37,99,235,0.7)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(37,99,235,0.5)")
                }
              >
                {buttons.primary.text}
              </button>
            )}
            {buttons.secondary && (
              <button
                onClick={buttons.secondary.onClick}
                className="px-8 py-4 rounded-full font-semibold text-base transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(147,197,253,0.4)",
                  color: "#e0f2fe",
                }}
              >
                {buttons.secondary.text}
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div
            className="flex flex-wrap justify-center gap-10 mt-14 hero-fade-up"
            style={{ animationDelay: "1s" }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-1 h-10 rounded-full"
                  style={{ background: "linear-gradient(to bottom, #60a5fa, #2563eb)" }}
                />
                <div>
                  <div
                    className="font-heading text-2xl font-bold leading-none"
                    style={{ color: "#93c5fd" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs font-medium mt-0.5"
                    style={{ color: "rgba(186,230,253,0.7)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom fade to site background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(250,245,238,0.8))",
        }}
      />
    </div>
  );
};

export default AnimatedShaderHero;
