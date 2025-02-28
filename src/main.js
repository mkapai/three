import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
const gui = new GUI({title:"Settings"});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.1, 1000000);
const renderer = new THREE.WebGLRenderer({alpha: true,antialias:true});
const stats = new Stats();
document.body.appendChild(stats.domElement);
var myinfo = {
  "init_velocity":785,
  "mass":0.092,
  "caliber":0.02,
  "length":0.5678,
  "position":new THREE.Vector3(23734.2637,2431.20166,2608.37378),
  "velocity":new THREE.Vector3(-7.18601704,-5.23217010,147.382675),
  "direction":new THREE.Vector3(1,0,0),
};
var targetinfo ={
  "position":new THREE.Vector3(23457.7285,2370.69775,4528.65820),
  "velocity":new THREE.Vector3(43.5342674,0.563053310,-132.302429),
  "acceleration":new THREE.Vector3(-10.7967958,0.118002892,-5.90927219),
};
var mygui = gui.addFolder('MyInfo');
mygui.add(myinfo, 'init_velocity' );
mygui.add(myinfo, 'mass');
mygui.add(myinfo, 'caliber');
mygui.add(myinfo, 'length');
var folder = mygui.addFolder('Position');
folder.add(myinfo.position, 'x' ).listen();
folder.add(myinfo.position, 'y' ).listen();
folder.add(myinfo.position, 'z' ).listen();
folder = mygui.addFolder('velocity');
folder.add(myinfo.velocity, 'x' ).listen();
folder.add(myinfo.velocity, 'y' ).listen();
folder.add(myinfo.velocity, 'z' ).listen();
folder = mygui.addFolder('direction');
folder.add(myinfo.direction, 'x' ).listen();
folder.add(myinfo.direction, 'y' ).listen();
folder.add(myinfo.direction, 'z' ).listen();
var targetgui = gui.addFolder('TargetInfo');
folder = targetgui.addFolder('Position');
folder.add(targetinfo.position, 'x' ).listen();
folder.add(targetinfo.position, 'y' ).listen();
folder.add(targetinfo.position, 'z' ).listen();
folder = targetgui.addFolder('velocity');
folder.add(targetinfo.velocity, 'x' ).listen();
folder.add(targetinfo.velocity, 'y' ).listen();
folder.add(targetinfo.velocity, 'z' ).listen();
folder = targetgui.addFolder('acceleration');
folder.add(targetinfo.acceleration, 'x' ).listen();
folder.add(targetinfo.acceleration, 'y' ).listen();
folder.add(targetinfo.acceleration, 'z' ).listen();
//监听按钮+键保存信息 相机信息和目标信息
window.addEventListener('keydown', (event) => {
 if(event.key == '+'){
  var cameraState = {
    position: camera.position.toArray(),
    rotation: camera.rotation.toArray()
  };
  localStorage.setItem('cameraState', JSON.stringify(cameraState));
  localStorage.setItem('gui', JSON.stringify(gui.save()));
 }
 if(event.key == '-'){
  var cameraState = JSON.parse(localStorage.getItem('cameraState'));
  camera.position.fromArray(cameraState.position);
  camera.rotation.fromArray(cameraState.rotation);
  gui.load(JSON.parse(localStorage.getItem('gui')));
 }
});



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

  //计算弹丸3维速度 s_velocity 是载具速度 direction 是方向 init_velocity 是初速度
  this.velocity = s_velocity.clone().add(direction.clone().multiplyScalar(init_velocity));
  this.ballistic_coeff = ballistic_coeff;
  this.end = false;
  
  //this.last_time = new Date().getTime();
  this.arrow = [];
  this.count = 1;
  this.update_end = false;
  this.time = 0;

  this.UpdateProjectile = (time)=>{

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
    if(++this.count >10){
      this.count = 0;
      var dir = this.velocity.clone().normalize();
      var arrowe = new THREE.ArrowHelper(
          dir,
          this.mesh.position.clone(),
          5,
          0xff00ff
        );
        scene.add(arrowe);
        this.arrow.push(arrowe);
    }
  };

  this.update = ()=>{
    var ctime = 1/96;
    if(this.end){
      //绘制记录点
      
      return;
    }
    //判断当前位置的Y轴是否小于0 是就删除 运行距离是否长于1000
    if(this.mesh.position.y < 0 || this.dist > 10000){
      this.end = true;
    }
    this.UpdateProjectile(ctime);
    //判断this.update_end是否是函数 是就调用
    if(typeof this.update_end == 'function'){
      this.update_end(ctime);  
    }
    this.time += ctime;

  };
  this.remove = ()=>{
    for(var i = 0; i < this.arrow.length; i++){
      scene.remove(this.arrow[i]);
    }
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

  this.update = ()=>{
    this.propeller.rotation.x += 0.1;
  };
  this.remove = ()=>{
  };
  this.predicted_data = [];
  //预测位置 记录预测信息
  this.predicted = (time)=>{
    var out_pos = new THREE.Vector3();
    var out_vel = new THREE.Vector3();
    //todo::尝试画出圆心轨迹
    extrapolateCircular(this.mesh.position,this.velocity,this.acceleration,time,out_pos,out_vel);
    //记录预测的信息
    var data = {
      "position":out_pos,
      "velocity":out_vel,
    };
    //this.predicted_data.push(data);
    return data;
  };

};
//新建一个弹丸管理器,管理并更新所有弹丸
var BulletManager = function(){
  this.bullets = [];
  this.Update = ()=>{
    for(var i = 0;i<this.bullets.length;i++){
      this.bullets[i].update();
    }
  };
  //创建弹丸
  this.CreateBullet = (start_position,velocity,init_velocity,direction,ballistic_coeff)=>{
    var bullet = new Bullet(start_position,velocity,init_velocity,direction,ballistic_coeff);
    this.bullets.push(bullet);
    scene.add(bullet.mesh);
    return bullet;
  }
  //删除最先创建的弹丸
  this.DeleteBullet = ()=>{

    var buller = this.bullets.shift();
    if(buller){
      buller.remove();
      scene.remove(buller.mesh);
    } 
  }
  //监听键盘事件小键盘1键删除一个弹丸 2键创建一个弹丸
  window.addEventListener("keydown",(e)=>{
    if(e.key === "1"){
      this.DeleteBullet();
    }
    if(e.key === "2"){
      //创建弹丸 需要一些参数 如何让用户输入?
      //打印myinfo
      var coff = getAirDensity(myinfo.position.y);
      coff = getAirResistanceCoefficient(coff,myinfo.mass,myinfo.caliber,myinfo.length);
      this.CreateBullet(myinfo.position,myinfo.velocity,myinfo.init_velocity,myinfo.direction,coff);
    }
  });
};

