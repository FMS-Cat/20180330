import xorshift from './libs/xorshift';
import Tweak from './libs/tweak';
import GLCat from './libs/glcat';
import GLCatPath from './libs/glcat-path-gui';
import MathCat from './libs/mathcat';
import step from './libs/step';

import pathText from './path-text';
import pathPieces from './path-pieces';
import pathPostfx from './path-postfx';

import CanvasSaver from './libs/canvas-saver';

let glslify = require( 'glslify' );

// ------

xorshift( 326789157890 );

// ------

let width = canvas.width = 480;
let height = canvas.height = 480;

// ------

let canvasSaver = new CanvasSaver( canvas );

// ------

let gl = canvas.getContext( 'webgl' );
gl.lineWidth( 1 );

let glCat = new GLCat( gl );

glCat.getExtension( 'OES_texture_float', true );
glCat.getExtension( 'OES_texture_float_linear', true );
glCat.getExtension( 'EXT_frag_depth', true );
glCat.getExtension( 'ANGLE_instanced_arrays', true );

let glCatPath = new GLCatPath( glCat, {
  el: divPath,
  canvas: canvas,
  stretch: true
} );

// ------

let tweak = new Tweak( divTweak );

// ------

let totalFrame = 0;
let init = false;

let automaton = new Automaton( {
  gui: divAutomaton,
  fps: 60,
  loop: true,
  data: `
  {"v":"1.2.0","length":3,"resolution":1000,"params":{"cameraPosX":[{"time":0,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":3,"value":0,"mode":4,"params":{"rate":2000,"damp":1},"mods":[false,false,false,false]}],"cameraPosY":[{"time":0,"value":0,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":3,"value":0,"mode":4,"params":{"rate":5000,"damp":1},"mods":[false,false,false,false]}],"cameraPosZ":[{"time":0,"value":10,"mode":1,"params":{},"mods":[false,false,false,false]},{"time":3,"value":10,"mode":4,"params":{"rate":5000,"damp":1},"mods":[false,false,false,false]}]},"gui":{"snap":{"enable":true,"bpm":"60","offset":"0"}}}
`
} );
let auto = automaton.auto;

// ------

let cameraPos = [ 0.0, 0.0, 10.0 ];
let cameraTar = [ 0.0, 0.0, 0.0 ];
let cameraRoll = 0.0;
let cameraFov = 70.0;

let cameraNear = 0.1;
let cameraFar = 100.0;

let lightPos = [ 10.0, 8.0, 10.0 ];

let matP;
let matV;
let matPL;
let matVL;

let updateMatrices = () => {
  cameraPos[ 0 ] = auto( 'cameraPosX' );
  cameraPos[ 1 ] = auto( 'cameraPosY' );
  cameraPos[ 2 ] = auto( 'cameraPosZ' );

  matP = MathCat.mat4Perspective( cameraFov, cameraNear, cameraFar );
  matV = MathCat.mat4LookAt( cameraPos, cameraTar, [ 0.0, 1.0, 0.0 ], cameraRoll );

  matPL = MathCat.mat4Perspective( cameraFov, cameraNear, cameraFar );
  matVL = MathCat.mat4LookAt( lightPos, cameraTar, [ 0.0, 1.0, 0.0 ], 0.0 );
};
updateMatrices();

// ------

let mouseX = 0.0;
let mouseY = 0.0;

canvas.addEventListener( 'mousemove', ( event ) => {
  mouseX = event.offsetX;
  mouseY = event.offsetY;
} );

// ------

let vboQuad = glCat.createVertexbuffer( [ -1, -1, 1, -1, -1, 1, 1, 1 ] );

// ------

let bgColor = [ 0.02, 0.02, 0.02, 1.0 ];

// ------

glCatPath.setGlobalFunc( () => {
  glCat.uniform1i( 'init', init );
  glCat.uniform1f( 'time', automaton.time );
  glCat.uniform1f( 'deltaTime', automaton.deltaTime );

  glCat.uniform1f( 'totalFrame', totalFrame );
  glCat.uniform2fv( 'mouse', [ mouseX, mouseY ] );

  glCat.uniform3fv( 'cameraPos', cameraPos );
  glCat.uniform3fv( 'cameraTar', cameraTar );
  glCat.uniform1f( 'cameraRoll', cameraRoll );
  glCat.uniform1f( 'cameraFov', cameraFov );
  glCat.uniform1f( 'cameraNear', cameraNear );
  glCat.uniform1f( 'cameraFar', cameraFar );
  glCat.uniform3fv( 'lightPos', lightPos );

  glCat.uniformMatrix4fv( 'matP', matP );
  glCat.uniformMatrix4fv( 'matV', matV );
  glCat.uniformMatrix4fv( 'matPL', matPL );
  glCat.uniformMatrix4fv( 'matVL', matVL );
  glCat.uniform4fv( 'bgColor', bgColor );
} );

glCatPath.add( {
  return: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/return.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  inspector: {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/inspector.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    func: ( path, params ) => {
      glCat.attribute( 'p', vboQuad, 2 );
      glCat.uniform3fv( 'circleColor', [ 1.0, 1.0, 1.0 ] );
      glCat.uniformTexture( 'sampler0', params.input, 0 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },

  'target': {
    width: width,
    height: height,
    vert: glslify( './shader/quad.vert' ),
    frag: glslify( './shader/bg.frag' ),
    blend: [ gl.ONE, gl.ZERO ],
    clear: [ 0.0, 0.0, 0.0, 1.0 ],
    framebuffer: true,
    float: true,
    depthWrite: false,
    func: () => {
      glCat.attribute( 'p', vboQuad, 2 );
      gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }
  },
} );

// ------

let updateUI = () => {
  let now = new Date();
  let deadline = new Date( 2018, 2, 30, 0, 0 );

  divCountdown.innerText = 'Deadline: ' + Math.floor( ( deadline - now ) / 1000 );
};

// ------

let update = () => {
  if ( !tweak.checkbox( 'play', { value: true } ) ) {
    setTimeout( update, 100 );
    return;
  }

  automaton.update();

  updateUI();
  updateMatrices();

  // ------

  glCatPath.begin();

  glCatPath.render( 'target' );

  glCatPath.render( 'piecesComputeReturn' );
  glCatPath.render( 'piecesCompute' );

  glCatPath.render( 'piecesRender', {
    target: glCatPath.fb( 'target' ),
    width: width,
    height: height
  } );

  glCatPath.render( 'textOuter', {
    target: glCatPath.fb( 'target' ),
    width: width,
    height: height
  } );

  glCatPath.render( 'post', {
    target: GLCatPath.nullFb,
    input: glCatPath.fb( 'target' ).texture,
    width: width,
    height: height,
  } );

  glCatPath.end();

  init = false;
  totalFrame ++;

  // ------

  if ( tweak.checkbox( 'save', { value: false } ) ) {
    canvasSaver.add( totalFrame );
  }

  if ( tweak.button( 'download' ) ) {
    canvasSaver.download();
  }

  requestAnimationFrame( update );
}


step( {
  0: ( step ) => {
    pathPieces( glCatPath, automaton );
    pathText( glCatPath, automaton, step );
    pathPostfx( glCatPath );
  },

  1: ( step ) => {
    update();
  }
} );

// ------

window.addEventListener( 'keydown', ( _e ) => {
  if ( _e.which === 27 ) {
    tweak.checkbox( 'play', { set: false } );
  }
} );
