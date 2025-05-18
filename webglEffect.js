// webglEffect.js

// 取得畫布和 WebGL 上下文
const webCanvas = document.getElementById("effectCanvas");
const gl = webCanvas.getContext("webgl");

if (!gl) {
  alert("WebGL not supported");
}

// 粒子資料結構
let particles = [];
const maxParticles = 50;

// 建立粒子效果，起始位置(x, y)
function createParticleEffect(x, y) {
  particles = []; // 每次觸發都重置粒子

  for (let i = 0; i < maxParticles; i++) {
    const angle = (i / maxParticles) * Math.PI * 2; // 均分圓周角度
    const speed = Math.random() * 2 + 2;          // 隨機速度，介於2~4

    particles.push({
      x: x,
      y: y,
      dx: Math.cos(angle) * speed,  // x方向速度分量
      dy: Math.sin(angle) * speed,  // y方向速度分量
      life: 30,                     // 粒子生命值 (用來控制消失)
      initialLife: 35               // 初始生命值，用於計算透明度比例
    });
  }

  // 開始渲染動畫
  requestAnimationFrame(renderParticles);
}

// 渲染粒子，每一幀都呼叫
function renderParticles() {
  // 設定畫面大小和清空畫面 (透明背景)
  gl.viewport(0, 0, webCanvas.width, webCanvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const alphas = [];   // 用來存放每個粒子的透明度
  const positions = []; // 用來存放每個粒子的 x, y 位置（轉換成 WebGL 坐標）

  // 更新粒子位置和生命
  particles.forEach(p => {
    const lifeRatio = p.life / p.initialLife; // 從1慢慢減到0
    // 粒子會依速度與生命比例移動，速度會隨生命衰減
    p.x += p.dx * lifeRatio;
    p.y += p.dy * lifeRatio;

    p.life--; // 生命遞減

    // 透明度隨生命遞減 (1 → 0)
    const alpha = p.life / p.initialLife;

    alphas.push(alpha);

    // 將畫面座標轉換成 WebGL -1~1 的範圍
    positions.push((p.x / webCanvas.width) * 2 - 1);
    positions.push(-((p.y / webCanvas.height) * 2 - 1));
  });

  // 移除生命為0的粒子
  particles = particles.filter(p => p.life > 0);

  // 建立並綁定位置 buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STREAM_DRAW);

  // 建立並綁定透明度 buffer
  const alphaBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(alphas), gl.STREAM_DRAW);

  // 頂點著色器程式碼
  const vsSource = `
    attribute vec2 position;
    attribute float alpha;
    varying float vAlpha;

    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
      vAlpha = alpha;
      gl_PointSize = 15.0 * vAlpha; // 粒子大小隨透明度變化
    }`;

  // 片段著色器程式碼（負責設定粒子顏色和透明度）
  const fsSource = `
    precision mediump float;
    varying float vAlpha;

    void main() {
      vec3 startColor = vec3(1.0, 0.3, 0.0); // 橘色 (起始色)
      vec3 endColor = vec3(1.0, 1.0, 0.0);   // 黃色 (結束色)
      vec3 color = mix(startColor, endColor, vAlpha); // 混合顏色，隨透明度漸變

      gl_FragColor = vec4(color, vAlpha); // 設定顏色與透明度
    }`;

  // 建立並編譯著色器
  const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
  const program = createProgram(vertexShader, fragmentShader);

  gl.useProgram(program);

  // 綁定 position attribute
  const positionLoc = gl.getAttribLocation(program, "position");
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  // 綁定 alpha attribute
  const alphaLoc = gl.getAttribLocation(program, "alpha");
  gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
  gl.enableVertexAttribArray(alphaLoc);
  gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, 0, 0);

  // 繪製所有粒子
  gl.drawArrays(gl.POINTS, 0, positions.length / 2);

  // 若還有粒子存活，繼續下一幀
  if (particles.length > 0) {
    requestAnimationFrame(renderParticles);
  }
}

// 建立並編譯著色器的輔助函式
function createShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

// 建立 WebGL 程式，連結頂點與片段著色器
function createProgram(vShader, fShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);
  gl.linkProgram(program);
  return program;
}

// 外部呼叫，觸發粒子效果，x,y 是點擊或事件座標
function triggerWebGLEffect(x, y) {
  createParticleEffect(x + 10, y + 10); // 加一點偏移，避免遮擋
}
