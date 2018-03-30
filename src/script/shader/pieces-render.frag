#define HUGE 9E16
#define PI 3.14159265
#define TAU 6.28318531
#define V vec3(0.,1.,-1.)
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+.5)*(m))

// ------

precision highp float;

varying vec2 vUv;
varying float vLife;
varying float vSize;

uniform vec3 color;
uniform vec3 cameraPos;
uniform float cameraNear;
uniform float cameraFar;
uniform vec3 lightPos;
uniform float totalFrame;
uniform float time;

// ------

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

// ------

bool ptn0( vec2 _p ) {
  float inner = pow( 1.0 - vLife, 2.0 );
  float outer = 1.0 - exp( -5.0 * ( 1.0 - vLife ) );
  vec2 p = _p;
  return inner < length( p ) && length( p ) < outer;
}

bool ptn1( vec2 _p ) {
  float inner = 0.7 * pow( 1.0 - vLife, 2.0 );
  float outer = 0.7 * ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) );
  vec2 p = _p * rotate2D( PI * ( 1.0 - exp( -2.0 * ( 1.0 - vLife ) ) ) );
  return (
    max( abs( p.x ), abs( p.y ) ) < outer &&
    inner < max( abs( p.x ), abs( p.y ) )
  );
}

bool ptn2( vec2 _p ) {
  float inner = 0.7 * pow( 1.0 - vLife, 2.0 );
  float outer = 0.7 * ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) );
  vec2 p = _p * rotate2D( PI / 4.0 );
  return (
    max( abs( p.x ), abs( p.y ) ) < outer &&
    inner < min( abs( p.x ), abs( p.y ) )
  );
}

bool ptn3( vec2 _p ) {
  float inner = 0.3 * ( 1.0 - pow( 1.0 - vLife, 2.0 ) );
  float outer = 0.3 * ( ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) ) );
  float radius = 0.7 * ( ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) ) );
  
  vec2 p = _p;
  p = rotate2D( -PI / 2.0 ) * p;
  p = rotate2D( -lofir( atan( p.y, p.x ), TAU / 6.0 ) ) * p;
  p.x -= radius * ( ( 1.0 - exp( -5.0 * ( 1.0 - vLife ) ) ) );
  return (
    length( p ) < inner &&
    length( p ) < outer
  );
}

// ------

void main() {
  if ( vLife <= 0.0 ) { discard; }

  vec2 p = vUv * 2.0 - 1.0;
  float sum = 0.0;

  float mode = floor( mod( vSize * 8573.51, 4.0 ) );
  
  if ( mode == 1.0 ) {
    if ( ptn0( p ) ) { sum += 1.0; }

  } else if ( mode == 2.0 ) {
    if ( ptn1( p ) ) { sum += 1.0; }

  } else if ( mode == 3.0 ) {
    if ( ptn2( p ) ) { sum += 1.0; }

  } else {
    if ( ptn3( p ) ) { sum += 1.0; }

  }

  if ( sum == 0.0 ) { discard; }
  gl_FragColor = vec4( vec3( 1.0 ), 0.1 );
}