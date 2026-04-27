let coin = 0;
function addCoin(n){
  coin += n;
  document.getElementById('coin').innerText = "💰 " + coin;
}

/* ===== CLICKER ===== */
let score=0,power=1;
function startClicker(){
 document.getElementById('game').innerHTML=`
 <h2>Clicker</h2>
 <p>Score: <span id="score">0</span></p>
 <button onclick="clickGame()">CLICK</button>
 <br>
 <button onclick="upgrade()">Upgrade (10)</button>`;
 score=0; power=1;
}
function clickGame(){
 score+=power;
 addCoin(1);
 document.getElementById('score').innerText=score;
}
function upgrade(){
 if(score>=10){ score-=10; power++; }
}

/* ===== SNAKE ===== */
function startSnake(){
 document.getElementById('game').innerHTML='<h2>Snake</h2><canvas id="snake" width="400" height="400"></canvas>';
 const c=document.getElementById('snake');
 const ctx=c.getContext('2d');

 let snake=[{x:200,y:200}],dx=20,dy=0;
 let food={x:100,y:100};

 document.onkeydown=e=>{
  if(e.key==='ArrowUp'){dx=0;dy=-20}
  if(e.key==='ArrowDown'){dx=0;dy=20}
  if(e.key==='ArrowLeft'){dx=-20;dy=0}
  if(e.key==='ArrowRight'){dx=20;dy=0}
 };

 setInterval(()=>{
  ctx.clearRect(0,0,400,400);
  let head={x:snake[0].x+dx,y:snake[0].y+dy};
  snake.unshift(head);

  if(head.x===food.x && head.y===food.y){
    food={x:Math.random()*400|0, y:Math.random()*400|0};
    addCoin(5);
  } else snake.pop();

  ctx.fillStyle='lime';
  snake.forEach(s=>ctx.fillRect(s.x,s.y,20,20));

  ctx.fillStyle='red';
  ctx.fillRect(food.x,food.y,20,20);
 },100);
}

/* ===== FLAPPY ===== */
function startFlappy(){
 document.getElementById('game').innerHTML='<h2>Flappy</h2><canvas id="f" width="400" height="500"></canvas>';
 const c=document.getElementById('f');
 const ctx=c.getContext('2d');

 let bird={x:50,y:200,vy:0}, pipes=[];

 document.onclick=()=>bird.vy=-6;

 setInterval(()=>{
  ctx.clearRect(0,0,400,500);
  bird.vy+=0.3;
  bird.y+=bird.vy;

  ctx.fillStyle='yellow';
  ctx.fillRect(bird.x,bird.y,20,20);

  if(Math.random()<0.02){
    pipes.push({x:400,h:Math.random()*300});
  }

  pipes.forEach(p=>{
    p.x-=2;
    ctx.fillStyle='green';
    ctx.fillRect(p.x,0,40,p.h);
    ctx.fillRect(p.x,p.h+120,40,500);

    if(p.x===50) addCoin(10);

    if(bird.y<0 || bird.y>500){
      alert("Game Over");
      startFlappy();
    }
  });
 },20);
}

/* ===== 반응속도 게임 ===== */
function reactionGame(){
 document.getElementById('game').innerHTML=`
 <h2>Reaction Game</h2>
 <button id="btn">기다려...</button>`;

 let btn=document.getElementById('btn');

 setTimeout(()=>{
  btn.innerText="CLICK!";
  let start=Date.now();

  btn.onclick=()=>{
    let time=Date.now()-start;
    addCoin(Math.max(1, 1000-time));
    alert("반응속도: "+time+"ms");
  };
 }, Math.random()*3000+1000);
}

/* ===== 기억력 게임 ===== */
function memoryGame(){
 let seq=[], user=[];
 document.getElementById('game').innerHTML=`
 <h2>Memory Game</h2>
 <button onclick="next()">START</button>`;

 window.next=function(){
  let n=Math.floor(Math.random()*4);
  seq.push(n);
  alert("패턴: "+seq.join(" "));
  let input=prompt("입력");
  if(input===seq.join(" ")){
    addCoin(15);
  } else {
    seq=[];
  }
 }
}
