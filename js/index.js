"use strict";
//collision groups
//   cat.player | cat.map | cat.body | cat.bullet | cat.powerUp | cat.mob | cat.mobBullet | cat.mobShield | cat.phased
const cat = {
    player: 0x1,
    map: 0x10,
    body: 0x100,
    bullet: 0x1000,
    powerUp: 0x10000,
    mob: 0x100000,
    mobBullet: 0x1000000,
    mobShield: 0x10000000,
    phased: 0x100000000,
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    return array;
}

// shrink power up selection menu to find window height
if (screen.height < 800) {
    document.getElementById("choose-grid").style.fontSize = "1em"; //1.3em is normal
    if (screen.height < 600) document.getElementById("choose-grid").style.fontSize = "0.8em"; //1.3em is normal
}


//**********************************************************************
// check for URL parameters to load a custom game
//**********************************************************************

//example  https://landgreen.github.io/sidescroller/index.html?
//          &gun1=minigun&gun2=laser
//          &tech1=laser-bot&tech2=mass%20driver&tech3=overcharge&tech4=laser-bot&tech5=laser-bot&field=phase%20decoherence%20field&difficulty=2
//add ? to end of url then for each power up add
// &gun1=name&gun2=name
// &tech1=laser-bot&tech2=mass%20driver&tech3=overcharge&tech4=laser-bot&tech5=laser-bot
// &field=phase%20decoherence%20field
// &difficulty=2
//use %20 for spaces
//difficulty is 0 easy, 1 normal, 2 hard, 4 why
function getUrlVars() {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, k, v) {
        vars[k] = v;
    });
    return vars;
}
window.addEventListener('load', (event) => {
    const set = getUrlVars()
    if (Object.keys(set).length !== 0) {
        openCustomBuildMenu();
        //add custom selections based on url
        for (const property in set) {
            set[property] = set[property].replace(/%20/g, " ")
            set[property] = set[property].replace(/%CE%A8/g, "Ψ")
            if (property === "field") {
                let found = false
                let index
                for (let i = 0; i < mech.fieldUpgrades.length; i++) {
                    if (set[property] === mech.fieldUpgrades[i].name) {
                        index = i;
                        found = true;
                        break;
                    }
                }
                if (found) build.choosePowerUp(document.getElementById(`field-${index}`), index, 'field')
            }
            if (property.substring(0, 3) === "gun") {
                let found = false
                let index
                for (let i = 0; i < b.guns.length; i++) {
                    if (set[property] === b.guns[i].name) {
                        index = i;
                        found = true;
                        break;
                    }
                }
                if (found) build.choosePowerUp(document.getElementById(`gun-${index}`), index, 'gun')
            }
            if (property.substring(0, 4) === "tech") {
                for (let i = 0; i < tech.tech.length; i++) {
                    if (set[property] === tech.tech[i].name) {
                        build.choosePowerUp(document.getElementById(`tech-${i}`), i, 'tech', true)
                        break;
                    }
                }
            }
            if (property === "difficulty") {
                simulation.difficultyMode = Number(set[property])
                document.getElementById("difficulty-select-custom").value = Number(set[property])
            }
            if (property === "level") {
                document.getElementById("starting-level").value = Number(set[property])
            }
            if (property === "noPower") {
                document.getElementById("no-power-ups").checked = Number(set[property])
            }
        }
    }
});


//**********************************************************************
//set up canvas
//**********************************************************************
var canvas = document.getElementById("canvas");
//using "const" causes problems in safari when an ID shares the same name.
const ctx = canvas.getContext("2d");
document.body.style.backgroundColor = "#fff";

//disable pop up menu on right click
document.oncontextmenu = function() {
    return false;
}

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.width2 = canvas.width / 2; //precalculated because I use this often (in mouse look)
    canvas.height2 = canvas.height / 2;
    canvas.diagonal = Math.sqrt(canvas.width2 * canvas.width2 + canvas.height2 * canvas.height2);
    // ctx.font = "18px Arial";
    // ctx.textAlign = "center";
    ctx.font = "25px Arial";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    // ctx.lineCap='square';
    simulation.setZoom();
}
setupCanvas();
window.onresize = () => {
    setupCanvas();
};

