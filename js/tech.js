
const tech = {
    totalCount: null,
    setupAllTech() {
        for (let i = 0, len = tech.tech.length; i < len; i++) {
            tech.tech[i].remove();
            tech.tech[i].isLost = false
            tech.tech[i].count = 0
        }
        // tech.nailBotCount = 0;
        // tech.foamBotCount = 0;
        // tech.boomBotCount = 0;
        // tech.laserBotCount = 0;
        // tech.orbitalBotCount = 0;
        // tech.plasmaBotCount = 0;
        tech.armorFromPowerUps = 0;
        tech.totalCount = 0;
        simulation.updateTechHUD();
    },
    removeTech(index) {
        tech.tech[index].remove();
        tech.tech[index].count = 0;
        simulation.updateTechHUD();
    },
    giveTech(index = 'random') {
        if (index === 'random') {
            let options = [];
            for (let i = 0; i < tech.tech.length; i++) {
                if (tech.tech[i].count < tech.tech[i].maxCount && tech.tech[i].allowed())
                    options.push(i);
            }
            // give a random tech from the tech I don't have
            if (options.length > 0) {
                let newTech = options[Math.floor(Math.random() * options.length)]
                tech.giveTech(newTech)
            }
        } else {
            if (isNaN(index)) { //find index by name
                let found = false;
                for (let i = 0; i < tech.tech.length; i++) {
                    if (index === tech.tech[i].name) {
                        index = i;
                        found = true;
                        break;
                    }
                }
                if (!found) return //if name not found don't give any tech
            }
            if (tech.tech[index].isLost) tech.tech[index].isLost = false; //give specific tech
            tech.tech[index].effect(); //give specific tech
            tech.tech[index].count++
            tech.totalCount++ //used in power up randomization
            simulation.updateTechHUD();
        }
    },
    setTechoNonRefundable(name) {
        for (let i = 0; i < tech.tech.length; i++) {
            if (tech.tech.name === name) {
                tech.tech[i].isNonRefundable = true;
                return
            }
        }
    },
    haveGunCheck(name) {
        if (
            !build.isCustomSelection &&
            b.inventory.length > 2 &&
            name !== b.guns[b.activeGun].name &&
            Math.random() > 2 / (b.inventory.length + tech.isGunCycle * 3) //lower chance of tech specific to a gun if you have lots of guns
        ) {
            return false
        }

        for (i = 0, len = b.inventory.length; i < len; i++) {
            if (b.guns[b.inventory[i]].name === name) return true
        }
        return false
    },
    damageFromTech() {
        let dmg = mech.fieldDamage
        // if (tech.aimDamage>1)
        if (tech.isLowEnergyDamage) dmg *= 1 + Math.max(0, 1 - mech.energy) * 0.5
        if (tech.isMaxEnergyTech) dmg *= 1.4
        if (tech.isEnergyNoAmmo) dmg *= 1.5
        if (tech.isDamageForGuns) dmg *= 1 + 0.07 * b.inventory.length
        if (tech.isLowHealthDmg) dmg *= 1 + 0.6 * Math.max(0, 1 - mech.health)
        if (tech.isHarmDamage && mech.lastHarmCycle + 600 > mech.cycle) dmg *= 2;
        if (tech.isEnergyLoss) dmg *= 1.5;
        if (tech.isAcidDmg && mech.health > 1) dmg *= 1.4;
        if (tech.restDamage > 1 && player.speed < 1) dmg *= tech.restDamage
        if (tech.isEnergyDamage) dmg *= 1 + mech.energy / 9;
        if (tech.isDamageFromBulletCount) dmg *= 1 + bullet.length * 0.0038
        if (tech.isRerollDamage) dmg *= 1 + 0.04 * powerUps.reroll.rerolls
        if (tech.isOneGun && b.inventory.length < 2) dmg *= 1.25
        if (tech.isNoFireDamage && mech.cycle > mech.fireCDcycle + 120) dmg *= 1.66
        if (tech.isSpeedDamage) dmg *= 1 + Math.min(0.4, player.speed * 0.013)
        if (tech.isBotDamage) dmg *= 1 + 0.02 * tech.totalBots()
        return dmg * tech.slowFire * tech.aimDamage * tech.extremeAtkInc * (simulation.isExtremeMode?tech.extremeAtkIncPerm:1)*tech.allBoost
    },
    duplicationChance() {
        x=(tech.isBayesian ? 0.2 : 0) + tech.cancelCount * 0.04 + tech.duplicateChance + mech.duplicateChance;
		if (x>1.5) x=1.5*((x/1.5)**0.825)
		return x
    },
    totalBots() {
        return tech.foamBotCount + tech.nailBotCount + tech.laserBotCount + tech.boomBotCount + tech.plasmaBotCount + tech.orbitBotCount + tech.plasmaBotCount
    },
    tech: [{
            name: "electrolytes",
            description: "increase <strong class='color-d'>damage</strong> by <strong>1%</strong><br>for every <strong>9</strong> stored <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.maxEnergy > 1 || tech.isEnergyRecovery || tech.isPiezo || tech.energySiphon > 0
            },
            requires: "increased energy regen or max energy",
            effect: () => {
                tech.isEnergyDamage = true
            },
            remove() {
                tech.isEnergyDamage = false;
            }
        },
		{
            name: "extreme radiation",
            description: "when radiation ends radiation resets with x1.2 damage",
            maxCount: 9,
            count: 0,
            allowed() {
                return simulation.isExtremeMode 
            },
            requires: "extreme mode(see settings)",
            effect: () => {
                tech.extremeRadExp *= 1.1
            },
            remove() {
                tech.extremeRadExp = 1;
            }
        },
        {
            name: "extreme perpetual tech",
            description: "find <strong>1</strong> <strong class='color-m'>tech</strong> at the start of each <strong>level</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return simulation.isExtremeMode
            },
            requires: "only 1 perpetual effect, not superdeterminism",
            effect() {
                tech.isPerpetualTech = true
            },
            remove() {
                tech.isPerpetualTech = false
            }
        },
		{
            name: "extreme damage",
            description: "x2 damage",
            maxCount: 39,
            count: 0,
            allowed() {
                return simulation.isExtremeMode 
            },
            requires: "extreme mode(see settings)",
            effect: () => {
                tech.extremeAtkInc *= 2
            },
            remove() {
                tech.extremeAtkInc = 1;
            }
        },
		{
            name: "extremely explosive nails",
            description: "nails explode<br><em>...oh no...</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.extremeFragments>0 
            },
            requires: "extreme fragmentation",
            effect: () => {
                tech.extremeNailExpl = true
            },
            remove() {
                tech.extremeNailExpl = false;
            }
        },
		{
            name: "extreme energy",
            description: "x2 energy cap and generation",
            maxCount: 9,
            count: 0,
            allowed() {
                return simulation.isExtremeMode
            },
            requires: "extreme mode",
            effect: () => {
                tech.extremeEnergy *= 2;
				mech.setEnergyRegen()
                mech.setMaxEnergy()
            },
            remove() {
                tech.extremeEnergy = 1;
                mech.setEnergyRegen()
                mech.setMaxEnergy()
            }
        },
        {
            name: "extreme explosives",
            description: "increase <strong class='color-e'>explosive</strong> <strong class='color-d'>damage</strong> and <br><strong class='color-b'>radius</strong> by <strong>x2</strong><br><em>PLEASE get electric reactive armor</em>",
            maxCount: 9,
            count: 0,
            allowed() {
                return simulation.isExtremeMode
            },
            requires: "extreme mode",
            effect: () => {
                tech.extremeExplosiveRadius *= 2;
            },
            remove() {
                tech.extremeExplosiveRadius = 1;
            }
        },
		{
            name: "extreme limit breaking",
            description: "all tech with more than a 1 tech limit becomes unlimited<br><em>does NOT work in build menu</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return simulation.isExtremeMode 
            },
            requires: "extreme mode(see settings)",
            effect: () => {
				tech.antiLimit=true
            },
            remove() {
				tech.antiLimit=false
            }
        },
		{
            name: "extreme fragmentation",
            description: "most collisions create nails",
            maxCount: 9,
            count: 0,
            allowed() {
                return simulation.isExtremeMode 
            },
            requires: "extreme mode(see settings)",
            effect: () => {
				tech.extremeFragments+=1
            },
            remove() {
				tech.extremeFragments=0
            }
        },
		{
            name: "extreme defense",
            description: "/2 harm",
            maxCount: 39,
            count: 0,
            allowed() {
                return simulation.isExtremeMode 
            },
            requires: "extreme mode(see settings)",
            effect: () => {
                tech.extremeHrmDec *= 2
            },
            remove() {
                tech.extremeHrmDec = 1;
            }
        },
		/*{
            name: "extreme eternal defense",
            description: "/1.3 harm beyond runs",
            maxCount: 9,
            count: 0,
            allowed() {
                return simulation.isExtremeMode 
            },
            requires: "extreme mode(see settings)",
            effect: () => {
                tech.extremeHrmDecPerm *= 1.3
				localSettings.extrDefPerm = tech.extremeHrmDecPerm;
				localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
            },
            remove() {
                if (!tech.extremeHrmDecPerm) {
				localSettings.extrDefPerm = tech.extremeHrmDecPerm;
				localStorage.setItem("localSettings", JSON.stringify(localSettings)); //update local storage
				}
				tech.extremeHrmDecPerm=JSON.parse(localStorage.getItem('localSettings')).extrDefPerm
            }
        },*/
		{
            name: "ghostly bullets[AAAAAAAAAAAAA HOW TO MAKE THIS WORK]",
            description: "bullets don't collide with walls",
            maxCount: 1,
            count: 0,
            allowed() {
                return false
            },
            requires: "a gun",
            effect: () => {
                tech.bulletsCollide = false
            },
            remove() {
                tech.bulletsCollide = true
            }
        },
        {
            name: "extreme tech replication",
            description: "spawn new <strong class='color-m'>tech</strong> according<br> to your current <strong class='color-m'>tech</strong>(/1.5)",
            maxCount: 10000000,
            count: 0,
            // isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return simulation.isExtremeMode
            },
            requires: "extreme mode",
            effect: () => {
                let count = -tech.extremeTech //count tech
                for (let i = 0, len = tech.tech.length; i < len; i++) { // spawn new tech power ups
                    if (!tech.tech[i].isNonRefundable) count += tech.tech[i].count
                }
                for (let i = 0; i < count/1.5; i++) { // spawn new tech power ups
                    powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
					tech.extremeTech++
                }
                //have state is checked in mech.death()
            },
            remove() {
				
			}
        },
        {
            name: "extreme bubble fusion",
            description: "after destroying a mob's <strong>shield</strong><br>you have a 30% chance to spawn <strong>1</strong> <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return simulation.isExtremeMode
            },
            requires: "",
            effect() {
                tech.isShieldTech = true;
            },
            remove() {
                tech.isShieldTech = false;
            }
        },
        {
            name: "extreme tech generation",
            description: "you have a 5% chance to spawn <strong>1</strong> <strong class='color-m'>tech</strong><br>when you kill a mob",
            maxCount: 1,
            count: 0,
            allowed() {
                return simulation.isExtremeMode
            },
            requires: "",
            effect() {
                tech.extremeTechGen = true;
            },
            remove() {
                tech.extremeTechGen = false;
            }
        },
        {
            name: "homing nails",
            description: "nails angle towards the nearest mob",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.homingNails = true;
            },
            remove() {
                tech.homingNails = false;
            }
        },
		{
            name: "simple boost",
            description: "x1.1 damage,harm reduction,<br>energy cap,energy generation",
            maxCount: 25,
            count: 0,
            allowed() {
                return true
            },
            requires: "...",
            effect: () => {
                tech.allBoost *= 1.1
				mech.setEnergyRegen()
            },
            remove() {
                tech.allBoost = 1;
				mech.setEnergyRegen()
				mech.setEnergyRegen()
            }
        },
		{
            name: "ammo upgrade",
            description: "increase <strong class='color-g'>ammo</strong> by <strong>33%</strong>",
            maxCount: 25,
            count: 0,
            allowed() {
                return b.inventory.length>0
            },
            requires: "a gun",
            effect: () => {
                tech.ammoBuff *=1.33
            },
            remove() {
                tech.ammoBuff = 1;
            }
        },
		{
            name: "multishot",
            description: "fire multiple times at once",
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.ammoBuff>1
            },
            requires: "ammo upgrade",
            effect: () => {
                tech.multiShot +=1
            },
            remove() {
                tech.multiShot=1
            }
        },
        {
            name: "exciton-lattice",
            description: `increase <strong class='color-d'>damage</strong> by <strong>50%</strong>, but<br><strong class='color-g'>ammo</strong> will no longer <strong>spawn</strong>`,
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("nail gun") && tech.isIceCrystals) || tech.haveGunCheck("laser") || mech.fieldUpgrades[mech.fieldMode].name === "plasma torch" || mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave"
            },
            requires: "energy based damage",
            effect() {
                tech.isEnergyNoAmmo = true;
            },
            remove() {
                tech.isEnergyNoAmmo = false;
            }
        },
        {
            name: "exothermic process",
            description: "increase <strong class='color-d'>damage</strong> by <strong>50%</strong><br>if a mob <strong>dies</strong> drain stored <strong class='color-f'>energy</strong> by <strong>25%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isEnergyLoss = true;
            },
            remove() {
                tech.isEnergyLoss = false;
            }
        },
        {
            name: "heat engine",
            description: `increase <strong class='color-d'>damage</strong> by <strong>40%</strong>, but<br>reduce maximum <strong class='color-f'>energy</strong> by <strong>50</strong>`,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isEnergyLoss && mech.maxEnergy === 1 && !tech.isMissileField && !tech.isSporeField && !tech.isRewindAvoidDeath
            },
            requires: "exothermic process, not max energy increase, CPT, missile or spore nano-scale",
            effect() {
                tech.isMaxEnergyTech = true;
                mech.setMaxEnergy()
            },
            remove() {
                tech.isMaxEnergyTech = false;
                mech.setMaxEnergy()
            }
        },
        {
            name: "Gibbs free energy",
            description: `increase <strong class='color-d'>damage</strong> by <strong>5%</strong><br>for every <strong>10</strong> <strong class='color-f'>energy</strong> below <strong>100</strong>`,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isEnergyLoss && mech.maxEnergy < 1.1
            },
            requires: "exothermic process",
            effect() {
                tech.isLowEnergyDamage = true;
            },
            remove() {
                tech.isLowEnergyDamage = false;
            }
        },
        {
            name: "rest frame",
            description: "increase <strong class='color-d'>damage</strong> by <strong>25%</strong><br>when not <strong>moving</strong>",
            maxCount: 6,
            count: 0,
            allowed() {
                return mech.Fx === 0.016
            },
            requires: "base movement speed",
            effect: () => {
                tech.restDamage += 0.25
            },
            remove() {
                tech.restDamage = 1;
            }
        },
        {
            name: "kinetic bombardment",
            description: "increase <strong class='color-d'>damage</strong> by up to <strong>33%</strong><br>at a <strong>distance</strong> of 40 steps from the target",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isFarAwayDmg = true; //used in mob.damage()
            },
            remove() {
                tech.isFarAwayDmg = false;
            }
        },
        {
            name: "fluoroantimonic acid",
            description: "increase <strong class='color-d'>damage</strong> by <strong>40%</strong><br>when your <strong>health</strong> is above <strong>100</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.maxHealth > 1;
            },
            requires: "health above 100",
            effect() {
                tech.isAcidDmg = true;
            },
            remove() {
                tech.isAcidDmg = false;
            }
        },
        {
            name: "integrated armament",
            description: "increase <strong class='color-d'>damage</strong> by <strong>25%</strong><br>your inventory can only hold <strong>1 gun</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return b.inventory.length < 2
            },
            requires: "no more than 1 gun",
            effect() {
                tech.isOneGun = true;
            },
            remove() {
                tech.isOneGun = false;
            }
        },
        {
            name: "negative feedback",
            description: "increase <strong class='color-d'>damage</strong> by <strong>6%</strong><br>for every <strong>10</strong> missing base <strong>health</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.health < 0.6 || build.isCustomSelection
            },
            requires: "health below 60",
            effect() {
                tech.isLowHealthDmg = true; //used in mob.damage()
            },
            remove() {
                tech.isLowHealthDmg = false;
            }
        },
        {
            name: "radiative equilibrium",
            description: "for <strong>10 seconds</strong> after receiving <strong class='color-harm'>harm</strong><br>increase <strong class='color-d'>damage</strong> by <strong>100%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.harmReduction() < 1
            },
            requires: "some harm reduction",
            effect() {
                tech.isHarmDamage = true;
            },
            remove() {
                tech.isHarmDamage = false;
            }
        },
        {
            name: "perturbation theory",
            description: "increase <strong class='color-d'>damage</strong> by <strong>4%</strong><br>for each of your <strong class='color-r'>rerolls</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return powerUps.reroll.rerolls > 3 || build.isCustomSelection
            },
            requires: "at least 4 rerolls",
            effect() {
                tech.isRerollDamage = true;
            },
            remove() {
                tech.isRerollDamage = false;
            }
        },
        {
            name: "electrostatic discharge",
            description: "increase <strong class='color-d'>damage</strong> by <strong>20%</strong><br><strong>20%</strong> increased <strong><em>delay</em></strong> after firing",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            effect() {
                tech.slowFire = 1.2
                b.setFireCD();
            },
            remove() {
                tech.slowFire = 1;
                b.setFireCD();
            }
        },
        {
            name: "Ψ(t) collapse",
            description: "<strong>66%</strong> decreased <strong><em>delay</em></strong> after firing<br>when you have no <strong class='color-r'>rerolls</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return powerUps.reroll.rerolls === 0 && !tech.manyWorlds
            },
            requires: "no rerolls",
            effect() {
                tech.isRerollHaste = true;
                tech.rerollHaste = 0.33;
                b.setFireCD();
            },
            remove() {
                tech.isRerollHaste = false;
                tech.rerollHaste = 1;
                b.setFireCD();
            }
        },
        {
            name: "auto-loading heuristics",
            description: "<strong>30%</strong> decreased <strong><em>delay</em></strong> after firing",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.fireRate *= 0.7
                b.setFireCD();
            },
            remove() {
                tech.fireRate = 1;
                b.setFireCD();
            }
        },
        {
            name: "mass driver",
            description: "increase <strong>block</strong> collision <strong class='color-d'>damage</strong> by <strong>100%</strong><br>charge <strong>throws</strong> more <strong>quickly</strong> for less <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name !== "wormhole"
            },
            requires: "not wormhole",
            effect() {
                tech.throwChargeRate = 2
            },
            remove() {
                tech.throwChargeRate = 1
            }
        },
        {
            name: "ammonium nitrate",
            description: "increase <strong class='color-e'>explosive</strong> <strong class='color-d'>damage</strong> by <strong>20%</strong><br>increase <strong class='color-e'>explosive</strong> <strong>radius</strong> by <strong>20%</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.haveGunCheck("missiles") || tech.isIncendiary || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("vacuum bomb") || tech.isPulseLaser || tech.isMissileField || tech.boomBotCount > 1 || tech.isFlechetteExplode
            },
            requires: "an explosive damage source",
            effect: () => {
                tech.explosiveRadius += 0.2;
            },
            remove() {
                tech.explosiveRadius = 1;
            }
        },
        {
            name: "nitroglycerin",
            description: "increase <strong class='color-e'>explosive</strong> <strong class='color-d'>damage</strong> by <strong>60%</strong><br>decrease <strong class='color-e'>explosive</strong> <strong>radius</strong> by <strong>20%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("missiles") || tech.isIncendiary || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("vacuum bomb") || tech.isPulseLaser || tech.isMissileField || tech.boomBotCount > 1 || tech.isFlechetteExplode
            },
            requires: "an explosive damage source",
            effect: () => {
                tech.isSmallExplosion = true;
            },
            remove() {
                tech.isSmallExplosion = false;
            }
        },
        {
            name: "acetone peroxide",
            description: "increase <strong class='color-e'>explosive</strong> <strong>radius</strong> by <strong>80%</strong>, but<br>you take <strong>400%</strong> more <strong class='color-harm'>harm</strong> from <strong class='color-e'>explosions</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("missiles") || tech.isIncendiary || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("vacuum bomb") || tech.isPulseLaser || tech.isMissileField || tech.isFlechetteExplode
            },
            requires: "an explosive damage source",
            effect: () => {
                tech.isExplosionHarm = true;
            },
            remove() {
                tech.isExplosionHarm = false;
            }
        },
        {
            name: "electric reactive armor",
            // description: "<strong class='color-e'>explosions</strong> do no <strong class='color-harm'>harm</strong><br> while your <strong class='color-f'>energy</strong> is above <strong>98%</strong>",
            description: "<strong class='color-harm'>harm</strong> from <strong class='color-e'>explosions</strong> is passively reduced<br>by <strong>7%</strong> for every <strong>10</strong> stored <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("missiles") || tech.isIncendiary || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("vacuum bomb") || tech.isMissileField || tech.isExplodeMob || tech.isFlechetteExplode || tech.isPulseLaser
            },
            requires: "an explosive damage source",
            effect: () => {
                tech.isImmuneExplosion = true;
            },
            remove() {
                tech.isImmuneExplosion = false;
            }
        },
        {
            name: "thermal runaway",
            description: "mobs <strong class='color-e'>explode</strong> when they <strong>die</strong><br><em>be careful</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("missiles") || tech.isIncendiary || (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("vacuum bomb") || tech.isPulseLaser || tech.isMissileField || tech.boomBotCount > 1 || tech.isFlechetteExplode) && !tech.sporesOnDeath && !tech.nailsDeathMob && !tech.isBotSpawner
            },
            requires: "an explosive damage source, no other mob death tech",
            effect: () => {
                tech.isExplodeMob = true;
            },
            remove() {
                tech.isExplodeMob = false;
            }
        },
        {
            name: "reaction inhibitor",
            description: "mobs spawn with <strong>11%</strong> less <strong>health</strong>",
            maxCount: 3,
            count: 0,
            allowed() {
                return tech.nailsDeathMob || tech.sporesOnDeath || tech.isExplodeMob || tech.isBotSpawner
            },
            requires: "any mob death tech",
            effect: () => {
                tech.mobSpawnWithHealth *= 0.89

                //set all mobs at full health to 0.85
                for (let i = 0; i < mob.length; i++) {
                    if (mob.health > tech.mobSpawnWithHealth) mob.health = tech.mobSpawnWithHealth
                }
            },
            remove() {
                tech.mobSpawnWithHealth = 1;
            }
        },
        {
            name: "zoospore vector",
            description: "mobs produce <strong class='color-p' style='letter-spacing: 2px;'>spores</strong> when they <strong>die</strong><br><strong>9%</strong> chance",
            maxCount: 9,
            count: 0,
            allowed() {
                return !tech.nailsDeathMob && !tech.isExplodeMob && !tech.isBotSpawner
            },
            requires: "no other mob death tech",
            effect() {
                tech.sporesOnDeath += 0.09;
                for (let i = 0; i < 8; i++) {
                    b.spore(mech.pos)
                }
            },
            remove() {
                tech.sporesOnDeath = 0;
            }
        },
        {
            name: "impact shear",
            description: "mobs release a <strong>nail</strong> when they <strong>die</strong><br>nails target nearby mobs",
            maxCount: 9,
            count: 0,
            allowed() {
                return !tech.sporesOnDeath && !tech.isExplodeMob && !tech.isBotSpawner
            },
            requires: "no other mob death tech",
            effect: () => {
                tech.nailsDeathMob++
            },
            remove() {
                tech.nailsDeathMob = 0;
            }
        },
        {
            name: "scrap bots",
            description: "<strong>20%</strong> chance to build a <strong>bot</strong> after killing a mob<br>the bot lasts for about <strong>20</strong> seconds",
            maxCount: 3,
            count: 0,
            allowed() {
                return tech.totalBots() > 0 && !tech.sporesOnDeath && !tech.nailsDeathMob && !tech.isExplodeMob
            },
            requires: "a bot and no other mob death tech",
            effect() {
                tech.isBotSpawner += 0.20;
            },
            remove() {
                tech.isBotSpawner = 0;
            }
        },
        {
            name: "nail-bot",
            description: "a bot fires <strong>nails</strong> at targets in line of sight",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.nailBotCount++;
                b.nailBot();
            },
            remove() {
                tech.nailBotCount -= this.count;
            }
        },
        {
            name: "nail-bot upgrade",
            description: "<strong>500%</strong> increased <strong> fire rate</strong><br><em>applies to all current and future nail-bots</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.nailBotCount > 1
            },
            requires: "2 or more nail bots",
            effect() {
                tech.isNailBotUpgrade = true
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'nail') bullet[i].isUpgraded = true
                }
            },
            remove() {
                tech.isNailBotUpgrade = false
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'nail') bullet[i].isUpgraded = false
                }
            }
        },
        {
            name: "foam-bot",
            description: "a bot fires <strong>foam</strong> at targets in line of sight",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.foamBotCount++;
                b.foamBot();
            },
            remove() {
                tech.foamBotCount -= this.count;
            }
        },
        {
            name: "foam-bot upgrade",
            description: "<strong>200%</strong> increased <strong>foam</strong> <strong>size</strong> and <strong>fire rate</strong><br><em>applies to all current and future foam-bots</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.foamBotCount > 1
            },
            requires: "2 or more foam bots",
            effect() {
                tech.isFoamBotUpgrade = true
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'foam') bullet[i].isUpgraded = true
                }
            },
            remove() {
                tech.isFoamBotUpgrade = false
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'foam') bullet[i].isUpgraded = false
                }
            }
        },
        {
            name: "boom-bot",
            description: "a bot <strong>defends</strong> the space around you<br>ignites an <strong class='color-e'>explosion</strong> after hitting a mob",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.boomBotCount++;
                b.boomBot();
            },
            remove() {
                tech.boomBotCount -= this.count;
            }
        },
        {
            name: "boom-bot upgrade",
            description: "<strong>250%</strong> increased <strong class='color-e'>explosion</strong> <strong class='color-d'>damage</strong> and size<br><em>applies to all current and future boom-bots</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.boomBotCount > 1
            },
            requires: "2 or more boom bots",
            effect() {
                tech.isBoomBotUpgrade = true
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'boom') bullet[i].isUpgraded = true
                }
            },
            remove() {
                tech.isBoomBotUpgrade = false
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'boom') bullet[i].isUpgraded = false
                }
            }
        },
        {
            name: "laser-bot",
            description: "a bot uses <strong class='color-f'>energy</strong> to emit a <strong>laser</strong><br>targeting nearby mobs",
            maxCount: 9,
            count: 0,
            allowed() {
                return mech.maxEnergy > 0.5
            },
            requires: "maximum energy above 50%",
            effect() {
                tech.laserBotCount++;
                b.laserBot();
            },
            remove() {
                tech.laserBotCount -= this.count;
            }
        },
        {
            name: "laser-bot upgrade",
            description: "<strong>350%</strong> increased laser <strong class='color-d'>damage</strong><br><em>applies to all current and future laser-bots</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.laserBotCount > 1
            },
            requires: "2 or more laser bots",
            effect() {
                tech.isLaserBotUpgrade = true
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'laser') bullet[i].isUpgraded = true
                }
            },
            remove() {
                tech.isLaserBotUpgrade = false
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'laser') bullet[i].isUpgraded = false
                }
            }
        },
        {
            name: "orbital-bot",
            description: "a bot is locked in <strong>orbit</strong> around you<br><strong>stuns</strong> and <strong class='color-d'>damages</strong> mobs on <strong>contact</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                b.orbitBot();
                tech.orbitBotCount++;
            },
            remove() {
                tech.orbitBotCount -= this.count;
            }
        },
        {
            name: "orbital-bot upgrade",
            description: "increase <strong class='color-d'>damage</strong> by <strong>150%</strong> and <strong>radius</strong> by <strong>30%</strong><br><em>applies to all current and future orbit-bots</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.orbitBotCount > 1
            },
            requires: "2 or more orbital bots",
            effect() {
                tech.isOrbitBotUpgrade = true
                const range = 190 + 60 * tech.isOrbitBotUpgrade
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'orbit') {
                        bullet[i].isUpgraded = true
                        bullet[i].range = range
                        bullet[i].orbitalSpeed = Math.sqrt(0.25 / range)
                    }
                }

            },
            remove() {
                tech.isOrbitBotUpgrade = false
                const range = 190 + 60 * tech.isOrbitBotUpgrade
                for (let i = 0; i < bullet.length; i++) {
                    if (bullet[i].botType === 'orbit') {
                        bullet[i].range = range
                        bullet[i].orbitalSpeed = Math.sqrt(0.25 / range)
                    }
                }
            }
        },
        {
            name: "bot fabrication",
            description: "anytime you collect <strong>5</strong> <strong class='color-r'>rerolls</strong><br>use them to build a <strong>random bot</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return powerUps.reroll.rerolls > 5 || build.isCustomSelection
            },
            requires: "at least 6 rerolls",
            effect() {
                tech.isRerollBots = true;
                powerUps.reroll.changeRerolls(0)
                simulation.makeTextLog(`<span class='color-var'>mech</span>.<span class='color-r'>rerolls</span> <span class='color-symbol'>=</span> 0`)
            },
            remove() {
                tech.isRerollBots = false;
            }
        },
        {
            name: "perimeter defense",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>3%</strong><br>for each of your permanent <strong>bots</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.totalBots() > 5 && !tech.isEnergyHealth
            },
            requires: "5 or more bots",
            effect() {
                tech.isBotArmor = true
            },
            remove() {
                tech.isBotArmor = false
            }
        }, {
            name: "network effect",
            description: "increase <strong class='color-d'>damage</strong> by <strong>2%</strong><br>for each of your permanent <strong>bots</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.totalBots() > 6
            },
            requires: "6 or more bots",
            effect() {
                tech.isBotDamage = true
            },
            remove() {
                tech.isBotDamage = false
            }
        },
        {
            name: "bot replication",
            description: "<strong class='color-dup'>duplicate</strong> your permanent <strong>bots</strong><br>remove <strong>all</strong> of your <strong class='color-g'>guns</strong>",
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return tech.totalBots() > 3
            },
            requires: "at least 3 bots",
            effect() {
                b.removeAllGuns();
                simulation.makeGunHUD();
                //double bots
                for (let i = 0; i < tech.nailBotCount; i++) {
                    b.nailBot();
                }
                tech.nailBotCount *= 2
                for (let i = 0; i < tech.laserBotCount; i++) {
                    b.laserBot();
                }
                tech.laserBotCount *= 2
                for (let i = 0; i < tech.foamBotCount; i++) {
                    b.foamBot();
                }
                tech.foamBotCount *= 2
                for (let i = 0; i < tech.boomBotCount; i++) {
                    b.boomBot();
                }
                tech.boomBotCount *= 2
                for (let i = 0; i < tech.plasmaBotCount; i++) {
                    b.plasmaBot();
                }
                tech.plasmaBotCount *= 2
                for (let i = 0; i < tech.orbitBotCount; i++) {
                    b.orbitBot();
                }
                tech.orbitBotCount *= 2
            },
            remove() {}
        },
        {
            name: "ablative drones",
            description: "rebuild your broken parts as <strong>drones</strong><br>chance to occur after receiving <strong class='color-harm'>harm</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.harmReduction() < 1
            },
            requires: "some harm reduction",
            effect() {
                tech.isDroneOnDamage = true;
                for (let i = 0; i < 4; i++) {
                    b.drone() //spawn drone
                }
            },
            remove() {
                tech.isDroneOnDamage = false;
            }
        },
        {
            name: "mine synthesis",
            description: "drop a <strong>mine</strong> after picking up a <strong>power up</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.duplicationChance() > 0
            },
            requires: "some power up duplication",
            effect() {
                tech.isMineDrop = true;
                if (tech.isMineDrop) b.mine(mech.pos, { x: 0, y: 0 }, 0, tech.isMineAmmoBack)
            },
            remove() {
                tech.isMineDrop = false;
            }
        },
        {
            name: "squirrel-cage rotor",
            description: "<strong>move</strong> and <strong>jump</strong> about <strong>25%</strong> faster",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() { // good with melee builds, content skipping builds
                tech.squirrelFx += 0.2;
                tech.squirrelJump += 0.09;
                mech.setMovement()
            },
            remove() {
                tech.squirrelFx = 1;
                tech.squirrelJump = 1;
                mech.setMovement()
            }
        },
        {
            name: "Newton's 1st law",
            description: "moving at high <strong>speeds</strong> reduces <strong class='color-harm'>harm</strong><br>by up to <strong>50%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.Fx > 0.016 && !tech.isEnergyHealth
            },
            requires: "speed increase, not mass-energy equivalence",
            effect() {
                tech.isSpeedHarm = true
            },
            remove() {
                tech.isSpeedHarm = false
            }
        },
        {
            name: "Newton's 2nd law",
            description: "moving at high <strong>speeds</strong> increases <strong class='color-d'>damage</strong><br> by up to <strong>33%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.Fx > 0.016
            },
            requires: "speed increase",
            effect() {
                tech.isSpeedDamage = true
            },
            remove() {
                tech.isSpeedDamage = false
            }
        },
        {
            name: "Pauli exclusion",
            description: `<strong>immune</strong> to <strong class='color-harm'>harm</strong> for <strong>0.5</strong> seconds longer<br>after receiving <strong class='color-harm'>harm</strong> from a collision`,
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.collisionImmuneCycles += 30;
                mech.immuneCycle = mech.cycle + tech.collisionImmuneCycles; //player is immune to collision damage for 30 cycles
            },
            remove() {
                tech.collisionImmuneCycles = 25;
            }
        },
        {
            name: "decorrelation",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>40%</strong><br>after not using your <strong class='color-g'>gun</strong> or <strong class='color-f'>field</strong> for <strong>2</strong> seconds",
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.totalBots() > 1 || tech.haveGunCheck("drones") || tech.haveGunCheck("mine") || tech.haveGunCheck("spores") || mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing") && !tech.isEnergyHealth
            },
            requires: "drones, spores, mines, or bots",
            effect() {
                tech.isNoFireDefense = true
            },
            remove() {
                tech.isNoFireDefense = false
            }
        },
        {
            name: "anticorrelation",
            description: "increase <strong class='color-d'>damage</strong> by <strong>66%</strong><br>after not using your <strong class='color-g'>gun</strong> or <strong class='color-f'>field</strong> for <strong>2</strong> seconds",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isNoFireDefense
            },
            requires: "decorrelation",
            effect() {
                tech.isNoFireDamage = true
            },
            remove() {
                tech.isNoFireDamage = false
            }
        },
        {
            name: "non-Newtonian armor",
            description: "for <strong>10 seconds</strong> after receiving <strong class='color-harm'>harm</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>66%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth && mech.harmReduction() < 1
            },
            requires: "some harm reduction",
            effect() {
                tech.isHarmArmor = true;
            },
            remove() {
                tech.isHarmArmor = false;
            }
        },
        {
            name: "clock gating",
            description: `<strong>slow</strong> <strong>time</strong> by <strong>50%</strong> after receiving <strong class='color-harm'>harm</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>15%</strong>`,
            maxCount: 1,
            count: 0,
            allowed() {
                return simulation.fpsCapDefault > 45 && !tech.isRailTimeSlow
            },
            requires: "FPS above 45",
            effect() {
                tech.isSlowFPS = true;
            },
            remove() {
                tech.isSlowFPS = false;
            }
        },
        {
            name: "liquid cooling",
            description: `<strong class='color-s'>freeze</strong> all mobs for <strong>5</strong> seconds<br>after receiving <strong class='color-harm'>harm</strong>`,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isSlowFPS
            },
            requires: "clock gating",
            effect() {
                tech.isHarmFreeze = true;
            },
            remove() {
                tech.isHarmFreeze = false;
            }
        },

        {
            name: "osmoprotectant",
            description: `collisions with <strong>stunned</strong> or <strong class='color-s'>frozen</strong> mobs<br>cause you <strong>no</strong> <strong class='color-harm'>harm</strong>`,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isStunField || tech.isPulseStun || tech.oneSuperBall || tech.isHarmFreeze || tech.isIceField || tech.isIceCrystals || tech.isSporeFreeze || tech.isAoESlow || tech.isFreezeMobs || tech.haveGunCheck("ice IX") || tech.isCloakStun || tech.orbitBotCount > 1 || tech.isWormholeDamage
            },
            requires: "a freezing or stunning effect",
            effect() {
                tech.isFreezeHarmImmune = true;
            },
            remove() {
                tech.isFreezeHarmImmune = false;
            }
        },
        {
            name: "supercapacitor",
            description: "<strong class='color-f'>energy</strong> above your max decays <strong>60%</strong> slower",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isEnergyRecovery || tech.isPiezo || tech.energySiphon > 0 || tech.isRailEnergyGain || tech.isWormholeEnergy || tech.iceEnergy > 0
            },
            requires: "a source of overfilled energy",
            effect() {
                tech.overfillDrain = 0.85
            },
            remove() {
                tech.overfillDrain = 0.75
            }
        },
        {
            name: "CPT reversal",
            description: "<strong>charge</strong>, <strong>parity</strong>, and <strong>time</strong> invert to undo <strong class='color-harm'>harm</strong><br><strong class='color-rewind'>rewind</strong> <strong>(1.5—5)</strong> seconds for <strong>(66—220)</strong> <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            allowed() { //&& (mech.fieldUpgrades[mech.fieldMode].name !== "nano-scale manufacturing" || mech.maxEnergy > 1)
                return mech.maxEnergy > 0.99 && mech.fieldUpgrades[mech.fieldMode].name !== "standing wave harmonics" && !tech.isEnergyHealth && !tech.isRewindGun
            },
            requires: "not standing wave, mass-energy, piezo, max energy reduction, CPT gun",
            effect() {
                tech.isRewindAvoidDeath = true;
            },
            remove() {
                tech.isRewindAvoidDeath = false;
            }
        },
        {
            name: "causality bots",
            description: "when you <strong class='color-rewind'>rewind</strong>, build some <strong>bots</strong><br>that protect you for about <strong>7</strong> seconds",
            maxCount: 3,
            count: 0,
            allowed() {
                return tech.isRewindAvoidDeath || tech.isRewindEnergy
            },
            requires: "CPT",
            effect() {
                tech.isRewindBot++;
            },
            remove() {
                tech.isRewindBot = 0;
            }
        },
        {
            name: "causality bombs",
            description: "before you <strong class='color-rewind'>rewind</strong> drop some <strong>grenades</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isRewindAvoidDeath
            },
            requires: "CPT",
            effect() {
                tech.isRewindGrenade = true;
            },
            remove() {
                tech.isRewindGrenade = false;
            }
        },
        {
            name: "piezoelectricity",
            description: "<strong>colliding</strong> with mobs gives you <strong>400</strong> <strong class='color-f'>energy</strong><br>reduce <strong class='color-harm'>harm</strong> by <strong>15%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isPiezo = true;
                mech.energy += 4;
            },
            remove() {
                tech.isPiezo = false;
            }
        },
        {
            name: "ground state",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>60%</strong><br>you <strong>no longer</strong> passively regenerate <strong class='color-f'>energy</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.iceEnergy || tech.isWormholeEnergy || tech.isPiezo || tech.isRailEnergyGain) && tech.energyRegen !== 0.004
            },
            requires: "piezoelectricity, Penrose, half-wave, or thermoelectric, but not time crystals",
            effect: () => {
                tech.energyRegen = 0;
                mech.fieldRegen = tech.energyRegen;
            },
            remove() {
                tech.energyRegen = 0.001;
                mech.fieldRegen = tech.energyRegen;
            }
        },
        {
            name: "mass-energy equivalence",
            description: "<strong class='color-f'>energy</strong> protects you instead of <strong>health</strong><br><strong class='color-harm'>harm</strong> <strong>reduction</strong> effects provide <strong>no</strong> benefit",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyLoss && !tech.isPiezo && !tech.isRewindAvoidDeath && !tech.isRewindGun && !tech.isSpeedHarm && mech.fieldUpgrades[mech.fieldMode].name !== "negative mass field"
            },
            requires: "not exothermic process, piezoelectricity, CPT, 1st law, negative mass",
            effect: () => {
                mech.health = 0
                // mech.displayHealth();
                document.getElementById("health").style.display = "none"
                document.getElementById("health-bg").style.display = "none"
                document.getElementById("dmg").style.backgroundColor = "#0cf";
                tech.isEnergyHealth = true;
                mech.displayHealth();
            },
            remove() {
                tech.isEnergyHealth = false;
                document.getElementById("health").style.display = "inline"
                document.getElementById("health-bg").style.display = "inline"
                document.getElementById("dmg").style.backgroundColor = "#f67";
                mech.health = Math.min(mech.maxHealth, mech.energy);
                mech.displayHealth();

            }
        },
        {
            name: "1st ionization energy",
            description: "each <strong class='color-h'>heal</strong> <strong>power up</strong> you collect<br>increases your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>4</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isEnergyHealth
            },
            requires: "mass-energy equivalence",
            effect() {
                tech.healGiveMaxEnergy = true; //tech.healMaxEnergyBonus given from heal power up
                powerUps.heal.color = "#0ae"
                for (let i = 0; i < powerUp.length; i++) { //find active heal power ups and adjust color live
                    if (powerUp[i].name === "heal") powerUp[i].color = powerUps.heal.color
                }
            },
            remove() {
                tech.healGiveMaxEnergy = false;
                tech.healMaxEnergyBonus = 0
                powerUps.heal.color = "#0eb"
                for (let i = 0; i < powerUp.length; i++) { //find active heal power ups and adjust color live
                    if (powerUp[i].name === "heal") powerUp[i].color = powerUps.heal.color
                }
            }
        },
        {
            name: "overcharge",
            description: "increase your <strong>maximum</strong> <strong class='color-f'>energy</strong> by <strong>50</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return mech.maxEnergy > 0.99
            },
            requires: "max energy >= 1",
            effect() {
                // mech.maxEnergy += 0.5
                // mech.energy += 0.5
                tech.bonusEnergy += 0.5
                mech.setMaxEnergy()
            },
            remove() {
                tech.bonusEnergy = 0;
                mech.setMaxEnergy()
            }
        },
        {
            name: "energy conservation",
            description: "<strong>6%</strong> of <strong class='color-d'>damage</strong> done recovered as <strong class='color-f'>energy</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.damageFromTech() > 1
            },
            requires: "some increased damage",
            effect() {
                tech.energySiphon += 0.06;
            },
            remove() {
                tech.energySiphon = 0;
            }
        },
        {
            name: "waste energy recovery",
            description: "if a mob has <strong>died</strong> in the last <strong>5 seconds</strong><br>regen <strong>5%</strong> of max <strong class='color-f'>energy</strong> every second",
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.maxEnergy > 0.99
            },
            requires: "max energy >= 1",
            effect() {
                tech.isEnergyRecovery = true;
            },
            remove() {
                tech.isEnergyRecovery = false;
            }
        },
        {
            name: "scrap recycling",
            description: "if a mob has <strong>died</strong> in the last <strong>5 seconds</strong><br>regain <strong>1%</strong> of max <strong class='color-h'>health</strong> every second",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isHealthRecovery = true;
            },
            remove() {
                tech.isHealthRecovery = false;
            }
        },
        {
            name: "entropy exchange",
            description: "<strong class='color-h'>heal</strong> for <strong>1%</strong> of <strong class='color-d'>damage</strong> done",
            maxCount: 9,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth && tech.damageFromTech() > 1
            },
            requires: "some increased damage, not mass-energy equivalence",
            effect() {
                tech.healthDrain += 0.01;
            },
            remove() {
                tech.healthDrain = 0;
            }
        },
        {
            name: "supersaturation",
            description: "increase your <strong>maximum</strong> <strong class='color-h'>health</strong> by <strong>50</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.bonusHealth += 0.5
                mech.addHealth(0.50)
                mech.setMaxHealth();
            },
            remove() {
                tech.bonusHealth = 0
                mech.setMaxHealth();

            }
        },{
            name: "hypersaturation",
            description: "when you pick up a <strong class='color-h'>heal</strong><strong> power up</strong> <br>you get 6% of your <strong class='color-h'>healing</strong> as <strong>maximum</strong> <strong class='color-h'>health</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth&&(tech.bonusHealth>=1&&!tech.isHealLowHealth)
            },
            requires: "not mass-energy equivalence, not negentropy, at least 200 hp",
            effect() {
                tech.healthToMax += 0.06
            },
            remove() {
                tech.healthToMax = 0
                mech.setMaxHealth();

            }
        },
        {
            name: "inductive coupling",
            description: "for each unused <strong>power up</strong> at the end of a <strong>level</strong><br>add 4 <strong>max</strong> <strong class='color-h'>health</strong> <em>(up to 44 health per level)</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.isArmorFromPowerUps = true; //tracked by  tech.armorFromPowerUps
            },
            remove() {
                tech.isArmorFromPowerUps = false;
                // tech.armorFromPowerUps = 0;  //this is now reset in tech.setupAllTech();
                mech.setMaxHealth();
            }
        },
        {
            name: "transceiver chip",
            description: "unused <strong>power ups</strong> at the end of each <strong>level</strong><br>are still activated <em>(selections are random)</em>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isArmorFromPowerUps
            },
            requires: "inductive coupling",
            effect() {
                tech.isEndLevelPowerUp = true;
            },
            remove() {
                tech.isEndLevelPowerUp = false;
            }
        },
        {
            name: "negentropy",
            description: `at the start of each <strong>level</strong><br>spawn a <strong class='color-h'>heal</strong> for every <strong>50</strong> missing health`,
            maxCount: 1,
            count: 0,
            allowed() {
                return (mech.maxHealth > 1 || tech.isArmorFromPowerUps) && !(tech.healthToMax > 0)
            },
            requires: "increased max health, not hypersaturation",
            effect() {
                tech.isHealLowHealth = true;
            },
            remove() {
                tech.isHealLowHealth = false;
            }
        },
        {
            name: "adiabatic healing",
            description: "<strong class='color-h'>heal</strong> <strong>power ups</strong> are <strong>100%</strong> more effective",
            maxCount: 3,
            count: 0,
            allowed() {
                return (mech.health < 0.7 || build.isCustomSelection) && !tech.isEnergyHealth
            },
            requires: "not mass-energy equivalence",
            effect() {
                tech.largerHeals++;
            },
            remove() {
                tech.largerHeals = 1;
            }
        },
        {
            name: "anthropic principle",
            nameInfo: "<span id = 'tech-anthropic'></span>",
            addNameInfo() {
                setTimeout(function() {
                    powerUps.reroll.changeRerolls(0)
                }, 1000);
            },
            description: "consume a <strong class='color-r'>reroll</strong> to avoid <strong>dying</strong> once a level <br>and spawn <strong>6</strong> <strong class='color-h'>heal</strong> power ups",
            maxCount: 1,
            count: 0,
            allowed() {
                return powerUps.reroll.rerolls > 0 || build.isCustomSelection
            },
            requires: "at least 1 reroll",
            effect() {
                tech.isDeathAvoid = true;
                tech.isDeathAvoidedThisLevel = false;
                setTimeout(function() {
                    powerUps.reroll.changeRerolls(0)
                }, 1000);
            },
            remove() {
                tech.isDeathAvoid = false;
            }
        },
        {
            name: "bubble fusion",
            description: "after destroying a mob's <strong>shield</strong><br>spawn <strong>1-2</strong> <strong class='color-h'>heals</strong>, <strong class='color-g'>ammo</strong>, or <strong class='color-r'>rerolls</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isShieldAmmo = true;
            },
            remove() {
                tech.isShieldAmmo = false;
            }
        },
        {
            name: "Bayesian statistics",
            description: "<strong>20%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong><br>after a <strong>collision</strong>, <strong>eject</strong> 1 <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            requires: "below 100% duplication chance",
            effect: () => {
                tech.isBayesian = true
                simulation.draw.powerUp = simulation.draw.powerUpBonus //change power up draw
            },
            remove() {
                tech.isBayesian = false
                if (tech.duplicationChance() === 0) simulation.draw.powerUp = simulation.draw.powerUpNormal
            }
        },
        {
            name: "stimulated emission",
            description: "<strong>6%</strong> chance to <strong class='color-dup'>duplicate</strong> spawned <strong>power ups</strong>",
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "below 100% duplication chance",
            effect() {
                tech.duplicateChance += 0.06
                simulation.draw.powerUp = simulation.draw.powerUpBonus //change power up draw
            },
            remove() {
                tech.duplicateChance = 0
                if (tech.duplicationChance() === 0) simulation.draw.powerUp = simulation.draw.powerUpNormal
            }
        },
        {
            name: "futures exchange",
            description: "clicking <strong style = 'font-size:150%;'>×</strong> to cancel a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>increases power up <strong class='color-dup'>duplication</strong> chance by <strong>4%</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            requires: "below 100% duplication chance, not determinism",
            effect() {
                tech.isCancelDuplication = true
                tech.cancelCount = 0
                simulation.draw.powerUp = simulation.draw.powerUpBonus //change power up draw
            },
            remove() {
                tech.isCancelDuplication = false
                tech.cancelCount = 0
                if (tech.duplicationChance() === 0) simulation.draw.powerUp = simulation.draw.powerUpNormal
            }
        },
        {
            name: "bots exchange",
            description: "clicking <strong style = 'font-size:150%;'>×</strong> to cancel a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>creates a random <b>bot</b>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.duplicationChance() < 1 && !tech.isDeterminism
            },
            requires: "below 100% duplication chance, not determinism",
            effect() {
                tech.isCancelBots = true
            },
            remove() {
                tech.isCancelBots = false
            }
        },
        {
            name: "commodities exchange",
            description: "clicking <strong style = 'font-size:150%;'>×</strong> to cancel a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>spawns <strong>6</strong> <strong class='color-h'>heals</strong>, <strong class='color-g'>ammo</strong>, or <strong class='color-r'>rerolls</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.duplicationChance() > 0 && !tech.isDeterminism
            },
            requires: "a chance to duplicate power ups, not determinism",
            effect() {
                tech.isCancelRerolls = true
            },
            remove() {
                tech.isCancelRerolls = false
            }
        },
        {
            name: "exchange symmetry",
            description: "convert <strong>1</strong> a random <strong class='color-m'>tech</strong> into <strong>3</strong> new <strong class='color-g'>guns</strong><br><em>recursive tech lose all stacks</em>",
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return (tech.totalCount > 3) && !tech.isSuperDeterminism
            },
            requires: "at least 1 tech, a chance to duplicate power ups",
            effect: () => {
                const have = [] //find which tech you have
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].count > 0) have.push(i)
                }
                const choose = have[Math.floor(Math.random() * have.length)]
                simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)
                for (let i = 0; i < tech.tech[choose].count; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
                }
                powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
                powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
                tech.tech[choose].count = 0;
                tech.tech[choose].remove(); // remove a random tech form the list of tech you have
                tech.tech[choose].isLost = true
                simulation.updateTechHUD();
            },
            remove() {}
        },
        {
            name: "monte carlo experiment",
            description: "spawn <strong>2</strong> <strong class='color-m'>tech</strong><br>remove <strong>1</strong> random <strong class='color-m'>tech</strong>",
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return (tech.totalCount > 3) && !tech.isSuperDeterminism && tech.duplicationChance() > 0
            },
            requires: "at least 1 tech, a chance to duplicate power ups",
            effect: () => {
                const have = [] //find which tech you have
                for (let i = 0; i < tech.tech.length; i++) {
                    if (tech.tech[i].count > 0) have.push(i)
                }
                const choose = have[Math.floor(Math.random() * have.length)]
                simulation.makeTextLog(`<span class='color-var'>tech</span>.remove("<span class='color-text'>${tech.tech[choose].name}</span>")`)
                for (let i = 0; i < tech.tech[choose].count; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
                }
                powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
                tech.tech[choose].count = 0;
                tech.tech[choose].remove(); // remove a random tech form the list of tech you have
                tech.tech[choose].isLost = true
                simulation.updateTechHUD();
            },
            remove() {}
        },
        {
            name: "strange attractor",
            description: `use <strong>2</strong> <strong class='color-r'>rerolls</strong> to spawn <strong>1</strong> <strong class='color-m'>tech</strong><br>with <strong>double</strong> your <strong class='color-dup'>duplication</strong> chance`,
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return !tech.isSuperDeterminism && tech.duplicationChance() > 0 && powerUps.reroll.rerolls > 1
            },
            requires: "at least 1 tech and 1 reroll, a chance to duplicate power ups",
            effect: () => {
                powerUps.reroll.changeRerolls(-2)
                simulation.makeTextLog(`<span class='color-var'>mech</span>.<span class='color-r'>rerolls</span> <span class='color-symbol'>-=</span> 2
                <br>${powerUps.reroll.rerolls}`)
                const chanceStore = tech.duplicateChance
                tech.duplicateChance = (tech.isBayesian ? 0.2 : 0) + tech.cancelCount * 0.04 + mech.duplicateChance + tech.duplicateChance * 2 //increase duplication chance to simulate doubling all 3 sources of duplication chance
                powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
                tech.duplicateChance = chanceStore
            },
            remove() {}
        },
        {
            name: "entanglement",
            nameInfo: "<span id = 'tech-entanglement'></span>",
            addNameInfo() {
                setTimeout(function() {
                    simulation.boldActiveGunHUD();
                }, 1000);
            },
            description: "while your <strong>first</strong> <strong class='color-g'>gun</strong> is equipped<br>reduce <strong class='color-harm'>harm</strong> by <strong>13%</strong> for each of your <strong class='color-g'>guns</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return b.inventory.length > 1 && !tech.isEnergyHealth
            },
            requires: "at least 2 guns",
            effect() {
                tech.isEntanglement = true
                setTimeout(function() {
                    simulation.boldActiveGunHUD();
                }, 1000);

            },
            remove() {
                tech.isEntanglement = false;
            }
        },
        {
            name: "arsenal",
            description: "increase <strong class='color-d'>damage</strong> by <strong>7%</strong><br>for each <strong class='color-g'>gun</strong> in your inventory",
            maxCount: 1,
            count: 0,
            allowed() {
                return b.inventory.length > 1
            },
            requires: "at least 2 guns",
            effect() {
                tech.isDamageForGuns = true;
            },
            remove() {
                tech.isDamageForGuns = false;
            }
        },
        {
            name: "generalist",
            description: "<strong>spawn</strong> 5 <strong class='color-g'>guns</strong>, but you can't <strong>switch</strong> <strong class='color-g'>guns</strong><br><strong class='color-g'>guns</strong> cycle automatically with each new level",
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            allowed() {
                return tech.isDamageForGuns
            },
            requires: "arsenal",
            effect() {
                tech.isGunCycle = true;
                for (let i = 0; i < 5; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
                }
            },
            remove() {
                tech.isGunCycle = false;
            }
        },
        {
            name: "logistics",
            description: "<strong class='color-g'>ammo</strong> power ups give <strong>200%</strong> <strong class='color-g'>ammo</strong><br>but <strong class='color-g'>ammo</strong> is only added to your <strong>current gun</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyNoAmmo
            },
            requires: "not exciton-lattice",
            effect() {
                tech.isAmmoForGun = true;
            },
            remove() {
                tech.isAmmoForGun = false;
            }
        },
        {
            name: "supply chain",
            description: "double your current <strong class='color-g'>ammo</strong> for all <strong class='color-g'>guns</strong>",
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            allowed() {
                return tech.isAmmoForGun
            },
            requires: "logistics",
            effect() {
                for (let i = 0; i < b.guns.length; i++) {
                    if (b.guns[i].have) b.guns[i].ammo = Math.floor(2 * b.guns[i].ammo)
                }
                simulation.makeGunHUD();
            },
            remove() {}
        },
        {
            name: "catabolism",
            description: "when you <strong>fire</strong> while <strong>out</strong> of <strong class='color-g'>ammo</strong><br>gain <strong>3</strong> <strong class='color-g'>ammo</strong>, but lose <strong>5</strong> <strong>health</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isEnergyHealth && !tech.isEnergyNoAmmo
            },
            requires: "not mass-energy equivalence<br>not exciton-lattice",
            effect: () => {
                tech.isAmmoFromHealth = true;
            },
            remove() {
                tech.isAmmoFromHealth = false;
            }
        },
        {
            name: "desublimated ammunition",
            description: "use <strong>50%</strong> less <strong class='color-g'>ammo</strong> when <strong>crouching</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                tech.isCrouchAmmo = true
            },
            remove() {
                tech.isCrouchAmmo = false;
            }
        },
        {
            name: "gun turret",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>50%</strong> when <strong>crouching</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isCrouchAmmo && !tech.isEnergyHealth
            },
            requires: "desublimated ammunition<br>not mass-energy equivalence",
            effect() {
                tech.isTurret = true
            },
            remove() {
                tech.isTurret = false;
            }
        },
        {
            name: "cardinality",
            description: "<strong class='color-m'>tech</strong>, <strong class='color-f'>fields</strong>, and <strong class='color-g'>guns</strong> have <strong>5</strong> <strong>choices</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isDeterminism
            },
            requires: "not determinism",
            effect: () => {
                tech.isExtraChoice = true;
            },
            remove() {
                tech.isExtraChoice = false;
            }
        },
		{
            name: "cardinality extended",
            description: "<strong class='color-m'>tech</strong>, <strong class='color-f'>fields</strong>, and <strong class='color-g'>guns</strong> have <strong>+1</strong> <strong>choice</strong><br><em>does not care about unpicked because i simply do not want to fix that</em>",
            maxCount: 9,
            count: 0,
            allowed() {
                return (!tech.isDeterminism) && tech.isExtraChoice
            },
            requires: "not determinism",
            effect: () => {
                tech.isExtraChoices += 1;
            },
            remove() {
                tech.isExtraChoices = 0;
            }
        },
        {
            name: "determinism",
            description: "spawn <strong>5</strong> <strong class='color-m'>tech</strong><br><strong class='color-m'>tech</strong>, <strong class='color-f'>fields</strong>, and <strong class='color-g'>guns</strong> have only <strong>1 choice</strong>",
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            allowed() {
                return !tech.isExtraChoice && !tech.isCancelDuplication && !tech.isCancelRerolls
            },
            requires: "not cardinality, not futures or commodities exchanges",
            effect: () => {
                tech.isDeterminism = true;
                for (let i = 0; i < 5; i++) { //if you change the six also change it in Born rule
                    powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
                }
            },
            remove() {
                tech.isDeterminism = false;
            }
        },
        {
            name: "superdeterminism",
            description: "spawn <strong>7</strong> <strong class='color-m'>tech</strong><br><strong class='color-r'>rerolls</strong>, <strong class='color-g'>guns</strong>, and <strong class='color-f'>fields</strong> no longer <strong>spawn</strong>",
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            allowed() {
                return tech.isDeterminism && !tech.manyWorlds
            },
            requires: "determinism",
            effect: () => {
                tech.isSuperDeterminism = true;
                for (let i = 0; i < 7; i++) { //if you change the six also change it in Born rule
                    powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
                }
            },
            remove() {
                tech.isSuperDeterminism = false;
            }
        },
        {
            name: "many-worlds",
            description: "after choosing a <strong class='color-f'>field</strong>, <strong class='color-m'>tech</strong>, or <strong class='color-g'>gun</strong><br>if you have no <strong class='color-r'>rerolls</strong> spawn <strong>2</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return powerUps.reroll.rerolls === 0 && !tech.isSuperDeterminism && !tech.isRerollHaste
            },
            requires: "not superdeterminism or Ψ(t) collapse<br>no rerolls",
            effect: () => {
                tech.manyWorlds = true;
            },
            remove() {
                tech.manyWorlds = false;
            }
        },
        {
            name: "renormalization",
            description: "consuming a <strong class='color-r'>reroll</strong> for <strong>any</strong> purpose<br>has a <strong>37%</strong> chance to spawn a <strong class='color-r'>reroll</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return (powerUps.reroll.rerolls > 1 || build.isCustomSelection) && !tech.isSuperDeterminism && !tech.isRerollHaste
            },
            requires: "not superdeterminism or Ψ(t) collapse<br>at least 2 rerolls",
            effect() {
                tech.renormalization = true;
            },
            remove() {
                tech.renormalization = false;
            }
        },
        {
            name: "quantum immortality",
            description: "after <strong>dying</strong>, continue in an <strong>alternate reality</strong><br>spawn <strong>4</strong> <strong class='color-r'>rerolls</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return powerUps.reroll.rerolls > 1 || build.isCustomSelection
            },
            requires: "at least 2 rerolls",
            effect() {
                tech.isImmortal = true;
                for (let i = 0; i < 4; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "reroll", false);
                }
            },
            remove() {
                tech.isImmortal = false;
            }
        },
        {
            name: "Born rule",
            description: "<strong>remove</strong> all current <strong class='color-m'>tech</strong><br>spawn new <strong class='color-m'>tech</strong> to replace them",
            maxCount: 1,
            count: 0,
            // isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return (tech.totalCount > 6)
            },
            requires: "more than 6 tech",
            effect: () => {
                //remove active bullets  //to get rid of bots
                for (let i = 0; i < bullet.length; ++i) Matter.World.remove(engine.world, bullet[i]);
                bullet = [];
                let count = 0 //count tech
                for (let i = 0, len = tech.tech.length; i < len; i++) { // spawn new tech power ups
                    if (!tech.tech[i].isNonRefundable) count += tech.tech[i].count
                }
                if (tech.isDeterminism) count -= 3 //remove the bonus tech 
                if (tech.isSuperDeterminism) count -= 2 //remove the bonus tech 

                tech.setupAllTech(); // remove all tech
                for (let i = 0; i < count; i++) { // spawn new tech power ups
                    powerUps.spawn(mech.pos.x, mech.pos.y, "tech");
                }
                //have state is checked in mech.death()
            },
            remove() {}
        },
        {
            name: "perpetual rerolls",
            description: "find <strong>1</strong> <strong class='color-r'>reroll</strong> at the start of each <strong>level</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isSuperDeterminism && !tech.isPerpetualHeal && !tech.isPerpetualAmmo && !tech.isPerpetualStun
            },
            requires: "only 1 perpetual effect, not superdeterminism",
            effect() {
                tech.isPerpetualReroll = true
            },
            remove() {
                tech.isPerpetualReroll = false
            }
        },
        {
            name: "perpetual heals",
            description: "find <strong>2</strong> <strong class='color-h'>heals</strong> at the start of each <strong>level</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isPerpetualReroll && !tech.isPerpetualAmmo && !tech.isPerpetualStun
            },
            requires: "only 1 perpetual effect",
            effect() {
                tech.isPerpetualHeal = true
            },
            remove() {
                tech.isPerpetualHeal = false
            }
        },
        {
            name: "perpetual ammo",
            description: "find <strong>2</strong> <strong class='color-g'>ammo</strong> at the start of each <strong>level</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isPerpetualReroll && !tech.isPerpetualHeal && !tech.isPerpetualReroll && !tech.isPerpetualStun && !tech.isEnergyNoAmmo
            },
            requires: "only 1 perpetual effect, not exciton lattice",
            effect() {
                tech.isPerpetualAmmo = true
            },
            remove() {
                tech.isPerpetualAmmo = false
            }
        },
        {
            name: "perpetual stun",
            description: "<strong>stun</strong> all mobs for up to <strong>8</strong> seconds<br>at the start of each <strong>level</strong>",
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isPerpetualReroll && !tech.isPerpetualHeal && !tech.isPerpetualAmmo
            },
            requires: "only 1 perpetual effect",
            effect() {
                tech.isPerpetualStun = true
            },
            remove() {
                tech.isPerpetualStun = false
            }
        },
        //************************************************** 
        //************************************************** gun
        //************************************************** tech
        //**************************************************
        {
            name: "CPT gun",
            description: "adds the <strong>CPT</strong> <strong class='color-g'>gun</strong> to your inventory<br>it <strong>rewinds</strong> your <strong class='color-h'>health</strong>, <strong>velocity</strong>, and <strong>position</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.totalBots() > 5 || mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" || mech.fieldUpgrades[mech.fieldMode].name === "plasma torch" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave") && !tech.isEnergyHealth && !tech.isRewindAvoidDeath //build.isCustomSelection ||
            },
            requires: "bots > 5, plasma torch, nano-scale, pilot wave, not mass-energy equivalence, CPT",
            effect() {
                tech.isRewindGun = true
                b.guns.push(b.gunRewind)
                b.giveGuns("CPT gun");
            },
            remove() {
                if (tech.isRewindGun) {
                    b.removeGun("CPT gun", true)
                    // for (let i = 0; i < b.guns.length; i++) {
                    //     if (b.guns[i].name === "CPT gun") {
                    //         b.guns[i].have = false
                    //         for (let j = 0; j < b.inventory.length; j++) {
                    //             if (b.inventory[j] === i) {
                    //                 b.inventory.splice(j, 1)
                    //                 break
                    //             }
                    //         }
                    //         if (b.inventory.length) {
                    //             b.activeGun = b.inventory[0];
                    //         } else {
                    //             b.activeGun = null;
                    //         }
                    //         simulation.makeGunHUD();

                    //         b.guns.splice(i, 1) //also remove CPT gun from gun pool array
                    //         break
                    //     }
                    // }
                    tech.isRewindGun = false
                }
            }
        },
        {
            name: "incendiary ammunition",
            description: "some <strong>bullets</strong> are loaded with <strong class='color-e'>explosives</strong><br><em style = 'font-size: 90%'>nail gun, shotgun, super balls, drones</em>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return ((mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isSporeField || tech.isMissileField || tech.isIceField)) || tech.haveGunCheck("drones") || tech.haveGunCheck("super balls") || tech.haveGunCheck("nail gun") || tech.haveGunCheck("shotgun")) && !tech.isIceCrystals && !tech.isNailCrit && !tech.isNailShot && !tech.isNailPoison
            },
            requires: "drones, super balls, nail gun, shotgun",
            effect() {
                tech.isIncendiary = true
            },
            remove() {
                tech.isIncendiary = false;
            }
        },
        {
            name: "fragmentation",
            description: "some <strong class='color-e'>detonations</strong> and collisions eject <strong>nails</strong><br><em style = 'font-size: 90%'>blocks, rail gun, grenades, missiles, shotgun slugs</em>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("grenades") && !tech.isNeutronBomb) || tech.haveGunCheck("missiles") || tech.haveGunCheck("rail gun") || (tech.haveGunCheck("shotgun") && tech.isSlugShot) || tech.throwChargeRate > 1
            },
            requires: "grenades, missiles, rail gun, shotgun slugs, or mass driver",
            effect() {
                tech.fragments++
            },
            remove() {
                tech.fragments = 0
            }
        },
        {
            name: "Lorentzian topology",
            description: "some <strong>bullets</strong> last <strong>30% longer</strong><br><em style = 'font-size: 83%'>drones, spores, missiles, foam, wave, ice IX, neutron</em>",
            isGunTech: true,
            maxCount: 3,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" || tech.haveGunCheck("spores") || tech.haveGunCheck("drones") || tech.haveGunCheck("missiles") || tech.haveGunCheck("foam") || tech.haveGunCheck("wave beam") || tech.haveGunCheck("ice IX") || tech.isNeutronBomb
            },
            requires: "drones, spores, missiles, foam<br>wave beam, ice IX, neutron bomb",
            effect() {
                tech.isBulletsLastLonger += 0.3
            },
            remove() {
                tech.isBulletsLastLonger = 1;
            }
        },
        {
            name: "microstates",
            description: "increase <strong class='color-d'>damage</strong> by <strong>4%</strong><br>for every <strong>10</strong> active <strong>bullets</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isBulletsLastLonger > 1
            },
            requires: "Lorentzian topology",
            effect() {
                tech.isDamageFromBulletCount = true
            },
            remove() {
                tech.isDamageFromBulletCount = false
            }
        },
        {
            name: "ice crystal nucleation",
            description: "the <strong>nail gun</strong> uses <strong class='color-f'>energy</strong> to condense<br>unlimited <strong class='color-s'>freezing</strong> <strong>ice shards</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("nail gun") && !tech.nailInstantFireRate && !tech.isIncendiary
            },
            requires: "nail gun, not incendiary, not powder-actuated",
            effect() {
                tech.isIceCrystals = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "nail gun") {
                        b.guns[i].ammoPack = Infinity
                        b.guns[i].recordedAmmo = b.guns[i].ammo
                        b.guns[i].ammo = Infinity
                        simulation.updateGunHUD();
                        break;
                    }
                }
            },
            remove() {
                if (tech.isIceCrystals) {
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "nail gun") {
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
                            if (b.guns[i].recordedAmmo) b.guns[i].ammo = b.guns[i].recordedAmmo
                            simulation.updateGunHUD();
                            break;
                        }
                    }
                }
                tech.isIceCrystals = false;
            }
        },
        {
            name: "critical bifurcation",
            description: "<strong>nails</strong> do <strong>400%</strong> more <strong class='color-d'>damage</strong><br>when they strike near the <strong>center</strong> of a mob",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("nail gun") && !tech.isIncendiary
            },
            requires: "nail gun, not incendiary",
            effect() {
                tech.isNailCrit = true
            },
            remove() {
                tech.isNailCrit = false
            }
        },
        {
            name: "pneumatic actuator",
            description: "<strong>nail gun</strong> takes <strong>45%</strong> less time to ramp up<br>to it's shortest <strong><em>delay</em></strong> after firing",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("nail gun")
            },
            requires: "nail gun",
            effect() {
                tech.nailFireRate = true
            },
            remove() {
                tech.nailFireRate = false
            }
        },
        {
            name: "powder-actuated",
            description: "<strong>nail gun</strong> takes <strong>no</strong> time to ramp up<br>nails have a <strong>30%</strong> faster muzzle <strong>speed</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("nail gun") && tech.nailFireRate && !tech.isIceCrystals
            },
            requires: "nail gun and pneumatic actuator",
            effect() {
                tech.nailInstantFireRate = true
            },
            remove() {
                tech.nailInstantFireRate = false
            }
        },
        {
            name: "shotgun spin-statistics",
            description: "<strong>immune</strong> to <strong class='color-harm'>harm</strong> while firing the <strong>shotgun</strong><br><strong class='color-g'>ammo</strong> costs are <strong>doubled</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("shotgun")
            },
            requires: "shotgun",
            effect() {
                tech.isShotgunImmune = true;

                //cut current ammo by 1/2
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "shotgun") {
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 0.5);
                        break;
                    }
                }
                simulation.updateGunHUD();

                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "shotgun") {
                        b.guns[i].ammoPack = b.guns[i].defaultAmmoPack * 0.5
                        break;
                    }
                }
            },
            remove() {
                tech.isShotgunImmune = false;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "shotgun") {
                        b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
                        break;
                    }
                }
            }
        },
        {
            name: "nailshot",
            description: "the <strong>shotgun</strong> fires a burst of <strong>nails</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("shotgun") && !tech.isIncendiary && !tech.isSlugShot
            },
            requires: "shotgun",
            effect() {
                tech.isNailShot = true;
            },
            remove() {
                tech.isNailShot = false;
            }
        },
        {
            name: "shotgun slug",
            description: "the <strong>shotgun</strong> fires 1 large <strong>bullet</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("shotgun") && !tech.isNailShot
            },
            requires: "shotgun",
            effect() {
                tech.isSlugShot = true;
            },
            remove() {
                tech.isSlugShot = false;
            }
        },
        {
            name: "Newton's 3rd law",
            description: "the <strong>shotgun</strong> fire <strong><em>delay</em></strong> is <strong>66%</strong> faster<br><strong>recoil</strong> is greatly increased",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("shotgun")
            },
            requires: "shotgun",
            effect() {
                tech.isShotgunRecoil = true;
            },
            remove() {
                tech.isShotgunRecoil = false;
            }
        },
        {
            name: "super duper",
            description: "fire <strong>1</strong> additional <strong>super ball</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.haveGunCheck("super balls") && !tech.oneSuperBall
            },
            requires: "super balls, but not the tech super ball",
            effect() {
                tech.superBallNumber++
            },
            remove() {
                tech.superBallNumber = 4;
            }
        },
        {
            name: "super ball",
            description: "fire just <strong>1 large</strong> super <strong>ball</strong><br>that <strong>stuns</strong> mobs for <strong>3</strong> second",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("super balls") && tech.superBallNumber === 4
            },
            requires: "super balls, but not super duper",
            effect() {
                tech.oneSuperBall = true;
            },
            remove() {
                tech.oneSuperBall = false;
            }
        },
        {
            name: "super sized",
            description: `your <strong>super balls</strong> are <strong>20%</strong> larger<br>increases mass and physical <strong class='color-d'>damage</strong>`,
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.haveGunCheck("super balls")
            },
            requires: "super balls",
            effect() {
                tech.bulletSize += 0.15
            },
            remove() {
                tech.bulletSize = 1;
            }
        },
        {
            name: "anti-gravity",
            description: "super balls aren't affected by gravity",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("super balls")
            },
            requires: "super balls",
            effect() {
                tech.antiGrav=false
            },
            remove() {
                tech.antiGrav = true;
            }
        },
        {
            name: "flechettes cartridges",
            description: "<strong>flechettes</strong> release <strong>three</strong> needles in each shot<br><strong class='color-g'>ammo</strong> costs are <strong>tripled</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("flechettes")
            },
            requires: "flechettes",
            effect() {
                tech.isFlechetteMultiShot = true;
                //cut current ammo by 1/3
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "flechettes") {
                        b.guns[i].ammo = Math.ceil(b.guns[i].ammo / 3);
                        break
                    }
                }
                //cut ammo packs by 1/3
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun
                    if (b.guns[i].name === "flechettes") {
                        b.guns[i].ammoPack = Math.ceil(b.guns[i].defaultAmmoPack / 3);
                        break
                    }
                }
                simulation.updateGunHUD();
            },
            remove() {
                if (tech.isFlechetteMultiShot) {
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "flechettes") {
                            b.guns[i].ammo = Math.ceil(b.guns[i].ammo * 3);
                            break
                        }
                    }
                    for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                        if (b.guns[i].name === "flechettes") {
                            b.guns[i].ammoPack = b.guns[i].defaultAmmoPack;
                            break
                        }
                        simulation.updateGunHUD();
                    }
                }
                tech.isFlechetteMultiShot = false;
            }
        },
        {
            name: "6s half-life",
            description: "<strong>flechette</strong> needles made of <strong class='color-p'>plutonium-238</strong><br>increase <strong class='color-d'>damage</strong> by <strong>100%</strong> over <strong>6</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("flechettes") && !tech.isFastDot
            },
            requires: "flechettes",
            effect() {
                tech.isSlowDot = true;
            },
            remove() {
                tech.isSlowDot = false;
            }
        },
        {
            name: "1/2s half-life",
            description: "<strong>flechette</strong> needles made of <strong class='color-p'>lithium-8</strong><br>flechette <strong class='color-d'>damage</strong> occurs after <strong>1/2</strong> a second",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("flechettes") && !tech.isSlowDot
            },
            requires: "flechettes",
            effect() {
                tech.isFastDot = true;
            },
            remove() {
                tech.isFastDot = false;
            }
        },
        {
            name: "supercritical fission",
            description: "<strong>flechettes</strong> can <strong class='color-e'>explode</strong><br>if they strike mobs near their <strong>center</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("flechettes") && !tech.pierce
            },
            requires: "flechettes and not piercing needles",
            effect() {
                tech.isFlechetteExplode = true
            },
            remove() {
                tech.isFlechetteExplode = false
            }
        },
        {
            name: "radioactive contamination",
            description: "after a mob or shield <strong>dies</strong>,<br> leftover <strong class='color-p'>radiation</strong> <strong>spreads</strong> to a nearby mob",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("flechettes") || tech.isNailPoison || tech.isHeavyWater || tech.isWormholeDamage || tech.isNeutronBomb
            },
            requires: "radiation damage source",
            effect() {
                tech.isRadioactive = true
            },
            remove() {
                tech.isRadioactive = false
            }
        },
        {
            name: "piercing needles",
            description: "<strong>needles</strong> penetrate <strong>mobs</strong> and <strong>blocks</strong><br>potentially hitting <strong>multiple</strong> targets",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("flechettes") && !tech.isFlechetteExplode
            },
            requires: "flechettes and not supercritical fission",
            effect() {
                tech.pierce = true;
            },
            remove() {
                tech.pierce = false;
            }
        },
        {
            name: "wave packet",
            description: "<strong>wave beam</strong> emits <strong>two</strong> oscillating particles<br>decrease wave <strong class='color-d'>damage</strong> by <strong>20%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("wave beam") && !tech.isExtruder
            },
            requires: "wave beam",
            effect() {
                tech.waveHelix = 2
            },
            remove() {
                tech.waveHelix = 1
            }
        },
        {
            name: "phase velocity",
            description: "the <strong>wave beam</strong> propagates faster in solids",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("wave beam") && !tech.isWaveReflect && !tech.isExtruder
            },
            requires: "wave beam",
            effect() {
                tech.waveSpeedMap = 3 //needs to be 3 to stop bound state require check
                tech.waveSpeedBody = 1.9
            },
            remove() {
                tech.waveSpeedMap = 0.08
                tech.waveSpeedBody = 0.25
            }
        },
        {
            name: "bound state",
            description: "<strong>wave beam</strong> bullets last <strong>5x</strong> longer<br>bullets are <strong>bound</strong> to a <strong>region</strong> around player",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("wave beam") && tech.waveSpeedMap !== 3 && !tech.isExtruder
            },
            requires: "wave beam",
            effect() {
                tech.isWaveReflect = true
            },
            remove() {
                tech.isWaveReflect = false
            }
        },
        {
            name: "recursion",
            description: "after <strong>missiles</strong> <strong class='color-e'>explode</strong> they have a<br><strong>20%</strong> chance to launch a larger <strong>missile</strong>",
            isGunTech: true,
            maxCount: 6,
            count: 0,
            allowed() {
                return tech.haveGunCheck("missiles") || tech.isMissileField
            },
            requires: "missiles",
            effect() {
                tech.recursiveMissiles++
            },
            remove() {
                tech.recursiveMissiles = 0;
            }
        },
        {
            name: "MIRV",
            description: "launch <strong>3</strong> small <strong>missiles</strong> instead of <strong>1</strong> <br><strong>1.5x</strong> increase in <strong><em>delay</em></strong> after firing",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("missiles")
            },
            requires: "missiles",
            effect() {
                tech.is3Missiles = true;
            },
            remove() {
                tech.is3Missiles = false;
            }
        },
        {
            name: "rocket-propelled grenade",
            description: "<strong>grenades</strong> rapidly <strong>accelerate</strong> forward<br>map <strong>collisions</strong> trigger an <strong class='color-e'>explosion</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("grenades")
            },
            requires: "grenades",
            effect() {
                tech.isRPG = true;
                b.setGrenadeMode()
            },
            remove() {
                tech.isRPG = false;
                b.setGrenadeMode()
            }
        },
        {
            name: "vacuum bomb",
            description: "<strong>grenades</strong> fire slower, <strong class='color-e'>explode</strong> bigger<br> and, <strong>suck</strong> everything towards them",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("grenades") && !tech.isNeutronBomb
            },
            requires: "grenades, not neutron bomb",
            effect() {
                tech.isVacuumBomb = true;
                b.setGrenadeMode()
            },
            remove() {
                tech.isVacuumBomb = false;
                b.setGrenadeMode()
            }
        },
        {
            name: "neutron bomb",
            description: "<strong>grenades</strong> are irradiated with <strong class='color-p'>Cf-252</strong><br>does <strong class='color-d'>damage</strong>, <strong class='color-harm'>harm</strong>, and drains <strong class='color-f'>energy</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("grenades") && !tech.fragments && !tech.isVacuumBomb
            },
            requires: "grenades, not fragmentation",
            effect() {
                tech.isNeutronBomb = true;
                b.setGrenadeMode()
            },
            remove() {
                tech.isNeutronBomb = false;
                b.setGrenadeMode()
            }
        },
        {
            name: "water shielding",
            description: "increase <strong>neutron bomb's</strong> range by <strong>20%</strong><br>player is <strong>immune</strong> to its harmful effects",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isNeutronBomb
            },
            requires: "neutron bomb",
            effect() {
                tech.isNeutronImmune = true
            },
            remove() {
                tech.isNeutronImmune = false
            }
        },
        {
            name: "vacuum permittivity",
            description: "increase <strong>neutron bomb's</strong> range by <strong>20%</strong><br>objects in range of the bomb are <strong>slowed</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isNeutronBomb
            },
            requires: "neutron bomb",
            effect() {
                tech.isNeutronSlow = true
            },
            remove() {
                tech.isNeutronSlow = false
            }
        },
        {
            name: "mine reclamation",
            description: "retrieve <strong class='color-g'>ammo</strong> from all undetonated <strong>mines</strong><br>and <strong>20%</strong> of <strong>mines</strong> after detonation",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("mine") && !tech.isMineSentry
            },
            requires: "mine, not sentry",
            effect() {
                tech.isMineAmmoBack = true;
            },
            remove() {
                tech.isMineAmmoBack = false;
            }
        },
        {
            name: "sentry",
            description: "<strong>mines</strong> <strong>target</strong> mobs with nails over time<br>mines last about <strong>12</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("mine") && !tech.isMineAmmoBack) || tech.isMineDrop
            },
            requires: "mine, not mine reclamation",
            effect() {
                tech.isMineSentry = true;
            },
            remove() {
                tech.isMineSentry = false;
            }
        },
        {
            name: "recursive shattering",
            description: "when shattershot nails hit mobs they make two copies of themselves with one more iteration",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("shattershot"))
            },
            requires: "shattershot",
            effect() {
                tech.impactRecurse = true;
            },
            remove() {
                tech.impactRecurse = false;
            }
        },
        {
            name: "recursive improvement",
            description: "shattershot nails recurse 1 more time",
            isGunTech: true,
            maxCount: 4,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("shattershot"))
            },
            requires: "shattershot",
            effect() {
                tech.recurseImprove += 1;
            },
            remove() {
                tech.recurseImprove = 0;
            }
        },
        {
            name: "irradiated nails",
            description: "<strong>nails</strong> are made with a <strong class='color-p'>cobalt-60</strong> alloy<br><strong>85%</strong> <strong class='color-p'>radioactive</strong> <strong class='color-d'>damage</strong> over <strong>2</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isMineDrop + tech.nailBotCount + tech.fragments + tech.nailsDeathMob / 2 + (tech.haveGunCheck("mine") + tech.isNailShot + (tech.haveGunCheck("nail gun") && !tech.isIncendiary)) * 2 > 1
            },
            requires: "nails",
            effect() {
                tech.isNailPoison = true;
            },
            remove() {
                tech.isNailPoison = false;
            }
        },
        {
            name: "railroad ties",
            description: "<strong>nails</strong> are <strong>40%</strong> <strong>larger</strong><br>increases physical <strong class='color-d'>damage</strong> by about <strong>20%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isMineDrop + tech.nailBotCount + tech.fragments + tech.nailsDeathMob / 2 + (tech.haveGunCheck("mine") + tech.isNailShot + (tech.haveGunCheck("nail gun") && !tech.isIncendiary)) * 2 > 1
            },
            requires: "nails",
            effect() {
                tech.biggerNails += 0.33
            },
            remove() {
                tech.biggerNails = 1
            }
        },
        {
            name: "mycelial fragmentation",
            description: "<strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> release an extra <strong class='color-p' style='letter-spacing: 2px;'>spore</strong><br> once a <strong>second</strong> during their <strong>growth</strong> phase",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("spores")
            },
            requires: "spores",
            effect() {
                tech.isSporeGrowth = true
            },
            remove() {
                tech.isSporeGrowth = false
            }
        },
        {
            name: "tinsellated flagella",
            description: "<strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> release <strong>2</strong> more <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> accelerate <strong>50% faster</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField
            },
            requires: "spores",
            effect() {
                tech.isFastSpores = true
            },
            remove() {
                tech.isFastSpores = false
            }
        },
        {
            name: "cryodesiccation",
            description: "<strong class='color-p' style='letter-spacing: 2px;'>sporangium</strong> release <strong>2</strong> more <strong class='color-p' style='letter-spacing: 2px;'>spores</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> <strong class='color-s'>freeze</strong> mobs for <strong>1</strong> second",
            // <br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> do <strong>1/3</strong> <strong class='color-d'>damage</strong>
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField
            },
            requires: "spores",
            effect() {
                tech.isSporeFreeze = true
            },
            remove() {
                tech.isSporeFreeze = false
            }
        },
        {
            name: "diplochory",
            description: "<strong class='color-p' style='letter-spacing: 2px;'>spores</strong> use the player for <strong>dispersal</strong><br>until they <strong>locate</strong> a viable host",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField
            },
            requires: "spores",
            effect() {
                tech.isSporeFollow = true
            },
            remove() {
                tech.isSporeFollow = false
            }
        },
        {
            name: "mutualism",
            description: "increase <strong class='color-p' style='letter-spacing: 2px;'>spore</strong> <strong class='color-d'>damage</strong> by <strong>100%</strong><br><strong class='color-p' style='letter-spacing: 2px;'>spores</strong> borrow <strong>0.5</strong> <strong>health</strong> until they <strong>die</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("spores") || tech.sporesOnDeath > 0 || tech.isSporeField) && !tech.isEnergyHealth
            },
            requires: "spores",
            effect() {
                tech.isMutualism = true
            },
            remove() {
                tech.isMutualism = false
            }
        },
        {
            name: "brushless motor",
            description: "<strong>drones</strong> accelerate <strong>50%</strong> faster",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("drones") || (mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isSporeField || tech.isMissileField || tech.isIceField))
            },
            requires: "drones",
            effect() {
                tech.isFastDrones = true
            },
            remove() {
                tech.isFastDrones = false
            }
        },
        {
            name: "harvester",
            description: "after a <strong>drone</strong> picks up a <strong>power up</strong>,<br>it's <strong>larger</strong>, <strong>faster</strong>, and very <strong>durable</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return !tech.isArmorFromPowerUps && (tech.haveGunCheck("drones") || (mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isSporeField || tech.isMissileField || tech.isIceField)))
            },
            requires: "drones",
            effect() {
                tech.isDroneGrab = true
            },
            remove() {
                tech.isDroneGrab = false
            }
        },
        {
            name: "superfluidity",
            description: "<strong class='color-s'>freeze</strong> effects apply to mobs near it's target",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("ice IX") || tech.isIceCrystals || tech.isSporeFreeze || tech.isIceField
            },
            requires: "a freeze effect",
            effect() {
                tech.isAoESlow = true
            },
            remove() {
                tech.isAoESlow = false
            }
        },
        {
            name: "heavy water",
            description: "<strong>ice IX</strong> is synthesized with an extra neutron<br>does <strong class='color-p'>radioactive</strong> <strong class='color-d'>damage</strong> over <strong>5</strong> seconds",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("ice IX") || tech.isIceField) && !tech.iceEnergy
            },
            requires: "ice IX",
            effect() {
                tech.isHeavyWater = true
            },
            remove() {
                tech.isHeavyWater = false;
            }
        },
        {
            name: "thermoelectric effect",
            description: "<strong>killing</strong> mobs with <strong>ice IX</strong> gives <strong>4</strong> <strong class='color-h'>health</strong><br>and <strong>100</strong> <strong class='color-f'>energy</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return (tech.haveGunCheck("ice IX") || tech.isIceField) && !tech.isHeavyWater
            },
            requires: "ice IX",
            effect() {
                tech.iceEnergy++
            },
            remove() {
                tech.iceEnergy = 0;
            }
        },
        {
            name: "necrophoresis",
            description: "<strong>foam</strong> bullets grow and split into 3 <strong>copies</strong><br> when the mob they are stuck to <strong>dies</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("foam") || tech.foamBotCount > 1
            },
            requires: "foam",
            effect() {
                tech.isFoamGrowOnDeath = true
            },
            remove() {
                tech.isFoamGrowOnDeath = false;
            }
        },
        {
            name: "colloidal foam",
            description: "increase <strong>foam</strong> <strong class='color-d'>damage</strong> by <strong>366%</strong><br><strong>foam</strong> dissipates <strong>40%</strong> faster",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("foam") || tech.foamBotCount > 2
            },
            requires: "foam",
            effect() {
                tech.isFastFoam = true
            },
            remove() {
                tech.isFastFoam = false;
            }
        },
        // {
        //     name: "foam size",
        //     description: "increase <strong>foam</strong> <strong class='color-d'>damage</strong> by <strong>200%</strong><br><strong>foam</strong> dissipates <strong>50%</strong> faster",
        //     maxCount: 1,
        //     count: 0,
        //     allowed() {
        //         return tech.haveGunCheck("foam") || tech.foamBotCount > 2
        //     },
        //     requires: "foam",
        //     effect() {
        //         tech.isLargeFoam = true
        //     },
        //     remove() {
        //         tech.isLargeFoam = false;
        //     }
        // },
        // {
        //     name: "frame-dragging",
        //     description: "<strong>slow time</strong> while charging the <strong>rail gun</strong><br>charging no longer drains <strong class='color-f'>energy</strong>",
        //     maxCount: 1,
        //     count: 0,
        //     allowed() {
        //         return simulation.fpsCapDefault > 45 && tech.haveGunCheck("rail gun") && !tech.isSlowFPS && !tech.isCapacitor
        //     },
        //     requires: "rail gun and FPS above 45",
        //     effect() {
        //         tech.isRailTimeSlow = true;
        //     },
        //     remove() {
        //         tech.isRailTimeSlow = false;
        //         simulation.fpsCap = simulation.fpsCapDefault
        //         simulation.fpsInterval = 1000 / simulation.fpsCap;
        //     }
        // },
        {
            name: "half-wave rectifier",
            description: "charging the <strong>rail gun</strong> gives you <strong class='color-f'>energy</strong><br><em>instead of draining it</em>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("rail gun")
            },
            requires: "rail gun",
            effect() {
                tech.isRailEnergyGain = true;
            },
            remove() {
                tech.isRailEnergyGain = false;
            }
        },
        {
            name: "dielectric polarization",
            description: "firing the <strong>rail gun</strong> <strong class='color-d'>damages</strong> nearby <strong>mobs</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("rail gun")
            },
            requires: "rail gun",
            effect() {
                tech.isRailAreaDamage = true;
            },
            remove() {
                tech.isRailAreaDamage = false;
            }
        },
        {
            name: "capacitor bank",
            description: "the <strong>rail gun</strong> no longer takes time to <strong>charge</strong><br><strong>rail gun</strong> rods are <strong>66%</strong> less massive",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("rail gun")
            },
            requires: "rail gun",
            effect() {
                tech.isCapacitor = true;
            },
            remove() {
                tech.isCapacitor = false;
            }
        },
        {
            name: "laser diodes",
            description: "<strong>lasers</strong> drain <strong>37%</strong> less <strong class='color-f'>energy</strong><br><em>effects laser-gun and laser-bot</em>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") || tech.laserBotCount > 1
            },
            requires: "laser",
            effect() {
                tech.isLaserDiode = 0.63; //100%-37%
            },
            remove() {
                tech.isLaserDiode = 1;
            }
        },
        {
            name: "specular reflection",
            description: "<strong>laser</strong> beams gain <strong>1</strong> reflection<br>increase <strong class='color-d'>damage</strong> and <strong class='color-f'>energy</strong> drain by <strong>50%</strong>",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") && !tech.isWideLaser && !tech.isPulseLaser && !tech.historyLaser
            },
            requires: "laser, not wide beam",
            effect() {
                tech.laserReflections++;
                tech.laserDamage += 0.08; //base is 0.12
                tech.laserFieldDrain += 0.0008 //base is 0.002
            },
            remove() {
                tech.laserReflections = 2;
                tech.laserDamage = 0.16;
                tech.laserFieldDrain = 0.0016;
            }
        },
        {
            name: "diffraction grating",
            description: `your <strong>laser</strong> gains <strong>2 diverging</strong> beams<br>decrease individual beam <strong class='color-d'>damage</strong> by <strong>10%</strong>`,
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") && !tech.isWideLaser && !tech.isPulseAim && !tech.historyLaser
            },
            requires: "laser, not specular reflection",
            effect() {
                tech.beamSplitter++
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                tech.beamSplitter = 0
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            }
        },
        {
            name: "diffuse beam",
            description: "<strong>laser</strong> beam is <strong>wider</strong> and doesn't <strong>reflect</strong><br>increase full beam <strong class='color-d'>damage</strong> by <strong>175%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") && tech.laserReflections < 3 && !tech.beamSplitter && !tech.isPulseLaser
            },
            requires: "laser, not specular reflection<br>not diffraction grating",
            effect() {
                if (tech.wideLaser === 0) tech.wideLaser = 3
                tech.isWideLaser = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                tech.wideLaser = 0
                tech.isWideLaser = false;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            }
        },
        {
            name: "output coupler",
            description: "<strong>widen</strong> diffuse <strong>laser</strong> beam by <strong>40%</strong><br>increase full beam <strong class='color-d'>damage</strong> by <strong>40%</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") && tech.isWideLaser
            },
            requires: "laser, not specular reflection<br>not diffraction grating",
            effect() {
                tech.wideLaser = 4
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                if (tech.isWideLaser) {
                    tech.wideLaser = 3
                } else {
                    tech.wideLaser = 0
                }
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            }
        },
        {
            name: "slow light propagation",
            description: "",
            isGunTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") && tech.laserReflections < 3 && !tech.beamSplitter && !tech.isPulseLaser
            },
            requires: "laser, not specular reflection<br>not diffraction grating",
            effect() {
                this.description = `add 10 more <strong>laser</strong> beams into into your past`
                tech.historyLaser++
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                this.description = "<strong>laser</strong> beam is <strong>spread</strong> into your recent <strong>past</strong><br>increase total laser <strong class='color-d'>damage</strong> by <strong>200%</strong>"
                tech.historyLaser = 0
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            }
        },
        {
            name: "pulse",
            description: "convert <strong>25%</strong> of your <strong class='color-f'>energy</strong> into a pulsed laser<br>instantly initiates a fusion <strong class='color-e'>explosion</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.haveGunCheck("laser") && tech.laserReflections < 3 && !tech.isWideLaser && !tech.historyLaser
            },
            requires: "laser, not specular reflection, not diffuse",
            effect() {
                tech.isPulseLaser = true;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            },
            remove() {
                tech.isPulseLaser = false;
                for (i = 0, len = b.guns.length; i < len; i++) { //find which gun 
                    if (b.guns[i].name === "laser") b.guns[i].chooseFireMethod()
                }
            }
        },
        {
            name: "shock wave",
            description: "mobs caught in <strong>pulse's</strong> explosion are <strong>stunned</strong><br>for up to <strong>2 seconds</strong>",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isPulseLaser
            },
            requires: "pulse",
            effect() {
                tech.isPulseStun = true;
            },
            remove() {
                tech.isPulseStun = false;
            }
        },
        {
            name: "neocognitron",
            description: "<strong>pulse</strong> automatically <strong>aims</strong> at a nearby mob<br><strong>50%</strong> decreased <strong><em>delay</em></strong> after firing",
            isGunTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isPulseLaser && !tech.beamSplitter
            },
            requires: "pulse",
            effect() {
                tech.isPulseAim = true;
            },
            remove() {
                tech.isPulseAim = false;
            }
        },
        //************************************************** 
        //************************************************** field
        //************************************************** tech
        //************************************************** 
        {
            name: "bremsstrahlung radiation",
            description: "<strong>blocking</strong> with <strong>standing wave harmonics</strong><br> does <strong class='color-d'>damage</strong> to mobs",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "standing wave harmonics"
            },
            requires: "standing wave harmonics",
            effect() {
                tech.blockDmg += 0.75 //if you change this value also update the for loop in the electricity graphics in mech.pushMass
            },
            remove() {
                tech.blockDmg = 0;
            }
        },
        {
            name: "frequency resonance",
            description: "<strong>standing wave harmonics</strong> shield is retuned<br>increase <strong>size</strong> and <strong>blocking</strong> efficiency by <strong>40%</strong>",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "standing wave harmonics"
            },
            requires: "standing wave harmonics",
            effect() {
                mech.fieldRange += 175 * 0.2
                mech.fieldShieldingScale *= 0.55
            },
            remove() {
                mech.fieldRange = 175;
                mech.fieldShieldingScale = 1;
            }
        },
        {
            name: "flux pinning",
            description: "blocking with <strong>perfect diamagnetism</strong><br><strong>stuns</strong> mobs for <strong>+1</strong> second",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "perfect diamagnetism"
            },
            requires: "perfect diamagnetism",
            effect() {
                tech.isStunField += 60;
            },
            remove() {
                tech.isStunField = 0;
            }
        },
        {
            name: "eddy current brake",
            description: "your stored <strong class='color-f'>energy</strong> projects a field that<br>limits the <strong>top speed</strong> of mobs",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "perfect diamagnetism"
            },
            requires: "perfect diamagnetism",
            effect() {
                tech.isPerfectBrake = true;
            },
            remove() {
                tech.isPerfectBrake = false;
            }
        },
        {
            name: "fracture analysis",
            description: "bullet impacts do <strong>400%</strong> <strong class='color-d'>damage</strong><br>to <strong>stunned</strong> mobs",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return tech.isStunField || tech.oneSuperBall || tech.isCloakStun || tech.orbitBotCount > 1 || tech.isPerpetualStun
            },
            requires: "a stun effect",
            effect() {
                tech.isCrit = true;
            },
            remove() {
                tech.isCrit = false;
            }
        },
        {
            name: "pair production",
            description: "picking up a <strong>power up</strong> gives you <strong>250</strong> <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave"
            },
            requires: "nano-scale manufacturing",
            effect: () => {
                tech.isMassEnergy = true // used in mech.grabPowerUp
                mech.energy += 3
            },
            remove() {
                tech.isMassEnergy = false;
            }
        },
        {
            name: "bot manufacturing",
            description: "use <strong>nano-scale manufacturing</strong><br>to build <strong>3</strong> random <strong>bots</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing"
            },
            requires: "nano-scale manufacturing",
            effect: () => {
                mech.energy = 0.01;
                b.randomBot()
                b.randomBot()
                b.randomBot()
            },
            remove() {}
        },
        {
            name: "bot prototypes",
            description: "use <strong>nano-scale manufacturing</strong> to <strong>upgrade</strong><br>all bots of a random type and <strong>build</strong> <strong>2</strong> of that <strong>bot</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isNailBotUpgrade && tech.isFoamBotUpgrade && tech.isBoomBotUpgrade && tech.isLaserBotUpgrade && tech.isOrbitBotUpgrade)
            },
            requires: "nano-scale manufacturing",
            effect: () => {
                mech.energy = 0.01;
                //fill array of available bots
                const notUpgradedBots = []
                if (!tech.isNailBotUpgrade) notUpgradedBots.push(() => {
                    tech.giveTech("nail-bot upgrade")
                    tech.setTechoNonRefundable("nail-bot upgrade")
                    for (let i = 0; i < 2; i++) {
                        b.nailBot()
                        tech.nailBotCount++;
                    }
                })
                if (!tech.isFoamBotUpgrade) notUpgradedBots.push(() => {
                    tech.giveTech("foam-bot upgrade")
                    tech.setTechoNonRefundable("foam-bot upgrade")
                    for (let i = 0; i < 2; i++) {
                        b.foamBot()
                        tech.foamBotCount++;
                    }
                })
                if (!tech.isBoomBotUpgrade) notUpgradedBots.push(() => {
                    tech.giveTech("boom-bot upgrade")
                    tech.setTechoNonRefundable("boom-bot upgrade")
                    for (let i = 0; i < 2; i++) {
                        b.boomBot()
                        tech.boomBotCount++;
                    }
                })
                if (!tech.isLaserBotUpgrade) notUpgradedBots.push(() => {
                    tech.giveTech("laser-bot upgrade")
                    tech.setTechoNonRefundable("laser-bot upgrade")
                    for (let i = 0; i < 2; i++) {
                        b.laserBot()
                        tech.laserBotCount++;
                    }
                })
                if (!tech.isOrbitBotUpgrade) notUpgradedBots.push(() => {
                    tech.giveTech("orbital-bot upgrade")
                    tech.setTechoNonRefundable("orbital-bot upgrade")
                    for (let i = 0; i < 2; i++) {
                        b.orbitBot()
                        tech.orbitBotCount++;
                    }
                })
                //choose random function from the array and run it
                notUpgradedBots[Math.floor(Math.random() * notUpgradedBots.length)]()
            },
            remove() {}
        },
        {
            name: "mycelium manufacturing",
            description: "<strong>nano-scale manufacturing</strong> is repurposed<br>excess <strong class='color-f'>energy</strong> used to grow <strong class='color-p' style='letter-spacing: 2px;'>spores</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.maxEnergy > 0.99 && mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isMissileField || tech.isIceField || tech.isFastDrones || tech.isDroneGrab)
            },
            requires: "nano-scale manufacturing",
            effect() {
                tech.isSporeField = true;
            },
            remove() {
                tech.isSporeField = false;
            }
        },
        {
            name: "missile manufacturing",
            description: "<strong>nano-scale manufacturing</strong> is repurposed<br>excess <strong class='color-f'>energy</strong> used to construct <strong>missiles</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.maxEnergy > 0.99 && mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isSporeField || tech.isIceField || tech.isFastDrones || tech.isDroneGrab)
            },
            requires: "nano-scale manufacturing",
            effect() {
                tech.isMissileField = true;
            },
            remove() {
                tech.isMissileField = false;
            }
        },
        {
            name: "ice IX manufacturing",
            description: "<strong>nano-scale manufacturing</strong> is repurposed<br>excess <strong class='color-f'>energy</strong> used to synthesize <strong>ice IX</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "nano-scale manufacturing" && !(tech.isSporeField || tech.isMissileField || tech.isFastDrones || tech.isDroneGrab)
            },
            requires: "nano-scale manufacturing",
            effect() {
                tech.isIceField = true;
            },
            remove() {
                tech.isIceField = false;
            }
        },
        {
            name: "degenerate matter",
            description: "reduce <strong class='color-harm'>harm</strong> by <strong>40%</strong><br>while <strong>negative mass field</strong> is active",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "negative mass field"
            },
            requires: "negative mass field",
            effect() {
                tech.isHarmReduce = true
            },
            remove() {
                tech.isHarmReduce = false;
            }
        },
        {
            name: "annihilation",
            description: "after <strong>touching</strong> mobs, they are <strong>annihilated</strong><br>drains <strong>33%</strong> of maximum <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "negative mass field" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave"
            },
            requires: "negative mass field",
            effect() {
                tech.isAnnihilation = true
            },
            remove() {
                tech.isAnnihilation = false;
            }
        },
        {
            name: "Bose Einstein condensate",
            description: "<strong>mobs</strong> inside your <strong class='color-f'>field</strong> are <strong class='color-s'>frozen</strong><br><em style = 'font-size: 100%'>pilot wave, negative mass, time dilation</em>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "pilot wave" || mech.fieldUpgrades[mech.fieldMode].name === "negative mass field" || mech.fieldUpgrades[mech.fieldMode].name === "time dilation field"
            },
            requires: "pilot wave, negative mass field, time dilation field",
            effect() {
                tech.isFreezeMobs = true
            },
            remove() {
                tech.isFreezeMobs = false
            }
        },
        // {
        //     name: "thermal reservoir",
        //     description: "increase your <strong class='color-plasma'>plasma</strong> <strong class='color-d'>damage</strong> by <strong>100%</strong><br><strong class='color-plasma'>plasma</strong> temporarily lowers health not <strong class='color-f'>energy</strong>",
        //     isFieldTech: true,
        //     maxCount: 1,
        //     count: 0,
        //     allowed() {
        //         return mech.fieldUpgrades[mech.fieldMode].name === "plasma torch" && !tech.isEnergyHealth
        //     },
        //     requires: "plasma torch, not mass-energy equivalence",
        //     effect() {
        //         tech.isPlasmaRange += 0.27;
        //     },
        //     remove() {
        //         tech.isPlasmaRange = 1;
        //     }
        // },
        {
            name: "plasma jet",
            description: "increase <strong class='color-plasma'>plasma</strong> <strong>torch's</strong> range by <strong>27%</strong>",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "plasma torch"
            },
            requires: "plasma torch",
            effect() {
                tech.isPlasmaRange += 0.27;
            },
            remove() {
                tech.isPlasmaRange = 1;
            }
        },
        {
            name: "plasma-bot",
            description: "a bot uses <strong class='color-f'>energy</strong> to emit <strong class='color-plasma'>plasma</strong><br>that <strong class='color-d'>damages</strong> and <strong>pushes</strong> mobs",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return true
            },
            requires: "you aren't supposed to see this",
            effect() {
                tech.plasmaBotCount++;
                b.plasmaBot();
            },
            remove() {
                tech.plasmaBotCount = 0;
            }
        },
        {
            name: "plasma upgrade",
            description: "all <strong class='color-plasma'>plasma</strong> weapons' <strong>range</strong> and <strong class='color-d'>damage</strong> is doubled<br><em>applies to all current and future plasma-bots</em><br><em>and also plasma field</em>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "plasma torch" || tech.plasmaBotCount>1
            },
            requires: "plasma torch or at least 2 plasma bots",
            effect() {
                tech.plasmaBotUpg=true
            },
            remove() {
                tech.plasmaBotUpg=false
            }
        },
        {
            name: "micro-extruder",
            description: "<strong class='color-plasma'>plasma</strong> <strong>torch</strong> extrudes a thin <strong class='color-plasma'>hot</strong> wire<br>increases <strong class='color-d'>damage</strong>, and <strong class='color-f'>energy</strong> drain",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "plasma torch"
            },
            requires: "plasma torch",
            effect() {
                tech.isExtruder = true;
            },
            remove() {
                tech.isExtruder = false;
            }
        },
        {
            name: "timelike world line",
            description: "<strong>time dilation</strong> doubles your relative time <strong>rate</strong><br>and makes you <strong>immune</strong> to <strong class='color-harm'>harm</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "time dilation field"
            },
            requires: "time dilation field",
            effect() {
                tech.isTimeSkip = true;
                b.setFireCD();
            },
            remove() {
                tech.isTimeSkip = false;
                b.setFireCD();
            }
        },
        {
            name: "Lorentz transformation",
            description: "permanently increase your relative time rate<br><strong>move</strong>, <strong>jump</strong>, and <strong>shoot</strong> <strong>40%</strong> faster",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "time dilation field" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave"
            },
            requires: "time dilation field",
            effect() {
                tech.fastTime *= 1.40;
                tech.fastTimeJump *= 1.11
                mech.setMovement();
                b.setFireCD();
            },
            remove() {
                tech.fastTime = 1;
                tech.fastTimeJump = 1;
                mech.setMovement();
                b.setFireCD();
            }
        },
        {
            name: "Lorentz transformation extended",
            description: "permanently increase your relative time rate<br><strong>move</strong>, <strong>jump</strong>, and <strong>shoot</strong> <strong>20%</strong> faster",
            isFieldTech: true,
            maxCount: 9,
            count: 0,
            allowed() {
                return tech.fastTime>1.3
            },
            requires: "time dilation field",
            effect() {
                tech.fastTime *= 1.20;
				tech.fastTimeJump += 0.11;
                mech.setMovement();
                b.setFireCD();
            },
            remove() {
                tech.fastTime = 1.4;
                tech.fastTimeJump = 1;
                mech.setMovement();
                b.setFireCD();
            }
        },
        {
            name: "time crystals",
            description: "<strong>quadruple</strong> your default <strong class='color-f'>energy</strong> regeneration",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return (mech.fieldUpgrades[mech.fieldMode].name === "time dilation field" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave") && tech.energyRegen !== 0;
            },
            requires: "time dilation field",
            effect: () => {
                tech.energyRegen *= 4;
                mech.setEnergyRegen()
            },
            remove() {
                tech.energyRegen = 0.001;
                mech.setEnergyRegen()
            }
        },
        {
            name: "phase decoherence",
            description: "become <strong>intangible</strong> while <strong class='color-cloaked'>cloaked</strong><br>but, passing through <strong>mobs</strong> drains your <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "metamaterial cloaking"
            },
            requires: "metamaterial cloaking",
            effect() {
                tech.isIntangible = true;
            },
            remove() {
                tech.isIntangible = false;
            }
        },
        {
            name: "dazzler",
            description: "<strong class='color-cloaked'>decloaking</strong> <strong>stuns</strong> nearby mobs<br>drains <strong>30%</strong> of your stored <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "metamaterial cloaking"
            },
            requires: "metamaterial cloaking",
            effect() {
                tech.isCloakStun = true;
            },
            remove() {
                tech.isCloakStun = false;
            }
        },
        {
            name: "discrete optimization",
            description: "increase <strong class='color-d'>damage</strong> by <strong>50%</strong><br><strong>50%</strong> increased <strong><em>delay</em></strong> after firing",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "metamaterial cloaking" || mech.fieldUpgrades[mech.fieldMode].name === "pilot wave"
            },
            requires: "metamaterial cloaking",
            effect() {
                tech.aimDamage = 1.5
                b.setFireCD();
            },
            remove() {
                tech.aimDamage = 1
                b.setFireCD();
            }
        },
        {
            name: "cosmic string",
            description: "<strong>stun</strong> and do <strong class='color-p'>radioactive</strong> <strong class='color-d'>damage</strong> to <strong>mobs</strong><br>if you tunnel through them with a <strong class='color-worm'>wormhole</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormholeDamage = true
            },
            remove() {
                tech.isWormholeDamage = false
            }
        },
        {
            name: "Penrose process",
            description: "after a <strong>block</strong> falls into a <strong class='color-worm'>wormhole</strong><br>you gain <strong>50</strong> <strong class='color-f'>energy</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormholeEnergy = true
            },
            remove() {
                tech.isWormholeEnergy = false
            }
        },
        {
            name: "transdimensional spores",
            description: "when <strong>blocks</strong> fall into a <strong class='color-worm'>wormhole</strong><br>higher dimension <strong class='color-p' style='letter-spacing: 2px;'>spores</strong> are summoned",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormSpores = true
            },
            remove() {
                tech.isWormSpores = false
            }
        },
        {
            name: "traversable geodesics",
            description: "your <strong>bullets</strong> can traverse <strong class='color-worm'>wormholes</strong><br>spawn a <strong class='color-g'>gun</strong> and <strong class='color-g'>ammo</strong>",
            isFieldTech: true,
            maxCount: 1,
            count: 0,
            allowed() {
                return mech.fieldUpgrades[mech.fieldMode].name === "wormhole"
            },
            requires: "wormhole",
            effect() {
                tech.isWormBullets = true
                powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
                powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
            },
            remove() {
                tech.isWormBullets = false
            }
        },
        {
            name: "heals",
            description: "spawn <strong>6</strong> <strong class='color-h'>heals</strong>",
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return true
            },
            requires: "",
            effect() {
                for (let i = 0; i < 6; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "heal");
                }
                this.count--
            },
            remove() {}
        },
        {
            name: "ammo",
            description: "spawn <strong>6</strong> <strong class='color-g'>ammo</strong>",
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return !tech.isEnergyNoAmmo
            },
            requires: "not exciton lattice",
            effect() {
                for (let i = 0; i < 6; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "ammo");
                }
                this.count--
            },
            remove() {}
        },
        {
            name: "rerolls",
            description: "spawn <strong>4</strong> <strong class='color-r'>rerolls</strong>",
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "not superdeterminism",
            effect() {
                for (let i = 0; i < 4; i++) {
                    powerUps.spawn(mech.pos.x, mech.pos.y, "reroll");
                }
                this.count--
            },
            remove() {}
        },
        {
            name: "gun",
            description: "spawn a <strong class='color-g'>gun</strong>",
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "not superdeterminism",
            effect() {
                powerUps.spawn(mech.pos.x, mech.pos.y, "gun");
                this.count--
            },
            remove() {}
        },
        {
            name: "field",
            description: "spawn a <strong class='color-f'>field</strong>",
            maxCount: 9,
            count: 0,
            isNonRefundable: true,
            isCustomHide: true,
            allowed() {
                return !tech.isSuperDeterminism
            },
            requires: "not superdeterminism",
            effect() {
                powerUps.spawn(mech.pos.x, mech.pos.y, "field");
                this.count--
            },
            remove() {}
        },
    ],
    //variables use for gun tech upgrades
    fireRate: null,
    bulletSize: null,
    energySiphon: null,
    healthDrain: null,
    isCrouchAmmo: null,
    isBulletsLastLonger: null,
    isImmortal: null,
    sporesOnDeath: null,
    isImmuneExplosion: null,
    isExplodeMob: null,
    isDroneOnDamage: null,
    isAcidDmg: null,
    isAnnihilation: null,
    largerHeals: null,
    squirrelFx: null,
    isCrit: null,
    isLowHealthDmg: null,
    isFarAwayDmg: null,
    isEntanglement: null,
    isMassEnergy: null,
    isExtraChoice: null,
    laserBotCount: null,
    nailBotCount: null,
    foamBotCount: null,
    boomBotCount: null,
    plasmaBotCount: null,
    orbitBotCount: null,
    collisionImmuneCycles: null,
    blockDmg: null,
    isPiezo: null,
    isFastDrones: null,
    isFastSpores: null,
    superBallNumber: null,
    oneSuperBall: null,
    laserReflections: null,
    laserDamage: null,
    laserFieldDrain: null,
    isAmmoFromHealth: null,
    mobSpawnWithHealth: null,
    isEnergyRecovery: null,
    isHealthRecovery: null,
    isEnergyLoss: null,
    isDeathAvoid: null,
    isDeathAvoidedThisLevel: null,
    waveSpeedMap: null,
    waveSpeedBody: null,
    isSporeField: null,
    isMissileField: null,
    isIceField: null,
    isFlechetteMultiShot: null,
    isMineAmmoBack: null,
    isPlasmaRange: null,
    isFreezeMobs: null,
    recursiveMissiles: null,
    isIceCrystals: null,
    throwChargeRate: null,
    isBlockStun: null,
    isStunField: null,
    isHarmDamage: null,
    isHeavyWater: null,
    energyRegen: null,
    isVacuumBomb: null,
    renormalization: null,
    fragments: null,
    isEnergyDamage: null,
    isBotSpawner: null,
    waveHelix: null,
    isSporeFollow: null,
    isNailPoison: null,
    isEnergyHealth: null,
    isPulseStun: null,
    restDamage: null,
    isRPG: null,
    is3Missiles: null,
    isDeterminism: null,
    isSuperDeterminism: null,
    isHarmReduce: null,
    nailsDeathMob: null,
    isSlowFPS: null,
    isNeutronStun: null,
    manyWorlds: null,
    isDamageFromBulletCount: null,
    isLaserDiode: null,
    isNailShot: null,
    slowFire: null,
    fastTime: null,
    squirrelJump: null,
    fastTimeJump: null,
    isFastDot: null,
    isArmorFromPowerUps: null,
    isAmmoForGun: null,
    isRapidPulse: null,
    isPulseAim: null,
    isSporeFreeze: null,
    isShotgunRecoil: null,
    isHealLowHealth: null,
    isAoESlow: null,
    isHarmArmor: null,
    isTurret: null,
    isRerollDamage: null,
    isHarmFreeze: null,
    isBotArmor: null,
    isRerollHaste: null,
    rerollHaste: null,
    isMineDrop: null,
    isRerollBots: null,
    isRailTimeSlow: null,
    isNailBotUpgrade: null,
    isFoamBotUpgrade: null,
    isLaserBotUpgrade: null,
    isBoomBotUpgrade: null,
    isOrbitBotUpgrade: null,
    isDroneGrab: null,
    isOneGun: null,
    isDamageForGuns: null,
    isGunCycle: null,
    isFastFoam: null,
    isSporeGrowth: null,
    isBayesian: null,
    nailGun: null,
    nailInstantFireRate: null,
    isCapacitor: null,
    isEnergyNoAmmo: null,
    isFreezeHarmImmune: null,
    isSmallExplosion: null,
    isExplosionHarm: null,
    armorFromPowerUps: null,
    bonusHealth: null,
    isIntangible: null,
    isCloakStun: null,
    bonusEnergy: null,
    healGiveMaxEnergy: null,
    healMaxEnergyBonus: null,
    aimDamage: null,
    isNoFireDefense: null,
    isNoFireDamage: null,
    duplicateChance: null,
    beamSplitter: null,
    iceEnergy: null,
    isPerfectBrake: null,
    explosiveRadius: null,
    isWormholeEnergy: null,
    isWormholeDamage: null,
    isNailCrit: null,
    isFlechetteExplode: null,
    isWormSpores: null,
    isWormBullets: null,
    isWideLaser: null,
    wideLaser: null,
    isPulseLaser: null,
    isRadioactive: null,
    isRailEnergyGain: null,
    isMineSentry: null,
    isIncendiary: null,
    overfillDrain: null,
    isNeutronSlow: null,
    isRailAreaDamage: null,
    historyLaser: null,
    isSpeedHarm: null,
    isSpeedDamage: null,
    isTimeSkip: null,
    isPerpetualReroll: null,
    isPerpetualAmmo: null,
    isPerpetualHeal: null,
    isPerpetualStun: null,
    isCancelDuplication: null,
    cancelCount: null,
    isCancelRerolls: null,
    isBotDamage: null,
    isBanish: null,
    isMaxEnergyTech: null,
    isLowEnergyDamage: null,
    isRewindBot: null,
    isRewindGrenade: null,
    isExtruder: null,
    isEndLevelPowerUp: null,
    isRewindGun: null,
	extremeTech:0

}
					tech.extremeHrmDecPerm = 1;
tech.extremeAtkIncPerm = 1;