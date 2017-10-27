/* lets...
collaborative environment for Windows Network Shared Folders

requires Quasic repos wshta, jsformat, and dom

Copyright (C) Quasic on GitHub
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.
You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
var lets={
log:["Loading..."],
keyMap:[],
tabContainer:[],
passwd:{},
userListOptionsHTML:''
};
(function(){"use strict";try{
lets.log.push("loading basic key handlers...");
document.onkeydown=function(){var f=lets.keyMap[event.keyCode];if(f)f(window);};
lets.keyMap[115]=lets.debugConsole=require("wshta/debugConsole.js");//F4, will load anyway, so no need to be lazy
lets.keyMap[112]=function(){alert("Keyboard shortcuts:\nFind text on page (Ctrl+F), Print page (Ctrl+P), Select All on page or in edit box (Ctrl+A), Zoom in (Ctrl+ +), Zoom out (Ctrl+ -)\nQuick Help (F1), Logout (F2), Debug (F4), Refresh (F5)\nEditing: Copy selection to clipboard (Ctrl+C), Cut (Ctrl+X, same as Copy then delete), Paste from clipboard (Ctrl+V), Undo previous edit (Ctrl+Z), Redo previous Undo (Ctrl+Y)\nYou can use the keyboard instead of the mouse for most things: Next control (Tab), Click control (Enter), Check box (Spacebar)");};//F1

lets.log.push("Loading basic functionality");
lets.M=require("module");
var fso=lets.fso=require("fso");
lets.dataPrefix=lets.localDataPrefix="localData/";
if(!fso.folderexists(lets.localDataPrefix))fso.createFolder(lets.localDataPrefix);

lets.log.push("Setting up local error reporting system");
if(!fso.folderexists(lets.localDataPrefix+"DebugConsole"))fso.createFolder(lets.localDataPrefix+"DebugConsole");
console.stream.conerr=console.stream[1];
console.stream[1]=console.stream.locerr={writeLine:function(s){
try{
var logerr=fso.openTextFile(lets.dataPrefix+"DebugConsole/errors.log",8,1);
logerr.writeLine(s);
logerr.close();
}catch(e){
try{
var logerr=fso.openTextFile(lets.localDataPrefix+"DebugConsole/errors.log",8,1);
logerr.writeLine(s);
logerr.close();
}catch(e){
console.stream.conerr.writeLine("[Failed to log to DebugConsole/errors.log:]-"+console.stringFrom(e));
}}
console.stream.conerr.writeLine(s);
}};

lets.log.push("Reading network settings");
var ini=fso.fileexists("apps/local/lets.ini")?INI.fromStream(fso.openTextFile("apps/local/lets.ini",1)):{};
if(ini.dataFolder&&fso.folderexists(ini.dataFolder))(function(){
lets.dataPrefix=fso.getFolder(ini.dataFolder).shortPath+"\\";
if(!fso.folderexists(lets.dataPrefix+"DebugConsole"))fso.createFolder(lets.dataPrefix+"DebugConsole");
lets.log.push("Connected to network; using data path prefix "+lets.dataPrefix);
lets.timer=new autoInterval(ini.poll&&Math.abs(parseInt(ini.poll.delayMin))||321,ini.poll&&Math.abs(parseInt(ini.poll.delayMax))||12345);

lets.log.push("Sending any error reports...");
var rlfn=lets.dataPrefix+"DebugConsole\\errors.log",
rlf=fso.fileexists(rlfn)&&fso.getFile(rlfn);
function report(msg){try{var
h=fso.openTextFile(rlfn,8,1);
h.writeLine("\n"+(new Date)+" "+require("wshNet").computername+" "+location.href+": "+msg);
h.close();
lets.log.push(msg);
}catch(e){lets.log.push("Failed to report "+msg+" due to error: "+e.message);}}
function reportIf(f){
if(!fso.fileexists(f))return;
var
h=fso.openTextFile(f,1),
g="local "+f+"\n"+(h.atEndOfStream?"":h.readAll());
h.close();
report(g);
fso.deleteFile(f);
}
reportIf("error.log");
reportIf("errors.log");
if(!rlf||fso.fileexists(lets.localDataPrefix+"DebugConsole\\errors.log")&&((t=fso.getFile(lets.localDataPrefix+"DebugConsole\\errors.log")).size!=rlf.size||+t.dateCreated!=+rlf.dateCreated||+t.dateLastModified!=+rlf.dateLastModified))reportIf(lets.localDataPrefix+"DebugConsole\\errors.log");
//new errors should go directly there
if(fso.fileexists("console.log"))fso.deleteFile("console.log");

lets.log.push("Updating from origin");
var
shell=require("wshShell"),
pullR=/^## .+behind [1-9][0-9]*\]$/,
git="%comspec% /c git ";
try{
shell.run(git+"version > ..\\git.tmp",0,1);
}catch(e){}
if(!fso.fileexists("../git.tmp"))git=ini.gitFallback+" ";
lets.log.push("Using gitpath "+git);
function pull(repo){var
x=console.entero(0,"init:update:pull",arguments),
d=shell.currentDirectory,
changed=false,
h;
if(fso.folderexists(repo))try{
shell.currentDirectory=repo;
if(shell.run(git+"fetch > ..\\git.tmp 2>> "+rlfn,0,1)){
report("Can't update (fetch) "+repo);
reportIf("../git.tmp");
shell.run(git+"status >> "+rlfn,0);
}
shell.run(git+"status -uno -b --porcelain > ../git.tmp",0,1);
h=fso.openTextFile("../git.tmp",1);
changed=h.readLine().search(pullR)>=0;
h.close();
if(changed)if(shell.run(git+"merge -ff-only FETCH_HEAD >> ..\\git.tmp 2>> "+rlfn,0,1)){
changed=false;
report("Can't update (merge) "+repo);
reportIf("../git.tmp");
shell.run(git+"status >> "+rlfn,0);
}
}catch(e){
report("Error trying to update "+repo+": "+e.message);
shell.run(git+"status >> "+rlfn,0);
}else{
report("Can't find "+repo);
}
shell.currentDirectory=d;
return x(changed);
}
try{
shell.run(git+"version > ..\\git.tmp 2>> "+rlfn,0,1);
if(fso.fileexists("../git.tmp")){
reportIf("../git.tmp");
if(shell.run(git+"ls-remote --heads --exit-code 2> ../git.tmp",1,1)){
h=fso.openTextFile("../git.tmp",1);
lets.log.push("Not connected to update server "+(h.atEndOfStream?"":h.readAll()));
h.close();
}else if(pull("../wshta")|pull("../dom")|pull("../jsformat")|pull("../jsBinary")|pull(".")){t=fso.openTextFile(rlfn,8);t.writeLine((new Date)+" Reload after update...");t.close();t=fso.openTextFile("error.log",8);t.writeLine((new Date)+"Updated.");t.close();location.reload();}
if(fso.fileexists("../git.tmp"))fso.deleteFile("../git.tmp");
}else report("gitpath invalid");
}catch(e){
report(e.message);
reportIf("../git.tmp");
reportIf("errors.log");
}
})();else lets.log.push((ini.dataFolder?"Can't connect to "+ini.dataFolder:"lets.ini doesn't set dataFolder")+"..., so using "+fso.getFolder(lets.dataPrefix));

lets.log.push("Loading interface");
var frame=[window];
lets.skin=function(f){for(var i=0;i<frame.length;i++)frame[i].document.getElementsByTagName("link")[0].href="skins/"+f+".css";};
lets.openWindow=function(){
if(!lets.user)return;
var w=new ActiveXObject("InternetExplorer.Application");
w.toolbar=0;
w.menubar=false;//actually not needed
//w.statusbar= fine whatever
w.navigate("about:blank#Let's... (frame #"+frame.length);
w.visible=1;
lets.initFrame(w.Document.parentWindow);
};
lets.initFrame=function(w){
w.document.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>Let\'s... (frame #'+frame.length+')</title><link rel=stylesheet src="'+(lets.user&&lets.user.skin||"default")+'.css" /></head><body></body></html>');
w.document.close();
frame.push(w);
initDoc(w);
};
function initDoc(w){var c=new AppTabs(w.document.body);
lets.tabContainer.push(c);
(w.onresize=function(){c.resize(getWindowSize(w));})();
w.document.onkeydown=function(){var f=lets.keyMap[w.event.keyCode];if(f)f(w);};
if(lets.user)loginmenu(c);
}
function loginmenu(c){var
a=document.createElement("span"),
u=document.createElement("u");
a.innerHTML='Welcome, '+lets.user.getName()+'! (';
u.className="button";
u.onclick=function(){c.run('Login?Settings');};
u.innerHTML="Settings";
a.appendChild(u);
a.appendChild(document.createTextNode(" | "));
u=document.createElement("u");
u.className="button";
u.onclick=lets.openWindow;
u.innerHTML="New Window";
a.appendChild(u);
a.appendChild(document.createTextNode(" | "));
u=document.createElement("u");
u.className="button";
u.onclick=lets.logout;
u.innerHTML="Logout";
a.appendChild(u);
a.appendChild(document.createTextNode(") "));
c.bar.insertBefore(a,c.bar.firstChild);
}
initDoc(window);

lets.log.push("Launching DebugConsole and setting up app functionality");
AppTabs.app.DebugConsole=function(app){var
x=console.entero(0,"lets.js:AppTabs.app.DebugConsole",arguments);
app.makeTab("form");
if(arguments.callee.form){
app.content.parentNode.replaceChild(arguments.callee.form,app.content);
app.content=arguments.callee.form;
app.container.focus(app);
}else{
arguments.callee.form=app.content;
//var stderr=console.stream[1];
require("wshta/debugConsole.js")(0,app.content,{resultWidth:"90%"});
var rl=document.getElementById("debugConsoleResultList");
app.onresize=function(wh){var
x=console.entero(0,"DebugConsole.onresize",arguments);
rl.style.height=(wh.height-rl.offsetTop)+"px";
x();};
console.stream[1]={writeLine:function(s){
try{var
//can't use app.dataFolder() yet
logerr=fso.openTextFile(lets.dataPrefix+"DebugConsole/errors.log",8,1);
logerr.writeLine(s);
logerr.close();
console.stream.conerr.writeLine(s);
}catch(e){
console.stream.locerr.writeLine("[Failed to log to DebugConsole/errors.log:]-"+console.stringFrom(e));
console.stream.locerr.writeLine(s);
app.notify("[DebugConsole error log failure]");
}
app.notify(s.substring(0,256).replace(/</g,'&lt;')+(s.length>256?'...':''));
}};
app.onfocus=function(){app.clearNotes();};
app.exit();
}
//app.content.style.overflow="auto";
x();
}
var Approto=lets.tabContainer[0].run("DebugConsole").constructor.prototype;
}catch(e){document.body.innerHTML+='<div>Error: '+HTML.fromFormattedString(e.message)+'</div>INIT_BACKLOG:<br />'+HTML.fromFormattedString(lets.log.join("\n\n"));throw e;}
console.formatLog(0,lets.log,{},"INIT_BACKLOG");
delete lets.log;
window.onbeforeunload=function(){
lets.timer.stop();
/*
also save windows, etc... ?
var t=AppTabs.runningList().join("|");
if(t!==lets.user.run&&confirm("Save tabs?"))
*/
AppTabs.exitAll();
for(var i=1;i<frame.length;i++)if(frame[i].close)frame[i].close();
};
Approto.dataPrefix=function(){var f=lets.dataPrefix+this.appid+"\\";if(!fso.folderexists(f))fso.createFolder(f);return f;};
Approto.localDataPrefix=function(){var f=lets.localDataFolder+this.appid+"\\";if(!fso.folderexists(f))fso.createFolder(f);return f;};
Approto.dataFolder=function(){return fso.getFolder(this.dataPrefix());};