//**********************************************************************
// custom build grid display and pause
//**********************************************************************
const build = {
    onLoadPowerUps() {
        const set = getUrlVars()
        if (Object.keys(set).length !== 0) {
            for (const property in set) {
                set[property] = set[property].replace(/%20/g, " ")
                if (property.substring(0, 3) === "gun") b.giveGuns(set[property])
                if (property.substring(0, 3) === "tech") tech.giveTech(set[property])
                if (property === "field") mech.setField(set[property])
                if (property === "difficulty") {
                    simulation.difficultyMode = Number(set[property])
                    document.getElementById("difficulty-select").value = Number(set[property])
                }
                if (property === "level") {
                    level.levelsCleared += Number(set[property]);
                    level.difficultyIncrease(Number(set[property]) * simulation.difficultyMode) //increase difficulty based on modes
                    spawn.setSpawnList(); //picks a couple mobs types for a themed random mob spawns
                    level.onLevel++
                }
            }
            for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
            bullet = []; //remove any bullets that might have spawned from tech
            if (b.inventory.length > 0) {
                b.activeGun = b.inventory[0] //set first gun to active gun
                simulation.makeGunHUD();
            }
        }
    },
    pauseGrid() {
        let text = ""
        if (!simulation.isChoosing) text += `<div class="pause-grid-module">
      <span style="font-size:1.5em;font-weight: 600;">PAUSED</span> &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; press P to resume</div>`
        text += `<div class="pause-grid-module" style = "font-size: 13px;line-height: 120%;padding: 5px;">
      <strong class='color-d'>damage</strong> increase: ${((tech.damageFromTech()-1)*100).toFixed(0)}%
      <br><strong class='color-harm'>harm</strong> reduction: ${((1-mech.harmReduction())*100).toFixed(0)}%
      <br><strong><em>fire delay</em></strong> decrease: ${((1-b.fireCD)*100).toFixed(0)}%
      <br><strong class='color-dup'>duplication</strong> chance: ${(tech.duplicationChance()*100).toFixed(0)+(tech.duplicationChance()>1.5?"(softcapped)":"")}%
      <br>
      <br><strong class='color-r'>rerolls</strong>: ${powerUps.reroll.rerolls}
      <br><strong class='color-h'>health</strong>: (${(mech.health*100).toFixed(0)} / ${(mech.maxHealth*100).toFixed(0)}) &nbsp; <strong class='color-f'>energy</strong>: (${(mech.energy*100).toFixed(0)} / ${(mech.maxEnergy*100).toFixed(0)})
      <br>position: (${player.position.x.toFixed(1)}, ${player.position.y.toFixed(1)}) &nbsp; velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})
      <br>mouse: (${simulation.mouseInGame.x.toFixed(1)}, ${simulation.mouseInGame.y.toFixed(1)}) &nbsp; mass: ${player.mass.toFixed(1)}      
      <br>
      <br>level: ${level.levels[level.onLevel]} (${level.difficultyText()}) &nbsp; ${mech.cycle} cycles
      <br>${mob.length} mobs, &nbsp; ${body.length} blocks, &nbsp; ${bullet.length} bullets, &nbsp; ${powerUp.length} power ups      
      <br>damage difficulty scale: ${(b.dmgScale*100).toFixed(2) }%
      <br>harm difficulty scale: ${(simulation.dmgScale*100).toFixed(0)}%
      <br>heal difficulty scale: ${(simulation.healScale*100).toFixed(1)}%
      <br><svg class="SVG-button" onclick="build.shareURL(false)" width="110" height="25" style="padding:2px; margin: 10px;">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
          <text x="5" y="18">copy build url</text>
      </g>
  </svg>

    </div>`;
        for (let i = 0, len = b.inventory.length; i < len; i++) {
            text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[b.inventory[i]].name} - <span style="font-size:100%;font-weight: 100;">${b.guns[b.inventory[i]].ammo}</span></div> ${b.guns[b.inventory[i]].description}</div>`
        }

        let el = document.getElementById("pause-grid-left")
        el.style.display = "grid"
        el.innerHTML = text
        text = "";
        text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[mech.fieldMode].name}</div> ${mech.fieldUpgrades[mech.fieldMode].description}</div>`
        let countTech = 0
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (tech.tech[i].count > 0) {
                const isCount = tech.tech[i].count > 1 ? `(${tech.tech[i].count}x)` : "";

                if (tech.tech[i].isFieldTech) {
                    text += `<div class="pause-grid-module"><div class="grid-title">
                                            <span style="position:relative;">
                                                <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                              <div class="circle-grid field" style="position:absolute; top:0; left:10px;opacity:0.65;"></div>
                                            </span>
                                            &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].name} ${isCount}</div>${tech.tech[i].description}</div></div>`
                } else if (tech.tech[i].isGunTech) {
                    text += `<div class="pause-grid-module"><div class="grid-title">
                                            <span style="position:relative;">
                                                <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                                <div class="circle-grid gun" style="position:absolute; top:0; left:10px; opacity:0.65;"></div>
                                            </span>
                                            &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].name} ${isCount}</div>${tech.tech[i].description}</div></div>`
                } else {
                    text += `<div class="pause-grid-module"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].name} ${isCount}</div>${tech.tech[i].description}</div></div>`
                }
                countTech++
            }
        }
        el = document.getElementById("pause-grid-right")
        el.style.display = "grid"
        el.innerHTML = text
        if (countTech > 5 || b.inventory.length > 6) {
            document.body.style.overflowY = "scroll";
            document.body.style.overflowX = "hidden";
        }
    },
    unPauseGrid() {
        document.body.style.overflow = "hidden"
        document.getElementById("pause-grid-left").style.display = "none"
        document.getElementById("pause-grid-right").style.display = "none"
        window.scrollTo(0, 0);
    },
    isCustomSelection: true,
    choosePowerUp(event,who, index, type, isAllowed = false) {
        if (type === "gun") {
            let isDeselect = false
            for (let i = 0, len = b.inventory.length; i < len; i++) { //look for selection in inventory
                if (b.guns[b.inventory[i]].name === b.guns[index].name) { //if already clicked, remove gun
                    isDeselect = true
                    who.classList.remove("build-gun-selected");
                    //remove gun
                    b.inventory.splice(i, 1)
                    b.guns[index].count = 0;
                    b.guns[index].have = false;
                    if (b.guns[index].ammo != Infinity) b.guns[index].ammo = 0;
                    if (b.inventory.length === 0) b.activeGun = null;
                    simulation.makeGunHUD();
                    break
                }
            }
            if (!isDeselect) { //add gun
                who.classList.add("build-gun-selected");
                b.giveGuns(index)
            }
        } else if (type === "field") {
            if (mech.fieldMode !== index) {
                document.getElementById("field-" + mech.fieldMode).classList.remove("build-field-selected");
                mech.setField(index)
                who.classList.add("build-field-selected");
            }
        } else if (type === "tech") { //remove tech if you have too many
            if (tech.tech[index].count < tech.tech[index].maxCount||(tech.antiLimit&&tech.tech[index].maxCount>1)) {
                if (!who.classList.contains("build-tech-selected")) who.classList.add("build-tech-selected");
                tech.giveTech(index)
            } else {
                tech.removeTech(index);
                who.classList.remove("build-tech-selected");
            }
			if (event.which==3) {tech.removeTech(index);who.classList.remove("build-tech-selected");}
        }
		console.log(event.which)
        //update tech text //disable not allowed tech
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            const techID = document.getElementById("tech-" + i)
            if (!tech.tech[i].isCustomHide) {
                if (tech.tech[i].allowed() || isAllowed || tech.tech[i].count > 0) {
                    const isCount = tech.tech[i].count > 1 ? `(${tech.tech[i].count}x)` : "";
                    if (tech.tech[i].isFieldTech) {
                        techID.innerHTML = ` <div class="grid-title">
                                                <span style="position:relative;">
                                                    <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                                    <div class="circle-grid field" style="position:absolute; top:0; left:10px;opacity:0.65;"></div>
                                                </span>
                                                &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].name} ${isCount}</div>${tech.tech[i].description}</div>`

                        // <div class="circle-grid gun" style="position:absolute; top:-3px; left:-3px; opacity:1; height: 33px; width:33px;"></div>
                        // <div class="circle-grid tech" style="position:absolute; top:5px; left:5px;opacity:1;height: 20px; width:20px;border: #fff solid 2px;"></div>
                        // border: #fff solid 0px;
                    } else if (tech.tech[i].isGunTech) {
                        techID.innerHTML = ` <div class="grid-title">
                                                <span style="position:relative;">
                                                    <div class="circle-grid tech" style="position:absolute; top:0; left:0;opacity:0.8;"></div>
                                                    <div class="circle-grid gun" style="position:absolute; top:0; left:10px; opacity:0.65;"></div>
                                                </span>
                                                &nbsp; &nbsp; &nbsp; &nbsp; ${tech.tech[i].name} ${isCount}</div>${tech.tech[i].description}</div>`
                    } else {
                        techID.innerHTML = `<div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].name} ${isCount}</div>${tech.tech[i].description}</div>`
                    }

                    if (techID.classList.contains("build-grid-disabled")) {
                        techID.classList.remove("build-grid-disabled");
                        techID.setAttribute("onClick", `build.choosePowerUp(event,this,${i},'tech')`);
                    }
                } else {
                    techID.innerHTML = `<div class="grid-title"> ${tech.tech[i].name}</div><span style="color:#666;">requires: ${tech.tech[i].requires}</span></div>`
                    if (!techID.classList.contains("build-grid-disabled")) {
                        techID.classList.add("build-grid-disabled");
                        techID.onclick = null
                    }
                    if (tech.tech[i].count > 0) tech.removeTech(i)
                    if (techID.classList.contains("build-tech-selected")) techID.classList.remove("build-tech-selected");
                }
            }
        }
    },
    populateGrid() {
        let text = `
  <div style="display: flex; justify-content: space-around; align-items: center;">
    <svg class="SVG-button" onclick="build.startBuildRun()" width="115" height="51">
      <g stroke='none' fill='#333' stroke-width="2" font-size="40px" font-family="Ariel, sans-serif">
        <text x="18" y="38">start</text>
      </g>
    </svg>
    <svg class="SVG-button" onclick="build.reset()" width="50" height="25">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
        <text x="5" y="18">reset</text>
      </g>
    </svg>
    <svg class="SVG-button" onclick="build.shareURL(true)" width="52" height="25">
      <g stroke='none' fill='#333' stroke-width="2" font-size="17px" font-family="Ariel, sans-serif">
        <text x="5" y="18">share</text>
      </g>
    </svg>
  </div>
  <div style="align-items: center; text-align:center; font-size: 1.00em; line-height: 190%;background-color:var(--build-bg-color);">
    <div>starting level: <input id='starting-level' type="number" step="1" value="0" min="0" max="99"></div>
    <div>
    <label for="difficulty-select" title="effects: number of mobs, damage done by mobs, damage done to mobs, mob speed, heal effects">difficulty:</label>
      <select name="difficulty-select" id="difficulty-select-custom">
						<option value="0">deserted[0]</option>
						<option value="0.25">not fun[0.25]</option>
						<option value="0.5">very easy[0.5]</option>
                        <option value="1">easy[1]</option>
                        <option value="2" selected>normal[2]</option>
                        <option value="4">hard[4]</option>
                        <option value="6">why?[6]</option>
                        <option value="10">help.[10]</option>
                        <option value="25">AAAAAAAAA[25]</option>
                        <option value="100">good luck[100]</option>
      </select>
    </div>
    <div>
      <label for="no-power-ups" title="no tech, fields, or guns will spawn">no power ups:</label>
      <input type="checkbox" id="no-power-ups" name="no-power-ups" style="width:17px; height:17px;">
    </div>
  </div>`
        for (let i = 0, len = mech.fieldUpgrades.length; i < len; i++) {
            text += `<div id ="field-${i}" class="build-grid-module" onclick="build.choosePowerUp(event,this,${i},'field')"><div class="grid-title"><div class="circle-grid field"></div> &nbsp; ${mech.fieldUpgrades[i].name}</div> ${mech.fieldUpgrades[i].description}</div>`
        }
        for (let i = 0, len = b.guns.length; i < len; i++) {
            text += `<div id = "gun-${i}" class="build-grid-module" onclick="build.choosePowerUp(event,this,${i},'gun')"><div class="grid-title"><div class="circle-grid gun"></div> &nbsp; ${b.guns[i].name}</div> ${b.guns[i].description}</div>`
        }

        for (let i = 0, len = tech.tech.length; i < len; i++) {
            if (!tech.tech[i].isCustomHide) {
                if (!tech.tech[i].allowed()) { // || tech.tech[i].name === "+1 cardinality") { //|| tech.tech[i].name === "leveraged investment"
                    text += `<div id="tech-${i}" class="build-grid-module build-grid-disabled"><div class="grid-title">${tech.tech[i].name}</div><span style="color:#666;">requires: ${tech.tech[i].requires}</span></div>`
                    // } else if (tech.tech[i].count > 1) {
                    //     text += `<div id="tech-${i}" class="build-grid-module" onclick="build.choosePowerUp(this,${i},'tech')"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].name} (${tech.tech[i].count}x)</div> ${tech.tech[i].description}</div>`
                } else {
                    text += `<div id="tech-${i}" class="build-grid-module" onmousedown="build.choosePowerUp(event,this,${i},'tech')"><div class="grid-title"><div class="circle-grid tech"></div> &nbsp; ${tech.tech[i].name}</div> ${tech.tech[i].description}</div>`
                }
            }
        }
        document.getElementById("build-grid").innerHTML = text
        document.getElementById("difficulty-select-custom").value = document.getElementById("difficulty-select").value
        document.getElementById("difficulty-select-custom").addEventListener("input", () => {
            simulation.difficultyMode = Number(document.getElementById("difficulty-select-custom").value)
            localSettings.difficultyMode = Number(document.getElementById("difficulty-select-custom").value)
            document.getElementById("difficulty-select").value = document.getElementById("difficulty-select-custom").value
            localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
        });
    },
    reset() {
        build.isCustomSelection = true;
        mech.setField(0)

        b.inventory = []; //removes guns and ammo  
        for (let i = 0, len = b.guns.length; i < len; ++i) {
            b.guns[i].count = 0;
            b.guns[i].have = false;
            if (b.guns[i].ammo != Infinity) b.guns[i].ammo = 0;
        }
        b.activeGun = null;
        simulation.makeGunHUD();

        tech.setupAllTech();
        build.populateGrid();
        document.getElementById("field-0").classList.add("build-field-selected");
        document.getElementById("build-grid").style.display = "grid"
    },
    shareURL(isCustom = false) {
        let url = "https://aShorterName.github.io/awfulgarbagebadngonmod/index.html?"
        let count = 0;

        for (let i = 0; i < b.inventory.length; i++) {
            if (b.guns[b.inventory[i]].have) {
                url += `&gun${count}=${encodeURIComponent(b.guns[b.inventory[i]].name.trim())}`
                count++
            }
        }

        count = 0;
        for (let i = 0; i < tech.tech.length; i++) {
            for (let j = 0; j < tech.tech[i].count; j++) {
                url += `&tech${count}=${encodeURIComponent(tech.tech[i].name.trim())}`
                count++
            }
        }
        url += `&field=${encodeURIComponent(mech.fieldUpgrades[mech.fieldMode].name.trim())}`
        url += `&difficulty=${simulation.difficultyMode}`
        if (isCustom) {
            url += `&level=${Math.abs(Number(document.getElementById("starting-level").value))}`
            url += `&noPower=${Number(document.getElementById("no-power-ups").checked)}`
            alert('n-gon build URL copied to clipboard.\nPaste into browser address bar.')
        } else {
            simulation.makeTextLog("n-gon build URL copied to clipboard.<br>Paste into browser address bar.")
        }
        console.log('n-gon build URL copied to clipboard.\nPaste into browser address bar.')
        console.log(url)
        simulation.copyToClipBoard(url)
    },
    startBuildRun() {
        build.isCustomSelection = false;
        spawn.setSpawnList(); //gives random mobs,  not starter mobs
        spawn.setSpawnList();
        if (b.inventory.length > 0) {
            b.activeGun = b.inventory[0] //set first gun to active gun
            simulation.makeGunHUD();
        }
        for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
        bullet = []; //remove any bullets that might have spawned from tech
        const levelsCleared = Math.abs(Number(document.getElementById("starting-level").value))
        level.difficultyIncrease(Math.min(99, levelsCleared * simulation.difficultyMode)) //increase difficulty based on modes
        level.levelsCleared += levelsCleared;
        simulation.isNoPowerUps = document.getElementById("no-power-ups").checked
        if (simulation.isNoPowerUps) { //remove tech, guns, and fields
            function removeOne() { //recursive remove one at a time to avoid array problems
                for (let i = 0; i < powerUp.length; i++) {
                    if (powerUp[i].name === "tech" || powerUp[i].name === "gun" || powerUp[i].name === "field") {
                        Matter.World.remove(engine.world, powerUp[i]);
                        powerUp.splice(i, 1);
                        removeOne();
                        break
                    }
                }
            }
            removeOne();
        }
        simulation.isCheating = true;
        document.body.style.cursor = "none";
        document.body.style.overflow = "hidden"
        document.getElementById("build-grid").style.display = "none"
        simulation.paused = false;
        requestAnimationFrame(cycle);
    }
}

