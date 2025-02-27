import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({alpha: true,antialias:true});
const stats = new Stats();
document.body.appendChild(stats.domElement);

var Colors = {
  red:0xf25346,
  white:0xd8d0d1,
  brown:0x59332e,
  pink:0xF5986E,
  brownDark:0x23190f,
  blue:0x68c3c0,
};
/**
 * 
 * @param {THREE.Vector3} start_position 
 * @param {THREE.Vector3} velocity 
 * @param {Number} init_velocity 
 * @param {THREE.Vector3} direction 
 */
var Bullet = function(start_position,s_velocity,init_velocity,direction,ballistic_coeff){
  this.clock = new THREE.Clock()

  this.mesh = new THREE.Object3D();
  var geometry = new THREE.SphereGeometry(1, 32, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  var bullet = new THREE.Mesh(geometry, material);
  this.mesh.add(bullet);
  this.init_position = start_position;
  this.dist = 0;
  this.mesh.position.copy(start_position);
  direction.multiplyScalar(init_velocity);
  this.velocity = s_velocity.clone().add(direction);
  this.ballistic_coeff = ballistic_coeff;
  this.end = false;
  scene.add(this.mesh);
  //this.last_time = new Date().getTime();


  this.UpdateProjectile = (time)=>{
    //console.log(time);
    //记录弹丸轨迹点
    var vel = this.velocity;
    var velocityLengthSqr = vel.lengthSq();
    var ballisticTerm = Math.sqrt(velocityLengthSqr) * time * this.ballistic_coeff;
    var velocityAdjustmentFactor = 1.0 - ballisticTerm;
    var dragFactor = ballisticTerm / velocityAdjustmentFactor;
    var adjustmentFactor = dragFactor + 1.0;
    this.velocity.x *= adjustmentFactor;
    this.velocity.z *= adjustmentFactor;
    this.velocity.y = this.velocity.y * adjustmentFactor + (-9.81*time);
    this.mesh.position.add(this.velocity.clone().multiplyScalar(time));
    this.dist = this.mesh.position.distanceTo(this.init_position);


    const dir = this.velocity.clone().normalize();
      const arrow = new THREE.ArrowHelper(
        dir,
        this.mesh.position.clone(),
        5,
        0xff00ff
      );
      scene.add(arrow);
  };

  this.update = ()=>{
    if(this.end){
      //绘制记录点
     
      return;
    }
    //判断当前位置的Y轴是否小于0 是就删除 运行距离是否长于1000
    if(this.mesh.position.y < 0 || this.dist > 10000){
      scene.remove(this.mesh);
      this.end = true;
    }
    //更新弹丸位置
    //var time = (new Date().getTime() - this.last_time) / 1000;
    this.UpdateProjectile(1/96);

  };
};

var AirPlane = function() {
  this.mesh = new THREE.Object3D();
  var geomCockpit = new THREE.BoxGeometry(60,50,50,1,1,1);
  var matCockpit = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);
  var geomEngine = new THREE.BoxGeometry(20,50,50,1,1,1);
  var matEngine = new THREE.MeshPhongMaterial({color:Colors.white, shading:THREE.FlatShading});
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);
  var geomTailPlane = new THREE.BoxGeometry(15,20,5,1,1,1);
  var matTailPlane = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-35,25,0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);
  var geomSideWing = new THREE.BoxGeometry(40,8,150,1,1,1);
  var matSideWing = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);
  var geomPropeller = new THREE.BoxGeometry(20,10,10,1,1,1);
  var matPropeller = new THREE.MeshPhongMaterial({color:Colors.brown, shading:THREE.FlatShading});
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;
  var geomBlade = new THREE.BoxGeometry(1,100,20,1,1,1);
  var matBlade = new THREE.MeshPhongMaterial({color:Colors.brownDark, shading:THREE.FlatShading});
  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8,0,0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50,0,0);
  this.mesh.add(this.propeller);
  this.velocity = new THREE.Vector3();//飞机速度
  this.acceleration = new THREE.Vector3();//飞机加速度

  //根据速度和加速度推算飞机的下一个位置
  this.update = ()=>{
    var out_pos = new THREE.Vector3();
    var out_vel = new THREE.Vector3();
    //todo::尝试画出圆心轨迹
    extrapolateCircular(this.mesh.position,this.velocity,this.acceleration,1/96,out_pos,out_vel);
    this.mesh.position.copy(out_pos);
    this.velocity.copy(out_vel);
  };
};



function createLights() {
  var hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
  var shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(999, 999, 999);

  scene.add(hemisphereLight);  
  scene.add(shadowLight);
  var ambientLight = new THREE.AmbientLight(0xdc8874, .5);
  scene.add(ambientLight);
}