var bulletManager = new BulletManager();
//新建一个飞机管理器,管理并更新所有飞机
var AirPlaneManager = function(){
  this.airplanes = [];
  this.Update = ()=>{
    for(var i = 0;i<this.airplanes.length;i++){
      this.airplanes[i].update();
    }
  };
  //创建飞机
  this.CreateAirPlane = (position,velocity,acceleration)=>{
    var airplane = new AirPlane();
    airplane.mesh.position.copy(position);
    airplane.velocity.copy(velocity);
    airplane.acceleration.copy(acceleration);
    this.airplanes.push(airplane);
    scene.add(airplane.mesh);
    return airplane;
  }
  //删除最先创建的飞机
  this.DeleteAirPlane = ()=>{
    var air = this.airplanes.shift();
    if(air){
      scene.remove(air.mesh); 
      air.remove();
    }
  }



}
var airplaneManager = new AirPlaneManager();

function createLights() {
  var hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000, .9)
  var shadowLight = new THREE.DirectionalLight(0xffffff, .9);
  shadowLight.position.set(9999, 9999, 9999);

  scene.add(hemisphereLight);  
  scene.add(shadowLight);
  var ambientLight = new THREE.AmbientLight(0xdc8874, .5);
  scene.add(ambientLight);
}

camera.position.x = 0;
camera.position.z = 200;
camera.position.y = 100;

const axesHelper = new THREE.AxesHelper(15000);
const gridHelper  = new THREE.GridHelper(15000,50);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
createLights();