function openCustomBuildMenu() {
    document.getElementById("build-button").style.display = "none";
    const el = document.getElementById("build-grid")
    el.style.display = "grid"
    document.body.style.overflowY = "scroll";
    document.body.style.overflowX = "hidden";
    document.getElementById("info").style.display = 'none'
    simulation.startGame(true); //starts game, but pauses it
    build.isCustomSelection = true;
    simulation.paused = true;
    build.reset();
}

//record settings so they can be reproduced in the custom menu
document.getElementById("build-button").addEventListener("click", () => { //setup build run
    let field = 0;
    let inventory = [];
    let techList = [];
    if (!simulation.firstRun) {
        field = mech.fieldMode
        inventory = [...b.inventory]
        for (let i = 0; i < tech.tech.length; i++) {
            techList.push(tech.tech[i].count)
        }
    }
    openCustomBuildMenu();
});

// ************************************************************************************************
// inputs
// ************************************************************************************************
const input = {
    fire: false, // left mouse
    field: false, // right mouse
    up: false, // jump
    down: false, // crouch
    left: false,
    right: false,
    isPauseKeyReady: true,
    key: {
        // fire: "ShiftLeft",
        field: "Space",
        up: "KeyW", // jump
        down: "KeyS", // crouch
        left: "KeyA",
        right: "KeyD",
        pause: "KeyP",
        nextGun: "KeyE",
        previousGun: "KeyQ",
        testing: "KeyT"
    },
    setDefault() {
        input.key = {
            // fire: "ShiftLeft",
            field: "Space",
            up: "KeyW", // jump
            down: "KeyS", // crouch
            left: "KeyA",
            right: "KeyD",
            pause: "KeyP",
            nextGun: "KeyE",
            previousGun: "KeyQ",
            testing: "KeyT"
        }
        input.controlTextUpdate()
    },
    controlTextUpdate() {
        function cleanText(text) {
            return text.replace('Key', '').replace('Digit', '')
        }
        document.getElementById("key-field").innerHTML = cleanText(input.key.field)
        document.getElementById("key-up").innerHTML = cleanText(input.key.up)
        document.getElementById("key-down").innerHTML = cleanText(input.key.down)
        document.getElementById("key-left").innerHTML = cleanText(input.key.left)
        document.getElementById("key-right").innerHTML = cleanText(input.key.right)
        document.getElementById("key-pause").innerHTML = cleanText(input.key.pause)
        document.getElementById("key-next-gun").innerHTML = cleanText(input.key.nextGun)
        document.getElementById("key-previous-gun").innerHTML = cleanText(input.key.previousGun)
        document.getElementById("key-testing").innerHTML = cleanText(input.key.testing)

        document.getElementById("splash-up").innerHTML = cleanText(input.key.up)[0]
        document.getElementById("splash-down").innerHTML = cleanText(input.key.down)[0]
        document.getElementById("splash-left").innerHTML = cleanText(input.key.left)[0]
        document.getElementById("splash-right").innerHTML = cleanText(input.key.right)[0]
        document.getElementById("splash-next-gun").innerHTML = cleanText(input.key.nextGun)[0]
        document.getElementById("splash-previous-gun").innerHTML = cleanText(input.key.previousGun)[0]

        localSettings.key = input.key
        localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    },
    focus: null,
    setTextFocus() {
        const backgroundColor = "#fff"
        document.getElementById("key-field").style.background = backgroundColor
        document.getElementById("key-up").style.background = backgroundColor
        document.getElementById("key-down").style.background = backgroundColor
        document.getElementById("key-left").style.background = backgroundColor
        document.getElementById("key-right").style.background = backgroundColor
        document.getElementById("key-pause").style.background = backgroundColor
        document.getElementById("key-next-gun").style.background = backgroundColor
        document.getElementById("key-previous-gun").style.background = backgroundColor
        document.getElementById("key-testing").style.background = backgroundColor
        if (input.focus) input.focus.style.background = 'rgb(0, 200, 255)';
    },
    setKeys(event) {
        //check for duplicate keys
        if (event.code && !(
                event.code === "ArrowRight" ||
                event.code === "ArrowLeft" ||
                event.code === "ArrowUp" ||
                event.code === "ArrowDown" ||
                event.code === input.key.field ||
                event.code === input.key.up ||
                event.code === input.key.down ||
                event.code === input.key.left ||
                event.code === input.key.right ||
                event.code === input.key.pause ||
                event.code === input.key.nextGun ||
                event.code === input.key.previousGun ||
                event.code === input.key.testing
            )) {
            switch (input.focus.id) {
                case "key-field":
                    input.key.field = event.code
                    break;
                case "key-up":
                    input.key.up = event.code
                    break;
                case "key-down":
                    input.key.down = event.code
                    break;
                case "key-left":
                    input.key.left = event.code
                    break;
                case "key-right":
                    input.key.right = event.code
                    break;
                case "key-pause":
                    input.key.pause = event.code
                    break;
                case "key-next-gun":
                    input.key.nextGun = event.code
                    break;
                case "key-previous-gun":
                    input.key.previousGun = event.code
                    break;
                case "key-testing":
                    input.key.testing = event.code
                    break;
            }
        }
        input.controlTextUpdate()
        input.endKeySensing()
    },
    endKeySensing() {
        window.removeEventListener("keydown", input.setKeys);
        input.focus = null
        input.setTextFocus()
    }
}

