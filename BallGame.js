
canvas = document.querySelector('canvas');
canvas.width = innerWidth;
canvas.height = innerHeight;

contxt= canvas.getContext('2d');

const scoreEl= document.getElementById('score');
const startGameBtn = document.querySelector('#startGameBtn');
const cardEl = document.querySelector('#cardEl');
const bigScoreEl = document.querySelector("#bigScoreEl")

var score = 0;



const centerx = canvas.width/2;
const centery = canvas.height/2;


const projectiles= [];
const enemies= [];
const particles= [];




class Player{
    constructor(x,y,radius,color){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
    }
    draw(){
      contxt.beginPath();
      contxt.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
      contxt.fillStyle=this.color;
      contxt.fill();
    }

}
const player = new Player(centerx,centery,10,'white');




class Projectile{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
    }
    draw(){
      contxt.beginPath();
      contxt.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
      contxt.fillStyle=this.color;
      contxt.fill();
    }
    update(){
        this.draw();
        this.x=this.x+this.velocity.x;
        this.y=this.y+this.velocity.y;
    }
    
}


const friction=.99999;

class Particle{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
        this.alpha=1;
    }
    draw(){
      contxt.save();
      contxt.globalAlpha = this.alpha;
      contxt.beginPath();
      contxt.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
      contxt.fillStyle=this.color;
      contxt.fill();
      contxt.restore();
    }
    update(){
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x=this.x+this.velocity.x;
        this.y=this.y+this.velocity.y;
        this.alpha -= 0.005;
    }
    
}


class Enemy{
    constructor(x,y,radius,color,velocity){
        this.x=x;
        this.y=y;
        this.radius=radius;
        this.color=color;
        this.velocity=velocity;
    }
    draw(){
      contxt.beginPath();
      contxt.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
      contxt.fillStyle=this.color;
      contxt.fill();
    }
    update(){
        this.draw();
        this.x=this.x+this.velocity.x;
        this.y=this.y+this.velocity.y;
    }
    
}


function spawnEnemies() {
    setInterval(() =>{
        let x ;
        let y ;
        const radius = Math.random() * (30-6)+6;

        if(Math.random() <0.5){
            x= Math.random() <0.5 ? 0 -radius : canvas.width +radius;
            y= Math.random() * canvas.height;
            
        }else{
            x = Math.random() * canvas.width;
            y = Math.random() <0.5 ? 0 -radius: canvas.height + radius;
        }

        let color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
        
        const angle = Math.atan2(centery - y, centerx -x);
        
        const velocity= {
            x: Math.cos(angle)*.1,
            y: Math.sin(angle)*.1
        }
        enemies.push(new Enemy(x,y,radius,color,velocity));
    }, 3000)
}


let animationId;

function animate(){ 


    scoreEl.innerHTML = score;

    animationId=requestAnimationFrame(animate);
    //draw semitransparent background for fade effect from framerate
    contxt.fillStyle='rgba(0,0,0,.3)';
    contxt.fillRect(0,0, canvas.width, canvas.height);
    player.draw();

    //animate particles
    particles.forEach((particle,index) =>{
            if (particle.alpha <= 0){
                particles.splice(index,1)
            }
            else{particle.update();}
        })


    //animate projectiles and check if off screen, if so remove
    projectiles.forEach((projectile, pIndex) => {
        projectile.update();
        if(projectile.x + projectile.radius <0||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius <0 ||
            projectile.y - projectile.radius > canvas.height){
            setTimeout(()=>{
                projectiles.splice(pIndex,1);
            },0)
        }
    });


    //animate enemy then check if end game conditions, then check if projectiles have hit enemy
    enemies.forEach((enemy, eIndex) => {
        enemy.update();
        const playerenemydist = Math.hypot(player.x - enemy.x,player.y-enemy.y);
        
        //end game conditions
        if(playerenemydist - enemy.radius -player.radius <1){
            cancelAnimationFrame(animationId);
            cardEl.style.display='flex';
            bigScoreEl.innerHTML = score;
        }
        
        
        projectiles.forEach((projectile, pIndex) => {
            const projectilenemydist= Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if(projectilenemydist - enemy.radius - projectile.radius < 1)
            {
                
                
                //create explosions
                for (let i = 0; i < enemy.radius *2; i++){
                    particles.push(
                        new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                            x: (Math.random() - 0.5)*(Math.random() * 7),
                            y: (Math.random() - 0.5)*(Math.random()*7)
                        })
                    )
                }
                //reduce size of enemy if over a certain radius
                if(enemy.radius-10 > 10){
                    score += 50;
                    
                    gsap.to(enemy, {
                        radius:enemy.radius- 10
                    })
                    setTimeout(()=>{
                        projectiles.splice(pIndex,1);
                    },0);
                //else destroy
                }else{
                    score += 150;
                    setTimeout(()=>{
                        
                        enemies.splice(eIndex,1);
                        projectiles.splice(pIndex,1);
                    },0)
                }
                
                
            }
        })

    
})}
    




window.addEventListener('click', (event)=>{
    const angle = Math.atan2(event.clientY - centery,event.clientX-centerx);
    const velocity ={
        x:Math.cos(angle)*10,
        y:Math.sin(angle)*10
    }
    projectiles.push(new Projectile(centerx, centery, 4,'red',velocity));
})
startGameBtn.addEventListener('click',() => {
    cardEl.style.display ='none';
    spawnEnemies();
    animate();
    
});