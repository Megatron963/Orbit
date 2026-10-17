(()=>{
 const canvas=document.getElementById('particles'),ctx=canvas.getContext('2d');if(!ctx)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let points=[],width=0,height=0,frame=0,last=0;
 function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;const scale=Math.min(devicePixelRatio||1,1.5);canvas.width=width*scale;canvas.height=height*scale;ctx.setTransform(scale,0,0,scale,0,0);points=Array.from({length:Math.min(48,Math.floor(width*height/18000))},()=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.16,vy:-(Math.random()*.16+.04),r:Math.random()*1.3+.5}));}
 function draw(time){frame=requestAnimationFrame(draw);if(time-last<33)return;const step=Math.min((time-last)/16.67,3);last=time;ctx.clearRect(0,0,width,height);if(reduced.matches||prefs.motion===false||document.getElementById('home').hidden)return;
 for(const p of points){p.x=(p.x+p.vx*step+width)%width;p.y=(p.y+p.vy*step+height)%height;ctx.fillStyle='rgba(210,220,240,.45)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
 for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){const a=points[i],b=points[j],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance<110){ctx.strokeStyle=`rgba(200,215,240,${(1-distance/110)*.10})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}
 }
 new ResizeObserver(resize).observe(canvas);document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(!document.hidden){last=performance.now();frame=requestAnimationFrame(draw)}});resize();frame=requestAnimationFrame(draw);
})();