document.getElementById("control-table").addEventListener('click', (event) => {
    if (event.target.className === 'key-input') {
        input.focus = event.target
        input.setTextFocus()
        window.addEventListener("keydown", input.setKeys);
    }
});
document.getElementById("control-details").addEventListener("toggle", function() {
    input.controlTextUpdate()
    input.endKeySensing();
})

document.getElementById("control-reset").addEventListener('click', input.setDefault);

window.addEventListener("keyup", function(event) {
    switch (event.code) {
        case input.key.right:
        case "ArrowRight":
            input.right = false
            break;
        case input.key.left:
        case "ArrowLeft":
            input.left = false
            break;
        case input.key.up:
        case "ArrowUp":
            input.up = false
            break;
        case input.key.down:
        case "ArrowDown":
            input.down = false
            break;
        case input.key.field:
            input.field = false
            break
    }
});
simulation.testSpawnX=0
window.addEventListener("keydown", function(event) {
    switch (event.code) {
        case input.key.right:
        case "ArrowRight":
            input.right = true
            break;
        case input.key.left:
        case "ArrowLeft":
            input.left = true
            break;
        case input.key.up:
        case "ArrowUp":
            input.up = true
            break;
        case input.key.down:
        case "ArrowDown":
            input.down = true
            break;
        case input.key.field:
            input.field = true
            break
        case input.key.nextGun:
            simulation.nextGun();
            break
        case input.key.previousGun:
            simulation.previousGun();
            break
        case input.key.pause:
            if (!simulation.isChoosing && input.isPauseKeyReady && mech.alive) {
                input.isPauseKeyReady = false
                setTimeout(function() {
                    input.isPauseKeyReady = true
                }, 300);
                if (simulation.paused) {
                    build.unPauseGrid()
                    simulation.paused = false;
                    level.levelAnnounce();
                    document.body.style.cursor = "none";
                    requestAnimationFrame(cycle);
                } else {
                    simulation.paused = true;
                    build.pauseGrid()
                    document.body.style.cursor = "auto";
                }
            }
            break
        case input.key.testing:
            if (mech.alive) {
                if (simulation.testing) {
                    simulation.testing = false;
                    simulation.loop = simulation.normalLoop
                    if (simulation.isConstructionMode) {
                        document.getElementById("construct").style.display = 'none'
                    }
                } else { //if (keys[191])
                    simulation.testing = true;
                    simulation.isCheating = true;
                    if (simulation.isConstructionMode) {
                        document.getElementById("construct").style.display = 'inline'
                    }
                    simulation.loop = simulation.testingLoop
                }
            }
            break
    }
    if (simulation.testing) {
        switch (event.key.toLowerCase()) {
            case "b":
                simulation.testSpawnX++
                break;
            case "v":
                simulation.testSpawnX--
                break;
            case "n":
                spawn[spawn.fullPickList[Math.abs(simulation.testSpawnX)%spawn.fullPickList.length]](simulation.mouseInGame.x,simulation.mouseInGame.y)
                break
			case "m":
				spawn[spawn.levelBosses[Math.abs(simulation.testSpawnX)%spawn.levelBosses.length]](simulation.mouseInGame.x,simulation.mouseInGame.y)
				break
            case "o":
                simulation.isAutoZoom = false;
                simulation.zoomScale /= 0.9;
                simulation.setZoom();
                break;
            case "i":
                simulation.isAutoZoom = false;
                simulation.zoomScale *= 0.9;
                simulation.setZoom();
                break
            case "`":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "reroll");
                break
            case "1":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "heal");
                break
            case "2":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "ammo");
                break
            case "3":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "gun");
                break
            case "4":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "field");
                break
            case "5":
                powerUps.directSpawn(simulation.mouseInGame.x, simulation.mouseInGame.y, "tech");
                break
            case "6":
                const index = body.length
                spawn.bodyRect(simulation.mouseInGame.x, simulation.mouseInGame.y, 50, 50);
                body[index].collisionFilter.category = cat.body;
                body[index].collisionFilter.mask = cat.player | cat.map | cat.body | cat.bullet | cat.mob | cat.mobBullet
                body[index].classType = "body";
                World.add(engine.world, body[index]); //add to world
                break
            case "7":
                const pick = spawn.fullPickList[Math.floor(Math.random() * spawn.fullPickList.length)];
                spawn[pick](simulation.mouseInGame.x, simulation.mouseInGame.y);
                break
            case "8":
                spawn.randomLevelBoss(simulation.mouseInGame.x, simulation.mouseInGame.y);
                break
			case "9":
				spawn.finalBoss(simulation.mouseInGame.x, simulation.mouseInGame.y)
			break
            case "f":
                const mode = (mech.fieldMode === mech.fieldUpgrades.length - 1) ? 0 : mech.fieldMode + 1
                mech.setField(mode)
                break
            case "g":
                b.giveGuns("all", 1000)
                break
            case "h":
                mech.addHealth(Infinity)
                mech.energy = mech.maxEnergy;
                break
            case "y":
                tech.giveTech()
                break
            case "r":
                mech.resetHistory();
                Matter.Body.setPosition(player, simulation.mouseInGame);
                Matter.Body.setVelocity(player, {
                    x: 0,
                    y: 0
                });
                // move bots to follow player
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType) {
                        Matter.Body.setPosition(bullet[i], Vector.add(player.position, {
                            x: 250 * (Math.random() - 0.5),
                            y: 250 * (Math.random() - 0.5)
                        }));
                        Matter.Body.setVelocity(bullet[i], {
                            x: 0,
                            y: 0
                        });
                    }
                }
                break
            case "u":
                level.bossKilled = true; //if there is no boss this needs to be true to increase levels
                level.nextLevel();
                break
            case "X": //capital X to make it hard to die
                mech.death();
                break
        }
    }
});
//mouse move input
document.body.addEventListener("mousemove", (e) => {
    simulation.mouse.x = e.clientX;
    simulation.mouse.y = e.clientY;
});

