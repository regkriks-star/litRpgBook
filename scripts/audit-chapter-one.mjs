import { chromium } from '@playwright/test';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=JSON.parse(execFileSync('python3',['-c',`import json,xml.etree.ElementTree as E
n={'f':'http://www.gribuser.ru/xml/fictionbook/2.0'}
r=E.parse('ленивое мужество.fb2').getroot()
s=next(s for s in r.findall('.//f:body/f:section',n) if s.find('f:title',n) is not None and ''.join(s.find('f:title',n).itertext()).strip()=='Глава 1')
print(json.dumps([''.join(p.itertext()) for p in s.findall('f:p',n)]))`],{encoding:'utf8'}));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const directory='docs/reviews/chapters-01-04';
const widths=process.argv.slice(2).map(Number); const sizes=[{width:568,height:320},{width:844,height:390},{width:1024,height:600},{width:1280,height:600},{width:1366,height:768}].filter(s=>!widths.length||widths.includes(s.width));
for(const size of sizes){
 const page=await browser.newPage({viewport:size,reducedMotion:'reduce'}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:5173');await page.evaluate(()=>{localStorage.setItem('lazy-courage:view','chapter-one');localStorage.setItem('lazy-courage:chapter-one-page','0');});await page.reload();
 const states=[];
 for(let i=0;i<source.length;i++){
  const text=await page.locator('.chapter-one-text p').textContent();if(text!==source[i])throw Error(`text${size.width}:${i}`);
  const state=await page.evaluate(()=>{
   const text=document.querySelector('.chapter-one-text'),window=document.querySelector('.story-window'),b=text.getBoundingClientRect();
   return{overflow:document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight,textHeight:b.height,textScrollHeight:text.scrollHeight,controls:[...document.querySelectorAll('.reader-controls button,.reader-header button,.card-inspect')].filter(e=>getComputedStyle(e).opacity!=='0').map(e=>{const b=e.getBoundingClientRect();return{name:e.getAttribute('aria-label')||e.textContent,w:b.width,h:b.height,y:b.y,x:b.x,visible:b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1};}),windowTop:window.getBoundingClientRect().top};
  });
  if(state.overflow||state.textHeight<40||state.controls.some(b=>!b.visible||b.w<43.99||b.h<43.99))throw Error(`layout${size.width}:${i}: ${JSON.stringify(state)}`);
  states.push({paragraph:i,...state});
  if([25,26,69,88,93,97,104,111].includes(i))await page.screenshot({path:`${directory}/after-ch01-${size.width}-p${i}.png`});
  if(i<source.length-1)await page.getByRole('button',{name:'Далее',exact:true}).click();
 }
 if(errors.length)throw Error(errors.join('\n'));
 await page.reload();if(await page.locator('.chapter-one-text p').textContent()!==source.at(-1))throw Error('resume');
 await page.getByRole('button',{name:'Назад',exact:true}).click();if(await page.locator('.chapter-one-text p').textContent()!==source.at(-2))throw Error('back');
 await page.setViewportSize({width:390,height:844});if(!(await page.getByRole('heading',{name:'Поверните телефон'}).filter({visible:true}).isVisible()))throw Error('portrait');
 fs.writeFileSync(`${directory}/chapter-one-after-${size.width}.json`,JSON.stringify({size,paragraphs:states.length,states,errors,resume:true,back:true,portrait:true},null,2));console.log(`PASS: chapter1 ${size.width}x${size.height},113 full FB2 paragraphs,controls44,resume,back,portrait`);
 await page.close();
}
await browser.close();
