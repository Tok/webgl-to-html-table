const w = 64;
const h = 64;
const center = Math.floor(h / 2);
const yRange = Array(h).fill();
const xRange = Array(w).fill();
var cubeRotation = 0.0;

main();

function main() {
    const canvas = createCanvas();
    const gl = initWebGL(canvas);
    const table = createTable();
    const vsSource = vertexShaderSource();
    const fsSource = fragmentShaderSource();
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    const programInfo = createProgramInfo(shaderProgram, gl);
    const buffers = initBuffers(gl);
    var lastMs = 0.0;
    var frame = 0;
    function render(nowMs) {
        const deltaMs = nowMs - lastMs;
        drawScene(gl, programInfo, buffers, deltaMs * 0.001);
        const imageData = getImageData(gl);
        printToHtmlTable(imageData);
        maybePrintToFpsTable(frame, deltaMs);
        frame = frame + 1;
        lastMs = nowMs;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function maybePrintToFpsTable(frame, deltaMs) {
    if (frame % 10 == 0) {
        const fps = Math.floor(1000 / deltaMs);
        addText(Math.floor(h / 2) + 2, "FPS: " + fps);
    }
}

function printToHtmlTable(imageData) {
    yRange.forEach((_, y) =>
        xRange.forEach((_, x) =>
            changeCellColor(imageData, x, y)
        )
    );
}

function changeCellColor(imageData, x, y) {
    const key = cellKey(x, y);
    const cell = document.getElementById(key);
    const dataIndex = (y * w * 4) + (x * 4);
    const r = imageData[dataIndex];
    const g = imageData[dataIndex + 1];
    const b = imageData[dataIndex + 2];
    const a = imageData[dataIndex + 3];
    const cssColor = rgbToHex(r, g, b);
    cell.style.backgroundColor = cssColor;
}

function initWebGL(canvas) {
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
        alert("Can not initialize WebGL.");
        return;
    }
    return gl;
}

function createCanvas() {
    const canvas = document.createElement("canvas");
    canvas.id = "canvas";
    canvas.width = w;
    canvas.height = h;
    document.getElementsByTagName("body")[0].appendChild(canvas);
    return canvas;
}

function createTable() {
    const nbsp = String.fromCharCode(160);
    const table = document.getElementById("table");
    yRange.forEach((_, y) => {
        const row = table.insertRow(y);
        row.classList.add("row");
        xRange.forEach((_, x) => {
            const cell = row.insertCell(x);
            cell.classList.add("cell");
            cell.id = cellKey(x, y);
            cell.innerHTML = nbsp + nbsp;
        })
    });
    addText(center, "WebGL to HTML-Table");
    addText(center + 1, "Cells: " + (w * h));
    return table;
}

function addText(y, rawText) {
    const nbsp = String.fromCharCode(160);
    const text = rawText.split(" ").join(nbsp);
    const xStart = Math.floor((w / 2) - (text.length / 4));
    for (x = 0; x < text.length; x++) {
        const key = cellKey(xStart + x, y);
        const subStart = x * 2;
        const subEnd = subStart + 2;
        const inner = text.substring(subStart, subEnd);
        document.getElementById(key).innerHTML = inner;
    }
}

function cellKey(x, y) {
    return "" + x + ":" + y;
}

function createProgramInfo(shaderProgram, gl) {
    return {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor")
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix")
        }}
}

function componentToHex(c) {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getImageData(gl) {
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    return pixels; //Uint8Array
}

function cubePositions() {
    const front  = [-1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0,  1.0];
    const back   = [-1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0, -1.0];
    const top    = [-1.0,  1.0, -1.0, -1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0];
    const bottom = [-1.0, -1.0, -1.0,  1.0, -1.0, -1.0,  1.0, -1.0,  1.0, -1.0, -1.0,  1.0];
    const right  = [ 1.0, -1.0, -1.0,  1.0,  1.0, -1.0,  1.0,  1.0,  1.0,  1.0, -1.0,  1.0];
    const left   = [-1.0, -1.0, -1.0, -1.0, -1.0,  1.0, -1.0,  1.0,  1.0, -1.0,  1.0, -1.0];
    const faces = [].concat.apply([], [front, back, top, bottom, right, left]);
    return faces;
}

function cubeColors() {
    const purple = [163/255,  73/255, 164/255, 1.0]; //#A349A4
    const yellow = [255/255, 242/255,   0/255, 1.0]; //#FFF200
    const red    = [237/255,  28/255,  36/255, 1.0]; //#ED1C24
    const blue   = [ 63/255,  72/255, 204/255, 1.0]; //#3F48CC
    const orange = [255/255, 127/255,  39/255, 1.0]; //#FF7F27
    const green  = [ 34/255, 177/255,  76/255, 1.0]; //#22B14C
    return [purple, yellow, red, blue, orange, green];
}

function cubeIndices() {
    const front  = [ 0,  1,  2,     0,  2,  3]
    const back   = [ 4,  5,  6,     4,  6,  7]
    const top    = [ 8,  9, 10,     8, 10, 11]
    const bottom = [12, 13, 14,    12, 14, 15]
    const right  = [16, 17, 18,    16, 18, 19]
    const left   = [20, 21, 22,    20, 22, 23]
    const trianglePairs = [].concat.apply([], [front, back, top, bottom, right, left]);
    return trianglePairs;
}

function createColors(faceColors) {
    return faceColors.reduce((acc, c) => acc.concat(c, c, c, c), []);
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = cubePositions();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const faceColors = cubeColors();
    const colors = createColors(faceColors);
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    const indices = cubeIndices();
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    return { position: positionBuffer, color: colorBuffer, indices: indexBuffer };
}

function drawScene(gl, programInfo, buffers, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); //full black
    gl.clearDepth(1.0); //clear everything
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL); //near things obscure far things
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const fieldOfView = 45 * Math.PI / 180; //radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1; //min distance
    const zFar = 100.0; //max distance

    //note: glmatrix.js always has the first argument as the destination to receive the result.
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
    const modelViewMatrix = mat4.create(); //start in center
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -5.0]);
    const zSpeed = cubeRotation;
    const xSpeed = cubeRotation *  0.618;
    const ySpeed = cubeRotation * -1.618;
    mat4.rotate(modelViewMatrix, modelViewMatrix, zSpeed, [0, 0, 1]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, xSpeed, [0, 1, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, ySpeed, [1, 0, 0]);
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        const vPos = programInfo.attribLocations.vertexPosition
        gl.vertexAttribPointer(vPos,numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
    }
    {
        const numComponents = 4;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        const vCol = programInfo.attribLocations.vertexColor
        gl.vertexAttribPointer(vCol, numComponents, type, normalize, stride, offset);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
    gl.useProgram(programInfo.program);
    const pMatrix = programInfo.uniformLocations.projectionMatrix;
    gl.uniformMatrix4fv(pMatrix, false, projectionMatrix);
    const mvMatrix = programInfo.uniformLocations.modelViewMatrix
    gl.uniformMatrix4fv(mvMatrix, false, modelViewMatrix);
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }
    cubeRotation += deltaTime;
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("An error occurred while compiling a shader: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function vertexShaderSource() {
    return `attribute vec4 aVertexPosition; attribute vec4 aVertexColor;
            uniform mat4 uModelViewMatrix; uniform mat4 uProjectionMatrix;
            varying lowp vec4 vColor;
            void main(void) {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }`;
}

function fragmentShaderSource() {
    return `varying lowp vec4 vColor; void main(void) { gl_FragColor = vColor; }`;
}