document.body.addEventListener("mouseup", (e) => {
    // input.fire = false;
    // console.log(e)
    if (e.which === 3) {
        input.field = false;
    } else {
        input.fire = false;
    }
});

document.body.addEventListener("mousedown", (e) => {
    if (e.which === 3) {
        input.field = true;
    } else {
        input.fire = true;
    }
});

document.body.addEventListener("mouseenter", (e) => { //prevents mouse getting stuck when leaving the window
    if (e.button === 1) {
        input.fire = true;
    } else {
        input.fire = false;
    }

    if (e.button === 3) {
        input.field = true;
    } else {
        input.field = false;
    }
});
document.body.addEventListener("mouseleave", (e) => { //prevents mouse getting stuck when leaving the window
    if (e.button === 1) {
        input.fire = true;
    } else {
        input.fire = false;
    }

    if (e.button === 3) {
        input.field = true;
    } else {
        input.field = false;
    }
});

document.body.addEventListener("wheel", (e) => {
    if (!simulation.paused) {
        if (e.deltaY > 0) {
            simulation.nextGun();
        } else {
            simulation.previousGun();
        }
    }
}, {
    passive: true
});

//**********************************************************************
//  local storage
//**********************************************************************
let localSettings = JSON.parse(localStorage.getItem("localSettings"));
if (localSettings) {
    if (localSettings.key) {
        input.key = localSettings.key
    } else {
        input.setDefault()
    }


    simulation.isCommunityMaps = localSettings.isCommunityMaps
    document.getElementById("community-maps").checked = localSettings.isCommunityMaps
    simulation.isExtremeMode = localSettings.isExtremeMode
	document.getElementById("extreme-mode").checked=localSettings.isExtremeMode
    simulation.difficultyMode = localSettings.difficultyMode
    document.getElementById("difficulty-select").value = localSettings.difficultyMode
    if (localSettings.fpsCapDefault === 'max') {
        simulation.fpsCapDefault = 999999999;
    } else {
        simulation.fpsCapDefault = Number(localSettings.fpsCapDefault)
    }
    document.getElementById("fps-select").value = localSettings.fpsCapDefault
} else {
    localSettings = {
        isCommunityMaps: false,
        difficultyMode: '2',
        fpsCapDefault: 'max',
        runCount: 0,
        levelsClearedLastGame: 0,
        key: undefined
    };
    input.setDefault()
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
    document.getElementById("community-maps").checked = localSettings.isCommunityMaps
    simulation.isCommunityMaps = localSettings.isCommunityMaps
    document.getElementById("difficulty-select").value = localSettings.difficultyMode
    document.getElementById("fps-select").value = localSettings.fpsCapDefault
}
input.controlTextUpdate()

