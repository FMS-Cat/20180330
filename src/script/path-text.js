import svgPath from './svg-path';
import MathCat from './libs/mathcat';
import VertPhaser from './vertphaser';
import * as opentype from 'opentype.js';
const glslify = require( 'glslify' );

// ------

let pathLofiPath = ( glCatPath, automaton, callback ) => {
  let glCat = glCatPath.glCat;
  let gl = glCat.gl;

  let auto = automaton.auto;

  // ------

  let phasers;

  opentype.load( 'fonts/Exo2-ExtraBoldItalic.ttf', function( error, font ) {
    if ( error ) {
      throw error;
    }
    
    let fontSize = 7.0;
    let text = 'Deadline';
    let wid = font.getAdvanceWidth( text, fontSize );
    let path = font.getPath( text, 0, 0, fontSize ).toPathData();
    let vs = svgPath( path, { curveSegs: 8 } );
    phasers = vs.map( ( v ) => {
      for ( let i = 0; i < v.length / 2; i ++ ) {
        v[ i * 2 + 0 ] =  ( v[ i * 2 + 0 ] - wid / 2 );
        v[ i * 2 + 1 ] = -( v[ i * 2 + 1 ] + fontSize * 0.35 );
      }
      return new VertPhaser( v );
    } );

    callback();
  } );

  let vboPos = glCat.createVertexbuffer( false );

  // ------

  glCatPath.add( {
    textOuter: {
      vert: glslify( './shader/path2d.vert' ),
      frag: glslify( './shader/color.frag' ),
      float: true,
      depthWrite: false,
      depthTest: false,
      func: ( path, params ) => {
        let matM = MathCat.mat4Identity();
        matM = MathCat.mat4Apply( MathCat.mat4ScaleXYZ( 0.4 ), matM );
        glCat.uniformMatrix4fv( 'matM', matM );
        
        glCat.uniform3fv( 'color', [ 1.0, 1.0, 1.0 ] );

        // ------

        phasers.map( phaser => {
          for ( let i = 0; i < 2; i ++ ) {
            let begin = automaton.progress + i / 2.0;
            let phase = 0.3;
            let arr = phaser.do( begin, phase );

            glCat.setVertexbuffer( vboPos, arr, gl.DYNAMIC_DRAW );

            glCat.attribute( 'p', vboPos, 2 );

            gl.drawArrays( gl.LINE_STRIP, 0, arr.length / 2 );
          }
        } );
      }
    },
  } );
};

export default pathLofiPath;