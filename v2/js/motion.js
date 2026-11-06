(()=>{
'use strict';
const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const wide=matchMedia('(min-width:900px) and (min-aspect-ratio:6/5)');
const $=(q,c=document)=>c.querySelector(c? q : '');
const $$=(q,c=document)=>[...c.querySelectorAll(q)];
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
let headerObserver;
function headerHeight(){
 const top=$('.top');if(!top)return;
 const set=()=>root.style.setProperty('--top-h',top.getBoundingClientRect().height+'px');
 try{new ResizeObserver(set).observe(top)}catch{}set();
}
function menu(){
 const b=$('.menu-toggle'),m=$('#site-menu');if(!b||!m)return;
 const close=(focus=false)=>{m.hidden=true;b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Открыть меню');headerHeight();if(focus)b.focus()};
 b.addEventListener('click',()=>{
  if(m.hidden){m.hidden=false;b.setAttribute('aria-expanded','true');b.setAttribute('aria-label','Закрыть меню');headerHeight()}
  else close();
 });
 $$('a',m).forEach(a=>a.addEventListener('click',()=>close()));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)close(true)});
 document.addEventListener('click',e=>{if(!m.hidden&&!e.target.closest('.top'))close()});
 wide.addEventListener('change',()=>{if(wide.matches)close()});
}
function maps(){
 $$('[data-map]').forEach(box=>{
  const b=$('button',box);
  b?.addEventListener('click',()=>{
   const iframe=document.createElement('iframe');
   iframe.src='https://yandex.ru/map-widget/v1/?oid=234714297576&ol=biz&z=17';
   iframe.title='Lash. Di на карте, улица Державина, 92';iframe.loading='lazy';iframe.tabIndex=-1;
   box.replaceChildren(iframe);
  },{once:true});
 });
}
function tilt(){
 const im=$('.board .hero-photo');if(!im)return;
 const start=()=>setTimeout(()=>im.classList.add('in'),im.getBoundingClientRect().top<innerHeight*1.15?280:900);
 const io=new IntersectionObserver(e=>e.forEach(v=>{if(v.isIntersecting){start();io.disconnect()}}));io.observe(im);
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){
  im.addEventListener('pointermove',e=>im.style.setProperty('--tilt',(e.clientX/innerWidth-.5)*1.5+'deg'));
  im.addEventListener('pointerleave',()=>im.style.setProperty('--tilt','0deg'));
 }
}
function fallbackCaptions(){
 if(reduce.matches)return;
 $$('.x').forEach(el=>{
  const text=el.textContent.trim();el.setAttribute('aria-label',text);
  el.setAttribute('data-rv','text');
 });
 $$('h1,h2,.lane-caption h3,.subsection-title h3').forEach(el=>{
  el.setAttribute('data-rv','text');
 });
}
function split(){
 $$('[data-rv="text"]').forEach(el=>{
  if(el.querySelector('.wi'))return;
  el.setAttribute('aria-label',el.textContent.replace(/\s+/g,' ').trim());
  // Split each text node independently, preserving semantic and line wrappers.
  const walk=node=>{
   if(node.nodeType===3){
    const parts=node.textContent.split(/([ \t\r\n]+)/);
    const fragment=document.createDocumentFragment();
    parts.forEach(part=>{
     if(!part)return;
     if(/^[ \t\r\n]+$/.test(part)){fragment.append(part);return}
     const outer=document.createElement('span');outer.className='w';
     const inner=document.createElement('span');inner.className='wi';inner.textContent=part;
     inner.style.setProperty('--word',Math.min(i++,10));
     outer.append(inner);fragment.append(outer);
    });
    node.replaceWith(fragment);
   }else if(node.nodeType===1){
    [...node.childNodes].forEach(walk);
   }
  };
  let i=0;[...el.childNodes].forEach(walk);
 });
}
const seen=new WeakSet();
function watch(elements){
 elements.forEach(el=>{
  if(seen.has(el))return;
  seen.add(el);
  if(el.classList.contains('section-title'))el.classList.add('line-in');
  if(io)io.observe(el);else{const r=el.getBoundingClientRect();if(r.top<innerHeight*.96&&r.bottom>0)el.classList.add('in')}
 });
}
const io=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>entries.forEach(entry=>{
 if(entry.isIntersecting){entry.target.classList.add('in');entry.target.addEventListener('transitionend',e=>{if(e.propertyName==='clip-path')entry.target.classList.add('done')});io?.unobserve(entry.target)}
}),{rootMargin:'0px 0px 100px 0px',threshold:0}):null;
function reveal(){
 split();
 const all=$$('[data-rv],.section-title');
 // No short item or an entire long list is allowed to wait for a strict root-margin trigger.
 const sweep=()=>{
  all.forEach(el=>{
   const r=el.getBoundingClientRect();
   if(r.top<innerHeight*.98&&r.bottom>0){el.classList.add('in');if(el.getAttribute('data-rv')==='curtain'){setTimeout(()=>el.classList.add('done'),1100)}};
  });
  $$('[data-rv="curtain"]').forEach(el=>{
   const r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)el.classList.add('in');
  });
 };
 sweep();addEventListener('scroll',sweep,{passive:true});addEventListener('resize',sweep);
 addEventListener('beforeprint',()=>all.forEach(el=>el.classList.add('in')));
 addEventListener('hashchange',()=>{sweep();setTimeout(sweep,300)});
 let ticking=false;
 addEventListener('load',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{sweep();ticking=false})},{once:true});
 new ResizeObserver(()=>sweep()).observe($('main'));
 tilt();
}
function stack(){
 const wrap=root;
 $$('.board .services').forEach(section=>{
  const box=$('.service-stack',section),cards=$$('.service-item',section);
  if(!wide.matches||reduce.matches)return;
  section.style.height='auto';
  const gap=8;
  const h=Math.max(200,...cards.map(e=>e.getBoundingClientRect().height));
  const travel=(cards.length-1)*220;
  const title=$('.section-title',section).getBoundingClientRect().height;const gapBefore=20;
  section.style.height='auto';
  const parent=box.parentElement;
  parent.style.minHeight=(title+gapBefore+travel+h+120)+'px';
  // Sticky starts at its scroll position, not its normal-flow box bottom.
  box.classList.add('service-motion');
  parent.classList.add('service-parent');
  const tick=()=>{
   const top=section.getBoundingClientRect().top+scrollY;

   const pinTop=parseFloat(getComputedStyle(box).top);
   const progress=clamp((scrollY-top)/Math.max(1,travel))*(cards.length-1);
   cards.forEach((card,i)=>{
    card.style.setProperty('--service-y',Math.max(0,i-progress)*(h+gap)+'px');
    card.style.zIndex=i+1;
    card.style.width='100%';
   });
  };
  addEventListener('scroll',tick,{passive:true});tick();
 });
 $$('.reviews-motion').forEach(box=>{
  const cards=$$('.review-item',box),pin=$('.reviews-pin',box),list=$('.review-list',box);
  if(reduce.matches){
   box.classList.remove('stack-active');box.style.height='auto';cards.forEach(card=>{card.classList.remove('is-current','is-next');card.style.transform='none'});return;
  }
  const activeStack=box.hasAttribute('data-stack')||!wide.matches;
  if(activeStack)box.classList.add('stack-active');else{box.classList.remove('stack-active');box.style.removeProperty('--stack-height')}
  const natural=Math.max(...cards.map(card=>{const content=card.querySelector('.review-card'); content.style.height='auto';const height=content.scrollHeight;content.style.removeProperty('height');return height}));
  const h=Math.max(natural+16,innerHeight*.38);
  box.style.setProperty('--card-h',h+'px');
  if(!activeStack)return;
  const travel=(cards.length-1)*(h+28);
  box.style.setProperty('--stack-height',travel+h+100+'px');
  const tick=()=>{
   if(!box.classList.contains('stack-active')||reduce.matches){cards.forEach(c=>{c.style.transform='none';c.style.visibility='visible'});return}
 
   const boxTop=box.getBoundingClientRect().top+scrollY;
   const p=clamp((scrollY-boxTop)/Math.max(1,travel));
   const f=p*(cards.length-1);
   const active=Math.min(cards.length-1,Math.floor(f));
   cards.forEach((card,i)=>{
    const delta=i-f;
    const deltaY=clamp(delta,0,1)*(h+28);
    card.style.setProperty('--stack-y',deltaY+'px');
    card.style.setProperty('--z',i+1);
    const covered=i<active-1;
    card.style.setProperty('--stack-opacity',covered?0:1);
    card.style.zIndex=i+1;
   });
  };
  addEventListener('scroll',tick,{passive:true});tick();
 });
}
function scrollLane(){
 $$('[data-lane]').forEach(box=>{
  if(!wide.matches||reduce.matches){box.classList.remove('motion-lane');box.style.setProperty('--x','0px');return}
  const track=$('.lane-track',box)||$('.review-list',box);
  const view=$('.lane-view',box)||$('.reviews-pin',box);
  box.dataset.ready='true';
  const max=Math.max(0,track.scrollWidth-view.clientWidth);
  const pin=$('.lane-pin',box)||$('.reviews-pin',box);
  const needed=Math.max(410,pin.getBoundingClientRect().height+20);
  const extra=needed+(max*1.25);
  box.style.setProperty('--lane-scroll',extra+'px');
  const tick=()=>{
   const top=box.getBoundingClientRect().top+scrollY;
   const progress=clamp((scrollY-top)/Math.max(1,max*1.25));
   track.style.setProperty('--lane-x',max*progress+'px');
   box.style.setProperty('--lane-progress',progress*100+'%');
  };
  addEventListener('scroll',tick,{passive:true});tick();
 });
}
function captions(){
 if(reduce.matches)return;
 $$('.grid-page .hero-directions h2,.grid-page .hero-about .eyebrow,.grid-page .subsection-title h3').forEach(el=>{
  const text=el.textContent.trim();
  const original=document.createElement('span');original.textContent=text;original.className='caption-text';
  const noise=document.createElement('span');noise.className='caption-noise';noise.setAttribute('aria-hidden','true');
  el.replaceChildren(original,noise);
  const chars='|/<>#*=·';
  noise.textContent=text.split('').map(c=>c===' '?'\u00a0':chars[Math.floor(Math.random()*chars.length)]).join('');
  setTimeout(()=>{el.classList.add('caption-done');noise.remove()},600);
 });
}
function lightAndProgress(){
 const lit=$('[data-light]'),spot=$('.light-spot');
 const update=()=>{
  root.style.setProperty('--progress',`${clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))*100}%`);
  if(lit&&lit.tagName!=='DIV'&&!reduce.matches){const r=lit.getBoundingClientRect();lit.style.opacity=.25+.75*clamp((innerHeight*.85-r.top)/(innerHeight*.5))}
  // Contact expansion belongs to scroll, not an asynchronous reveal gate.
  const panel=$('.contact-panel');
  if(panel&&!reduce.matches){const r=panel.getBoundingClientRect();panel.style.setProperty('--fx',48*clamp((r.top/innerHeight-.1)/.3) + 'px')}
 };
 addEventListener('scroll',update,{passive:true});update();
 if(spot&&matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduce.matches)addEventListener('pointermove',e=>spot.style.transform=`translate(${e.clientX-innerWidth/2}px,${e.clientY-innerHeight/2}px)`,{passive:true});
}
function init(){
 clearTimeout(window.__release);
 menu();headerHeight();
 if(reduce.matches){root.classList.remove('m-on');root.classList.add('m-reduced');maps();return}
 fallbackCaptions();maps();root.setAttribute('data-motion','active');
 const ready=()=>{
  reveal();scrollLane();stack();captions();lightAndProgress();
  root.classList.add('m-ready');
  addEventListener('resize',()=>{ clearTimeout(window.__resizeRefresh);window.__resizeRefresh=setTimeout(()=>location.reload(),250) });
 };
 if(document.fonts)document.fonts.ready.then(ready).catch(ready);else ready();
}
try{init()}catch(e){root.classList.remove('m-on');root.classList.remove('m-ready');console.error(e);menu()}
})();