//**********************************************************************
// settings 
//**********************************************************************
document.getElementById("fps-select").addEventListener("input", () => {
    let value = document.getElementById("fps-select").value
    if (value === 'max') {
        simulation.fpsCapDefault = 999999999;
    } else {
        simulation.fpsCapDefault = Number(value)
    }
    localSettings.fpsCapDefault = value
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

document.getElementById("community-maps").addEventListener("input", () => {
    simulation.isCommunityMaps = document.getElementById("community-maps").checked
    localSettings.isCommunityMaps = simulation.isCommunityMaps
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});
document.getElementById("extreme-mode").addEventListener("input", () => {
    simulation.isExtremeMode = document.getElementById("extreme-mode").checked
	   localSettings.isExtremeMode = simulation.isExtremeMode
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});

// difficulty-select-custom event listener is set in build.makeGrid
document.getElementById("difficulty-select").addEventListener("input", () => {
    simulation.difficultyMode = Number(document.getElementById("difficulty-select").value)
    localSettings.difficultyMode = simulation.difficultyMode
    localSettings.levelsClearedLastGame = 0 //after changing difficulty, reset run history
    localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
});



document.getElementById("updates").addEventListener("toggle", function() {
////there was a bunch of complecated network stuff which i decided to not exist actually
            document.getElementById("updates-div").innerHTML = `the bad mod:update list<hr>
			<b title="...">2021-4-10</b> - who likes cloaking anyway<br>reenabled phase decoherence field and removed phase decoherence tech<hr>
			<b title="get buffed">2021-4-9</b> - a "bit" more content<br>added a lot of extreme field tech(<b title="only for field emitter,standing wave harmonics,perfect diametrism,nano-scale manufacturing,pilot wave, can't be bothered with any other ones yet">hover over this for more info</b>)<br>tech: AAAAAAAAAAAA - lowers effective difficulty scaling<br>tech: [endless screaming] - 3% of damage to mobs are affected less by scaling<br>tech:jfdghdhgldfhdfkg - [endless screaming]'s exponent is 0.25 higher<br>tech:nyoom - decreases health and increases damage over time<br>sure do hope i remembered all of the things<hr>
			<b title="AAAAAAAAAAAAAAAAAAAAAAAAAAAA">2021-4-6</b> - one nanosecond later bugpatch 2<br>extreme perpetual tech requirement text was wrong<hr>
			<b title="AAAAAAAAAAAA part 2:BBBBBB">2021-4-6</b> - ten hour later bugpatch<br>added requirement text to some extreme tech because i forgot or something<hr>
			<b title="AAAAAAAAAAAA">2021-4-6</b> - one nanosecond later bugpatch<br>fixed even more extreme mode<hr>
			<b title="i give up">2021-4-6</b> - i have run out of jokes<br>tech - even more extreme mode:things<hr>
			<b title="bzzz">2021-2-8</b> - updateasdsaedsaa<br>tech - chain zap :zap chains<br> tehcj - long zap ; zap 33% longer<br>teidj - gamma rad beam = raytracing things cause radiation<br>made field orb  work for thignas<hr>
			<b title="this is not a news ticker">2021-2-7</b> - updataes yes<br>tech - aimbot:auto-aim on fire<br>tech-field orb:claified things<br>gun : zap - pulse but without exploding and with ammo<br>update thtis div's css<hr>
			<b title="should've waited a day more">2021-2-6</b> - OH MY GOD AN UPDATE??????????????<br>gun:random - random bullet<br>tech:extreme freeze - 2x freeze<br>tech:extreme explosive vaporisation - small chance for an exposion to have xe12 damage<br>made extreme antilimit work in custom menu<br>right click clears in custom menu<hr>
			<b title="more guns">2021-1-7</b> - funny fractal<br><br>gun:shattershot - makes nails that split recursively<br>tess:recursive shattering- shattering nails shatter more on hit on mob<br>tekl - recursive improvement: shattering nails last 1 iteration longer<br>tulh = extreme limit break - no more tech limits!!!!<hr>
			<b title="pain">removed cycles buffs</b><hr>
			<b title="more tehcs">2021-1-7</b> - nail go BRRR<br><br>teches:homing nails- nails go fast towards mobs<br>tekh - [anti/hyper]cycles: cycles go by [faster/slower](some time things are different and<br>most drastically æffects exposives and mob vision)<hr>
			<b title="ob hoy tore mechs">2021-1-7</b> - more tech<br><br>tch:extreme buuble fusion-30% tech on shield destroy<br>extreme tech generation-5% tech on destroy<br>bots exchange-make random bot on cancel<br>antigravity-super balls don't fall[i actually did this yesterday but i forgot to log it]<br>random bots now include plasma! i have no idea why i didn't do this sooner<br>mech color change<hr>		
			update css[did you know? if you hover over bold text in this update tab it makes stuff show up]<hr>`
})

//**********************************************************************
// main loop 
//**********************************************************************
simulation.loop = simulation.normalLoop;

function cycle() {
    if (!simulation.paused) requestAnimationFrame(cycle);
    const now = Date.now();
    const elapsed = now - simulation.then; // calc elapsed time since last loop
    if (elapsed > simulation.fpsInterval) { // if enough time has elapsed, draw the next frame
        simulation.then = now - (elapsed % simulation.fpsInterval); // Get ready for next frame by setting then=now.   Also, adjust for fpsInterval not being multiple of 16.67

        simulation.cycle++ //tracks game cycles
        mech.cycle+=1; //tracks player cycles  //used to alow time to stop for everything, but the player
        if (simulation.clearNow) {
            simulation.clearNow = false;
            simulation.clearMap();
            level.start();
        }

        simulation.loop();
        // if (isNaN(mech.health) || isNaN(mech.energy)) {
        //   console.log(`mech.health = ${mech.health}`)
        //   simulation.paused = true;
        //   build.pauseGrid()
        //   document.body.style.cursor = "auto";
        //   alert("health is NaN, please report this bug to the discord  \n https://discordapp.com/invite/2eC9pgJ")
        // }
        // for (let i = 0, len = loop.length; i < len; i++) {
        //   loop[i]()
        // }
    }
}