const CANVAS = document.getElementById("thecanvas");
const ctx = CANVAS.getContext("2d")
function setpixelated(context){
    context['imageSmoothingEnabled'] = false;       /* standard */
    context['mozImageSmoothingEnabled'] = false;    /* Firefox */
    context['oImageSmoothingEnabled'] = false;      /* Opera */
    context['webkitImageSmoothingEnabled'] = false; /* Safari */
    context['msImageSmoothingEnabled'] = false;     /* IE */
}
setpixelated(ctx)
const CANVAS_SIZE = 512
const SIDE_SIZE = 0.2
const CLICK_REIGON = 64
const id = document.getElementById.bind(document)
let SPAWN_TIME = 3000
let START_SPAWN_TIME = 0.1
const DESPAWN_TIME = 1000
const BAR_POS = [0.2, 0.05] 
const BAR_SIZE = [112, 15]
const BAR_FULL = 1000000
const sounds = {
    "give":new Audio("Sounds/GivePotato.wav"),
    "fail":new Audio("Sounds/Failure.wav"),
    "left":new Audio("Sounds/PurchaseLeft.wav"),
    "right":new Audio("Sounds/PurchaseRight.wav")
}
function playSound(sound) {
    if (!document.hidden){sounds[sound].play()}
}
let points = 0
let potato_joy = 0
let on_screen = []
let particles = []
const MENU_HEIGHT = 50
const LEFT_MENU = [{name:"10 -> 1% faster",func:function(){
    if (points>=10 && SPAWN_TIME>2500) {
        SPAWN_TIME*= 0.99
        points -= 10
    }
}},
{name:"100 -> 5% faster",func:function(){
    if (points>=100 && SPAWN_TIME>2000) {
        SPAWN_TIME*= 0.95
        points -= 100
    }
}},
{name:"1000 -> 10% faster",func:function(){
    if (points>=1000 && SPAWN_TIME>1500) {
        SPAWN_TIME*= 0.9
        points -= 1000
    }
}},
{name:"10000 -> 20% faster",func:function(){
    if (points>=10000 && SPAWN_TIME>1000) {
        SPAWN_TIME*= 0.8
        points -= 10000
    }
}},
{name:"100000 -> 30% faster",func:function(){
    if (points>=100000) {
        SPAWN_TIME*= 0.7
        points -= 100000
    }
}},
{name:"100 -> autoclick (12s)",func:function(){
    if (points>=100) {
        setInterval(() => {
            if (on_screen.length>0) {
                c = on_screen[Math.floor(Math.random()*on_screen.length)]
                click(c.pos)
                part = new Particle([c.pos[0],c.pos[1]-16],id("Sprites/Cursor.png"),16)
            }
        }, 12000);
        points -= 100
    }
}},
{name:"1000 -> autoclick (1s)",func:function(){
    if (points>=1000) {
        setInterval(() => {
            if (on_screen.length>0) {
                c = on_screen[Math.floor(Math.random()*on_screen.length)]
                click(c.pos)
                part = new Particle([c.pos[0],c.pos[1]-16],id("Sprites/Cursor.png"),16)
            }
        }, 1000);
        points -= 1000
    }
}}]
const RIGHT_MENU = [{img:"Sprites/Truck0.png",name:"100 -> Truck",func:function(){
    if (points>=100 && !UNLOCKED.includes(Truck)) {
        UNLOCKED.push(Truck)
        points -= 100
    }
}},
{img:"Sprites/Boat0.png",name:"1000 -> Boat",func:function(){
    if (points>=1000 && !UNLOCKED.includes(Boat)) {
        UNLOCKED.push(Boat)
        points -= 1000
    }
}},
{img:"Sprites/Plane0.png",name:"10000 -> Plane",func:function(){
    if (points>=10000 && !UNLOCKED.includes(Plane)) {
        UNLOCKED.push(Plane)
        points -= 10000
    }
}}]
function menu_click(pos) {
    button_num = Math.floor(pos[1]/MENU_HEIGHT)
    start = points
    if (pos[0]/CANVAS_SIZE<SIDE_SIZE) {
        LEFT_MENU[button_num].func()
        if (points != start) {
            playSound("left")
        } else {
            playSound("fail")
        }
    } else if (pos[0]/CANVAS_SIZE>1-SIDE_SIZE) {
        RIGHT_MENU[button_num].func()
        if (points != start) {
            playSound("right")
        } else {
            playSound("fail")
        }
    }
}
class Clickable {
    worth = 0
    sprite = ""
    sprite_holding = ""
    constructor(pos) {
        this.pos = pos
        this.holding = false
        this.time_of_click = 0
    }
    click(pos) {
        if (this.holding) {return}
        if(Math.hypot(this.pos[0]-pos[0], this.pos[1]-pos[1])<CLICK_REIGON) {
            points += this.worth
            potato_joy += this.worth
            this.holding = true
            this.time_of_click = new Date().getTime()
            playSound("give")
            new Particle(this.pos,id("Sprites/Money.png"),30,[SIDE_SIZE*CANVAS_SIZE,0])
            render()
        }
    }
    
