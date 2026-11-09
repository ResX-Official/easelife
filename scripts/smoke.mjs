import "dotenv/config";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { createDatabaseClient } from "../lib/database.ts";
import { createStorageClient, storageBucket } from "../lib/supabase-storage.ts";
import { deletePhotoObjects } from "../lib/photo-objects.ts";

const origin = process.argv.find(arg=>arg.startsWith("--origin="))?.slice(9) ?? process.env.SMOKE_ORIGIN ?? "http://127.0.0.1:3000";
const output = "/tmp/easelife-smoke";
await mkdir(output,{recursive:true});
const db = createDatabaseClient();
const chrome = spawn("google-chrome",["--headless","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--remote-debugging-port=0",`--user-data-dir=${output}/chrome`,"about:blank"],{stdio:["ignore","ignore","pipe"]});
let roomId, socket, ownerListingId, ownerTitle;
const ownerPhotoUrls = [];
const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));
try {
  const wsUrl = await new Promise((resolve,reject)=>{
    let buffer="";
    const timeout=setTimeout(()=>reject(new Error("Chrome debugging endpoint did not start")),15000);
    chrome.stderr.on("data",chunk=>{buffer+=chunk.toString(); const match=buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});
    chrome.on("error",reject);
  });
  socket = new WebSocket(wsUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener("open",resolve,{once:true});socket.addEventListener("error",reject,{once:true});});
  let seq=0;
  const pending=new Map();
  socket.addEventListener("message",event=>{const result=JSON.parse(event.data);if(result.method === "Network.responseReceived" && result.params.type === "Script" && result.params.response.status >= 400) console.error("Script response:",result.params.response.status,new URL(result.params.response.url).pathname);if(result.method === "Network.loadingFailed" && !result.params.canceled && result.params.errorText !== "net::ERR_ABORTED") console.error("Resource failed:",result.params.errorText,result.params.blockedReason ?? "");if(result.method === "Runtime.exceptionThrown") console.error("Browser exception:",result.params.exceptionDetails.exception?.description?.slice(0,500));if(result.id){const task=pending.get(result.id);pending.delete(result.id);if(task){clearTimeout(task.timer);if (result.error) task.reject(new Error(result.error.message)); else task.resolve(result.result);}}});
  function cmd(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error(`Browser command timed out: ${method}`));},30000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
  async function page(){const {browserContextId}=await cmd("Target.createBrowserContext");const {targetId}=await cmd("Target.createTarget",{url:"about:blank",browserContextId});const {sessionId}=await cmd("Target.attachToTarget",{targetId,flatten:true});await cmd("Page.enable",{},sessionId);await cmd("Runtime.enable",{},sessionId);await cmd("Network.enable",{},sessionId);return sessionId;}
  async function evaluate(s,expression){const r=await cmd("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true},s);if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description ?? "Browser evaluation failed");return r.result.value;}
  async function wait(s,expression,message=expression,attempts=120){for(let n=0;n<attempts;n++){try{if(await evaluate(s,expression))return;}catch{}await delay(250);}const detail=await evaluate(s,"({path:location.pathname,error:document.querySelector('.form-error')?.textContent,invalid:[...document.querySelectorAll('input:invalid')].map(e=>e.name)})");const shot=await cmd("Page.captureScreenshot",{format:"png"},s);await writeFile(`${output}/failure.png`,Buffer.from(shot.data,"base64"));throw new Error(`Timed out: ${message} ${JSON.stringify(detail)}`);}
  async function go(s,path){await cmd("Page.bringToFront",{},s);await cmd("Page.navigate",{url:`${origin}${path}`},s);await wait(s,"document.readyState === 'complete' && document.body && !document.body.innerText.includes('Compiling')","page ready");await delay(700);}
  async function interactive(s) {
    await wait(s,`(()=>{const button=document.querySelector('button[aria-label="Toggle menu"]');if(!button)return false;if(button.getAttribute('aria-expanded')==='true')return true;button.click();return button.getAttribute('aria-expanded')==='true';})()`,"interactive navigation");
    await evaluate(s,`document.querySelector('button[aria-label="Toggle menu"]').click()`);
  }
  async function fields(s,values){
    for(const [name,value] of Object.entries(values)) {
      const selector = `input[name="${name}"],textarea[name="${name}"],select[name="${name}"]`;
      const select = await evaluate(s,`document.querySelector(${JSON.stringify(selector)})?.tagName === 'SELECT'`);
      if(select) await evaluate(s,`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('change',{bubbles:true}));})()`);
      else {
        await evaluate(s,`document.querySelector(${JSON.stringify(selector)}).focus()`);
        await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:"a",code:"KeyA",windowsVirtualKeyCode:65,nativeVirtualKeyCode:65,modifiers:2},s);
        await cmd("Input.dispatchKeyEvent",{type:"keyUp",key:"a",code:"KeyA",windowsVirtualKeyCode:65,nativeVirtualKeyCode:65,modifiers:2},s);
        await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:"Backspace",code:"Backspace",windowsVirtualKeyCode:8,nativeVirtualKeyCode:8},s);
        await cmd("Input.dispatchKeyEvent",{type:"keyUp",key:"Backspace",code:"Backspace",windowsVirtualKeyCode:8,nativeVirtualKeyCode:8},s);
        if(value) await cmd("Input.insertText",{text:value},s);
      }
    }
  }
  async function click(s,text){await evaluate(s,`(()=>{const el=[...document.querySelectorAll('button,a')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)throw new Error('Missing action '+${JSON.stringify(text)});el.click();})()`);}
  async function screenshot(s,name,width=1440,height=1000){await cmd("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false},s);await delay(900);const {data}=await cmd("Page.captureScreenshot",{format:"png",captureBeyondViewport:false},s);await writeFile(`${output}/${name}.png`,Buffer.from(data,"base64"));assert.ok(await evaluate(s,"document.documentElement.scrollWidth <= window.innerWidth"),`Horizontal overflow on ${name}`);}
  const host=await page();
  if(process.argv.includes("--gallery-only")) {
    const listing = await db.listing.create({data:{title:"QA gallery",description:"Temporary gallery check",price:100,currency:"NGN",propertyType:"Apartment",bedrooms:2,bathrooms:1,city:"Lagos",state:"Lagos",address:"Test",landlordName:"QA",landlordEmail:"qa@example.test",landlordPhone:"08000000000",photos:{create:Array.from({length:15},(_,order)=>({url:"/file.svg",order}))}}});
    ownerListingId = listing.id;
    await go(host,`/listings/${listing.id}`);
    await interactive(host);
    await click(host,"View all 15 photos");
    await wait(host,"document.querySelector('dialog').open","gallery opens");
    await evaluate(host,"document.querySelector('[aria-label=\"Previous photo\"]').click()");
    await wait(host,"document.querySelector('dialog').innerText.includes('Photo 15 of 15')","last photo accessible");
    await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:"ArrowRight",code:"ArrowRight"},host);
    await wait(host,"document.querySelector('dialog').innerText.includes('Photo 1 of 15')","keyboard navigation");
    await evaluate(host,`(()=>{const image=document.querySelector('dialog img');image.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,touches:[new Touch({identifier:1,target:image,clientX:300,clientY:200})]}));image.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[new Touch({identifier:1,target:image,clientX:100,clientY:205})]}));})()`);
    await wait(host,"document.querySelector('dialog').innerText.includes('Photo 2 of 15')","swipe navigation");
    await screenshot(host,"gallery-mobile",390,844);
    await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape"},host);
    await wait(host,"!document.querySelector('dialog').open && document.body.style.overflow !== 'hidden'","close restores scrolling");
    console.log("PASS all 15 photos, keyboard, swipe, mobile layout, and close");
  } else if(process.argv.includes("--draft-only")) {
    await go(host,"/list-property");
    await interactive(host);
    await fields(host,{title:"QA saved draft",description:"A draft kept after a refresh.",price:"120000",landlordEmail:"draft@example.test"});
    await evaluate(host,"document.querySelector('#listingCategory').click()");
    await click(host,"Homes for sale").catch(async () => {
      await evaluate(host,"[...document.querySelectorAll('[role=option]')].find(el=>el.textContent.toLowerCase().includes('sale')).click()");
    });
    await wait(host,"JSON.parse(localStorage.getItem('easelife:listing-draft:v1'))?.title === 'QA saved draft'","draft saved");
    await go(host,"/list-property");
    await wait(host,"document.body.innerText.includes('Resume draft')","draft offered after refresh");
    await click(host,"Resume draft");
    await wait(host,"document.querySelector('[name=title]').value === 'QA saved draft'","draft restored");
    assert.equal(await evaluate(host,"document.querySelector('[name=landlordEmail]').value"),"draft@example.test");
    assert.equal(await evaluate(host,"document.querySelector('[name=listingCategory]').value"),"sale");
    await go(host,"/list-property");
    await click(host,"Discard draft");
    assert.equal(await evaluate(host,"localStorage.getItem('easelife:listing-draft:v1')"),null);
    assert.equal(await evaluate(host,"document.querySelector('[name=title]').value"),"");
    console.log("PASS draft save, refresh, restore, category, and discard");
  } else if(process.argv.includes("--read-error-only")) {
    await go(host,"/list-property");
    await interactive(host);
    assert.ok(await evaluate(host,"document.body.innerText.includes('Easelife') && !!document.querySelector('input[name=title]')"),"The form loads even when the optional logo lookup fails");
    await go(host,"/listings");
    await wait(host,"document.querySelector('[role=alert]')?.textContent.includes('Please try again in a moment')","friendly read failure");
    await click(host,"Try again");
    await wait(host,"document.querySelector('[role=alert]')?.textContent.includes('Please try again in a moment')","retry remains usable");
    assert.ok(await evaluate(host,"!!document.querySelector('a[href=\"/my-listings\"]')"),"Read failures provide a link to saved listings");
    console.log("PASS optional-logo fallback and page-error recovery when the database is unavailable");
  } else if(process.argv.includes("--security-only")) {
    await go(host,"/admin");
    assert.equal(await evaluate(host,"!!document.querySelector('[name=password]')"),true,"Admin requires login");
    for(let attempt=0;attempt<11;attempt++) {
      await fields(host,{username:"wrong-admin",password:"wrong-password"});
      await wait(host,"[...document.querySelectorAll('button')].some(button=>button.textContent.trim()==='Sign in' && !button.disabled)","login form ready");
      await click(host,"Sign in");
      await delay(600);
    }
    await wait(host,"document.body.innerText.includes('Too many sign-in attempts')","admin login rate limit");
    console.log("PASS admin login rejects repeated attempts");
    const result=await evaluate(host,`(async()=>{let limited;for(let index=0;index<250;index++){const response=await fetch('/api/visit?path=/security-check',{method:'POST',headers:{'x-forwarded-for':'192.0.2.'+(index%250+1)}});if(response.status!==204){limited={status:response.status,retryAfter:response.headers.get('retry-after')};break;}}return limited;})()`);
    assert.equal(result?.status,429,"Visitor writes are rate limited even with spoofed forwarding headers");
    assert.ok(Number(result.retryAfter)>0,"Rate limits return a retry interval");
    console.log("PASS persistent API rate limits and forwarding-header spoof protection");
  } else if(process.argv.includes("--owner-only")) {
    const title = `QA publishing ${Date.now()}`;
    ownerTitle = title;
    const manyPhotos = process.argv.includes("--many-photos");
    const photoCount = manyPhotos ? 15 : 1;
    await go(host,"/list-property");
    await interactive(host);
    await fields(host,{title,description:"Temporary end-to-end readiness check.",price:"120000",bedrooms:"2",bathrooms:"2",city:"Lagos",state:"Lagos",address:"QA test address",landlordName:"QA Owner",landlordEmail:"qa@example.test",landlordPhone:"08000000000"});
    await evaluate(host,"document.querySelector('#propertyType').click()");
    await wait(host,"!!document.querySelector('[role=option]')","property type dropdown");
    await click(host,"Apartment");
    if(manyPhotos) {
      await evaluate(host,`(()=>{window.qaPhotoRequests=0;const original=window.fetch.bind(window);window.fetch=async(input,options)=>{if(input==='/api/photos'){window.qaPhotoRequests++;sessionStorage.setItem('qaPhotoRequests',String(window.qaPhotoRequests));if(window.qaPhotoRequests===3)return new Response(JSON.stringify({error:'Temporary upload failure'}),{status:503,headers:{'content-type':'application/json'}});}if(input==='/api/listings'){const started=performance.now();const response=await original(input,options);sessionStorage.setItem('qaPublishDuration',String(Math.round(performance.now()-started)));return response;}return original(input,options);};})()`);
    }
    await evaluate(host,`(async()=>{const files=new DataTransfer();for(let index=0;index<${photoCount};index++){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const context=canvas.getContext('2d');const data=context.createImageData(1024,1024);let seed=index+1;for(let offset=0;offset<data.data.length;offset+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data.data[offset]=seed&255;data.data[offset+1]=(seed>>>8)&255;data.data[offset+2]=(seed>>>16)&255;data.data[offset+3]=255;}context.putImageData(data,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.95));files.items.add(new File([blob],'qa-'+index+'.jpg',{type:'image/jpeg'}));}const input=document.querySelector('input[name=photos]');input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
    await wait(host,`document.body.innerText.includes('${photoCount} photo') && !document.querySelector('button[type=submit]').disabled`,"photos prepared",240);
    if(manyPhotos) {
      assert.ok(await evaluate(host,"[...document.querySelector('input[name=photos]').files].reduce((sum,file)=>sum+file.size,0)>4.5*1024*1024"),"Regression selection exceeds the old single-request limit");
      await wait(host,"document.querySelector('[role=alert]')?.textContent.includes('Some photos')","recoverable background upload error",240);
      assert.equal(await evaluate(host,"document.querySelector('input[name=title]').value"),title,"Upload failures preserve listing details");
      assert.ok(await evaluate(host,"document.body.innerText.includes('15 photos')"),"Upload failures preserve selected photos");
      console.log("PASS background upload failure preserves the form and allows retry");
    }
    await evaluate(host,"document.querySelector('input[name=title]').form.requestSubmit()");
    await wait(host,"location.pathname.startsWith('/manage/')","listing published",480);

    if(manyPhotos) assert.equal(await evaluate(host,"Number(sessionStorage.getItem('qaPhotoRequests'))"),16,"Retry reuses the first two completed uploads");
    if(manyPhotos) console.log(`CHECK final publish request ${await evaluate(host,"sessionStorage.getItem('qaPublishDuration')")} ms after photo uploads`);
    const listing = await db.listing.findFirstOrThrow({where:{title},include:{photos:true}});
    assert.equal(listing.photos.length,photoCount,"All selected photos are attached to the listing");
    ownerListingId=listing.id;
    ownerPhotoUrls.push(...listing.photos.map(photo=>photo.url));
    const photoStatus=await evaluate(host,`fetch(${JSON.stringify(listing.photos[0].url)}).then(r=>r.status)`);
    console.log(`CHECK newly uploaded photo HTTP ${photoStatus}`);
    assert.equal(photoStatus,200,"New uploads must be served without restarting production");
    const optimizedPhotoStatus=await evaluate(host,`fetch('/_next/image?url='+encodeURIComponent(${JSON.stringify(listing.photos[0].url)})+'&w=640&q=75').then(r=>r.status)`);
    assert.equal(optimizedPhotoStatus,200,"New uploads work with image optimization");
    assert.equal(await evaluate(host,"fetch('/uploads/not-a-photo.txt').then(r=>r.status)"),404);
    await go(host,"/");
    assert.ok((await evaluate(host,"document.body.innerText")).includes(title),"Published listing appears on the homepage immediately");
    console.log("PASS publishing, uploaded photo serving, and homepage freshness");
    const guest=await page();
    await go(guest,`/listings/${listing.id}`);
    await interactive(guest);
    await click(guest,photoCount === 1 ? "View photo" : `View all ${photoCount} photos`);
    await wait(guest,"document.querySelector('dialog')?.open","photo gallery opens");
    assert.ok(await evaluate(guest,`document.querySelector('dialog').innerText.includes('Photo 1 of ${photoCount}')`));
    if(photoCount > 1) {
      await evaluate(guest,"document.querySelector('[aria-label=\"Previous photo\"]').click()");
      assert.ok(await evaluate(guest,`document.querySelector('dialog').innerText.includes('Photo ${photoCount} of ${photoCount}')`));
      await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:"ArrowRight",code:"ArrowRight"},guest);
      assert.ok(await evaluate(guest,`document.querySelector('dialog').innerText.includes('Photo 1 of ${photoCount}')`));
    }
    await cmd("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape"},guest);
    await wait(guest,"!document.querySelector('dialog').open","gallery closes with Escape");
    console.log("PASS full photo gallery opens and closes with keyboard support");
    const publicHtml=await evaluate(guest,"fetch(location.href).then(r=>r.text())");
    assert.equal(await evaluate(guest,`fetch('/api/listings/${listing.id}',{method:'DELETE'}).then(response=>response.status)`),401,"Guests cannot delete listings");
    assert.equal(await evaluate(guest,`fetch('/api/listings/${listing.id}',{method:'DELETE',headers:{authorization:'Bearer wrong-management-token'}}).then(response=>response.status)`),403,"Wrong owner tokens cannot delete listings");
    assert.ok(!publicHtml.includes(listing.managementToken),"Public listing does not expose owner credentials");
    await fields(guest,{senderName:"QA Guest",senderEmail:"guest@example.test",senderPhone:"08000000001",body:"Temporary readiness enquiry"});
    await click(guest,"Send message");
    await wait(guest,"document.body.innerText.includes('Your message was sent')","enquiry sent");
    await go(host,`/manage/${listing.managementToken}`);
    await wait(host,"document.body.innerText.includes('Temporary readiness enquiry')","enquiry received in owner inbox");
    await interactive(host);
    await fields(host,{title:`${title} updated`});
    await click(host,"Save changes");
    await wait(host,`document.body.innerText.includes(${JSON.stringify(`Manage ${title} updated`)})`,"listing updated");
    assert.equal((await db.listing.findUniqueOrThrow({where:{id:listing.id}})).title,`${title} updated`);
    console.log("PASS public credential privacy, enquiry delivery to owner inbox, and listing editing");
    assert.equal(await evaluate(host,"document.querySelector('input[aria-label=\"Private management link\"]').value"),`${origin}/manage/${listing.managementToken}`);
    await go(host,"/my-listings");
    await wait(host,`document.body.innerText.includes(${JSON.stringify(`${title} updated`)})`,"saved owner listing");
    await go(host,`/manage/${listing.managementToken}`);
    await interactive(host);
    await evaluate(host,`(()=>{window.confirm=()=>true;document.querySelector('details').open=true;window.qaDeleteRequests=0;const original=window.fetch.bind(window);window.fetch=async(input,options)=>{if(options?.method==='DELETE'){window.qaDeleteRequests++;if(window.qaDeleteRequests===1)return new Response(JSON.stringify({error:'Temporary deletion failure'}),{status:503,headers:{'content-type':'application/json'}});}return original(input,options);};const button=[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Delete listing');button.click();button.click();})()`);
    await wait(host,"document.querySelector('[role=alert]')?.textContent.includes('Temporary deletion failure')","recoverable delete error");
    assert.equal(await evaluate(host,"window.qaDeleteRequests"),1,"Duplicate clicks send only one delete request");
    assert.ok(await db.listing.findUnique({where:{id:listing.id}}),"A failed request does not remove the listing");
    console.log("PASS deletion failure stays on the page and duplicate clicks are blocked");
    await evaluate(host,"[...document.querySelectorAll('button')].find(button=>button.textContent.trim()==='Delete listing').click()");
    await wait(host,"location.pathname === '/my-listings'","listing deleted");
    assert.equal(await db.listing.findUnique({where:{id:listing.id}}),null);
    assert.ok(!(await evaluate(host,"document.body.innerText")).includes(`${title} updated`),"Deleted management links are removed from this browser");
    for (const url of ownerPhotoUrls) assert.equal(await evaluate(host,`fetch(${JSON.stringify(url)},{cache:'no-store'}).then(response=>response.status)`),404,"Deleted listing photos are no longer served");
    for(let attempt=0;attempt<80;attempt++){if(await db.storedPhoto.count({where:{filename:{in:ownerPhotoUrls.map(url=>url.split('/').pop())}}})===0)break;await delay(250);}
    assert.equal(await db.storedPhoto.count({where:{filename:{in:ownerPhotoUrls.map(url=>url.split('/').pop())}}}),0,"Deleted photos release their storage allowance");
    await go(host,"/");
    assert.ok(!(await evaluate(host,"document.body.innerText")).includes(title),"Deleted listing disappears from the homepage");
    console.log("PASS private sharing, saved management links, deletion, and homepage refresh after deletion");
    if(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      const adminListing = await db.listing.create({data:{title:`${title} admin`,description:"Temporary admin deletion check.",price:100,currency:"NGN",propertyType:"Apartment",bedrooms:2,bathrooms:1,city:"Lagos",state:"Lagos",address:"Test address",landlordName:"QA Owner",landlordEmail:"qa@example.test",landlordPhone:"08000000000"}});
      ownerListingId=adminListing.id;
      const admin=await page();
      await go(admin,"/admin");
      await wait(admin,"!!document.querySelector('[name=password]')","admin login");
      await fields(admin,{username:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD});
      await click(admin,"Sign in");
      await wait(admin,"!!document.querySelector('.admin-metrics')","authenticated admin");
      await go(admin,`/admin?tab=properties&q=${encodeURIComponent(adminListing.title)}`);
      await wait(admin,"!!document.querySelector('tbody button')","admin listing row");
      await evaluate(admin,`(()=>{window.confirm=()=>true;window.qaDeleteRequests=0;const original=window.fetch.bind(window);window.fetch=async(input,options)=>{if(options?.method==='DELETE'){window.qaDeleteRequests++;if(window.qaDeleteRequests===1)return new Response(JSON.stringify({error:'Temporary admin deletion failure'}),{status:503,headers:{'content-type':'application/json'}});}return original(input,options);};const button=document.querySelector('tbody button');button.click();button.click();})()`);
      await wait(admin,"document.querySelector('[role=alert]')?.textContent.includes('Temporary admin deletion failure')","recoverable admin delete error");
      assert.equal(await evaluate(admin,"window.qaDeleteRequests"),1);
      assert.ok(await db.listing.findUnique({where:{id:adminListing.id}}));
      await evaluate(admin,"document.querySelector('tbody button').click()");
      await wait(admin,`!document.querySelector('tbody')?.innerText.includes(${JSON.stringify(adminListing.title)})`,"admin row removed");
      assert.equal(await db.listing.findUnique({where:{id:adminListing.id}}),null);
      console.log("PASS admin deletion errors, retry, duplicate-click protection, and inventory refresh");
    }
  } else if(process.argv.includes("--check-hydration")) {
    await go(host,"/escape");
    await interactive(host);
    console.log("PASS local development server serves an interactive Escape Match form");
  } else {
  if(!process.env.SMOKE_ESCAPE_ONLY && !process.argv.includes("--escape-only")) {
  await go(host,"/listings?category=staycation");await wait(host,"document.querySelectorAll('.editorial-listing').length >= 8","demo stay catalogue");await screenshot(host,"stays-desktop");await screenshot(host,"stays-mobile",390,1000);console.log("PASS stay catalogue and mobile layout");
  await go(host,"/listings?category=apartments");await wait(host,"document.querySelectorAll('.editorial-listing').length >= 2","luxury apartment collection");await screenshot(host,"apartments-desktop");await screenshot(host,"apartments-mobile",390,1000);
  await go(host,"/listings?category=apartments&period=monthly");await wait(host,"!!document.querySelector('.apartment-period-tabs')","monthly apartments");assert.ok((await evaluate(host,"document.body.innerText")).includes("/ month"));
  await go(host,"/listings?category=apartments&period=daily");await wait(host,"document.querySelectorAll('.editorial-listing').length >= 1","daily apartments");assert.ok((await evaluate(host,"document.body.innerText")).includes("/ day"));
  await go(host,"/listings?category=apartments&purpose=sale");await wait(host,"document.querySelectorAll('.editorial-listing').length >= 1","apartments for sale");assert.ok(!(await evaluate(host,"document.querySelector('.catalog-grid').innerText")).includes("/ month"));console.log("PASS daily apartments, monthly apartments, and apartment sales");
  await go(host,"/listings?type=sale");await wait(host,"document.querySelectorAll('.editorial-listing').length >= 4","demo sale catalogue");assert.ok(!(await evaluate(host,"document.body.innerText")).includes("/ night"));console.log("PASS sale catalogue");
  await go(host,"/listings/demo-palm-house");await wait(host,"document.body.innerText.includes('fictional demo listing')","demo disclaimer");assert.equal(await evaluate(host,"!!document.querySelector('#contact form')"),false);await screenshot(host,"detail-desktop");await screenshot(host,"detail-mobile",390,1000);console.log("PASS demo detail and disabled enquiries");
  await go(host,"/list-property");await wait(host,"!!document.querySelector('input[name=title]')","listing form");await screenshot(host,"list-property-desktop");await screenshot(host,"list-property-mobile",390,1000);console.log("PASS listing editor layout");
  await go(host,"/my-listings");await wait(host,"document.body.innerText.includes('Good places. All yours.')","saved listings page");console.log("PASS saved listings page");
  }
  await go(host,"/escape");await wait(host,"!!document.querySelector('.escape-create-form')","escape form");await interactive(host);await screenshot(host,"escape-desktop");await screenshot(host,"escape-mobile",390,1100);
  await fields(host,{name:"QA Host",title:"QA weekend escape",groupSize:"2",nights:"2",budget:"1",location:"",vibe:"any",currency:"NGN"});await click(host,"Create our escape");await wait(host,"document.body.innerText.includes('We need at least two stays')","budget validation");
  await fields(host,{budget:""});await click(host,"Create our escape");await wait(host,"location.pathname.startsWith('/escape/') && !!document.querySelector('.escape-vote-card')","created room");roomId=await evaluate(host,"location.pathname.split('/').pop()");
  const room=await db.escapeRoom.findUnique({where:{id:roomId},include:{options:{include:{listing:true}},members:true}});assert.equal(room.groupSize,2);assert.equal(room.options.length,6);assert.equal(room.members.length,1);assert.ok(room.options.every(o=>["daily","per_stay"].includes(o.listing.paymentFrequency)));console.log("PASS persistent room creation and strict budget matching");
  const participant=await page();await go(participant,`/escape/${roomId}`);await wait(participant,"!!document.querySelector('.escape-join-form')","invitation page");await screenshot(participant,"invitation-mobile",390,1000);
  const html=await evaluate(participant,"fetch(location.href).then(r=>r.text())");assert.ok(!html.includes('hostHash'));assert.ok(!html.includes('tokenHash'));assert.ok(!html.includes(room.hostHash));assert.ok(!html.includes(room.members[0].tokenHash));
  await fields(participant,{name:"QA Friend"});await click(participant,"I’m in. Let’s find our escape.");await wait(participant,"!!document.querySelector('.escape-vote-card')","joined room");
  const outsider=await page();await go(outsider,`/escape/${roomId}`);await wait(outsider,"document.body.innerText.includes('This group is full')","room capacity");console.log("PASS nickname join, capacity limit, and no credential leakage");
  const total=room.options.length;
  for(let i=0;i<total;i++){await wait(host,"!!document.querySelector('.escape-vote-buttons button:last-child:not(:disabled)')","host vote ready");await click(host,"I’m in");if(i+1<total)await wait(host,`document.body.innerText.includes('${i+1} / ${total} picked')`,"vote saved");else await wait(host,"!!document.querySelector('.escape-waiting')","host finished");}
  await go(host,`/escape/${roomId}`);await wait(host,"!!document.querySelector('.escape-waiting')","votes persist after reload");
  const before=await db.escapeRoom.findUnique({where:{id:roomId}});assert.equal(before.status,"voting");assert.ok(!(await evaluate(participant,"document.body.innerText")).includes("I’m in ·"));console.log("PASS votes persist and other votes remain hidden before reveal");
  for(let i=0;i<total;i++){await wait(participant,"!!document.querySelector('.escape-vote-buttons button:last-child:not(:disabled)')","friend vote ready");await click(participant,"I’m in");if(i+1<total)await wait(participant,`document.body.innerText.includes('${i+1} / ${total} picked')`,"friend vote saved");else await wait(participant,"!!document.querySelector('.escape-winner')","automatic reveal");}
  assert.equal((await db.escapeRoom.findUnique({where:{id:roomId}})).status,"revealed");await screenshot(participant,"reveal-desktop");await screenshot(participant,"reveal-mobile",390,1100);await go(host,`/escape/${roomId}`);await wait(host,"document.body.innerText.includes('Everyone’s saying')","unanimous result");assert.equal(await evaluate(host,"!!document.querySelector('.escape-vote-buttons')"),false);console.log("PASS automatic unanimous reveal and closed voting");
  const revealHTML=await evaluate(participant,"fetch(location.href).then(r=>r.text())");assert.ok(!revealHTML.includes('tokenHash'));const metadata=await evaluate(participant,"document.querySelector('meta[property=\"og:image\"]')?.content");assert.ok(metadata,"Invitation has an Open Graph image");
  if(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD){const admin=await page();await go(admin,"/admin");await wait(admin,"!!document.querySelector('[name=password]')","admin login");await fields(admin,{username:process.env.ADMIN_USERNAME,password:process.env.ADMIN_PASSWORD});await click(admin,"Sign in");await wait(admin,"!!document.querySelector('.admin-metrics')","authenticated dashboard");await screenshot(admin,"admin-desktop");await screenshot(admin,"admin-mobile",390,1000);for(const tab of ["properties","enquiries","escapes","traffic","settings"]){await go(admin,`/admin?tab=${tab}`);await wait(admin,"!!document.querySelector('.admin-content')","admin section");assert.ok(!(await evaluate(admin,"document.body.innerText")).includes("Internal Server Error"));}await go(admin,"/admin?tab=properties");await screenshot(admin,"admin-properties-desktop");await go(admin,"/admin?tab=settings");await click(admin,"Sign out");await wait(admin,"!!document.querySelector('[name=password]')","admin logout");console.log("PASS admin authentication, all six views, and logout");}
  console.log(`PASS all smoke checks. Screenshots saved to ${output}`);
  }
} catch(error){console.error(`FAIL ${error.message}`);process.exitCode=1;}
finally{if(!ownerListingId&&ownerTitle){const leftover=await db.listing.findFirst({where:{title:{in:[ownerTitle,`${ownerTitle} updated`]},landlordEmail:"qa@example.test"},include:{photos:true}});if(leftover){ownerListingId=leftover.id;ownerPhotoUrls.push(...leftover.photos.map(photo=>photo.url));}}if(roomId)await db.escapeRoom.deleteMany({where:{id:roomId}});if(ownerListingId)await db.listing.deleteMany({where:{id:ownerListingId}});if(ownerPhotoUrls.length)await deletePhotoObjects(db,createStorageClient().from(storageBucket()),ownerPhotoUrls);await db.$disconnect();if(socket?.readyState===1)socket.close();chrome.kill();}