camera.position.x = 0;
camera.position.z = 200;
camera.position.y = 100;

const axesHelper = new THREE.AxesHelper(15000);
const gridHelper  = new THREE.GridHelper(1500,50);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
createLights();


const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ alpha: true,transparent:true,opacity:0.5});
const cube = new THREE.Mesh(geometry, material);
var airplane = new AirPlane();
var airplane2 = new AirPlane();

airplane.mesh.scale.set(.25,.25,.25);
airplane.mesh.position.y = 100;


airplane2.mesh.position.x = 1000;
airplane2.mesh.position.y = 100;
airplane2.mesh.position.z = 1000;
airplane2.mesh.scale.set(.25,.25,.25);
airplane2.velocity = new THREE.Vector3(152,-32,169);
airplane2.acceleration = new THREE.Vector3(-1,20,-10);


scene.add(airplane2.mesh);
scene.add(airplane.mesh);
scene.add(cube);
scene.add(axesHelper);
scene.add(gridHelper);

var bullets = new Bullet(airplane.mesh.position,new THREE.Vector3(152,-32,169),300,new THREE.Vector3(0.5,0.3,0.2),-0.0002);
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
 
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  bullets.update();

  airplane2.update();
  stats.update();
  airplane.propeller.rotation.x += 0.3;
  renderer.render(scene, camera);
}
animate();


/**
 * 
 * @param {THREE.Vector3} pos 
 * @param {THREE.Vector3} vel 
 * @param {THREE.Vector3} acc 
 * @param {Number} time 
 * @param {THREE.Vector3} out_pos 
 * @param {THREE.Vector3} out_vel 
 * @param {*} minVel 
 * @param {*} minAccel 
 * @returns 
 */
function extrapolateCircular(pos, vel, acc, time, out_pos, out_vel, minVel = 1e-6, minAccel = 1e-6) {
  const velLen = vel.length();
  if (velLen < minVel) {
      out_pos.copy(pos).add(acc.clone().multiplyScalar(time * time * 0.5));
      out_vel.copy(acc).multiplyScalar(time);
      return;
  }

  const accLen = acc.length();
  if (accLen < minAccel) {
      out_pos.copy(pos).add(vel.clone().multiplyScalar(time));
      out_vel.copy(vel);
      return;
  }

  const velNorm = vel.clone().divideScalar(velLen);
  const accNorm = acc.clone().divideScalar(accLen);

  const axis = velNorm.clone().cross(accNorm);
  const axisLength = axis.length();

  // Handle near-parallel vectors
  if (axisLength < 1e-9) {
      out_vel.copy(vel).add(acc.clone().multiplyScalar(time));
      out_pos.copy(pos).add(vel.clone().multiplyScalar(time))
                    .add(acc.clone().multiplyScalar(0.5 * time * time));
      return;
  }

  const axisNormalized = axis.divideScalar(axisLength);
  const accTurnNorm = axisNormalized.clone().cross(velNorm);
  const accTurnLen = accTurnNorm.dot(acc);

  if (Math.abs(accTurnLen) > minAccel) {
      const accLnLen = acc.dot(velNorm);
      let angle;

      if (Math.abs(accLnLen) > minAccel) {
          const finalVel = Math.max(Math.abs(velLen + accLnLen * time), minVel);
          angle = (accTurnLen / accLnLen) * (Math.log(finalVel) - Math.log(velLen));
      } else {
          angle = (accTurnLen / velLen) * time;
      }

      const quat = new THREE.Quaternion().setFromAxisAngle(axisNormalized, angle);
      const rotatedVel = vel.clone().applyQuaternion(quat);
      const velFactor = (velLen + accLnLen * time) / velLen;
      out_vel.copy(rotatedVel).multiplyScalar(velFactor);

      const turnRadius = Math.pow(velLen + accLnLen * time, 2) / accTurnLen;
      
      if (turnRadius < 1e4) {
          const dirFromTurnCenter = accTurnNorm.clone().multiplyScalar(-turnRadius);
          const turnCenter = pos.clone().sub(dirFromTurnCenter);
          const rotatedDir = dirFromTurnCenter.clone().applyQuaternion(quat);
          out_pos.copy(turnCenter).add(rotatedDir);
      } else {
          out_pos.copy(pos).add(vel.clone().multiplyScalar(time))
                        .add(acc.clone().multiplyScalar(0.5 * time * time));
      }
  } else {
      out_vel.copy(vel).add(acc.clone().multiplyScalar(time));
      out_pos.copy(pos).add(vel.clone().multiplyScalar(time))
                    .add(acc.clone().multiplyScalar(0.5 * time * time));
  }
}