console.log("Loading users");
lets.login=function(code){var
x=console.entero(0,"lets.login",arguments),
a=lets.passwd[code],
i,
j;
if(!a)throw new Error("User code "+code+" not found in passwd file");
if(fso.fileexists(i=lets.dataPrefix+"login/"+code+".ini")){
lets.user=require(i);
for(i in a)lets.user[i]=a[i];
}else lets.user=a;//{myname:'Guest',appMenu:{appid:"title"},run:"appid|appid|appid"}
if(!lets.user.appMenu)lets.user.appMenu={};
lets.user.getName=function(){return lets.user.myname||lets.user.name;};
loginmenu(lets.tabContainer[0]);
AppTabs.appMenu=lets.user.appMenu;
if(lets.user.skin)lets.skin(lets.user.skin);
if(lets.user.run){
a=lets.user.run.split("|");
for(i=0;i<a.length;i++)lets.tabContainer[0].run(a[i]);
}
i=new Date;
i.setYear(i.getFullYear()+1);
document.cookie="Login="+code+";expires="+i.toUTCString();
x();};
lets.logout=lets.keyMap[113/*F2*/]=function(){
console.entero(0,"lets.logout",arguments);
document.cookie="Login=;expires="+(new Date(7)).toUTCString();
location.reload();};
lets.switchUser=function(code){
console.entero(0,"lets.switchUser",arguments);
var
i=new Date;
i.setYear(i.getFullYear()+1);
document.cookie="Login="+code+";expires="+i.toUTCString();
location.reload();};
AppTabs.app.Login=function(app){
if(!app.param&&lets.user)return confirm("You're already logged in, "+lets.user.getName()+"! Do you want to log out?")?lets.logout():0;
app.makeTab("form");
var f=app.content;
if(!app.param){
f.id="loginForm";
f.onsubmit=function(){
window.event.returnValue=false;
lets.login(f.user.options[f.user.selectedIndex].value);
app.exit();
return true;
};
f.innerHTML='<select name=user>'+lets.userListOptionsHTML+'</select><input type=submit value="Login"/><p>Press F1 any time for a short cheat sheet, er, popup of key command shortcuts.</p>';
return true;};
if(app.param==="Users"){
f.innerHTML="Just edit passwd in notepad for now...";
return require("wshShell").run('notepad "'+lets.dataPrefix+'login/passwd"');
}
if(app.param==="Settings"){
f.onsubmit=function(){
window.event.returnValue=false;
var o={appMenu:lets.user.appMenu},h;
if(lets.user.run)o.run=lets.user.run;
if(f.n.value&&f.n.value!==lets.user.name)o.myname=lets.user.myname=f.n.value;
h=app.dataFolder.files(lets.user.code+".ini").openAsTextStream(2);
h.write(INI.toText(o));
h.close();
return true;};
//skins have apps that apply them, so use run...
f.style.overflow="auto";
f.innerHTML='No changes made on this page will be saved for next login until you press the <b>Save</b> button, below, but they will start to affect your current session to let you preview the new settings.<br />Public name: '+lets.user.name+'<br />Private name: <input name=n onchange="lets.user.myname=this.value" /> (used to greet you)<br />Code: '+lets.user.code+'<br />Group: '+lets.user.group+'<br />Gecos (public description and contact info): '+lets.user.gecos+'<br />Skin: <select name=skin></select><br /><input type=submit value="Save"/> <input type=reset value="Undo all changes" /><h2>Apps:';
for(var s=lets.user.skin||"default",t,i=new Enumerator(fso.getFolder("skins").files);!i.atEnd();i.moveNext())if((t=i.item().name).substring(t.length-4)===".css"){
t=fso.getBaseName(t);
f.skin.options[f.skin.length]=new Option(t);
if(t===s)f.skin.selectedIndex=f.skin.length-1;
}
f.skin.onchange=function(){lets.skin(lets.user.skin=f.skin.options[f.skin.selectedIndex].text);};
f.appendChild(d=document.createElement("div"));
(app.onfocus=function(){var
a=lets.user.run.split("|"),
p=fso.getFolder("apps"),
i,
r={};
f.n.value=lets.user.getName();
for(i=0;i<a.length;i++)r[a[i]]=1;
//buttons for each folder? filtersort?

d.innerHTML="";

//main, each subfolder, custom lists [+], installed, in run list

listApps(d,p,r,app.container.id)
for(i=new Enumerator(p.subfolders);!i.atEnd();i.moveNext())listApps(d,i.item(),r,app.container.id);
})();}};
function listApps(d,f,r,c/*,filter*/){var e,i,n,q/*,match=filter||lets.M.retrue*/;
for(i=new Enumerator(f.files);!i.atEnd();i.moveNext())if((n=i.item().name).substring(n.length-3)===".js")/*if(match(i.item()))*/{
e=document.createElement("div");
e.style.float="left";
e.style.textAlign="center";
e.style.border="1px solid black";
e.style.background="white";
e.style.color="blue";
n=fso.getBaseName(n);
q=console.stringFrom(n,{depth:0}).replace(lets.M.R.q,"&#34;").replace(/'/g,"&#39;");
e.innerHTML=(f.name==="apps"?'':f.name+'/')+'<b>'+n+'</b><br />'+(lets.user.appMenu.hasOwnProperty(n)?'Installed as '+lets.user.appMenu[n]+' Change':'Install')+' [needs to update other than onfocus]<br /><input type=checkbox'+(r[n]?' checked="checked"':'')+' onclick="lets.user.run=lets.user.run?lets.user.run.split(\'|\').indexOf('+q+')<0?lets.user.run+\'|\'+'+q+':(function(){var a=lets.user.run.split(\'|\'),r={},i,o={};for(i=0;i<a.length;i++)r[a[i]]=o;a=[];for(i in r)if(i!=='+q+'&&r[i]===o)a.push(i);return a.join(\'|\');})():'+q+'"/>Run automatically when you login<br /><input type=button value="Run now" onclick="AppTabs.fromID('+c+').run('+q+')"/>';

d.appendChild(e);
}}
f=lets.dataPrefix+"login/passwd";
if(!fso.fileexists(f)){
h=fso.createTextFile(f);
h.write("Guest:G:others:Anyone may use this account if they choose to");
h.close();
}
h=fso.openTextFile(f,1);
while(!h.atEndOfStream){
i=h.readLine().split(':');
lets.passwd[i[1]]={name:i[0],code:i[1],group:i[2]||'others',gecos:i[3]||''};//home and shell are in custom js file, rather than here
lets.userListOptionsHTML+='<option value="'+i[1]+(i[3]?'" title="'+i[3].replace(lets.M.R.q,"&#34;"):'')+'">'+i[0]+'</option>';
}
h.close();
if(h=document.cookie.match(/(^|; *)Login=([^;]*)(;|$)/)){
lets.login(h[2]);
}else lets.tabContainer[0].run("Login");
console.log("Ready.");
module.loaded=true;//since the tag is gone by this point
})();