const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ alpha: true,transparent:true,opacity:0.5});
const cube = new THREE.Mesh(geometry, material);


//创建物体
var my = airplaneManager.CreateAirPlane(myinfo.position,myinfo.velocity,new THREE.Vector3());

var target = airplaneManager.CreateAirPlane(targetinfo.position,targetinfo.velocity,targetinfo.acceleration);
target.mesh.scale.set(.25,.25,.25);
my.mesh.scale.set(.25,.25,.25);

gui.onFinishChange(()=>{
  //配置飞机信息
  target.mesh.position.copy(targetinfo.position);
  target.velocity.copy(targetinfo.velocity);
  target.acceleration.copy(targetinfo.acceleration);

  my.mesh.position.copy(myinfo.position);
  my.velocity.copy(myinfo.velocity);
 
});


scene.add(cube);
scene.add(axesHelper);
scene.add(gridHelper);

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
 
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  bulletManager.Update();
  airplaneManager.Update();
  stats.update();
  
  renderer.render(scene, camera);
}
animate();

//根据 高度获取空气阻力系数
function getAirDensity(height) {
  var density = 1.225; // 标准大气压下的空气密度
  //最高海拔 18300.0
  var height_clamped = Math.min(height,18300.0);
  var polynomial = height_clamped * 2.2872e-19;
  polynomial+= -5.8356e-14;
  polynomial*= height_clamped;
  polynomial += 0.0000000035312;
  polynomial *= height_clamped;
  polynomial += -0.000095939;
  polynomial *= height_clamped;
  var base_value = 18300.0 * 1.225;
  var density = base_value + (polynomial * base_value);
  density /= Math.max(18300.0, height);
  return density;
}
//根据弹丸重量 口径 长度 计算弹丸空气阻力系数
function getAirResistanceCoefficient(density, mass, caliber, length) {
  // 计算弹丸的横截面积
  const crossSectionalArea = Math.pow(caliber * 0.5, 2) * Math.PI;
  
  // 计算空气阻力系数的中间值
  const intermediateValue = crossSectionalArea * length * density * 0.5;
  
  // 计算最终的空气阻力系数
  const airResistanceCoefficient = intermediateValue / mass;
  
  return airResistanceCoefficient * -1;
}


window.addEventListener("keydown",(e)=>{
  if(e.key === " "){
    var coff = getAirDensity(myinfo.position.y);
    coff = getAirResistanceCoefficient(coff,myinfo.mass,myinfo.caliber,myinfo.length);



    //计算目标相对位置
    var relative_pos = target.mesh.position.clone().sub(my.mesh.position);
    var relative_magnitude = relative_pos.clone().length();//相对距离
    var relative_drirection = relative_pos.clone().normalize();

    


    //创建弹丸
    var bull = bulletManager.CreateBullet(my.mesh.position,my.velocity,myinfo.init_velocity,relative_drirection,coff);
    var time = 0;
    bull.update_end = (ctime)=>{
      if(bull.end){
        return;
      }


      time += ctime;
      var newpos = target.predicted(time);
      //计算弹丸到我的位置的距离
      var bull_distance = bull.mesh.position.clone().sub(my.mesh.position).lengthSq();
      //计算目标到我的位置的距离
      var target_distance = newpos.position.clone().sub(my.mesh.position).lengthSq();
      //如果弹丸到我的位置的距离大于目标到我的位置的距离 插值计算他们距离到我的距离相等的位置
      if(bull_distance > target_distance){
        bull.end = true;
        //计算弹丸到目标的距离
        var bull2newpos = bull.mesh.position.clone().sub(newpos.position.clone()).length();
        //计算插值系数
        var ins = (Math.sqrt(bull_distance) - Math.sqrt(target_distance)) / bull2newpos;
        //保证插值系数在0-1之间
        ins = Math.max(0,Math.min(1,ins));
        //插值计算弹丸到目标的位置
        var newpos2 = newpos.position.clone().multiplyScalar(ins).add(bull.mesh.position.clone().multiplyScalar(1-ins));
        //插值时间
        time = time + ctime - (ins * ctime);
        //外推目标最新位置
        var newpos3 = target.predicted(time);

        
      }


    }
  }
})


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