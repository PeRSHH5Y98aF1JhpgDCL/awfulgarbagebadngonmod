if (!localStorage.saves) localStorage.saves="{\"intro\":[[0,[-250,0],[3600,1800]],[0,[-2750,-2800],[2600,4600]],[0,[3000,-2800],[2600,4600]],[0,[-250,-2800],[3600,1800]],[0,[2600,-300],[500,500]],[0,[2600,-1200],[500,600]],[0,[-95,-1100],[80,110]],[0,[410,-10],[90,20]],[1,[2425,-120],[70,50]],[1,[2400,-100],[100,60]],[1,[2500,-150],[100,150]],[6,[2800,-335]],[7,[460,-100]]]}"
var qol={
	canvas: document.getElementById("canvas"),
	context: document.getElementById("canvas").getContext('2d')
}
var input={
	leftC: false,
	l:false,
	r:false,
	u:false,
	d:false,
	shift:false
}
var player={
	pos:[0,0],
	blockPos:[0,0],
	blockType:0,
	selected:0,
	campos:[1000,2000],
	inputElsTracked:[],
	isinprompt:false,
	camzoom:1/2//pain
}
function cycle() {
    requestAnimationFrame(cycle);
    qol.canvas.width=document.body.clientWidth
	qol.canvas.height=document.body.clientHeight
	render()
	if (!player.isinprompt) {
		if (input.l) player.campos[0]+=10/player.camzoom
		if (input.r) player.campos[0]-=10/player.camzoom
		if (input.u) player.campos[1]+=10/player.camzoom
		if (input.d) player.campos[1]-=10/player.camzoom
	}
}
var itemsPlaced=[
					[0,[-250,0],[3600,1800]],
					[0,[-2750, -2800], [2600, 4600]],
					[0,[3000, -2800], [2600, 4600]],
					[0,[-250, -2800], [3600, 1800]],
					[0,[2600, -300], [500, 500]],
					[0,[2600, -1200], [500, 600]],
					[0,[-95, -1100], [80, 110]],
					[0,[410, -10], [90, 20]],
					[1,[2425, -120], [70, 50]],
					[1,[2400, -100], [100, 60]],
					[1,[2500, -150], [100, 150]],
					[6,[2800,-335]],
					[7,[460, -100]]
				]