    render() {
        ctx.drawImage(this.holding ? id(this.sprite_holding):id(this.sprite), this.pos[0], this.pos[1])
    }
    is_dead() {
        if (!this.holding) {
            return false
        }
        if (new Date().getTime()-this.time_of_click<DESPAWN_TIME) {
            return false
        }
        return true
    }
}
class Person extends Clickable {
    worth = 1
    static domain = [0.75, 1]
    sprite = "Sprites/Person0.png"
    sprite_holding = "Sprites/Person1.png"
}
class Truck extends Clickable {
    worth = 10
    static domain = [0.5, 0.75]
    sprite = "Sprites/Truck0.png"
    sprite_holding = "Sprites/Truck1.png"
}
class Boat extends Clickable {
    worth = 100
    static domain = [0.25, 0.5]
    sprite = "Sprites/Boat0.png"
    sprite_holding = "Sprites/Boat1.png"
}
class Plane extends Clickable {
    worth = 1000
    static domain = [0.2, 0.4]
    sprite = "Sprites/Plane0.png"
    sprite_holding = "Sprites/Plane1.png"
}
const UNLOCKED = [Person]
class Particle{
    constructor(pos,sprite,life,target){
        this.pos = pos;
        this.sprite = sprite;
        this.life = life;
        this.target = target
        this.age = 0;
        this.zoom = 0;
        particles.push(this)
    }
    get(){
        let y_offset;
        let x_offset
        if (this.age <= this.life){
            y_offset=Math.sin(this.age/this.life*Math.PI/2)*-16
            x_offset=0;
        }else if(this.age > this.life){
            if (this.target===undefined){
                return false
            }
            if (this.zoom < 24){
                x_offset=(this.zoom/24)*(this.target[0]-this.pos[0])
                y_offset=(this.zoom/24)*(this.target[1]-this.pos[1])+16
            }else if(this.zoom >= 25){
                return false
            }
            this.zoom++
        }
        this.age++
        return [this.pos[0]+x_offset,this.pos[1]+y_offset];
    }
}function render() {
    ctx.scale((CANVAS_SIZE*(1-SIDE_SIZE*2))/32,CANVAS_SIZE/64)
    ctx.drawImage(id("backdrop"), CANVAS_SIZE*SIDE_SIZE/((CANVAS_SIZE*(1-SIDE_SIZE*2))/32), 0)
    ctx.resetTransform()
    for (let i = 0; i < on_screen.length; i++) {
        const clickable = on_screen[i];
        clickable.render()
    }
    ctx.fillStyle = "#000"
    ctx.fillText(points, SIDE_SIZE*CANVAS_SIZE+15, 10)
    ctx.drawImage(id("Sprites/Money.png"), SIDE_SIZE*CANVAS_SIZE,0)
    ctx.fillStyle = "#888"
    ctx.fillRect(0, 0, CANVAS_SIZE*SIDE_SIZE, CANVAS_SIZE)
    ctx.fillRect(CANVAS_SIZE*(1-SIDE_SIZE), 0, CANVAS_SIZE*SIDE_SIZE, CANVAS_SIZE)
    ctx.drawImage(id("Sprites/Bar.png"), CANVAS_SIZE*BAR_POS[0], CANVAS_SIZE*BAR_POS[1])
    if (potato_joy >= BAR_FULL) {
        ctx.drawImage(id("Sprites/Smile.png"), CANVAS_SIZE*BAR_POS[0], CANVAS_SIZE*BAR_POS[1]+25)
    }
    ctx.fillStyle = "#E228"
    // lifetime
    bar_progress = Math.min(Math.log10(potato_joy)/Math.log10(BAR_FULL),1)
    ctx.fillRect(CANVAS_SIZE*BAR_POS[0]+15, CANVAS_SIZE*BAR_POS[1]+1, bar_progress*BAR_SIZE[0], BAR_SIZE[1])
    ctx.fillStyle = "#999"
    for (let i = 0; i < LEFT_MENU.length; i++) {
        ctx.fillRect(5, MENU_HEIGHT*i+5, SIDE_SIZE*CANVAS_SIZE-10, MENU_HEIGHT-10)
    }
    ctx.fillStyle="#000"
    for (let i = 0; i < LEFT_MENU.length; i++) {
        ctx.fillText(LEFT_MENU[i].name, 5, 25+i*MENU_HEIGHT)
    }
    ctx.fillStyle = "#999"
    for (let i = 0; i < RIGHT_MENU.length; i++) {
        ctx.fillRect((1-SIDE_SIZE)*CANVAS_SIZE+5, MENU_HEIGHT*i+5, SIDE_SIZE*CANVAS_SIZE-10, MENU_HEIGHT-10)
        ctx.drawImage(id(RIGHT_MENU[i].img), (1-SIDE_SIZE)*CANVAS_SIZE+5, MENU_HEIGHT*i+25)
    }
    ctx.fillStyle="#000"
    for (let i = 0; i < RIGHT_MENU.length; i++) {
        ctx.fillText(RIGHT_MENU[i].name, CANVAS_SIZE*(1-SIDE_SIZE)+5, 25+i*MENU_HEIGHT)
    }
    for (i=0;i<particles.length;i++){
        pos = particles[i].get();
        if (pos == false || pos == undefined){
            particles.splice(i,1)
            i--
        }else{
            ctx.drawImage(particles[i].sprite,pos[0],pos[1])
        }
    }
}
function add_clickable() {
    let n = UNLOCKED[Math.floor(Math.random()*UNLOCKED.length)]
    pos = [CANVAS_SIZE * (Math.random()*(1-SIDE_SIZE*2)+SIDE_SIZE), (Math.random()*(n.domain[1]-n.domain[0])+n.domain[0])*CANVAS_SIZE]
    on_screen.push(new n(pos))
    render()
    START_SPAWN_TIME = (START_SPAWN_TIME*0.95+0.05)
    setTimeout(add_clickable, START_SPAWN_TIME*SPAWN_TIME)
}
function clean() {
    for (let i = 0; i < on_screen.length; i++) {
        if (on_screen[i].is_dead()) {
            on_screen.splice(i, 1)
            i--
            render()
        }
    }
}

function click(pos) {
    for (let i = 0; i < on_screen.length; i++) {
        const clickable = on_screen[i];
        clickable.click(pos)
    }
    menu_click(pos)
}
CANVAS.onclick = function(e) {
    click(getMousePos(CANVAS, e))
}
// not mine
function  getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
      scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
      scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
  
    return [
      (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    ]
}
add_clickable()
setInterval(clean, DESPAWN_TIME)
setInterval(render, 42)