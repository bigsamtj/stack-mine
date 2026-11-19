/* HELIOS SYSTEMS skin behaviours: scroll reveal, card spotlight, read-more for long prose. No dependencies. */
(function(){
  var d=document,root=d.documentElement,main=d.querySelector('main');if(!main)return;
  root.classList.add('sk-js');
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* reveal */
  var RV='.a-head,.so-head,.a-grid>*,.vx-tiers>*,.vx-metrics>*,.vx-rel>*,.so-feat,.so-mod,.so-plan,.ab-step,.a-faq,.so-faq details,.a-table,.so-facts,.vx-magnet,.mph-card,.mpp-card,.a-stats,.so-stats';
  var els=[].slice.call(main.querySelectorAll(RV)).filter(function(e){return !e.closest('.a-hero,.so-hero,.mph-hero,.page-hero')&&!e.classList.contains('cw-rv')});
  if(reduce||!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('sk-rv','in')})}
  else{
    var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -6% 0px',threshold:.05});
    els.forEach(function(e){var p=e.parentNode,i=[].indexOf.call(p.children,e);e.style.setProperty('--d',Math.min(i,5)*70+'ms');e.classList.add('sk-rv');io.observe(e)});
    setTimeout(function(){els.forEach(function(e){e.classList.add('in')})},4000);
  }
  /* spotlight */
  if(!reduce&&matchMedia('(hover:hover)').matches){
    [].forEach.call(main.querySelectorAll('.a-grid>*,.vx-tiers>*,.so-feat,.so-mod,.so-plan,.vx-rel a,.mph-card,.mpp-card'),function(c){
      if(c.closest('.a-hero,.so-hero,.mph-hero'))return;
      if(getComputedStyle(c).position==='static')c.style.position='relative';
      c.classList.add('sk-spot');
      c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')});
    });
  }
  /* read-more: long prose blocks marked at build time with [data-sk-more] */
  [].forEach.call(main.querySelectorAll('[data-sk-more]'),function(b,i){
    var h=parseInt(b.getAttribute('data-sk-more'),10)||280;
    if(b.scrollHeight<h+140)return;
    var bg=getComputedStyle(b.closest('section')||d.body).backgroundColor;
    if(bg&&bg!=='rgba(0, 0, 0, 0)')b.style.setProperty('--sk-bg',bg);
    b.style.setProperty('--sk-h',h+'px');b.classList.add('sk-more','sk-clamped');b.id=b.id||('sk-more-'+i);
    var btn=d.createElement('button');btn.type='button';btn.className='sk-more-btn';btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-controls',b.id);btn.textContent='Read more';
    btn.addEventListener('click',function(){var open=b.classList.toggle('sk-clamped');btn.setAttribute('aria-expanded',String(!open));btn.textContent=open?'Read more':'Show less'});
    b.parentNode.insertBefore(btn,b.nextSibling);
    if(location.hash){try{var t=d.querySelector(location.hash);if(t&&b.contains(t)){btn.click()}}catch(e){}}
  });
})();
/* jump bar: highlight the section in view */
(function(){
  var bar=document.querySelector('.sk-jump');if(!bar||!('IntersectionObserver' in window))return;
  var links=[].slice.call(bar.querySelectorAll('a[href^="#"]')),map={};
  links.forEach(function(a){var t=document.getElementById(a.getAttribute('href').slice(1));if(t)map[t.id]=a});
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){links.forEach(function(l){l.classList.remove('on')});var a=map[x.target.id];if(a){a.classList.add('on');if(a.scrollIntoView&&bar.scrollWidth>bar.clientWidth)a.parentNode.scrollLeft=a.offsetLeft-40}}})},{rootMargin:'-30% 0px -60% 0px'});
  Object.keys(map).forEach(function(id){io.observe(document.getElementById(id))});
})();