itemsPlacedBackup=itemsPlaced
var obs=[//1:block, 2:point, 3:tools, 4:vertex
	{
		type:1,
		name:"Map Rectangle",
		render(x,s){
			qol.context.fillStyle="#444444"
			if (s) {qol.context.fillStyle = '#440000';}
			qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
		}
	},
	{
		type:1,
		name:"Throwable block",
		render(x,s){
			qol.context.fillStyle="#989898"
			qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			if (s) {
				qol.context.strokeStyle = '#ff0000';
			} else {
				qol.context.strokeStyle="#000000"
			}
				qol.context.lineWidth = 3;
				qol.context.strokeRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
		}
	},
	{
		type:1,
		name:"Shading",
		addedVars:[
			["Color", "#d4d4d7"]
		],
		render(x,s){
			qol.context.fillStyle=x[3]
			qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			if (s) {
				qol.context.strokeStyle = '#ff2222';
				qol.context.fillStyle = '#ff0000';
				qol.context.lineWidth = 3;
				qol.context.strokeRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
				qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			}
		}
	},
	{
		type:2,
		name:"Enemy",
		render(x,s){
			r=100*player.camzoom//pain
			let vertexes=[]
			for (i = 0; i < 3; i++) {
				vertexes.push([r * Math.cos(2 * Math.PI * i / 3), r * Math.sin(2 * Math.PI * i / 3)]);
			}
			vertexes=vertexes.map((y)=>y.map((z,i)=>-(z-x[1][i]-player.campos[i])*player.camzoom))
			//console.log(vertexes[0])
			qol.context.moveTo(vertexes[0][0],vertexes[0][1])
			qol.context.beginPath()
			qol.context.lineWidth = 3;
			for (i = 0; i < 3; i++) {
				qol.context.lineTo(vertexes[i%3][0],vertexes[i%3][1])
			}
			qol.context.fillStyle="#fcc"
			if (s) qol.context.fillStyle="#f00"
			qol.context.fill()
		}
	},
	{
		type:2,
		name:"Level Boss",
		render(x,s){
			r=300*player.camzoom//pain
			qol.context.fillStyle="#ccccff"
			if (s) qol.context.fillStyle="#ff00cc"
			if (s) qol.context.strokeStyle = '#ff2222';
			let vertexes=[]
			for (i = 0; i < 3; i++) {
				vertexes.push([r * Math.cos(2 * Math.PI * i / 3), r * Math.sin(2 * Math.PI * i / 3)]);
			}
			vertexes=vertexes.map((y)=>y.map((z,i)=>-(z-x[1][i]-player.campos[i])*player.camzoom))
			qol.context.lineWidth = 3;
			qol.context.moveTo(vertexes[0][0],vertexes[0][1])
			qol.context.beginPath()
			for (i = 0; i < 3; i++) {
				qol.context.lineTo(vertexes[i%3][0],vertexes[i%3][1])
			}
			qol.context.fill()
		}
	},
	{
		type:2,
		name:"Minor Boss",
		render(x,s){
			qol.context.fillStyle="#777777"
			if (s) qol.context.fillStyle="#770000"
			qol.context.strokeStyle = '#000000';
			if (s) qol.context.strokeStyle="#440000"
			qol.context.strokeRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(90)*player.camzoom,(90)*player.camzoom)
			qol.context.lineWidth = 2;
			qol.context.fillRect((x[1][0]-25+player.campos[0])*player.camzoom,(x[1][1]-25+player.campos[1])*player.camzoom,(50)*player.camzoom,(50)*player.camzoom)
			qol.context.fillRect((x[1][0]+65+player.campos[0])*player.camzoom,(x[1][1]+65+player.campos[1])*player.camzoom,(50)*player.camzoom,(50)*player.camzoom)
			qol.context.fillRect((x[1][0]+65+player.campos[0])*player.camzoom,(x[1][1]-25+player.campos[1])*player.camzoom,(50)*player.camzoom,(50)*player.camzoom)
			qol.context.fillRect((x[1][0]-25+player.campos[0])*player.camzoom,(x[1][1]+65+player.campos[1])*player.camzoom,(50)*player.camzoom,(50)*player.camzoom)
			if (s) {
				qol.context.strokeStyle = '#ff0000';
				qol.context.lineWidth = 3;
				qol.context.strokeRect((x[1][0]-25+player.campos[0])*player.camzoom,(x[1][1]-25+player.campos[1])*player.camzoom,(140)*player.camzoom,(140)*player.camzoom)
			}
			qol.context.fill()
			qol.context.fillStyle="#777777"
		}
	},
	{
		type:2,
		name:"Exit doorway",
		render(x,s){
			qol.context.fillStyle="#0ff"
			if (s) qol.context.fillStyle="#f55"
			qol.context.fillRect((x[1][0]+player.campos[0]-62.5)*player.camzoom,(x[1][1]+player.campos[1]-125-41.666-62.5)*player.camzoom,(125)*player.camzoom,(182.5+62.5)*player.camzoom)
			obs[0].render([0,[x[1][0]-62.5,x[1][1]+15],[125,20]])
			qol.context.fill()
		}
	},
	{
		type:2,
		name:"Entry doorway",
		render(x,s){
			qol.context.fillStyle="#aeaeae"
			if (s) qol.context.fillStyle="#ae0000"
			qol.context.fillRect((x[1][0]+player.campos[0]-62.5)*player.camzoom,(x[1][1]+player.campos[1]-125-41.666-62.5)*player.camzoom,(125)*player.camzoom,(182.5+62.5)*player.camzoom)
		}
	},
	{
		type:1,
		name:"Hazard",
		render(x,s){
			qol.context.fillStyle=x[3]
			qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			if (s) {
				qol.context.strokeStyle = '#ff2222';
				qol.context.fillStyle = '#af0000';
				qol.context.lineWidth = 3;
				qol.context.strokeRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
				qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			}
		}
	},
	/*{
		type:1,
		name:"Elevator",
		addedVars:[
			["Delta", [0,1000]]
		],
		render(x,s){
			qol.context.fillStyle=x[3]
			qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			if (s) {
				qol.context.strokeStyle = '#ff2222';
				qol.context.fillStyle = '#af0000';
				qol.context.lineWidth = 3;
				qol.context.strokeRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
				qol.context.fillRect((x[1][0]+player.campos[0])*player.camzoom,(x[1][1]+player.campos[1])*player.camzoom,(x[2][0])*player.camzoom,(x[2][1])*player.camzoom)
			}
		}
	},*/
]
var baseLineNames=["Position", "Width"]
function updateWarns() {
	let hasEx=(!(itemsPlaced.map(x=>x[0]).indexOf(7)==-1))
	let hasEnt=(!(itemsPlaced.map(x=>x[0]).indexOf(6)==-1))
	let warn=[]
	if (!hasEx) { warn.push("No entry doorway, player will be spawned at [0,1000]")}
	if (!hasEnt){warn.push("No exit doorway, player will not be able to get out without testing mode")};
	if (warn.length==0) warn.push("None!")
	document.getElementById("warns").innerHTML="<strong class=\"color-r\">Warnings:</strong>["+warn+']'
}
function render() {
	itemsPlaced.forEach((x,i)=>{
		qol.context.fillStyle="#000000"
		obs[x[0]].render(x,i==player.selected)
	})
	document.getElementById("objs").innerHTML="<strong><em>Amount of objects</em></strong>: "+itemsPlaced.length
	if (obs[player.blockType].type==1&&input.leftC) {
		let width=Math.abs(-player.blockPos[0]+player.pos[0])
		let height=Math.abs(-player.blockPos[1]+player.pos[1])
		qol.context.lineWidth = 3;
		qol.context.strokeStyle = '#000000';
		qol.context.strokeRect(player.blockPos[0],player.blockPos[1],width,height);
	}
	try {
		document.getElementById("curSel").innerHTML="<strong class=\"color-dup\">Currently selected object</strong>: "+(player.selected+1)+"["+obs[itemsPlaced[player.selected][0]].name+"]"
	} catch(err) {
		document.getElementById("curSel").innerHTML="<strong class=\"color-dup\">Currently selected object</strong>: "+(player.selected+1)+"[Does not currently exist]"
	}
	updateWarns()
	  document.getElementById("type").innerHTML="<strong class='color-harm'>Object to be placed</strong>: "+obs[player.blockType].name+"["+player.blockType+"]"
}
qol.canvas.addEventListener("wheel", function(event){
	//event.preventDefault();
   if (event.deltaY > 0){
      player.camzoom/=1.2
   } else {
      player.camzoom*=1.2
   }
}, false);
qol.canvas.addEventListener("mouseup", function (iinput) {
  //if (iinput.button === 0) {
	if ((obs[player.blockType].type==1)&&iinput.button==0) {
		let width=Math.abs(-player.blockPos[0]+player.pos[0])
		let height=Math.abs(-player.blockPos[1]+player.pos[1])
		player.selected=itemsPlaced.length;
		let temp=[player.blockType,[player.blockPos[0],player.blockPos[1]].map((x,i)=>x/player.camzoom-player.campos[i]),[width,height].map(x=>x/player.camzoom)];
		(obs[player.blockType].addedVars??[]).forEach((x,i)=>{
			temp.push(x[1])
		});
		itemsPlacedBackup=itemsPlaced
		itemsPlaced.push(temp)
	}
    input.leftC = false;
  /*} else if (iinput.button === 2) {
    input.leftC = false;
  }*/
});
pointInRect = (x1, y1, x2, y2, x, y) => (
  (x > x1 && x < x2) && (y > y1 && y < y2)
);
function toggleControls() {
	if (document.getElementById("Controls").style.display=="none") {
		document.getElementById("Controls").style.display="inline-block"
	} else {
		document.getElementById("Controls").style.display="none"
	}
}
function toggleProps() {
	if (document.getElementById("editProps").style.display=="none") {
		document.getElementById("editProps").style.display="inline-block"
		player.isinprompt=true
	} else {
		document.getElementById("editProps").style.display="none"
		player.isinprompt=false
	}
}
function saveClick() {
	player.inputElsTracked.forEach((x,i)=>{
	try {
		itemsPlaced[player.selected][i+1]=JSON.parse(x.value)
	} catch (err) {
		alert("Error while parsing at value "+(i+1)+"("+(baseLineNames[i]??obs[itemsPlaced[player.selected][0]].addedVars[i-baseLineNames.length][0])+"):\n"+err+"\n[This is why you don't delete formatting...]")
	}
	})
}
document.addEventListener("keydown", event => {
	//if (document.activeElement !== qol.canvas) return;
	console.log(event.keyCode)
  if (event.keyCode==46&&!player.isinprompt) {
	  itemsPlacedBackup=itemsPlaced
	  itemsPlaced.splice(player.selected, 1)
	  return;
  }
  if (event.keyCode==37) {
	input.l=true  
	return;
  }
  if (event.keyCode==38) {
	input.u=true  
	return;
  }
  if (event.keyCode==39) {
	input.r=true  
	return;
  }
  if (event.keyCode==40) {
	input.d=true  
	return;
  }
  if (event.keyCode==65&&!player.isinprompt) {
	player.blockType=(((player.blockType-1)%obs.length)+obs.length)%obs.length
	return;
  }
  if (event.keyCode==68&&!player.isinprompt) {
	player.blockType=(player.blockType+1)%obs.length
	return;
  }
  if (event.keyCode==69&&!player.isinprompt) {
	if (document.getElementById("editProps").style.display=="inline-block") return; 
	if (player.selected>=itemsPlaced.length) return;
	player.isinprompt=true
	let div = document.getElementById("editProps")
	let obj=itemsPlaced[player.selected]
	div.innerHTML=""//wipe html
	toggleProps()
	player.inputElsTracked=[]
	div.appendChild(document.createElement('br'))
	let el=document.createElement("strong")
	el.appendChild(document.createTextNode("Note:Do NOT touch the formatting and stuff, like quotes."))
	div.appendChild(el)
	div.appendChild(document.createElement('br'))
	el=document.createElement("strong")
	el.appendChild(document.createTextNode("Editing "+obs[obj[0]].name+"("+(player.selected+1)+")"))
	div.appendChild(el)
	div.appendChild(document.createElement('br'))
	for (let i=1;i<obj.length;i++) {
		let subDiv=document.createElement("div")
		subDiv.innerHTML="<div class=\"circle-grid field\"></div>"
		subDiv.classList.add("chooselike")
		subDiv.style.backgroundColor="#ffffff"
		subDiv.style.border="2px solid #bbb"
		let el=document.createElement("strong")
		el.appendChild(document.createTextNode((baseLineNames[i-1]??obs[obj[0]].addedVars[i-1-baseLineNames.length][0])))
		subDiv.appendChild(el)
		subDiv.appendChild(document.createElement('br'))
		subDiv.appendChild(document.createElement('br'))
		el=document.createElement("input")
		el.type="text"
		el.value=JSON.stringify(obj[i])
		player.inputElsTracked.push(el)
		el.classList.add("inputElem")
		subDiv.appendChild(el)
		div.appendChild(subDiv)

	}
	div.appendChild(document.createElement('br'))
	el=document.createElement("Button")
	el.appendChild(document.createTextNode("Save"))
	let saveBtn=el
	div.appendChild(el)
	el=document.createElement("Button")
	el.appendChild(document.createTextNode("Close"))
	let closeBtn=el
	div.appendChild(el)
	div.appendChild(document.createElement('br'))
	closeBtn.onclick=toggleProps
	saveBtn.onclick=saveClick
	div.appendChild(document.createElement('br'))
	return;
  }
  if (event.keyCode==70&&!player.isinprompt) {
	  player.isinprompt=true
	  saveBtnThings()
  }//todo
  if ((event.keyCode==90)&&event.ctrlKey) {
		itemsPlaced=itemsPlacedBackup
	return;
  }
});
function saveBtnThings() {
	let saves=JSON.parse(localStorage.saves)
	  let div=document.getElementById("savesDiv")
	  div.innerHTML=""
	  div.appendChild(document.createElement('br'))
	  div.style.display="inline-block"
	  Object.keys(saves).forEach((x,i)=>{
		  let obj=saves[x]
		  let subDiv=document.createElement("div")
		  div.appendChild(subDiv)
		  subDiv.innerHTML="<div class=\"circle-grid tech\"></div>"
		  subDiv.classList.add("chooselike")
		  subDiv.style.backgroundColor="#ffffff"
		  subDiv.style.border="2px solid #bbb"
		  let el=document.createElement("strong")
		  el.appendChild(document.createTextNode(x))
		  subDiv.appendChild(el)
		  subDiv.appendChild(document.createElement('br'))
		  subDiv.appendChild(document.createElement('br'))
		  el=document.createElement("button")
		  subDiv.appendChild(el)
		  el.innerHTML="Load"
		  el.onclick=()=>{
			  itemsPlaced=obj
			  document.getElementById("curSave").innerHTML="<strong class=\"color-m\">Currently selected save:</strong>"+x
		  }
		  el=document.createElement("button")
		  subDiv.appendChild(el)
		  el.innerHTML="Save"
		  el.onclick=()=>{
			  let tsaves=saves
			  tsaves[x]=itemsPlaced
			  localStorage.saves=JSON.stringify(tsaves)
			  saveBtnThings()
		  }
		  subDiv.appendChild(document.createElement('br'))
		  el=document.createElement("button")
		  subDiv.appendChild(el)
		  el.innerHTML="Export"
		  el.onclick=()=>{
			  copyText("{\""+x+"\":"+JSON.stringify(obj,(k,v)=>{
				if ((typeof v)=="number") return parseInt(v.toPrecision())
				return v
			  })+"}"
			)
		  }
		  el=document.createElement("button")
		  subDiv.appendChild(el)
		  el.innerHTML="Export as js"
		  el.onclick=()=>{//oh boy
			let tobj=obj
			let asdf=tobj.map((x)=>{
				let y=x[0]
				switch (y) {
					case 0:
						z=[...x[1],...(x[2].map((x)=>Math.abs(x)))]
						return "spawn.mapRect("+z.join(", ")+');'
						break;
					case 1:
						z=[...x[1],...(x[2].map((x)=>Math.abs(x)))]
						return "spawn.bodyRect("+z.join(", ")+');'
						break;
					case 2:
						z=[...x[1],...(x[2].map((x)=>Math.abs(x)))]
						return "level.fillBG.push("+JSON.stringify({x:z[0],y:z[1],width:z[2],height:z[3],color:x[3]})+');'
						break;
					case 3:
						return "randomMob("+x[1]+');'
						break;
					case 4:
						return "randomLevelBoss("+x[1]+');'
						break;
					case 5:
						return "randomBoss("+x[1]+');'
						break;
					case 6:
						return "level.exit.x = "+x[1][0]+';\nlevel.exit.y = '+x[1][1]+'\nspawn.mapRect(level.exit.x, level.exit.y + 20, 100, 100);'
						break;
					case 7:
						return "level.setPosToSpawn("+x[1]+");\nspawn.mapRect(level.enter.x, level.enter.y + 20, 100, 20);"
						break;
					case 8:
						z=[...x[1],...(x[2].map((x)=>Math.abs(x)))]
						return "level.hazard("+z.join(", ")+');'
						break;
					default:
					alert("You broke something, didn't you?")
					break;
				}
			}).join("\n")
			  copyText(asdf)
		  }
		  subDiv.appendChild(document.createElement('br'))
		  el=document.createElement("button")
		  subDiv.appendChild(el)
		  el.innerHTML="Delete"
		  el.onclick=()=>{
			  if (prompt("Are you sure? Type the name of this save to comfirm")==x) {
				  let tsaves=saves
				  delete tsaves[x]
				  localStorage.saves=JSON.stringify(tsaves)
				  saveBtnThings()
			  }
		  }
		  
	  })
	  div.appendChild(document.createElement('br'))
	  el=document.createElement("button")
	  div.appendChild(el)
	  el.innerHTML="Save level as new save"
	  div.appendChild(document.createElement('br'))
	  el.onclick=()=>{
		  let tsaves=saves
		  tsaves[prompt("Enter save name")]=itemsPlaced
		  localStorage.saves=JSON.stringify(tsaves)
		  saveBtnThings()
	  }
	  el=document.createElement("button")
	  div.appendChild(el)
	  el.innerHTML="Import Save"
	  el.onclick=()=>{
		  try {
			  let saveTemp=JSON.parse(prompt("Input JSON here...","{\"n\":[[0,[322,-1929],[178,1750]],[0,[372,-1261],[767,153]],[0,[998,-1805],[157,1542]],[1,[1621,-2020],[170,1799]],[1,[1334,-2070],[692,153]],[1,[1421,-498],[564,244]],[2,[2616,-2020],[240,1372],\"#ff0000\"],[3,[2695,-270]],[3,[2819,-278]],[3,[2749,-361]],[3,[2740,-299]]]}"))
			  let saves=JSON.parse(localStorage.saves)
			  saves[Object.keys(saveTemp)[0]]=saveTemp[Object.keys(saveTemp)[0]]
			  localStorage.saves=JSON.stringify(saves)
			  saveBtnThings()
		  } catch (err) {
			  console.log(err)
			  alert("Invalid save!\n(...or something, i don't know.)")
		  }
	  }
	  el=document.createElement("button")
	  div.appendChild(el)
	  el.innerHTML="Close"
	  el.onclick=()=>{
		  div.style.display="none"
		  player.isinprompt=false
	  }
}
function copyText(x) {
  var copyText = document.getElementById("hiddenCopyPaste");
  copyText.style.display="block"
  copyText.value=x
  copyText.select();
  document.execCommand("copy");
  copyText.style.display="none"
  alert("Copied to clipboard!");
}
document.addEventListener("keyup", event => {
	//if (document.activeElement !== qol.canvas) return;
  if (event.keyCode==37) {
	input.l=false
  }
  if (event.keyCode==38) {
	input.u=false
  }
  if (event.keyCode==39) {
	input.r=false
  }
  if (event.keyCode==40) {
	input.d=false
  }
  if (event.keyCode==16) {
	input.shift=false
  }
  // do something
});
qol.canvas.addEventListener('contextmenu', event => {
	event.preventDefault()
	/*for (let i=0;i<itemsPlaced.length;i++) {
			let type=obs[itemsPlaced[i][0]].type
			let obj=itemsPlaced[i]
			if (type==1) {
				let x = obj[2]
				x=[x[0]+obj[1][0],x[1]+obj[1][1]]
				if (pointInRect(...[...obj[1],...x].map(x=>x*player.camzoom),...player.pos)) {
					player.selected=i
					break;
				}
			}
		}*/
});
qol.canvas.addEventListener("mousedown", function (iinput) {
	if (iinput.ctrlKey) {
		if (iinput.button === 2) {
			player.playerFocus = true;
			adjustScreen();
		}
	}
	if (iinput.button==0) {
		input.leftC = true;
		if (obs[player.blockType].type==1) {
			player.blockPos=player.pos
		}
		if (obs[player.blockType].type==2) {
			player.selected=itemsPlaced.length
			itemsPlacedBackup=itemsPlaced
			itemsPlaced.push([player.blockType,player.pos.map((x,i)=>(x)/player.camzoom-player.campos[i])])
		}
	} else if (iinput.button==2) {
		for (let i=0;i<itemsPlaced.length;i++) {
			let type=obs[itemsPlaced[i][0]].type
			let obj=itemsPlaced[i]
			if (type==1) {
				let hwadj=obj[2].map((x,i)=>x+obj[1][i])
				if (pointInRect(...obj[1],...hwadj,...(player.pos.map((x,i)=>x/player.camzoom-player.campos[i])))) {
					player.selected=i
					break;
				}
			}
			if (type==2) {
				let posadj=player.pos.map((x,i)=>x/player.camzoom-player.campos[i])
				if (Math.hypot(obj[1][0]-posadj[0],obj[1][1]-posadj[1])*player.camzoom<100) {
					player.selected=i
					break;
				}
			}
		}
	}
    window.focus();
});
qol.canvas.addEventListener("mousemove", function (iinput) {
    if (player.isinprompt) return;
    let x = (iinput.clientX)
    let y = (iinput.clientY)
	let delta=[x,y].map((z,i)=>z-player.pos[i])
	if (iinput.ctrlKey&&iinput.shiftKey&&itemsPlaced[player.selected]) {
		let gt=Math.abs(delta[0])>Math.abs(delta[1])
		let w=gt?delta[0]:delta[1]
		itemsPlaced[player.selected][1]=itemsPlaced[player.selected][1].map((z,i)=>((gt^(i==1))?((delta[i]/player.camzoom)+z):z))
	} else if (iinput.shiftKey&&itemsPlaced[player.selected]) {
		itemsPlaced[player.selected][1]=itemsPlaced[player.selected][1].map((z,i)=>z+delta[i]/player.camzoom)
	} 
	else if (iinput.ctrlKey&&obs[player.blockType]&&itemsPlaced[player.selected]) {
		itemsPlaced[player.selected][2]=itemsPlaced[player.selected][2].map((z,i)=>z+delta[i]/player.camzoom)
	}
	player.pos=[x,y]
    document.getElementById("mousepos").innerHTML = "<strong class='color-d'>Mouse Position</strong>:[" + (x+player.campos[0]/player.camzoom).toPrecision(4) + "," + (y+player.campos[1]/player.camzoom).toPrecision(4) + "]";
});
localSettings = JSON.parse(localStorage.getItem("localSettings"));
cycle()