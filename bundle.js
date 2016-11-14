(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
console.log("hello world");

var gameManager = require('./games/test/gameManager.js');

//for unit testing
//var dataReadTest = require('./unitTesting/dataReadTest.js');
//dataReadTest.test();


var gameFile = '/games/test/data/game.json';

gameManager.initGame(gameFile);

},{"./games/test/gameManager.js":2}],2:[function(require,module,exports){
"use strict";

//include pixi
var pixi = require('pixi.js');
var timer = require('pixi-timer');//adds timer class to pixi

//include framwork
var tapir = require('./../../src/');

//gameManager is the main class of the game
var gameManager = exports;

//managers are assigned to the game Manager to be reachable from dynamic code
gameManager.objectManager = tapir.objectManagement.objectManager;
gameManager.sceneManager = tapir.sceneManagement.sceneManager;
gameManager.dataManager = tapir.loader.dataManager;
gameManager.assetManager = tapir.loader.assetManager;
gameManager.reelLines = require('./scripts/slot/reels/reelLines.js');
gameManager.spinning = false;

var animType = tapir.objectManagement.objectTypes.animation;

var scene = tapir.sceneManagement.scene;
var dynamicTypes = tapir.objectManagement.objectTypes.dynamicTypes;

//custom object type declaration example
var spriteType = require('./scripts/types/spriteType.js');
var slotType = require('./scripts/types/slotType.js');

//path of the JSON file containing game data to initialize the game
var gameDataPath = ('games/test/data/game.json');

//setting up renderer and stage
var renderer = pixi.autoDetectRenderer(1280, 800,{transparent: true});
gameManager.stage = new pixi.Container();

var gameDiv = document.getElementById('gameDiv');
gameDiv.appendChild(renderer.view);

var r;

//add gameManager to the window so that the dynamic code can reach namespace
window.gameManager = gameManager;

//function to initialize the game
gameManager.initGame = function(gameDataFilePath){
  //load json files and keep data inside dataManager.
  loadGameData();

  //start updating stage
  update();
}

function loadGameData(){
  console.log("started loading game data!");
  //loads all game data. callback function load assets is called after all data is loaded.
  gameManager.dataManager.loadAllGameData(gameDataPath, loadAssets);
  //gameManager.dataManager.loadData(gameDataPath, loadAssets, "myGameData");
}

function loadAssets(){
  var count = 0;
  //registering a dynamic object type
  dynamicTypes.registerDynamicObjectType(new spriteType());
  dynamicTypes.registerDynamicObjectType(new slotType());

  console.log("started loading assets ");

  //load assets. callback function assetsLoaded is called after all assets are loaded.
  gameManager.assetManager.loadImageBatch(gameManager.dataManager.getAssetDataByName("symbolTextures"), assetsLoaded);
  gameManager.assetManager.loadImageBatch(gameManager.dataManager.getAssetDataByName("uiAssets"), assetsLoaded);
  gameManager.assetManager.loadAnimBatch(gameManager.dataManager.getAssetDataByName("animAssets"), assetsLoaded);


  function assetsLoaded(to, loaded){
    count++;
    if(count == 3){
      //create scene
      var s = gameManager.dataManager.getSceneDataByName("slotScene");
      console.log("all assets are loaded! ");
      var sc = new scene(s);
      gameManager.stage.addChild(sc.container);

      gameManager.server = require('./scripts/slot/serverSim/serverSim.js');

      //var reelData = gameManager.server.randomizeReels(100);

      //var spinData = gameManager.server.randomizeSpin();

      //console.log("initial spin data: " + spinData);

      //console.log("slot object: " + gameManager.slot.reelArr[0].rendText);
      /*var anim = new animType();
      sc.container.addChild(anim.createObject("symbolAnim"));
      anim.displayObject.x = 100;
      anim.displayObject.y = 100;
      anim.displayObject.visible = false;
      anim.playAnimation();
      anim.displayObject.visible = true;

      var reel = require('./scripts/slot/reels/reel.js');
      r = new reel(reelData, gameManager.dataManager.settingsData, gameManager.dataManager.assetData);
      r.createReel(0, gameManager.assetManager.loader);
      console.log(r.cont);
      //sc.container.addChild(r.cont);
      r.tile.position.x = 200;
      sc.container.addChild(r.tile);*/

      //sc.container.addChild(gameManager.slot.cont.displayObject);

      /*for(var i = 0; i < 5; i++){
        sc.container.addChild(gameManager.slot.reelArr[i].tile);
        gameManager.slot.reelArr[i].tile.x = gameManager.slot.cont.displayObject.position.x + 154*i;
        gameManager.slot.reelArr[i].tile.y = gameManager.slot.cont.displayObject.position.y;
      }*/

      //sc.container.addChild(gameManager.slot.cont);
    }
  }

}


function update(){
  requestAnimationFrame(update);
  renderer.render(gameManager.stage);
    pixi.timerManager.update();
  for(var i = 0; i < 5; i++){
    if(gameManager.slot != undefined && gameManager.slot.reelArr[i]!=undefined){
      renderer.render(gameManager.slot.reelArr[i].cont, gameManager.slot.reelArr[i].rendText);
      if(gameManager.slot.reelArr[i].isSpinning){
          gameManager.slot.reelArr[i].spinReel(20);
      }
    }
  }
}

},{"./../../src/":35,"./scripts/slot/reels/reelLines.js":4,"./scripts/slot/serverSim/serverSim.js":5,"./scripts/types/slotType.js":7,"./scripts/types/spriteType.js":8,"pixi-timer":9,"pixi.js":10}],3:[function(require,module,exports){
var slot = require('./../slot.js');
var gameManager = require('./../../../gameManager.js');

module.exports = function (reelData, settingsData, assetData){
  //console.log("reel is being initialized");
    this.numOfSymbols = settingsData.settings.totalLength;
    var noOfReels = settingsData.settings.numberOfReels;
    var symbolWidth = settingsData.symbolProps.symbolWidth;
    var symbolHeight = settingsData.symbolProps.symbolHeight;
    var iterations = settingsData.settings.totalSpinIterations;
    var numberOfSymbolsOnReel = settingsData.settings.numberOfSymbolsOnReel;
    var symbolPath;
    this.isSpinning = false;
    this.spinSpeed = settingsData.settings.spinSpeed;
    this.maxSpeed = settingsData.settings.spinMaxSpeed;
    var spinInc = this.spinSpeed;
    this.textureArr;
    this.textureChanged = false;
    this.reelIndex;
    this.settingsData = settingsData;
    this.assetData = assetData;
    this.reelData = reelData;
    this.reelIndex = 0;

    //reelcontainer
    this.cont = new PIXI.Container();

    var brt = new PIXI.BaseRenderTexture(symbolWidth, this.numOfSymbols * symbolHeight, PIXI.SCALE_MODES.LINEAR, 1);

    //render texture for the reel. it will be used inside update function to render
    //the tiling sprite
    this.rendText = new PIXI.RenderTexture(brt);

    //tiling sprite for masking and spin animation
    this.tile = new PIXI.extras.TilingSprite(this.rendText, symbolWidth, symbolHeight*numberOfSymbolsOnReel);

    //init reel
    this.createReel = function(target, index){
        this.reelIndex = index;
        for(var i = 0; i<this.numOfSymbols; i++){
            var v =  "symbol0" + (reelData[this.reelIndex][normalizeIndexNumber(target+ i, this.reelData[0].length)] + 1);
            var s = new PIXI.Sprite(gameManager.assetManager.loader.resources[v].texture);
            s.position.y = (i)*symbolHeight;
            this.cont.addChild(s);
        }
    }

    //replace symbols of the reel according to new spin data
    this.replaceTexture = function(target){
        this.cont.removeChildren();
        for(var i = 0; i<this.numOfSymbols; i++){
            var v =  "symbol0" + (reelData[this.reelIndex][normalizeIndexNumber(target+ i, this.reelData[0].length)] + 1);
            var s = new PIXI.Sprite(gameManager.assetManager.loader.resources[v].texture);
            s.position.y = (i)*symbolHeight;
            this.cont.addChild(s);
        }
        this.textureChanged = true;
        return this.cont;
    }

    this.startSpin = function(target){
        spinInc = this.spinSpeed;
        this.tile.tilePosition.y = 0;
        this.isSpinning = true;
        this.currentTarget = target;
    }

    //spin reel
    this.spinReel = function(){
        //before upper speed limit, speed up spin
        if(this.tile.tilePosition.y < (iterations*symbolHeight*this.numOfSymbols)*0.6 && spinInc < this.maxSpeed){
                spinInc+=0.1;
            }
        //while on top speed, replace textures according to the target
        else if(this.tile.tilePosition.y > (iterations*symbolHeight*this.numOfSymbols)*0.6 && this.tile.tilePosition.y < (iterations*symbolHeight*this.numOfSymbols)*0.8){
            if(!this.textureChanged){
                this.cont = this.replaceTexture(this.currentTarget);
            }
        }
        //speed down for last %20 of spin
        else if(this.tile.tilePosition.y > (iterations*symbolHeight*this.numOfSymbols)*0.8 && spinInc > this.spinSpeed){
            spinInc-=0.35;
        }
        //spin the reel by increment tile position
        if(this.tile.tilePosition.y < iterations * symbolHeight*this.numOfSymbols)
            this.tile.tilePosition.y += spinInc;
        //if increment variable messes up, place the reel into its targeted position
        else if(this.tile.tilePosition.y > iterations*symbolHeight*this.numOfSymbols){
            this.tile.tilePosition.y = iterations*symbolHeight*this.numOfSymbols;
            this.isSpinning = false;
            slot.finishedReelCount++;
            if(slot.finishedReelCount == noOfReels)
                slot.finishSpinSequence();
        }
    }

    //stop reel
    this.stopReel = function(target){
        if(!this.textureChanged)
          this.cont = this.replaceTexture(target);
        this.tile.tilePosition.y = 0;
        this.isSpinning = false;
        slot.finishedReelCount++;
        if(slot.finishedReelCount == noOfReels)
            slot.finishSpinSequence();
    }
    return this;
}

//if the reel index start index + target index is greater than size of the reel
//returns the correct index from beginning. Otherwise index will get out of bounds.
function normalizeIndexNumber(ind, arraySize){
    if(ind < 0){
        return Math.abs(arraySize + ind);
    }
    if(ind >= arraySize){
        return Math.abs(arraySize - ind);
    }else
        return ind;
}

},{"./../../../gameManager.js":2,"./../slot.js":6}],4:[function(require,module,exports){
var pixi = require('pixi.js');
var reelLines = exports;
var gameManager = require('./../../../gameManager.js');

//list of winning lines
var p = [
    [2,2,1,2,2],
    [0,0,1,0,0],
    [1,2,2,2,1],
    [2,1,1,1,2],
    [0,0,0,0,0],
    [1,1,1,1,1],
    [2,2,2,2,2],
    [2,1,0,1,2],
    [0,1,2,1,0]
]
//var p = [2,1,1,2,0];
var pArgs = new Object();
pArgs.leftPos = 260;
pArgs.rightPos = 740;
pArgs.topMargin = 124;
pArgs.symbolWidth = 144;
pArgs.symbolHeight = 144;
pArgs.reelMargin = 10;
pArgs.numberOfReels = 5;
pArgs.numberOfLines = 9;

//draw only possible line
reelLines.drawLine = function (index){
    var g = new pixi.Graphics();
    g.lineStyle(4, 0xffd900, 1);
    var btnCont = gameManager.objectManager.getObjectByName("lineButtonContainer").displayObject;
    var name = "btnLine" + (index);
    var sP = gameManager.objectManager.getObjectByName(name).displayObject;
    g.moveTo(btnCont.x + sP.position.x + 50, btnCont.y + sP.position.y + 25);
    for(var i = 0; i < pArgs.numberOfReels; i++){
        g.lineTo(pArgs.leftPos + pArgs.reelMargin*i + i*pArgs.symbolWidth + pArgs.symbolWidth/2, pArgs.topMargin + pArgs.symbolHeight*p[index-1][i] + pArgs.symbolHeight/2);
        g.moveTo(pArgs.leftPos + pArgs.reelMargin*i + i*pArgs.symbolWidth + pArgs.symbolWidth/2, pArgs.topMargin + pArgs.symbolHeight*p[index-1][i] + pArgs.symbolHeight/2);
    }

    g.endFill();

    return g;
}

//draws winning line with squares
reelLines.drawWinningLine = function (index, count){
    console.log("drawing winning line: " + index);
    var g = new pixi.Graphics();
    g.lineStyle(4, 0xaad900, 1);

    var btnCont = gameManager.objectManager.getObjectByName("lineButtonContainer").displayObject;
    var name = "btnLine" + (index + 1);
    var sP = gameManager.objectManager.getObjectByName(name).displayObject;
    g.moveTo(btnCont.position.x + sP.position.x + 50, btnCont.position.y + sP.position.y + 25);
    g.lineTo(pArgs.leftPos, pArgs.topMargin + pArgs.symbolHeight*p[index][0] + pArgs.symbolHeight/2);
    for(var i = 0; i < count-1; i++){
        g.moveTo(pArgs.leftPos + pArgs.reelMargin*i + (i+1)*pArgs.symbolWidth, pArgs.topMargin + pArgs.symbolHeight*p[index][i] + pArgs.symbolHeight/2);
        g.lineTo(pArgs.leftPos + pArgs.reelMargin*i + (i+1)*pArgs.symbolWidth + pArgs.reelMargin, pArgs.topMargin + pArgs.symbolHeight*p[index][i+1] + pArgs.symbolHeight/2);
    }
    g.moveTo(pArgs.leftPos + pArgs.reelMargin*(count-1) + (count)*pArgs.symbolWidth, pArgs.topMargin + pArgs.symbolHeight*p[index][count-1] + pArgs.symbolHeight/2);
    for(i = count; i < 5; i++){
        g.lineTo(pArgs.leftPos + pArgs.reelMargin*i + i*pArgs.symbolWidth + pArgs.symbolWidth/2, pArgs.topMargin + pArgs.symbolHeight*p[index][i] + pArgs.symbolHeight/2);
        g.moveTo(pArgs.leftPos + pArgs.reelMargin*i + i*pArgs.symbolWidth + pArgs.symbolWidth/2, pArgs.topMargin + pArgs.symbolHeight*p[index][i] + pArgs.symbolHeight/2);
    }
    for(var i = 0; i < count; i++){
        g.drawRect(pArgs.leftPos + i*pArgs.symbolWidth + i*pArgs.reelMargin, p[index][i]*pArgs.symbolHeight + pArgs.topMargin, pArgs.symbolWidth, pArgs.symbolHeight);
    }


    g.endFill();
    return g;
}

reelLines.animateWinningLines = function(winArr){
    console.log("winning lines are being animated " + winArr);
    //var f = winArr[0][0]-1;
    //var g = winArr[0][1];
    //for(var i = 0; i < winArr.length; i++)
    var cnt = 0;
    var timerArr = [];
    winArr.forEach(res => {
      var f = res[0]-1;
      var g = res[1];
      console.log("f: " + f + " g: " + g);
      var lnCont = gameManager.objectManager.getObjectByName("lineContainer");
      var l = reelLines.drawWinningLine(f,g);
      console.log("cnt: " + cnt)
      var t = pixi.timerManager.createTimer(1500 * cnt + 0.1);
      t.start();
      t.on('end', function(del){
        lnCont.displayObject.removeChildren();
        lnCont.displayObject.addChild(l);
        console.log("working!");
      });
      console.log("l: " + l);
        cnt++;
      //lnCont.displayObject.addChild(t);

      //return t;//reelLines.drawWinningLine(f,g);
    });
}

//randomizes reel line data so that you can see it works on all conditions
function randomizeReelLines(){
    for(var i = 0; i < pArgs.numberOfReels; i++){
        p[i] = Math.floor((Math.random() * 3) + 0)
    }
    console.log("winning line: " + p[0] + " " + p[1] + " " + p[2] + " " + p[3] + " " + p[4]);
}

function normalizeIndexNumber(ind, arraySize){
    if(ind < 0){
        return Math.abs(arraySize + ind);
    }
    if(ind >= arraySize){
        return Math.abs(arraySize - ind);
    }else
        return ind;
}

},{"./../../../gameManager.js":2,"pixi.js":10}],5:[function(require,module,exports){
var server = exports;
var slot = require('./../slot.js');
server.name = "game server";



//winning lines
server.p = [
    [2,2,1,2,2],
    [0,0,1,0,0],
    [1,2,2,2,1],
    [2,1,1,1,2],
    [0,0,0,0,0],
    [1,1,1,1,1],
    [2,2,2,2,2],
    [2,1,0,1,2],
    [0,1,2,1,0]
]

server.randomizeSpin = function (){
    server.spinData = new Array();
    //console.log('Generating spin data');
    for(var i = 0; i < server.noOfReels; i++){
        server.spinData.push(Math.floor((Math.random() * (100)) + 0));
    }
    console.log("new spin indexes: " + server.spinData[0] + " " + server.spinData[1] + " " + server.spinData[2] + " " + server.spinData[3] + " " + server.spinData[4] + " ")
    return server.spinData;
}

server.randomizeReels = function (rSize){
    server.noOfReels = 5;//slot.gameData.settings.numberOfReels;
    server.reelSize = 20;//slot.gameData.settings.reelItemSize;
    server.reels = new Array();
    server.spinData = new Array();
    server.numberOfSymbolAssets = 9;//slot.gameData.settings.totalNumberOfSymbols;
    //console.log('Generating reel data');
    reels = new Array();
    for(var i = 0; i < server.noOfReels; i++){
        var rl =new Array();
        for(var j = 0; j < rSize; j++){
            rl.push(Math.floor((Math.random() * (server.numberOfSymbolAssets)) + 0));
        }
        server.reels.push(rl);
    }
    return server.reels;
}

server.checkWin = function(){
    var winLines = [];
    for(var i = 0; i < server.p.length; i++){
        var ctr = 1;
        var first = server.reels[0][(server.spinData[0] + server.p[i][0])];
        for(var j = 1; j<server.noOfReels; j++){
            if(first == server.reels[j][(server.spinData[j] + server.p[i][j])]){
                ctr++;
            }
            else
                break;
        }
        if(ctr > 2)
            winLines.push([(i+1), ctr, first]);
    }
    return winLines;
}

},{"./../slot.js":6}],6:[function(require,module,exports){
var pixi = require('pixi.js');
var gameManager = require('./../../gameManager.js');

var reel = require('./reels/reel.js');
var reelLines = require('./reels/reelLines.js')

var slot = exports;

slot.reelArr = [];
slot.spinning = false;
slot.spinData = [];
slot.reelData = [];

slot.initializeSlot = function(spinData, reelData){
  slot.reelData = reelData;
  slot.spinData = spinData;
  slot.cont = gameManager.objectManager.getObjectByName("slotGameContainer");
  for(let i = 0; i < 5; i++){
    var r = new reel(reelData, gameManager.dataManager.settingsData, gameManager.dataManager.assetData);
    r.createReel(spinData[i], i);
    //console.log(r.cont);
    slot.reelArr.push(r);
    slot.cont.displayObject.addChild(r.tile);
    r.tile.x = (144 + 10) * i;
    //console.log("cont: " + r.cont);
  }

    //gameManager.stage.addChild(slot.cont);
  //sc.container.addChild(r.cont);
  /*r.tile.position.x = 200;
  sc.container.addChild(r.tile);*/
  return slot;
}

slot.startSpin = function(){
  //console.log("spinData: " + slot.spinData);

  slot.spinning = true;
  slot.setSpinButtonText("STOP");
  //if last reel is not spinning, then none of them are. In this example, they spin synchronously so order is not important.
  //if slot is not spinning and pressed spin button, get new spin data from server simulator

  if(!slot.spinStarted){
  gameManager.objectManager.getObjectByName("lineContainer").displayObject.removeChildren();
  gameManager.objectManager.getObjectByName("animationContainer").displayObject.removeChildren();

  //reelLines.deactivateLineButtons();
  slot.finishedReelCount = 0;
  if(!slot.reelArr[4].isSpinning){
      slot.spinData = gameManager.server.randomizeSpin();
      slot.winData = gameManager.server.checkWin();
      slot.winData = [[3, 3, 6], [6,4,6]];
      console.log("win data: " + slot.winData);
  }

  //you can trace it on the console if the spin stops on correct position or not. result of every spin will be show on the console.
  //you can check if visuals are correct by looking at the assets folder
  console.log("spin is initiated, spin order: " + slot.reelData[0][slot.spinData[0]] + " " + slot.reelData[1][slot.spinData[1]] + " " + slot.reelData[2][slot.spinData[2]] + " " + slot.reelData[3][slot.spinData[3]] + " " + slot.reelData[4][slot.spinData[4]] + " ")

  slot.tArr = new Array();
  for(var i = 0; i < 5; i++){
    //slot.reelArr[i].startSpin(slot.spinData[i]);
    //console.log(slot.reelArr[i].startSpin);
    //slot.reelArr[i].startSpin(slot.spinData[this.index]);

      var t = pixi.timerManager.createTimer(400 * i + 0.1);
      t.index = i;
      slot.tArr.push(t);
  }
      slot.spinStarted = true;

      //if not spinning, start spinning each reel, if spinning, stop them and set the final position
      for(var i = 0; i < 5; i++){
          if(!slot.reelArr[i].isSpinning){
              console.log("target for reel " + i + ": " + slot.reelData[i][slot.spinData[i]] + "\narray: " + slot.reelData[i])
              slot.reelArr[i].textureChanged = false;
              slot.tArr[i].start();
              slot.tArr[i].on('end', function(del){
                delay((del-0.1)/400);
              });

              function delay(ind){
                var flag = false;
                for(var j = ind; j >0; j--){
                    if(!slot.reelArr[j-1].isSpinning && j > 0)flag = true;
                }
                if(!flag){
                    slot.reelArr[ind].startSpin(slot.spinData[ind]);
                }
              }
          }
      }
  }
  else{
      slot.stopSpin(slot.spinData);
  }
}

slot.stopSpin = function(args){

  for(var i = 0; i < 5; i++){
      slot.reelArr[i].stopReel(slot.spinData[i]);
      //console.log("to stop: " + slot.spinData[i]);
  }
}

slot.finishSpinSequence = function(){
    console.log("spin is finished");
    if(slot.winData.length != 0){
        var lnCont = gameManager.objectManager.getObjectByName("lineContainer");
        reelLines.animateWinningLines(slot.winData);
        //console.log("a: " + a);
        //lnCont.displayObject.addChild(a);
        //console.log("server.p: " + gameManager.server.p[slot.winData[0][0]-1]);
        //slot.playSymbolAnimations(gameManager.server.p[slot.winData[0][0]-1], slot.winData[0].length);
    }
    slot.spinStarted = false;
    slot.spinning = false;
    slot.setSpinButtonText("SPIN");
}

slot.playSymbolAnimations = function(winArr, animCount){
    var animCont = slot.gameManager.getObjectByName('animationContainer', slot.gameManager.objects);
    for(var i = 0; i < animCount; i++){
        //console.log("line: " + winArr + " count: " + animCount);
        var an = animationController.playAnimation('win', 50, i, winArr[i]);
        animCont.addChild(an);
    }
}


slot.drawLine = function(v){
  var lineBtnCont = gameManager.objectManager.getObjectByName("lineButtonContainer");
  lineBtnCont.displayObject.children.forEach(elm =>{
    if(elm.name == ("btnLine" + v)){
      elm.setState("selected");
      elm.clicked = true;
    }
    else{
      elm.setState("init");
      elm.clicked = false;
    }
  });

  var lnCont = gameManager.objectManager.getObjectByName("lineContainer");
  if(lnCont.displayObject.children != null)
    lnCont.displayObject.removeChildren();
  lnCont.displayObject.addChild(gameManager.reelLines.drawLine(v));
}

slot.setSpinButtonText = function(textVal){
  var text = gameManager.objectManager.getObjectByName("spinText");
  text.displayObject.content(textVal);
}

},{"./../../gameManager.js":2,"./reels/reel.js":3,"./reels/reelLines.js":4,"pixi.js":10}],7:[function(require,module,exports){
var pixi = require('pixi.js');

var tapir = require('./../../../../src');
var objectManager = tapir.objectManagement.objectManager;
var assetManager = tapir.loader.assetManager;
var slot = require('./../slot/slot.js');
var gameManager = require('./../../gameManager.js');

module.exports = function(){
  this.dynTypeName = "slotType";

  this.createObject = function(args){
    
    this.name = args.name;
    //find corresponding loader

    gameManager.server = require('./../slot/serverSim/serverSim.js');

    var reelData = gameManager.server.randomizeReels(100);

    var spinData = gameManager.server.randomizeSpin();

    console.log("initial spin data: " + spinData);
    gameManager.slot = slot.initializeSlot(spinData, reelData);

    var o = gameManager.slot.cont.displayObject;

    //o = objectManager.setCommonProperties(o, args);

    this.displayObject = o;

    objectManager.registerObject(this);

    console.log("creating slot object");

    return o;
  }
  this.makeInvisible = function(){
    this.displayObject.visible = false;
  }
  return this;
}

},{"./../../../../src":35,"./../../gameManager.js":2,"./../slot/serverSim/serverSim.js":5,"./../slot/slot.js":6,"pixi.js":10}],8:[function(require,module,exports){
var pixi = require('pixi.js');

var tapir = require('./../../../../src');
var objectManager = tapir.objectManagement.objectManager;
var assetManager = tapir.loader.assetManager;

module.exports = function(){
  this.dynTypeName = "spriteType";

  this.createObject = function(args){
    this.name = args.name;
    //find corresponding loader

    var o = new pixi.Sprite(gameManager.assetManager.loader.resources[args.background].texture);

    o = objectManager.setCommonProperties(o, args);

    this.displayObject = o;

    objectManager.registerObject(this);

    return o;
  }
  this.makeInvisible = function(){
    this.displayObject.visible = false;
  }
  return this;
}

},{"./../../../../src":35,"pixi.js":10}],9:[function(require,module,exports){
!function(e){function t(r){if(i[r])return i[r].exports;var n=i[r]={exports:{},id:r,loaded:!1};return e[r].call(n.exports,n,n.exports,t),n.loaded=!0,n.exports}var i={};return t.m=e,t.c=i,t.p="",t(0)}([function(e,t,i){e.exports=i(4)},function(e,t,i){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!t||"object"!=typeof t&&"function"!=typeof t?e:t}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t)}var o=function(){function e(e,t){for(var i=0;i<t.length;i++){var r=t[i];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,i,r){return i&&e(t.prototype,i),r&&e(t,r),t}}();Object.defineProperty(t,"__esModule",{value:!0});var u=i(2),l=r(u),h=function(e){function t(){var e=arguments.length<=0||void 0===arguments[0]?1:arguments[0],i=arguments[1];n(this,t);var r=a(this,Object.getPrototypeOf(t).call(this));return r.time=e,i&&r.addTo(i),r.active=!1,r.isEnded=!1,r.isStarted=!1,r.expire=!1,r.delay=0,r.repeat=0,r.loop=!1,r._delayTime=0,r._elapsedTime=0,r._repeat=0,r}return s(t,e),o(t,[{key:"addTo",value:function(e){return this.manager=e,this.manager.addTimer(this),this}},{key:"remove",value:function(){return this.manager?(this.manager.removeTimer(this),this):void 0}},{key:"start",value:function(){return this.active=!0,this}},{key:"stop",value:function(){return this.active=!1,this.emit("stop",this._elapsedTime),this}},{key:"reset",value:function(){return this._elapsedTime=0,this._repeat=0,this._delayTime=0,this.isStarted=!1,this.isEnded=!1,this}},{key:"update",value:function(e,t){if(this.active){if(this.delay>this._delayTime)return void(this._delayTime+=t);if(this.isStarted||(this.isStarted=!0,this.emit("start",this._elapsedTime)),this.time>this._elapsedTime){var i=this._elapsedTime+t,r=i>=this.time;if(this._elapsedTime=r?this.time:i,this.emit("update",this._elapsedTime,e),r){if(this.loop||this.repeat>this._repeat)return this._repeat++,this.emit("repeat",this._elapsedTime,this._repeat),void(this._elapsedTime=0);this.isEnded=!0,this.active=!1,this.emit("end",this._elapsedTime)}}}}}]),t}(l["default"].utils.EventEmitter);t["default"]=h},function(e,t){e.exports=PIXI},function(e,t,i){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}var a=function(){function e(e,t){for(var i=0;i<t.length;i++){var r=t[i];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r)}}return function(t,i,r){return i&&e(t.prototype,i),r&&e(t,r),t}}();Object.defineProperty(t,"__esModule",{value:!0});var s=i(1),o=r(s),u=function(){function e(){n(this,e),this.timers=[],this._timersToDelete=[],this._last=0}return a(e,[{key:"update",value:function(e){var t=void 0;e||0===e?t=1e3*e:(t=this._getDeltaMS(),e=t/1e3);for(var i=0;i<this.timers.length;i++){var r=this.timers[i];r.active&&(r.update(e,t),r.isEnded&&r.expire&&r.remove())}if(this._timersToDelete.length){for(var i=0;i<this._timersToDelete.length;i++)this._remove(this._timersToDelete[i]);this._timersToDelete.length=0}}},{key:"removeTimer",value:function(e){this._timersToDelete.push(e)}},{key:"addTimer",value:function(e){e.manager=this,this.timers.push(e)}},{key:"createTimer",value:function(e){return new o["default"](e,this)}},{key:"_remove",value:function(e){var t=this.timers.indexOf(e);t>0&&this.timers.splice(t,1)}},{key:"_getDeltaMS",value:function(){0===this._last&&(this._last=Date.now());var e=Date.now(),t=e-this._last;return this._last=e,t}}]),e}();t["default"]=u},function(e,t,i){"use strict";function r(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var n=i(2),a=r(n),s=i(3),o=r(s),u=i(1),l=r(u),h={TimerManager:o["default"],Timer:l["default"]};a["default"].timerManager||(a["default"].timerManager=new o["default"],a["default"].timer=h),t["default"]=h}]);

},{}],10:[function(require,module,exports){
(function (global){
/*!
 * pixi.js - v4.0.3
 * Compiled Thu Sep 29 2016 12:09:36 GMT-0400 (EDT)
 *
 * pixi.js is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
!function(t){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var e;e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,e.PIXI=t()}}(function(){var t;return function t(e,r,i){function n(o,a){if(!r[o]){if(!e[o]){var h="function"==typeof require&&require;if(!a&&h)return h(o,!0);if(s)return s(o,!0);var u=new Error("Cannot find module '"+o+"'");throw u.code="MODULE_NOT_FOUND",u}var l=r[o]={exports:{}};e[o][0].call(l.exports,function(t){var r=e[o][1][t];return n(r?r:t)},l,l.exports,t,e,r,i)}return r[o].exports}for(var s="function"==typeof require&&require,o=0;o<i.length;o++)n(i[o]);return n}({1:[function(t,e,r){"use strict";"use restrict";function i(t){var e=32;return t&=-t,t&&e--,65535&t&&(e-=16),16711935&t&&(e-=8),252645135&t&&(e-=4),858993459&t&&(e-=2),1431655765&t&&(e-=1),e}var n=32;r.INT_BITS=n,r.INT_MAX=2147483647,r.INT_MIN=-1<<n-1,r.sign=function(t){return(t>0)-(t<0)},r.abs=function(t){var e=t>>n-1;return(t^e)-e},r.min=function(t,e){return e^(t^e)&-(t<e)},r.max=function(t,e){return t^(t^e)&-(t<e)},r.isPow2=function(t){return!(t&t-1||!t)},r.log2=function(t){var e,r;return e=(t>65535)<<4,t>>>=e,r=(t>255)<<3,t>>>=r,e|=r,r=(t>15)<<2,t>>>=r,e|=r,r=(t>3)<<1,t>>>=r,e|=r,e|t>>1},r.log10=function(t){return t>=1e9?9:t>=1e8?8:t>=1e7?7:t>=1e6?6:t>=1e5?5:t>=1e4?4:t>=1e3?3:t>=100?2:t>=10?1:0},r.popCount=function(t){return t-=t>>>1&1431655765,t=(858993459&t)+(t>>>2&858993459),16843009*(t+(t>>>4)&252645135)>>>24},r.countTrailingZeros=i,r.nextPow2=function(t){return t+=0===t,--t,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t+1},r.prevPow2=function(t){return t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t-(t>>>1)},r.parity=function(t){return t^=t>>>16,t^=t>>>8,t^=t>>>4,t&=15,27030>>>t&1};var s=new Array(256);!function(t){for(var e=0;e<256;++e){var r=e,i=e,n=7;for(r>>>=1;r;r>>>=1)i<<=1,i|=1&r,--n;t[e]=i<<n&255}}(s),r.reverse=function(t){return s[255&t]<<24|s[t>>>8&255]<<16|s[t>>>16&255]<<8|s[t>>>24&255]},r.interleave2=function(t,e){return t&=65535,t=16711935&(t|t<<8),t=252645135&(t|t<<4),t=858993459&(t|t<<2),t=1431655765&(t|t<<1),e&=65535,e=16711935&(e|e<<8),e=252645135&(e|e<<4),e=858993459&(e|e<<2),e=1431655765&(e|e<<1),t|e<<1},r.deinterleave2=function(t,e){return t=t>>>e&1431655765,t=858993459&(t|t>>>1),t=252645135&(t|t>>>2),t=16711935&(t|t>>>4),t=65535&(t|t>>>16),t<<16>>16},r.interleave3=function(t,e,r){return t&=1023,t=4278190335&(t|t<<16),t=251719695&(t|t<<8),t=3272356035&(t|t<<4),t=1227133513&(t|t<<2),e&=1023,e=4278190335&(e|e<<16),e=251719695&(e|e<<8),e=3272356035&(e|e<<4),e=1227133513&(e|e<<2),t|=e<<1,r&=1023,r=4278190335&(r|r<<16),r=251719695&(r|r<<8),r=3272356035&(r|r<<4),r=1227133513&(r|r<<2),t|r<<2},r.deinterleave3=function(t,e){return t=t>>>e&1227133513,t=3272356035&(t|t>>>2),t=251719695&(t|t>>>4),t=4278190335&(t|t>>>8),t=1023&(t|t>>>16),t<<22>>22},r.nextCombination=function(t){var e=t|t-1;return e+1|(~e&-~e)-1>>>i(t)+1}},{}],2:[function(t,e,r){"use strict";function i(t,e,r){r=r||2;var i=e&&e.length,s=i?e[0]*r:t.length,a=n(t,0,s,r,!0),h=[];if(!a)return h;var u,l,d,p,f,v,g;if(i&&(a=c(t,e,a,r)),t.length>80*r){u=d=t[0],l=p=t[1];for(var y=r;y<s;y+=r)f=t[y],v=t[y+1],f<u&&(u=f),v<l&&(l=v),f>d&&(d=f),v>p&&(p=v);g=Math.max(d-u,p-l)}return o(a,h,r,u,l,g),h}function n(t,e,r,i,n){var s,o;if(n===D(t,e,r,i)>0)for(s=e;s<r;s+=i)o=M(s,t[s],t[s+1],o);else for(s=r-i;s>=e;s-=i)o=M(s,t[s],t[s+1],o);return o&&T(o,o.next)&&(A(o),o=o.next),o}function s(t,e){if(!t)return t;e||(e=t);var r,i=t;do if(r=!1,i.steiner||!T(i,i.next)&&0!==b(i.prev,i,i.next))i=i.next;else{if(A(i),i=e=i.prev,i===i.next)return null;r=!0}while(r||i!==e);return e}function o(t,e,r,i,n,c,d){if(t){!d&&c&&v(t,i,n,c);for(var p,f,g=t;t.prev!==t.next;)if(p=t.prev,f=t.next,c?h(t,i,n,c):a(t))e.push(p.i/r),e.push(t.i/r),e.push(f.i/r),A(t),t=f.next,g=f.next;else if(t=f,t===g){d?1===d?(t=u(t,e,r),o(t,e,r,i,n,c,2)):2===d&&l(t,e,r,i,n,c):o(s(t),e,r,i,n,c,1);break}}}function a(t){var e=t.prev,r=t,i=t.next;if(b(e,r,i)>=0)return!1;for(var n=t.next.next;n!==t.prev;){if(m(e.x,e.y,r.x,r.y,i.x,i.y,n.x,n.y)&&b(n.prev,n,n.next)>=0)return!1;n=n.next}return!0}function h(t,e,r,i){var n=t.prev,s=t,o=t.next;if(b(n,s,o)>=0)return!1;for(var a=n.x<s.x?n.x<o.x?n.x:o.x:s.x<o.x?s.x:o.x,h=n.y<s.y?n.y<o.y?n.y:o.y:s.y<o.y?s.y:o.y,u=n.x>s.x?n.x>o.x?n.x:o.x:s.x>o.x?s.x:o.x,l=n.y>s.y?n.y>o.y?n.y:o.y:s.y>o.y?s.y:o.y,c=y(a,h,e,r,i),d=y(u,l,e,r,i),p=t.nextZ;p&&p.z<=d;){if(p!==t.prev&&p!==t.next&&m(n.x,n.y,s.x,s.y,o.x,o.y,p.x,p.y)&&b(p.prev,p,p.next)>=0)return!1;p=p.nextZ}for(p=t.prevZ;p&&p.z>=c;){if(p!==t.prev&&p!==t.next&&m(n.x,n.y,s.x,s.y,o.x,o.y,p.x,p.y)&&b(p.prev,p,p.next)>=0)return!1;p=p.prevZ}return!0}function u(t,e,r){var i=t;do{var n=i.prev,s=i.next.next;!T(n,s)&&E(n,i,i.next,s)&&S(n,s)&&S(s,n)&&(e.push(n.i/r),e.push(i.i/r),e.push(s.i/r),A(i),A(i.next),i=t=s),i=i.next}while(i!==t);return i}function l(t,e,r,i,n,a){var h=t;do{for(var u=h.next.next;u!==h.prev;){if(h.i!==u.i&&_(h,u)){var l=R(h,u);return h=s(h,h.next),l=s(l,l.next),o(h,e,r,i,n,a),void o(l,e,r,i,n,a)}u=u.next}h=h.next}while(h!==t)}function c(t,e,r,i){var o,a,h,u,l,c=[];for(o=0,a=e.length;o<a;o++)h=e[o]*i,u=o<a-1?e[o+1]*i:t.length,l=n(t,h,u,i,!1),l===l.next&&(l.steiner=!0),c.push(x(l));for(c.sort(d),o=0;o<c.length;o++)p(c[o],r),r=s(r,r.next);return r}function d(t,e){return t.x-e.x}function p(t,e){if(e=f(t,e)){var r=R(e,t);s(r,r.next)}}function f(t,e){var r,i=e,n=t.x,s=t.y,o=-(1/0);do{if(s<=i.y&&s>=i.next.y){var a=i.x+(s-i.y)*(i.next.x-i.x)/(i.next.y-i.y);if(a<=n&&a>o){if(o=a,a===n){if(s===i.y)return i;if(s===i.next.y)return i.next}r=i.x<i.next.x?i:i.next}}i=i.next}while(i!==e);if(!r)return null;if(n===o)return r.prev;var h,u=r,l=r.x,c=r.y,d=1/0;for(i=r.next;i!==u;)n>=i.x&&i.x>=l&&m(s<c?n:o,s,l,c,s<c?o:n,s,i.x,i.y)&&(h=Math.abs(s-i.y)/(n-i.x),(h<d||h===d&&i.x>r.x)&&S(i,t)&&(r=i,d=h)),i=i.next;return r}function v(t,e,r,i){var n=t;do null===n.z&&(n.z=y(n.x,n.y,e,r,i)),n.prevZ=n.prev,n.nextZ=n.next,n=n.next;while(n!==t);n.prevZ.nextZ=null,n.prevZ=null,g(n)}function g(t){var e,r,i,n,s,o,a,h,u=1;do{for(r=t,t=null,s=null,o=0;r;){for(o++,i=r,a=0,e=0;e<u&&(a++,i=i.nextZ,i);e++);for(h=u;a>0||h>0&&i;)0===a?(n=i,i=i.nextZ,h--):0!==h&&i?r.z<=i.z?(n=r,r=r.nextZ,a--):(n=i,i=i.nextZ,h--):(n=r,r=r.nextZ,a--),s?s.nextZ=n:t=n,n.prevZ=s,s=n;r=i}s.nextZ=null,u*=2}while(o>1);return t}function y(t,e,r,i,n){return t=32767*(t-r)/n,e=32767*(e-i)/n,t=16711935&(t|t<<8),t=252645135&(t|t<<4),t=858993459&(t|t<<2),t=1431655765&(t|t<<1),e=16711935&(e|e<<8),e=252645135&(e|e<<4),e=858993459&(e|e<<2),e=1431655765&(e|e<<1),t|e<<1}function x(t){var e=t,r=t;do e.x<r.x&&(r=e),e=e.next;while(e!==t);return r}function m(t,e,r,i,n,s,o,a){return(n-o)*(e-a)-(t-o)*(s-a)>=0&&(t-o)*(i-a)-(r-o)*(e-a)>=0&&(r-o)*(s-a)-(n-o)*(i-a)>=0}function _(t,e){return t.next.i!==e.i&&t.prev.i!==e.i&&!w(t,e)&&S(t,e)&&S(e,t)&&C(t,e)}function b(t,e,r){return(e.y-t.y)*(r.x-e.x)-(e.x-t.x)*(r.y-e.y)}function T(t,e){return t.x===e.x&&t.y===e.y}function E(t,e,r,i){return!!(T(t,e)&&T(r,i)||T(t,i)&&T(r,e))||b(t,e,r)>0!=b(t,e,i)>0&&b(r,i,t)>0!=b(r,i,e)>0}function w(t,e){var r=t;do{if(r.i!==t.i&&r.next.i!==t.i&&r.i!==e.i&&r.next.i!==e.i&&E(r,r.next,t,e))return!0;r=r.next}while(r!==t);return!1}function S(t,e){return b(t.prev,t,t.next)<0?b(t,e,t.next)>=0&&b(t,t.prev,e)>=0:b(t,e,t.prev)<0||b(t,t.next,e)<0}function C(t,e){var r=t,i=!1,n=(t.x+e.x)/2,s=(t.y+e.y)/2;do r.y>s!=r.next.y>s&&n<(r.next.x-r.x)*(s-r.y)/(r.next.y-r.y)+r.x&&(i=!i),r=r.next;while(r!==t);return i}function R(t,e){var r=new O(t.i,t.x,t.y),i=new O(e.i,e.x,e.y),n=t.next,s=e.prev;return t.next=e,e.prev=t,r.next=n,n.prev=r,i.next=r,r.prev=i,s.next=i,i.prev=s,i}function M(t,e,r,i){var n=new O(t,e,r);return i?(n.next=i.next,n.prev=i,i.next.prev=n,i.next=n):(n.prev=n,n.next=n),n}function A(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ)}function O(t,e,r){this.i=t,this.x=e,this.y=r,this.prev=null,this.next=null,this.z=null,this.prevZ=null,this.nextZ=null,this.steiner=!1}function D(t,e,r,i){for(var n=0,s=e,o=r-i;s<r;s+=i)n+=(t[o]-t[s])*(t[s+1]+t[o+1]),o=s;return n}e.exports=i,i.deviation=function(t,e,r,i){var n=e&&e.length,s=n?e[0]*r:t.length,o=Math.abs(D(t,0,s,r));if(n)for(var a=0,h=e.length;a<h;a++){var u=e[a]*r,l=a<h-1?e[a+1]*r:t.length;o-=Math.abs(D(t,u,l,r))}var c=0;for(a=0;a<i.length;a+=3){var d=i[a]*r,p=i[a+1]*r,f=i[a+2]*r;c+=Math.abs((t[d]-t[f])*(t[p+1]-t[d+1])-(t[d]-t[p])*(t[f+1]-t[d+1]))}return 0===o&&0===c?0:Math.abs((c-o)/o)},i.flatten=function(t){for(var e=t[0][0].length,r={vertices:[],holes:[],dimensions:e},i=0,n=0;n<t.length;n++){for(var s=0;s<t[n].length;s++)for(var o=0;o<e;o++)r.vertices.push(t[n][s][o]);n>0&&(i+=t[n-1].length,r.holes.push(i))}return r}},{}],3:[function(t,e,r){"use strict";function i(t,e,r){this.fn=t,this.context=e,this.once=r||!1}function n(){}var s=Object.prototype.hasOwnProperty,o="function"!=typeof Object.create&&"~";n.prototype._events=void 0,n.prototype.eventNames=function(){var t,e=this._events,r=[];if(!e)return r;for(t in e)s.call(e,t)&&r.push(o?t.slice(1):t);return Object.getOwnPropertySymbols?r.concat(Object.getOwnPropertySymbols(e)):r},n.prototype.listeners=function(t,e){var r=o?o+t:t,i=this._events&&this._events[r];if(e)return!!i;if(!i)return[];if(i.fn)return[i.fn];for(var n=0,s=i.length,a=new Array(s);n<s;n++)a[n]=i[n].fn;return a},n.prototype.emit=function(t,e,r,i,n,s){var a=o?o+t:t;if(!this._events||!this._events[a])return!1;var h,u,l=this._events[a],c=arguments.length;if("function"==typeof l.fn){switch(l.once&&this.removeListener(t,l.fn,void 0,!0),c){case 1:return l.fn.call(l.context),!0;case 2:return l.fn.call(l.context,e),!0;case 3:return l.fn.call(l.context,e,r),!0;case 4:return l.fn.call(l.context,e,r,i),!0;case 5:return l.fn.call(l.context,e,r,i,n),!0;case 6:return l.fn.call(l.context,e,r,i,n,s),!0}for(u=1,h=new Array(c-1);u<c;u++)h[u-1]=arguments[u];l.fn.apply(l.context,h)}else{var d,p=l.length;for(u=0;u<p;u++)switch(l[u].once&&this.removeListener(t,l[u].fn,void 0,!0),c){case 1:l[u].fn.call(l[u].context);break;case 2:l[u].fn.call(l[u].context,e);break;case 3:l[u].fn.call(l[u].context,e,r);break;default:if(!h)for(d=1,h=new Array(c-1);d<c;d++)h[d-1]=arguments[d];l[u].fn.apply(l[u].context,h)}}return!0},n.prototype.on=function(t,e,r){var n=new i(e,r||this),s=o?o+t:t;return this._events||(this._events=o?{}:Object.create(null)),this._events[s]?this._events[s].fn?this._events[s]=[this._events[s],n]:this._events[s].push(n):this._events[s]=n,this},n.prototype.once=function(t,e,r){var n=new i(e,r||this,(!0)),s=o?o+t:t;return this._events||(this._events=o?{}:Object.create(null)),this._events[s]?this._events[s].fn?this._events[s]=[this._events[s],n]:this._events[s].push(n):this._events[s]=n,this},n.prototype.removeListener=function(t,e,r,i){var n=o?o+t:t;if(!this._events||!this._events[n])return this;var s=this._events[n],a=[];if(e)if(s.fn)(s.fn!==e||i&&!s.once||r&&s.context!==r)&&a.push(s);else for(var h=0,u=s.length;h<u;h++)(s[h].fn!==e||i&&!s[h].once||r&&s[h].context!==r)&&a.push(s[h]);return a.length?this._events[n]=1===a.length?a[0]:a:delete this._events[n],this},n.prototype.removeAllListeners=function(t){return this._events?(t?delete this._events[o?o+t:t]:this._events=o?{}:Object.create(null),this):this},n.prototype.off=n.prototype.removeListener,n.prototype.addListener=n.prototype.on,n.prototype.setMaxListeners=function(){return this},n.prefixed=o,"undefined"!=typeof e&&(e.exports=n)},{}],4:[function(e,r,i){!function(e){var i=/iPhone/i,n=/iPod/i,s=/iPad/i,o=/(?=.*\bAndroid\b)(?=.*\bMobile\b)/i,a=/Android/i,h=/(?=.*\bAndroid\b)(?=.*\bSD4930UR\b)/i,u=/(?=.*\bAndroid\b)(?=.*\b(?:KFOT|KFTT|KFJWI|KFJWA|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|KFARWI|KFASWI|KFSAWI|KFSAWA)\b)/i,l=/IEMobile/i,c=/(?=.*\bWindows\b)(?=.*\bARM\b)/i,d=/BlackBerry/i,p=/BB10/i,f=/Opera Mini/i,v=/(CriOS|Chrome)(?=.*\bMobile\b)/i,g=/(?=.*\bFirefox\b)(?=.*\bMobile\b)/i,y=new RegExp("(?:Nexus 7|BNTV250|Kindle Fire|Silk|GT-P1000)","i"),x=function(t,e){return t.test(e)},m=function(t){var e=t||navigator.userAgent,r=e.split("[FBAN");if("undefined"!=typeof r[1]&&(e=r[0]),r=e.split("Twitter"),"undefined"!=typeof r[1]&&(e=r[0]),this.apple={phone:x(i,e),ipod:x(n,e),tablet:!x(i,e)&&x(s,e),device:x(i,e)||x(n,e)||x(s,e)},this.amazon={phone:x(h,e),tablet:!x(h,e)&&x(u,e),device:x(h,e)||x(u,e)},this.android={phone:x(h,e)||x(o,e),tablet:!x(h,e)&&!x(o,e)&&(x(u,e)||x(a,e)),device:x(h,e)||x(u,e)||x(o,e)||x(a,e)},this.windows={phone:x(l,e),tablet:x(c,e),device:x(l,e)||x(c,e)},this.other={blackberry:x(d,e),blackberry10:x(p,e),opera:x(f,e),firefox:x(g,e),chrome:x(v,e),device:x(d,e)||x(p,e)||x(f,e)||x(g,e)||x(v,e)},this.seven_inch=x(y,e),this.any=this.apple.device||this.android.device||this.windows.device||this.other.device||this.seven_inch,this.phone=this.apple.phone||this.android.phone||this.windows.phone,this.tablet=this.apple.tablet||this.android.tablet||this.windows.tablet,"undefined"==typeof window)return this},_=function(){var t=new m;return t.Class=m,t};"undefined"!=typeof r&&r.exports&&"undefined"==typeof window?r.exports=m:"undefined"!=typeof r&&r.exports&&"undefined"!=typeof window?r.exports=_():"function"==typeof t&&t.amd?t("isMobile",[],e.isMobile=_()):e.isMobile=_()}(this)},{}],5:[function(t,e,r){"use strict";function i(t){if(null===t||void 0===t)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(t)}function n(){try{if(!Object.assign)return!1;var t=new String("abc");if(t[5]="de","5"===Object.getOwnPropertyNames(t)[0])return!1;for(var e={},r=0;r<10;r++)e["_"+String.fromCharCode(r)]=r;var i=Object.getOwnPropertyNames(e).map(function(t){return e[t]});if("0123456789"!==i.join(""))return!1;var n={};return"abcdefghijklmnopqrst".split("").forEach(function(t){n[t]=t}),"abcdefghijklmnopqrst"===Object.keys(Object.assign({},n)).join("")}catch(t){return!1}}var s=Object.prototype.hasOwnProperty,o=Object.prototype.propertyIsEnumerable;e.exports=n()?Object.assign:function(t,e){for(var r,n,a=i(t),h=1;h<arguments.length;h++){r=Object(arguments[h]);for(var u in r)s.call(r,u)&&(a[u]=r[u]);if(Object.getOwnPropertySymbols){n=Object.getOwnPropertySymbols(r);for(var l=0;l<n.length;l++)o.call(r,n[l])&&(a[n[l]]=r[n[l]])}}return a}},{}],6:[function(t,e,r){var i=new ArrayBuffer(0),n=function(t,e,r,n){this.gl=t,this.buffer=t.createBuffer(),this.type=e||t.ARRAY_BUFFER,this.drawType=n||t.STATIC_DRAW,this.data=i,r&&this.upload(r)};n.prototype.upload=function(t,e,r){r||this.bind();var i=this.gl;t=t||this.data,e=e||0,this.data.byteLength>=t.byteLength?i.bufferSubData(this.type,e,t):i.bufferData(this.type,t,this.drawType),this.data=t},n.prototype.bind=function(){var t=this.gl;t.bindBuffer(this.type,this.buffer)},n.createVertexBuffer=function(t,e,r){return new n(t,t.ARRAY_BUFFER,e,r)},n.createIndexBuffer=function(t,e,r){return new n(t,t.ELEMENT_ARRAY_BUFFER,e,r)},n.create=function(t,e,r,i){return new n(t,e,i)},n.prototype.destroy=function(){this.gl.deleteBuffer(this.buffer)},e.exports=n},{}],7:[function(t,e,r){var i=t("./GLTexture"),n=function(t,e,r){this.gl=t,this.framebuffer=t.createFramebuffer(),this.stencil=null,this.texture=null,this.width=e||100,this.height=r||100};n.prototype.enableTexture=function(t){var e=this.gl;this.texture=t||new i(e),this.texture.bind(),this.bind(),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,this.texture.texture,0)},n.prototype.enableStencil=function(){if(!this.stencil){var t=this.gl;this.stencil=t.createRenderbuffer(),t.bindRenderbuffer(t.RENDERBUFFER,this.stencil),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.RENDERBUFFER,this.stencil),t.renderbufferStorage(t.RENDERBUFFER,t.DEPTH_STENCIL,this.width,this.height)}},n.prototype.clear=function(t,e,r,i){this.bind();var n=this.gl;n.clearColor(t,e,r,i),n.clear(n.COLOR_BUFFER_BIT)},n.prototype.bind=function(){var t=this.gl;this.texture&&this.texture.unbind(),t.bindFramebuffer(t.FRAMEBUFFER,this.framebuffer)},n.prototype.unbind=function(){var t=this.gl;t.bindFramebuffer(t.FRAMEBUFFER,null)},n.prototype.resize=function(t,e){var r=this.gl;this.width=t,this.height=e,this.texture&&this.texture.uploadData(null,t,e),this.stencil&&(r.bindRenderbuffer(r.RENDERBUFFER,this.stencil),r.renderbufferStorage(r.RENDERBUFFER,r.DEPTH_STENCIL,t,e))},n.prototype.destroy=function(){var t=this.gl;this.texture&&this.texture.destroy(),t.deleteFramebuffer(this.framebuffer),this.gl=null,this.stencil=null,this.texture=null},n.createRGBA=function(t,e,r){var s=i.fromData(t,null,e,r);s.enableNearestScaling(),s.enableWrapClamp();var o=new n(t,e,r);return o.enableTexture(s),o.unbind(),o},n.createFloat32=function(t,e,r,s){var o=new i.fromData(t,s,e,r);o.enableNearestScaling(),o.enableWrapClamp();var a=new n(t,e,r);return a.enableTexture(o),a.unbind(),a},e.exports=n},{"./GLTexture":9}],8:[function(t,e,r){var i=t("./shader/compileProgram"),n=t("./shader/extractAttributes"),s=t("./shader/extractUniforms"),o=t("./shader/generateUniformAccessObject"),a=function(t,e,r){this.gl=t,this.program=i(t,e,r),this.attributes=n(t,this.program);var a=s(t,this.program);this.uniforms=o(t,a)};a.prototype.bind=function(){this.gl.useProgram(this.program)},a.prototype.destroy=function(){},e.exports=a},{"./shader/compileProgram":14,"./shader/extractAttributes":16,"./shader/extractUniforms":17,"./shader/generateUniformAccessObject":18}],9:[function(t,e,r){var i=function(t,e,r,i,n){this.gl=t,this.texture=t.createTexture(),this.mipmap=!1,this.premultiplyAlpha=!1,this.width=e||0,this.height=r||0,this.format=i||t.RGBA,this.type=n||t.UNSIGNED_BYTE};i.prototype.upload=function(t){this.bind();var e=this.gl;this.width=t.videoWidth||t.width,this.height=t.videoHeight||t.height,e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),e.texImage2D(e.TEXTURE_2D,0,this.format,this.format,this.type,t)};var n=!1;i.prototype.uploadData=function(t,e,r){this.bind();var i=this.gl;if(this.width=e||this.width,this.height=r||this.height,t instanceof Float32Array){if(!n){var s=i.getExtension("OES_texture_float");if(!s)throw new Error("floating point textures not available");n=!0}this.type=i.FLOAT}else this.type=i.UNSIGNED_BYTE;i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),i.texImage2D(i.TEXTURE_2D,0,this.format,this.width,this.height,0,this.format,this.type,t||null)},i.prototype.bind=function(t){var e=this.gl;void 0!==t&&e.activeTexture(e.TEXTURE0+t),e.bindTexture(e.TEXTURE_2D,this.texture)},i.prototype.unbind=function(){var t=this.gl;t.bindTexture(t.TEXTURE_2D,null)},i.prototype.minFilter=function(t){var e=this.gl;this.bind(),this.mipmap?e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,t?e.LINEAR_MIPMAP_LINEAR:e.NEAREST_MIPMAP_NEAREST):e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,t?e.LINEAR:e.NEAREST)},i.prototype.magFilter=function(t){var e=this.gl;this.bind(),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,t?e.LINEAR:e.NEAREST)},i.prototype.enableMipmap=function(){var t=this.gl;this.bind(),this.mipmap=!0,t.generateMipmap(t.TEXTURE_2D)},i.prototype.enableLinearScaling=function(){this.minFilter(!0),this.magFilter(!0)},i.prototype.enableNearestScaling=function(){this.minFilter(!1),this.magFilter(!1)},i.prototype.enableWrapClamp=function(){var t=this.gl;this.bind(),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE)},i.prototype.enableWrapRepeat=function(){var t=this.gl;this.bind(),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.REPEAT)},i.prototype.enableWrapMirrorRepeat=function(){var t=this.gl;this.bind(),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.MIRRORED_REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.MIRRORED_REPEAT)},i.prototype.destroy=function(){var t=this.gl;t.deleteTexture(this.texture)},i.fromSource=function(t,e,r){var n=new i(t);return n.premultiplyAlpha=r||!1,n.upload(e),n},i.fromData=function(t,e,r,n){var s=new i(t);return s.uploadData(e,r,n),s},e.exports=i},{}],10:[function(t,e,r){function i(t,e){if(this.nativeVaoExtension=null,i.FORCE_NATIVE||(this.nativeVaoExtension=t.getExtension("OES_vertex_array_object")||t.getExtension("MOZ_OES_vertex_array_object")||t.getExtension("WEBKIT_OES_vertex_array_object")),this.nativeState=e,this.nativeVaoExtension){this.nativeVao=this.nativeVaoExtension.createVertexArrayOES();var r=t.getParameter(t.MAX_VERTEX_ATTRIBS);this.nativeState={tempAttribState:new Array(r),attribState:new Array(r)}}this.gl=t,this.attributes=[],this.indexBuffer=null,this.dirty=!1}var n=t("./setVertexAttribArrays");i.prototype.constructor=i,e.exports=i,i.FORCE_NATIVE=!1,i.prototype.bind=function(){return this.nativeVao?(this.nativeVaoExtension.bindVertexArrayOES(this.nativeVao),this.dirty&&(this.dirty=!1,this.activate())):this.activate(),this},i.prototype.unbind=function(){return this.nativeVao&&this.nativeVaoExtension.bindVertexArrayOES(null),this},i.prototype.activate=function(){for(var t=this.gl,e=null,r=0;r<this.attributes.length;r++){var i=this.attributes[r];e!==i.buffer&&(i.buffer.bind(),e=i.buffer),t.vertexAttribPointer(i.attribute.location,i.attribute.size,i.type||t.FLOAT,i.normalized||!1,i.stride||0,i.start||0)}return n(t,this.attributes,this.nativeState),this.indexBuffer.bind(),this},i.prototype.addAttribute=function(t,e,r,i,n,s){return this.attributes.push({buffer:t,attribute:e,location:e.location,type:r||this.gl.FLOAT,normalized:i||!1,stride:n||0,start:s||0}),this.dirty=!0,this},i.prototype.addIndex=function(t){return this.indexBuffer=t,this.dirty=!0,this},i.prototype.clear=function(){return this.nativeVao&&this.nativeVaoExtension.bindVertexArrayOES(this.nativeVao),this.attributes.length=0,this.indexBuffer=null,this},i.prototype.draw=function(t,e,r){var i=this.gl;return i.drawElements(t,e,i.UNSIGNED_SHORT,r||0),this},i.prototype.destroy=function(){this.gl=null,this.indexBuffer=null,this.attributes=null,this.nativeState=null,this.nativeVao&&this.nativeVaoExtension.deleteVertexArrayOES(this.nativeVao),this.nativeVaoExtension=null,this.nativeVao=null}},{"./setVertexAttribArrays":13}],11:[function(t,e,r){var i=function(t,e){var r=t.getContext("webgl",e)||t.getContext("experimental-webgl",e);if(!r)throw new Error("This browser does not support webGL. Try using the canvas renderer");return r};e.exports=i},{}],12:[function(t,e,r){var i={createContext:t("./createContext"),setVertexAttribArrays:t("./setVertexAttribArrays"),GLBuffer:t("./GLBuffer"),GLFramebuffer:t("./GLFramebuffer"),GLShader:t("./GLShader"),GLTexture:t("./GLTexture"),VertexArrayObject:t("./VertexArrayObject"),shader:t("./shader")};"undefined"!=typeof e&&e.exports&&(e.exports=i),"undefined"!=typeof window&&(window.pixi={gl:i})},{"./GLBuffer":6,"./GLFramebuffer":7,"./GLShader":8,"./GLTexture":9,"./VertexArrayObject":10,"./createContext":11,"./setVertexAttribArrays":13,"./shader":19}],13:[function(t,e,r){var i=function(t,e,r){var i;if(r){var n=r.tempAttribState,s=r.attribState;for(i=0;i<n.length;i++)n[i]=!1;for(i=0;i<e.length;i++)n[e[i].attribute.location]=!0;for(i=0;i<s.length;i++)s[i]!==n[i]&&(s[i]=n[i],r.attribState[i]?t.enableVertexAttribArray(i):t.disableVertexAttribArray(i))}else for(i=0;i<e.length;i++){var o=e[i];t.enableVertexAttribArray(o.attribute.location)}};e.exports=i},{}],14:[function(t,e,r){var i=function(t,e,r){var i=n(t,t.VERTEX_SHADER,e),s=n(t,t.FRAGMENT_SHADER,r),o=t.createProgram();return t.attachShader(o,i),t.attachShader(o,s),t.linkProgram(o),t.getProgramParameter(o,t.LINK_STATUS)||(console.error("Pixi.js Error: Could not initialize shader."),console.error("gl.VALIDATE_STATUS",t.getProgramParameter(o,t.VALIDATE_STATUS)),console.error("gl.getError()",t.getError()),""!==t.getProgramInfoLog(o)&&console.warn("Pixi.js Warning: gl.getProgramInfoLog()",t.getProgramInfoLog(o)),t.deleteProgram(o),o=null),t.deleteShader(i),t.deleteShader(s),o},n=function(t,e,r){var i=t.createShader(e);return t.shaderSource(i,r),t.compileShader(i),t.getShaderParameter(i,t.COMPILE_STATUS)?i:(console.log(t.getShaderInfoLog(i)),null)};e.exports=i},{}],15:[function(t,e,r){var i=function(t,e){switch(t){case"float":return 0;case"vec2":return new Float32Array(2*e);case"vec3":return new Float32Array(3*e);case"vec4":return new Float32Array(4*e);case"int":case"sampler2D":return 0;case"ivec2":return new Int32Array(2*e);case"ivec3":return new Int32Array(3*e);case"ivec4":return new Int32Array(4*e);case"bool":return!1;case"bvec2":return n(2*e);case"bvec3":return n(3*e);case"bvec4":return n(4*e);case"mat2":return new Float32Array([1,0,0,1]);case"mat3":return new Float32Array([1,0,0,0,1,0,0,0,1]);case"mat4":return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}},n=function(t){for(var e=new Array(t),r=0;r<e.length;r++)e[r]=!1;return e};e.exports=i},{}],16:[function(t,e,r){var i=t("./mapType"),n=t("./mapSize"),s=function(t,e){for(var r={},s=t.getProgramParameter(e,t.ACTIVE_ATTRIBUTES),a=0;a<s;a++){var h=t.getActiveAttrib(e,a),u=i(t,h.type);r[h.name]={type:u,size:n(u),location:t.getAttribLocation(e,h.name),pointer:o}}return r},o=function(t,e,r,i){gl.vertexAttribPointer(this.location,this.size,t||gl.FLOAT,e||!1,r||0,i||0)};e.exports=s},{"./mapSize":20,"./mapType":21}],17:[function(t,e,r){var i=t("./mapType"),n=t("./defaultValue"),s=function(t,e){for(var r={},s=t.getProgramParameter(e,t.ACTIVE_UNIFORMS),o=0;o<s;o++){var a=t.getActiveUniform(e,o),h=a.name.replace(/\[.*?\]/,""),u=i(t,a.type);r[h]={type:u,size:a.size,location:t.getUniformLocation(e,h),value:n(u,a.size)}}return r};e.exports=s},{"./defaultValue":15,"./mapType":21}],18:[function(t,e,r){var i=function(t,e){var r={data:{}};r.gl=t;for(var i=Object.keys(e),a=0;a<i.length;a++){var h=i[a],u=h.split("."),l=u[u.length-1],c=o(u,r),d=e[h];c.data[l]=d,c.gl=t,Object.defineProperty(c,l,{get:n(l),set:s(l,d)})}return r},n=function(t){var e=a.replace("%%",t);return new Function(e)},s=function(t,e){var r,i=h.replace(/%%/g,t);return r=1===e.size?u[e.type]:l[e.type],r&&(i+="\nthis.gl."+r+";"),new Function("value",i)},o=function(t,e){for(var r=e,i=0;i<t.length-1;i++){var n=r[t[i]]||{data:{}};r[t[i]]=n,r=n}return r},a=["return this.data.%%.value;"].join("\n"),h=["this.data.%%.value = value;","var location = this.data.%%.location;"].join("\n"),u={float:"uniform1f(location, value)",vec2:"uniform2f(location, value[0], value[1])",vec3:"uniform3f(location, value[0], value[1], value[2])",vec4:"uniform4f(location, value[0], value[1], value[2], value[3])",int:"uniform1i(location, value)",ivec2:"uniform2i(location, value[0], value[1])",ivec3:"uniform3i(location, value[0], value[1], value[2])",ivec4:"uniform4i(location, value[0], value[1], value[2], value[3])",bool:"uniform1i(location, value)",bvec2:"uniform2i(location, value[0], value[1])",bvec3:"uniform3i(location, value[0], value[1], value[2])",bvec4:"uniform4i(location, value[0], value[1], value[2], value[3])",mat2:"uniformMatrix2fv(location, false, value)",mat3:"uniformMatrix3fv(location, false, value)",mat4:"uniformMatrix4fv(location, false, value)",sampler2D:"uniform1i(location, value)"},l={float:"uniform1fv(location, value)",vec2:"uniform2fv(location, value)",vec3:"uniform3fv(location, value)",vec4:"uniform4fv(location, value)",int:"uniform1iv(location, value)",ivec2:"uniform2iv(location, value)",ivec3:"uniform3iv(location, value)",ivec4:"uniform4iv(location, value)",bool:"uniform1iv(location, value)",bvec2:"uniform2iv(location, value)",bvec3:"uniform3iv(location, value)",bvec4:"uniform4iv(location, value)",sampler2D:"uniform1iv(location, value)"};e.exports=i},{}],19:[function(t,e,r){e.exports={compileProgram:t("./compileProgram"),defaultValue:t("./defaultValue"),extractAttributes:t("./extractAttributes"),extractUniforms:t("./extractUniforms"),generateUniformAccessObject:t("./generateUniformAccessObject"),mapSize:t("./mapSize"),mapType:t("./mapType")}},{"./compileProgram":14,"./defaultValue":15,"./extractAttributes":16,"./extractUniforms":17,"./generateUniformAccessObject":18,"./mapSize":20,"./mapType":21}],20:[function(t,e,r){var i=function(t){return n[t]},n={float:1,vec2:2,vec3:3,vec4:4,int:1,ivec2:2,ivec3:3,ivec4:4,bool:1,bvec2:2,bvec3:3,bvec4:4,mat2:4,mat3:9,mat4:16,sampler2D:1};e.exports=i},{}],21:[function(t,e,r){var i=function(t,e){if(!n){var r=Object.keys(s);n={};for(var i=0;i<r.length;++i){var o=r[i];n[t[o]]=s[o]}}return n[e]},n=null,s={FLOAT:"float",FLOAT_VEC2:"vec2",FLOAT_VEC3:"vec3",FLOAT_VEC4:"vec4",INT:"int",INT_VEC2:"ivec2",INT_VEC3:"ivec3",INT_VEC4:"ivec4",BOOL:"bool",BOOL_VEC2:"bvec2",BOOL_VEC3:"bvec3",BOOL_VEC4:"bvec4",FLOAT_MAT2:"mat2",FLOAT_MAT3:"mat3",FLOAT_MAT4:"mat4",SAMPLER_2D:"sampler2D"};e.exports=i},{}],22:[function(t,e,r){(function(t){function e(t,e){for(var r=0,i=t.length-1;i>=0;i--){var n=t[i];"."===n?t.splice(i,1):".."===n?(t.splice(i,1),r++):r&&(t.splice(i,1),r--)}if(e)for(;r--;r)t.unshift("..");return t}function i(t,e){if(t.filter)return t.filter(e);for(var r=[],i=0;i<t.length;i++)e(t[i],i,t)&&r.push(t[i]);return r}var n=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/,s=function(t){return n.exec(t).slice(1)};r.resolve=function(){for(var r="",n=!1,s=arguments.length-1;s>=-1&&!n;s--){var o=s>=0?arguments[s]:t.cwd();if("string"!=typeof o)throw new TypeError("Arguments to path.resolve must be strings");o&&(r=o+"/"+r,n="/"===o.charAt(0))}return r=e(i(r.split("/"),function(t){return!!t}),!n).join("/"),(n?"/":"")+r||"."},r.normalize=function(t){var n=r.isAbsolute(t),s="/"===o(t,-1);return t=e(i(t.split("/"),function(t){return!!t}),!n).join("/"),t||n||(t="."),t&&s&&(t+="/"),(n?"/":"")+t},r.isAbsolute=function(t){return"/"===t.charAt(0)},r.join=function(){var t=Array.prototype.slice.call(arguments,0);return r.normalize(i(t,function(t,e){if("string"!=typeof t)throw new TypeError("Arguments to path.join must be strings");return t}).join("/"))},r.relative=function(t,e){function i(t){for(var e=0;e<t.length&&""===t[e];e++);for(var r=t.length-1;r>=0&&""===t[r];r--);return e>r?[]:t.slice(e,r-e+1)}t=r.resolve(t).substr(1),e=r.resolve(e).substr(1);for(var n=i(t.split("/")),s=i(e.split("/")),o=Math.min(n.length,s.length),a=o,h=0;h<o;h++)if(n[h]!==s[h]){a=h;break}for(var u=[],h=a;h<n.length;h++)u.push("..");return u=u.concat(s.slice(a)),u.join("/")},r.sep="/",r.delimiter=":",r.dirname=function(t){var e=s(t),r=e[0],i=e[1];return r||i?(i&&(i=i.substr(0,i.length-1)),r+i):"."},r.basename=function(t,e){var r=s(t)[2];return e&&r.substr(-1*e.length)===e&&(r=r.substr(0,r.length-e.length)),r},r.extname=function(t){return s(t)[3]};var o="b"==="ab".substr(-1)?function(t,e,r){return t.substr(e,r)}:function(t,e,r){return e<0&&(e=t.length+e),t.substr(e,r)}}).call(this,t("_process"))},{_process:23}],23:[function(t,e,r){function i(){throw new Error("setTimeout has not been defined")}function n(){throw new Error("clearTimeout has not been defined")}function s(t){if(c===setTimeout)return setTimeout(t,0);if((c===i||!c)&&setTimeout)return c=setTimeout,setTimeout(t,0);try{return c(t,0)}catch(e){try{return c.call(null,t,0)}catch(e){return c.call(this,t,0)}}}function o(t){if(d===clearTimeout)return clearTimeout(t);if((d===n||!d)&&clearTimeout)return d=clearTimeout,clearTimeout(t);try{return d(t)}catch(e){try{return d.call(null,t)}catch(e){return d.call(this,t)}}}function a(){g&&f&&(g=!1,f.length?v=f.concat(v):y=-1,v.length&&h())}function h(){if(!g){var t=s(a);g=!0;for(var e=v.length;e;){for(f=v,v=[];++y<e;)f&&f[y].run();y=-1,e=v.length}f=null,g=!1,o(t)}}function u(t,e){this.fun=t,this.array=e}function l(){}var c,d,p=e.exports={};!function(){try{c="function"==typeof setTimeout?setTimeout:i}catch(t){c=i}try{d="function"==typeof clearTimeout?clearTimeout:n}catch(t){d=n}}();var f,v=[],g=!1,y=-1;p.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];v.push(new u(t,e)),1!==v.length||g||s(h)},u.prototype.run=function(){this.fun.apply(null,this.array)},p.title="browser",p.browser=!0,p.env={},p.argv=[],p.version="",p.versions={},p.on=l,p.addListener=l,p.once=l,p.off=l,p.removeListener=l,
p.removeAllListeners=l,p.emit=l,p.binding=function(t){throw new Error("process.binding is not supported")},p.cwd=function(){return"/"},p.chdir=function(t){throw new Error("process.chdir is not supported")},p.umask=function(){return 0}},{}],24:[function(e,r,i){(function(e){!function(n){function s(t){throw new RangeError(L[t])}function o(t,e){for(var r=t.length,i=[];r--;)i[r]=e(t[r]);return i}function a(t,e){var r=t.split("@"),i="";r.length>1&&(i=r[0]+"@",t=r[1]),t=t.replace(I,".");var n=t.split("."),s=o(n,e).join(".");return i+s}function h(t){for(var e,r,i=[],n=0,s=t.length;n<s;)e=t.charCodeAt(n++),e>=55296&&e<=56319&&n<s?(r=t.charCodeAt(n++),56320==(64512&r)?i.push(((1023&e)<<10)+(1023&r)+65536):(i.push(e),n--)):i.push(e);return i}function u(t){return o(t,function(t){var e="";return t>65535&&(t-=65536,e+=N(t>>>10&1023|55296),t=56320|1023&t),e+=N(t)}).join("")}function l(t){return t-48<10?t-22:t-65<26?t-65:t-97<26?t-97:E}function c(t,e){return t+22+75*(t<26)-((0!=e)<<5)}function d(t,e,r){var i=0;for(t=r?B(t/R):t>>1,t+=B(t/e);t>F*S>>1;i+=E)t=B(t/F);return B(i+(F+1)*t/(t+C))}function p(t){var e,r,i,n,o,a,h,c,p,f,v=[],g=t.length,y=0,x=A,m=M;for(r=t.lastIndexOf(O),r<0&&(r=0),i=0;i<r;++i)t.charCodeAt(i)>=128&&s("not-basic"),v.push(t.charCodeAt(i));for(n=r>0?r+1:0;n<g;){for(o=y,a=1,h=E;n>=g&&s("invalid-input"),c=l(t.charCodeAt(n++)),(c>=E||c>B((T-y)/a))&&s("overflow"),y+=c*a,p=h<=m?w:h>=m+S?S:h-m,!(c<p);h+=E)f=E-p,a>B(T/f)&&s("overflow"),a*=f;e=v.length+1,m=d(y-o,e,0==o),B(y/e)>T-x&&s("overflow"),x+=B(y/e),y%=e,v.splice(y++,0,x)}return u(v)}function f(t){var e,r,i,n,o,a,u,l,p,f,v,g,y,x,m,_=[];for(t=h(t),g=t.length,e=A,r=0,o=M,a=0;a<g;++a)v=t[a],v<128&&_.push(N(v));for(i=n=_.length,n&&_.push(O);i<g;){for(u=T,a=0;a<g;++a)v=t[a],v>=e&&v<u&&(u=v);for(y=i+1,u-e>B((T-r)/y)&&s("overflow"),r+=(u-e)*y,e=u,a=0;a<g;++a)if(v=t[a],v<e&&++r>T&&s("overflow"),v==e){for(l=r,p=E;f=p<=o?w:p>=o+S?S:p-o,!(l<f);p+=E)m=l-f,x=E-f,_.push(N(c(f+m%x,0))),l=B(m/x);_.push(N(c(l,0))),o=d(r,y,i==n),r=0,++i}++r,++e}return _.join("")}function v(t){return a(t,function(t){return D.test(t)?p(t.slice(4).toLowerCase()):t})}function g(t){return a(t,function(t){return P.test(t)?"xn--"+f(t):t})}var y="object"==typeof i&&i&&!i.nodeType&&i,x="object"==typeof r&&r&&!r.nodeType&&r,m="object"==typeof e&&e;m.global!==m&&m.window!==m&&m.self!==m||(n=m);var _,b,T=2147483647,E=36,w=1,S=26,C=38,R=700,M=72,A=128,O="-",D=/^xn--/,P=/[^\x20-\x7E]/,I=/[\x2E\u3002\uFF0E\uFF61]/g,L={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},F=E-w,B=Math.floor,N=String.fromCharCode;if(_={version:"1.4.1",ucs2:{decode:h,encode:u},decode:p,encode:f,toASCII:g,toUnicode:v},"function"==typeof t&&"object"==typeof t.amd&&t.amd)t("punycode",function(){return _});else if(y&&x)if(r.exports==y)x.exports=_;else for(b in _)_.hasOwnProperty(b)&&(y[b]=_[b]);else n.punycode=_}(this)}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],25:[function(t,e,r){"use strict";function i(t,e){return Object.prototype.hasOwnProperty.call(t,e)}e.exports=function(t,e,r,s){e=e||"&",r=r||"=";var o={};if("string"!=typeof t||0===t.length)return o;var a=/\+/g;t=t.split(e);var h=1e3;s&&"number"==typeof s.maxKeys&&(h=s.maxKeys);var u=t.length;h>0&&u>h&&(u=h);for(var l=0;l<u;++l){var c,d,p,f,v=t[l].replace(a,"%20"),g=v.indexOf(r);g>=0?(c=v.substr(0,g),d=v.substr(g+1)):(c=v,d=""),p=decodeURIComponent(c),f=decodeURIComponent(d),i(o,p)?n(o[p])?o[p].push(f):o[p]=[o[p],f]:o[p]=f}return o};var n=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)}},{}],26:[function(t,e,r){"use strict";function i(t,e){if(t.map)return t.map(e);for(var r=[],i=0;i<t.length;i++)r.push(e(t[i],i));return r}var n=function(t){switch(typeof t){case"string":return t;case"boolean":return t?"true":"false";case"number":return isFinite(t)?t:"";default:return""}};e.exports=function(t,e,r,a){return e=e||"&",r=r||"=",null===t&&(t=void 0),"object"==typeof t?i(o(t),function(o){var a=encodeURIComponent(n(o))+r;return s(t[o])?i(t[o],function(t){return a+encodeURIComponent(n(t))}).join(e):a+encodeURIComponent(n(t[o]))}).join(e):a?encodeURIComponent(n(a))+r+encodeURIComponent(n(t)):""};var s=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)},o=Object.keys||function(t){var e=[];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.push(r);return e}},{}],27:[function(t,e,r){"use strict";r.decode=r.parse=t("./decode"),r.encode=r.stringify=t("./encode")},{"./decode":25,"./encode":26}],28:[function(t,e,r){"use strict";function i(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}function n(t,e,r){if(t&&u.isObject(t)&&t instanceof i)return t;var n=new i;return n.parse(t,e,r),n}function s(t){return u.isString(t)&&(t=n(t)),t instanceof i?t.format():i.prototype.format.call(t)}function o(t,e){return n(t,!1,!0).resolve(e)}function a(t,e){return t?n(t,!1,!0).resolveObject(e):e}var h=t("punycode"),u=t("./util");r.parse=n,r.resolve=o,r.resolveObject=a,r.format=s,r.Url=i;var l=/^([a-z0-9.+-]+:)/i,c=/:[0-9]*$/,d=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,p=["<",">",'"',"`"," ","\r","\n","\t"],f=["{","}","|","\\","^","`"].concat(p),v=["'"].concat(f),g=["%","/","?",";","#"].concat(v),y=["/","?","#"],x=255,m=/^[+a-z0-9A-Z_-]{0,63}$/,_=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,b={javascript:!0,"javascript:":!0},T={javascript:!0,"javascript:":!0},E={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},w=t("querystring");i.prototype.parse=function(t,e,r){if(!u.isString(t))throw new TypeError("Parameter 'url' must be a string, not "+typeof t);var i=t.indexOf("?"),n=i!==-1&&i<t.indexOf("#")?"?":"#",s=t.split(n),o=/\\/g;s[0]=s[0].replace(o,"/"),t=s.join(n);var a=t;if(a=a.trim(),!r&&1===t.split("#").length){var c=d.exec(a);if(c)return this.path=a,this.href=a,this.pathname=c[1],c[2]?(this.search=c[2],e?this.query=w.parse(this.search.substr(1)):this.query=this.search.substr(1)):e&&(this.search="",this.query={}),this}var p=l.exec(a);if(p){p=p[0];var f=p.toLowerCase();this.protocol=f,a=a.substr(p.length)}if(r||p||a.match(/^\/\/[^@\/]+@[^@\/]+/)){var S="//"===a.substr(0,2);!S||p&&T[p]||(a=a.substr(2),this.slashes=!0)}if(!T[p]&&(S||p&&!E[p])){for(var C=-1,R=0;R<y.length;R++){var M=a.indexOf(y[R]);M!==-1&&(C===-1||M<C)&&(C=M)}var A,O;O=C===-1?a.lastIndexOf("@"):a.lastIndexOf("@",C),O!==-1&&(A=a.slice(0,O),a=a.slice(O+1),this.auth=decodeURIComponent(A)),C=-1;for(var R=0;R<g.length;R++){var M=a.indexOf(g[R]);M!==-1&&(C===-1||M<C)&&(C=M)}C===-1&&(C=a.length),this.host=a.slice(0,C),a=a.slice(C),this.parseHost(),this.hostname=this.hostname||"";var D="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!D)for(var P=this.hostname.split(/\./),R=0,I=P.length;R<I;R++){var L=P[R];if(L&&!L.match(m)){for(var F="",B=0,N=L.length;B<N;B++)F+=L.charCodeAt(B)>127?"x":L[B];if(!F.match(m)){var U=P.slice(0,R),k=P.slice(R+1),j=L.match(_);j&&(U.push(j[1]),k.unshift(j[2])),k.length&&(a="/"+k.join(".")+a),this.hostname=U.join(".");break}}}this.hostname.length>x?this.hostname="":this.hostname=this.hostname.toLowerCase(),D||(this.hostname=h.toASCII(this.hostname));var W=this.port?":"+this.port:"",G=this.hostname||"";this.host=G+W,this.href+=this.host,D&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==a[0]&&(a="/"+a))}if(!b[f])for(var R=0,I=v.length;R<I;R++){var X=v[R];if(a.indexOf(X)!==-1){var H=encodeURIComponent(X);H===X&&(H=escape(X)),a=a.split(X).join(H)}}var z=a.indexOf("#");z!==-1&&(this.hash=a.substr(z),a=a.slice(0,z));var V=a.indexOf("?");if(V!==-1?(this.search=a.substr(V),this.query=a.substr(V+1),e&&(this.query=w.parse(this.query)),a=a.slice(0,V)):e&&(this.search="",this.query={}),a&&(this.pathname=a),E[f]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){var W=this.pathname||"",Y=this.search||"";this.path=W+Y}return this.href=this.format(),this},i.prototype.format=function(){var t=this.auth||"";t&&(t=encodeURIComponent(t),t=t.replace(/%3A/i,":"),t+="@");var e=this.protocol||"",r=this.pathname||"",i=this.hash||"",n=!1,s="";this.host?n=t+this.host:this.hostname&&(n=t+(this.hostname.indexOf(":")===-1?this.hostname:"["+this.hostname+"]"),this.port&&(n+=":"+this.port)),this.query&&u.isObject(this.query)&&Object.keys(this.query).length&&(s=w.stringify(this.query));var o=this.search||s&&"?"+s||"";return e&&":"!==e.substr(-1)&&(e+=":"),this.slashes||(!e||E[e])&&n!==!1?(n="//"+(n||""),r&&"/"!==r.charAt(0)&&(r="/"+r)):n||(n=""),i&&"#"!==i.charAt(0)&&(i="#"+i),o&&"?"!==o.charAt(0)&&(o="?"+o),r=r.replace(/[?#]/g,function(t){return encodeURIComponent(t)}),o=o.replace("#","%23"),e+n+r+o+i},i.prototype.resolve=function(t){return this.resolveObject(n(t,!1,!0)).format()},i.prototype.resolveObject=function(t){if(u.isString(t)){var e=new i;e.parse(t,!1,!0),t=e}for(var r=new i,n=Object.keys(this),s=0;s<n.length;s++){var o=n[s];r[o]=this[o]}if(r.hash=t.hash,""===t.href)return r.href=r.format(),r;if(t.slashes&&!t.protocol){for(var a=Object.keys(t),h=0;h<a.length;h++){var l=a[h];"protocol"!==l&&(r[l]=t[l])}return E[r.protocol]&&r.hostname&&!r.pathname&&(r.path=r.pathname="/"),r.href=r.format(),r}if(t.protocol&&t.protocol!==r.protocol){if(!E[t.protocol]){for(var c=Object.keys(t),d=0;d<c.length;d++){var p=c[d];r[p]=t[p]}return r.href=r.format(),r}if(r.protocol=t.protocol,t.host||T[t.protocol])r.pathname=t.pathname;else{for(var f=(t.pathname||"").split("/");f.length&&!(t.host=f.shift()););t.host||(t.host=""),t.hostname||(t.hostname=""),""!==f[0]&&f.unshift(""),f.length<2&&f.unshift(""),r.pathname=f.join("/")}if(r.search=t.search,r.query=t.query,r.host=t.host||"",r.auth=t.auth,r.hostname=t.hostname||t.host,r.port=t.port,r.pathname||r.search){var v=r.pathname||"",g=r.search||"";r.path=v+g}return r.slashes=r.slashes||t.slashes,r.href=r.format(),r}var y=r.pathname&&"/"===r.pathname.charAt(0),x=t.host||t.pathname&&"/"===t.pathname.charAt(0),m=x||y||r.host&&t.pathname,_=m,b=r.pathname&&r.pathname.split("/")||[],f=t.pathname&&t.pathname.split("/")||[],w=r.protocol&&!E[r.protocol];if(w&&(r.hostname="",r.port=null,r.host&&(""===b[0]?b[0]=r.host:b.unshift(r.host)),r.host="",t.protocol&&(t.hostname=null,t.port=null,t.host&&(""===f[0]?f[0]=t.host:f.unshift(t.host)),t.host=null),m=m&&(""===f[0]||""===b[0])),x)r.host=t.host||""===t.host?t.host:r.host,r.hostname=t.hostname||""===t.hostname?t.hostname:r.hostname,r.search=t.search,r.query=t.query,b=f;else if(f.length)b||(b=[]),b.pop(),b=b.concat(f),r.search=t.search,r.query=t.query;else if(!u.isNullOrUndefined(t.search)){if(w){r.hostname=r.host=b.shift();var S=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@");S&&(r.auth=S.shift(),r.host=r.hostname=S.shift())}return r.search=t.search,r.query=t.query,u.isNull(r.pathname)&&u.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.href=r.format(),r}if(!b.length)return r.pathname=null,r.search?r.path="/"+r.search:r.path=null,r.href=r.format(),r;for(var C=b.slice(-1)[0],R=(r.host||t.host||b.length>1)&&("."===C||".."===C)||""===C,M=0,A=b.length;A>=0;A--)C=b[A],"."===C?b.splice(A,1):".."===C?(b.splice(A,1),M++):M&&(b.splice(A,1),M--);if(!m&&!_)for(;M--;M)b.unshift("..");!m||""===b[0]||b[0]&&"/"===b[0].charAt(0)||b.unshift(""),R&&"/"!==b.join("/").substr(-1)&&b.push("");var O=""===b[0]||b[0]&&"/"===b[0].charAt(0);if(w){r.hostname=r.host=O?"":b.length?b.shift():"";var S=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@");S&&(r.auth=S.shift(),r.host=r.hostname=S.shift())}return m=m||r.host&&b.length,m&&!O&&b.unshift(""),b.length?r.pathname=b.join("/"):(r.pathname=null,r.path=null),u.isNull(r.pathname)&&u.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.auth=t.auth||r.auth,r.slashes=r.slashes||t.slashes,r.href=r.format(),r},i.prototype.parseHost=function(){var t=this.host,e=c.exec(t);e&&(e=e[0],":"!==e&&(this.port=e.substr(1)),t=t.substr(0,t.length-e.length)),t&&(this.hostname=t)}},{"./util":29,punycode:24,querystring:27}],29:[function(t,e,r){"use strict";e.exports={isString:function(t){return"string"==typeof t},isObject:function(t){return"object"==typeof t&&null!==t},isNull:function(t){return null===t},isNullOrUndefined:function(t){return null==t}}},{}],30:[function(t,e,r){"use strict";function i(){}function n(t,e,r){this.fn=t,this.context=e,this.once=r||!1}function s(){this._events=new i,this._eventsCount=0}var o=Object.prototype.hasOwnProperty,a="~";Object.create&&(i.prototype=Object.create(null),(new i).__proto__||(a=!1)),s.prototype.eventNames=function(){var t,e,r=[];if(0===this._eventsCount)return r;for(e in t=this._events)o.call(t,e)&&r.push(a?e.slice(1):e);return Object.getOwnPropertySymbols?r.concat(Object.getOwnPropertySymbols(t)):r},s.prototype.listeners=function(t,e){var r=a?a+t:t,i=this._events[r];if(e)return!!i;if(!i)return[];if(i.fn)return[i.fn];for(var n=0,s=i.length,o=new Array(s);n<s;n++)o[n]=i[n].fn;return o},s.prototype.emit=function(t,e,r,i,n,s){var o=a?a+t:t;if(!this._events[o])return!1;var h,u,l=this._events[o],c=arguments.length;if(l.fn){switch(l.once&&this.removeListener(t,l.fn,void 0,!0),c){case 1:return l.fn.call(l.context),!0;case 2:return l.fn.call(l.context,e),!0;case 3:return l.fn.call(l.context,e,r),!0;case 4:return l.fn.call(l.context,e,r,i),!0;case 5:return l.fn.call(l.context,e,r,i,n),!0;case 6:return l.fn.call(l.context,e,r,i,n,s),!0}for(u=1,h=new Array(c-1);u<c;u++)h[u-1]=arguments[u];l.fn.apply(l.context,h)}else{var d,p=l.length;for(u=0;u<p;u++)switch(l[u].once&&this.removeListener(t,l[u].fn,void 0,!0),c){case 1:l[u].fn.call(l[u].context);break;case 2:l[u].fn.call(l[u].context,e);break;case 3:l[u].fn.call(l[u].context,e,r);break;case 4:l[u].fn.call(l[u].context,e,r,i);break;default:if(!h)for(d=1,h=new Array(c-1);d<c;d++)h[d-1]=arguments[d];l[u].fn.apply(l[u].context,h)}}return!0},s.prototype.on=function(t,e,r){var i=new n(e,r||this),s=a?a+t:t;return this._events[s]?this._events[s].fn?this._events[s]=[this._events[s],i]:this._events[s].push(i):(this._events[s]=i,this._eventsCount++),this},s.prototype.once=function(t,e,r){var i=new n(e,r||this,(!0)),s=a?a+t:t;return this._events[s]?this._events[s].fn?this._events[s]=[this._events[s],i]:this._events[s].push(i):(this._events[s]=i,this._eventsCount++),this},s.prototype.removeListener=function(t,e,r,n){var s=a?a+t:t;if(!this._events[s])return this;if(!e)return 0===--this._eventsCount?this._events=new i:delete this._events[s],this;var o=this._events[s];if(o.fn)o.fn!==e||n&&!o.once||r&&o.context!==r||(0===--this._eventsCount?this._events=new i:delete this._events[s]);else{for(var h=0,u=[],l=o.length;h<l;h++)(o[h].fn!==e||n&&!o[h].once||r&&o[h].context!==r)&&u.push(o[h]);u.length?this._events[s]=1===u.length?u[0]:u:0===--this._eventsCount?this._events=new i:delete this._events[s]}return this},s.prototype.removeAllListeners=function(t){var e;return t?(e=a?a+t:t,this._events[e]&&(0===--this._eventsCount?this._events=new i:delete this._events[e])):(this._events=new i,this._eventsCount=0),this},s.prototype.off=s.prototype.removeListener,s.prototype.addListener=s.prototype.on,s.prototype.setMaxListeners=function(){return this},s.prefixed=a,s.EventEmitter=s,"undefined"!=typeof e&&(e.exports=s)},{}],31:[function(t,e,r){"use strict";e.exports=function(t,e){e=e||{};for(var r={key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}},i=r.parser[e.strictMode?"strict":"loose"].exec(t),n={},s=14;s--;)n[r.key[s]]=i[s]||"";return n[r.q.name]={},n[r.key[12]].replace(r.q.parser,function(t,e,i){e&&(n[r.q.name][e]=i)}),n}},{}],32:[function(t,e,r){"use strict";function i(t,e){a.call(this),e=e||h,this.baseUrl=t||"",this.progress=0,this.loading=!1,this._progressChunk=0,this._beforeMiddleware=[],this._afterMiddleware=[],this._boundLoadResource=this._loadResource.bind(this),this._buffer=[],this._numToLoad=0,this._queue=s.queue(this._boundLoadResource,e),this.resources={}}var n=t("parse-uri"),s=t("./async"),o=t("./Resource"),a=t("eventemitter3"),h=10,u=100;i.prototype=Object.create(a.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.add=i.prototype.enqueue=function(t,e,r,i){if(Array.isArray(t)){for(var n=0;n<t.length;++n)this.add(t[n]);return this}if("object"==typeof t&&(i=e||t.callback||t.onComplete,r=t,e=t.url,t=t.name||t.key||t.url),"string"!=typeof e&&(i=r,r=e,e=t),"string"!=typeof e)throw new Error("No url passed to add resource to loader.");if("function"==typeof r&&(i=r,r=null),this.resources[t])throw new Error('Resource with name "'+t+'" already exists.');return e=this._prepareUrl(e),this.resources[t]=new o(t,e,r),"function"==typeof i&&this.resources[t].once("afterMiddleware",i),this._numToLoad++,this._queue.started?(this._queue.push(this.resources[t]),this._progressChunk=(u-this.progress)/(this._queue.length()+this._queue.running())):(this._buffer.push(this.resources[t]),this._progressChunk=u/this._buffer.length),this},i.prototype.before=i.prototype.pre=function(t){return this._beforeMiddleware.push(t),this},i.prototype.after=i.prototype.use=function(t){return this._afterMiddleware.push(t),this},i.prototype.reset=function(){this.progress=0,this.loading=!1,this._progressChunk=0,this._buffer.length=0,this._numToLoad=0,this._queue.kill(),this._queue.started=!1;for(var t in this.resources){var e=this.resources[t];e.off("complete",this._onLoad,this),e.isLoading&&e.abort()}return this.resources={},this},i.prototype.load=function(t){if("function"==typeof t&&this.once("complete",t),this._queue.started)return this;this.emit("start",this),this.loading=!0;for(var e=0;e<this._buffer.length;++e)this._queue.push(this._buffer[e]);return this._buffer.length=0,this},i.prototype._prepareUrl=function(t){var e=n(t,{strictMode:!0});return e.protocol||!e.path||0===e.path.indexOf("//")?t:this.baseUrl.length&&this.baseUrl.lastIndexOf("/")!==this.baseUrl.length-1&&"/"!==t.charAt(0)?this.baseUrl+"/"+t:this.baseUrl+t},i.prototype._loadResource=function(t,e){var r=this;t._dequeue=e,s.eachSeries(this._beforeMiddleware,function(e,i){e.call(r,t,function(){i(t.isComplete?{}:null)})},function(){t.isComplete?r._onLoad(t):(t.once("complete",r._onLoad,r),t.load())})},i.prototype._onComplete=function(){this.loading=!1,this.emit("complete",this,this.resources)},i.prototype._onLoad=function(t){var e=this;s.eachSeries(this._afterMiddleware,function(r,i){r.call(e,t,i)},function(){t.emit("afterMiddleware",t),e._numToLoad--,e.progress+=e._progressChunk,e.emit("progress",e,t),t.error?e.emit("error",t.error,e,t):e.emit("load",e,t),0===e._numToLoad&&(e.progress=100,e._onComplete())}),t._dequeue()},i.LOAD_TYPE=o.LOAD_TYPE,i.XHR_RESPONSE_TYPE=o.XHR_RESPONSE_TYPE},{"./Resource":33,"./async":34,eventemitter3:30,"parse-uri":31}],33:[function(t,e,r){"use strict";function i(t,e,r){if(o.call(this),r=r||{},"string"!=typeof t||"string"!=typeof e)throw new Error("Both name and url are required for constructing a resource.");this.name=t,this.url=e,this.isDataUrl=0===this.url.indexOf("data:"),this.data=null,this.crossOrigin=r.crossOrigin===!0?"anonymous":r.crossOrigin,this.loadType=r.loadType||this._determineLoadType(),this.xhrType=r.xhrType,this.metadata=r.metadata||{},this.error=null,this.xhr=null,this.isJson=!1,this.isXml=!1,this.isImage=!1,this.isAudio=!1,this.isVideo=!1,this.isComplete=!1,this.isLoading=!1,this._dequeue=null,this._boundComplete=this.complete.bind(this),this._boundOnError=this._onError.bind(this),this._boundOnProgress=this._onProgress.bind(this),this._boundXhrOnError=this._xhrOnError.bind(this),this._boundXhrOnAbort=this._xhrOnAbort.bind(this),this._boundXhrOnLoad=this._xhrOnLoad.bind(this),this._boundXdrOnTimeout=this._xdrOnTimeout.bind(this)}function n(t){return t.toString().replace("object ","")}function s(t,e,r){e&&0===e.indexOf(".")&&(e=e.substring(1)),e&&(t[e]=r)}var o=t("eventemitter3"),a=t("parse-uri"),h=!(!window.XDomainRequest||"withCredentials"in new XMLHttpRequest),u=null,l=0,c=200,d=204;i.prototype=Object.create(o.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.complete=function(){if(this.data&&this.data.removeEventListener&&(this.data.removeEventListener("error",this._boundOnError,!1),this.data.removeEventListener("load",this._boundComplete,!1),this.data.removeEventListener("progress",this._boundOnProgress,!1),this.data.removeEventListener("canplaythrough",this._boundComplete,!1)),this.xhr&&(this.xhr.removeEventListener?(this.xhr.removeEventListener("error",this._boundXhrOnError,!1),this.xhr.removeEventListener("abort",this._boundXhrOnAbort,!1),this.xhr.removeEventListener("progress",this._boundOnProgress,!1),this.xhr.removeEventListener("load",this._boundXhrOnLoad,!1)):(this.xhr.onerror=null,this.xhr.ontimeout=null,this.xhr.onprogress=null,this.xhr.onload=null)),this.isComplete)throw new Error("Complete called again for an already completed resource.");this.isComplete=!0,this.isLoading=!1,this.emit("complete",this)},i.prototype.abort=function(t){if(!this.error){if(this.error=new Error(t),this.xhr)this.xhr.abort();else if(this.xdr)this.xdr.abort();else if(this.data)if("undefined"!=typeof this.data.src)this.data.src="";else for(;this.data.firstChild;)this.data.removeChild(this.data.firstChild);this.complete()}},i.prototype.load=function(t){if(!this.isLoading)if(this.isComplete){if(t){var e=this;setTimeout(function(){t(e)},1)}}else switch(t&&this.once("complete",t),this.isLoading=!0,this.emit("start",this),this.crossOrigin!==!1&&"string"==typeof this.crossOrigin||(this.crossOrigin=this._determineCrossOrigin(this.url)),this.loadType){case i.LOAD_TYPE.IMAGE:this._loadElement("image");break;case i.LOAD_TYPE.AUDIO:this._loadSourceElement("audio");break;case i.LOAD_TYPE.VIDEO:this._loadSourceElement("video");break;case i.LOAD_TYPE.XHR:default:h&&this.crossOrigin?this._loadXdr():this._loadXhr()}},i.prototype._loadElement=function(t){this.metadata.loadElement?this.data=this.metadata.loadElement:"image"===t&&"undefined"!=typeof window.Image?this.data=new Image:this.data=document.createElement(t),this.crossOrigin&&(this.data.crossOrigin=this.crossOrigin),this.metadata.skipSource||(this.data.src=this.url);var e="is"+t[0].toUpperCase()+t.substring(1);this[e]===!1&&(this[e]=!0),this.data.addEventListener("error",this._boundOnError,!1),this.data.addEventListener("load",this._boundComplete,!1),this.data.addEventListener("progress",this._boundOnProgress,!1)},i.prototype._loadSourceElement=function(t){if(this.metadata.loadElement?this.data=this.metadata.loadElement:"audio"===t&&"undefined"!=typeof window.Audio?this.data=new Audio:this.data=document.createElement(t),null===this.data)return void this.abort("Unsupported element "+t);if(!this.metadata.skipSource)if(navigator.isCocoonJS)this.data.src=Array.isArray(this.url)?this.url[0]:this.url;else if(Array.isArray(this.url))for(var e=0;e<this.url.length;++e)this.data.appendChild(this._createSource(t,this.url[e]));else this.data.appendChild(this._createSource(t,this.url));this["is"+t[0].toUpperCase()+t.substring(1)]=!0,this.data.addEventListener("error",this._boundOnError,!1),this.data.addEventListener("load",this._boundComplete,!1),this.data.addEventListener("progress",this._boundOnProgress,!1),this.data.addEventListener("canplaythrough",this._boundComplete,!1),this.data.load()},i.prototype._loadXhr=function(){"string"!=typeof this.xhrType&&(this.xhrType=this._determineXhrType());var t=this.xhr=new XMLHttpRequest;t.open("GET",this.url,!0),this.xhrType===i.XHR_RESPONSE_TYPE.JSON||this.xhrType===i.XHR_RESPONSE_TYPE.DOCUMENT?t.responseType=i.XHR_RESPONSE_TYPE.TEXT:t.responseType=this.xhrType,t.addEventListener("error",this._boundXhrOnError,!1),t.addEventListener("abort",this._boundXhrOnAbort,!1),t.addEventListener("progress",this._boundOnProgress,!1),t.addEventListener("load",this._boundXhrOnLoad,!1),t.send()},i.prototype._loadXdr=function(){"string"!=typeof this.xhrType&&(this.xhrType=this._determineXhrType());var t=this.xhr=new XDomainRequest;t.timeout=5e3,t.onerror=this._boundXhrOnError,t.ontimeout=this._boundXdrOnTimeout,t.onprogress=this._boundOnProgress,t.onload=this._boundXhrOnLoad,t.open("GET",this.url,!0),setTimeout(function(){t.send()},0)},i.prototype._createSource=function(t,e,r){r||(r=t+"/"+e.substr(e.lastIndexOf(".")+1));var i=document.createElement("source");return i.src=e,i.type=r,i},i.prototype._onError=function(t){this.abort("Failed to load element using "+t.target.nodeName)},i.prototype._onProgress=function(t){t&&t.lengthComputable&&this.emit("progress",this,t.loaded/t.total)},i.prototype._xhrOnError=function(){var t=this.xhr;this.abort(n(t)+" Request failed. Status: "+t.status+', text: "'+t.statusText+'"')},i.prototype._xhrOnAbort=function(){this.abort(n(this.xhr)+" Request was aborted by the user.")},i.prototype._xdrOnTimeout=function(){this.abort(n(this.xhr)+" Request timed out.")},i.prototype._xhrOnLoad=function(){var t=this.xhr,e="undefined"==typeof t.status?t.status:c;if(!(e===c||e===d||e===l&&t.responseText.length>0))return void this.abort("["+t.status+"]"+t.statusText+":"+t.responseURL);if(this.xhrType===i.XHR_RESPONSE_TYPE.TEXT)this.data=t.responseText;else if(this.xhrType===i.XHR_RESPONSE_TYPE.JSON)try{this.data=JSON.parse(t.responseText),this.isJson=!0}catch(t){return void this.abort("Error trying to parse loaded json:",t)}else if(this.xhrType===i.XHR_RESPONSE_TYPE.DOCUMENT)try{if(window.DOMParser){var r=new DOMParser;this.data=r.parseFromString(t.responseText,"text/xml")}else{var n=document.createElement("div");n.innerHTML=t.responseText,this.data=n}this.isXml=!0}catch(t){return void this.abort("Error trying to parse loaded xml:",t)}else this.data=t.response||t.responseText;this.complete()},i.prototype._determineCrossOrigin=function(t,e){if(0===t.indexOf("data:"))return"";e=e||window.location,u||(u=document.createElement("a")),u.href=t,t=a(u.href,{strictMode:!0});var r=!t.port&&""===e.port||t.port===e.port,i=t.protocol?t.protocol+":":"";return t.host===e.hostname&&r&&i===e.protocol?"":"anonymous"},i.prototype._determineXhrType=function(){return i._xhrTypeMap[this._getExtension()]||i.XHR_RESPONSE_TYPE.TEXT},i.prototype._determineLoadType=function(){return i._loadTypeMap[this._getExtension()]||i.LOAD_TYPE.XHR},i.prototype._getExtension=function(){var t=this.url,e="";if(this.isDataUrl){var r=t.indexOf("/");e=t.substring(r+1,t.indexOf(";",r))}else{var i=t.indexOf("?");i!==-1&&(t=t.substring(0,i)),e=t.substring(t.lastIndexOf(".")+1)}return e.toLowerCase()},i.prototype._getMimeFromXhrType=function(t){switch(t){case i.XHR_RESPONSE_TYPE.BUFFER:return"application/octet-binary";case i.XHR_RESPONSE_TYPE.BLOB:return"application/blob";case i.XHR_RESPONSE_TYPE.DOCUMENT:return"application/xml";case i.XHR_RESPONSE_TYPE.JSON:return"application/json";case i.XHR_RESPONSE_TYPE.DEFAULT:case i.XHR_RESPONSE_TYPE.TEXT:default:return"text/plain"}},i.LOAD_TYPE={XHR:1,IMAGE:2,AUDIO:3,VIDEO:4},i.XHR_RESPONSE_TYPE={DEFAULT:"text",BUFFER:"arraybuffer",BLOB:"blob",DOCUMENT:"document",JSON:"json",TEXT:"text"},i._loadTypeMap={gif:i.LOAD_TYPE.IMAGE,png:i.LOAD_TYPE.IMAGE,bmp:i.LOAD_TYPE.IMAGE,jpg:i.LOAD_TYPE.IMAGE,jpeg:i.LOAD_TYPE.IMAGE,tif:i.LOAD_TYPE.IMAGE,tiff:i.LOAD_TYPE.IMAGE,webp:i.LOAD_TYPE.IMAGE,tga:i.LOAD_TYPE.IMAGE,"svg+xml":i.LOAD_TYPE.IMAGE},i._xhrTypeMap={xhtml:i.XHR_RESPONSE_TYPE.DOCUMENT,html:i.XHR_RESPONSE_TYPE.DOCUMENT,htm:i.XHR_RESPONSE_TYPE.DOCUMENT,xml:i.XHR_RESPONSE_TYPE.DOCUMENT,tmx:i.XHR_RESPONSE_TYPE.DOCUMENT,tsx:i.XHR_RESPONSE_TYPE.DOCUMENT,svg:i.XHR_RESPONSE_TYPE.DOCUMENT,gif:i.XHR_RESPONSE_TYPE.BLOB,png:i.XHR_RESPONSE_TYPE.BLOB,bmp:i.XHR_RESPONSE_TYPE.BLOB,jpg:i.XHR_RESPONSE_TYPE.BLOB,jpeg:i.XHR_RESPONSE_TYPE.BLOB,tif:i.XHR_RESPONSE_TYPE.BLOB,tiff:i.XHR_RESPONSE_TYPE.BLOB,webp:i.XHR_RESPONSE_TYPE.BLOB,tga:i.XHR_RESPONSE_TYPE.BLOB,json:i.XHR_RESPONSE_TYPE.JSON,text:i.XHR_RESPONSE_TYPE.TEXT,txt:i.XHR_RESPONSE_TYPE.TEXT},i.setExtensionLoadType=function(t,e){s(i._loadTypeMap,t,e)},i.setExtensionXhrType=function(t,e){s(i._xhrTypeMap,t,e)}},{eventemitter3:30,"parse-uri":31}],34:[function(t,e,r){"use strict";function i(){}function n(t,e,r){var i=0,n=t.length;!function s(o){return o||i===n?void(r&&r(o)):void e(t[i++],s)}()}function s(t){return function(){if(null===t)throw new Error("Callback was already called.");var e=t;t=null,e.apply(this,arguments)}}function o(t,e){function r(t,e,r){if(null!=r&&"function"!=typeof r)throw new Error("task callback must be a function");if(a.started=!0,null==t&&a.idle())return void setTimeout(function(){a.drain()},1);var n={data:t,callback:"function"==typeof r?r:i};e?a._tasks.unshift(n):a._tasks.push(n),setTimeout(function(){a.process()},1)}function n(t){return function(){o-=1,t.callback.apply(t,arguments),null!=arguments[0]&&a.error(arguments[0],t.data),o<=a.concurrency-a.buffer&&a.unsaturated(),a.idle()&&a.drain(),a.process()}}if(null==e)e=1;else if(0===e)throw new Error("Concurrency must not be zero");var o=0,a={_tasks:[],concurrency:e,saturated:i,unsaturated:i,buffer:e/4,empty:i,drain:i,error:i,started:!1,paused:!1,push:function(t,e){r(t,!1,e)},kill:function(){a.drain=i,a._tasks=[]},unshift:function(t,e){r(t,!0,e)},process:function(){for(;!a.paused&&o<a.concurrency&&a._tasks.length;){var e=a._tasks.shift();0===a._tasks.length&&a.empty(),o+=1,o===a.concurrency&&a.saturated(),t(e.data,s(n(e)))}},length:function(){return a._tasks.length},running:function(){return o},idle:function(){return a._tasks.length+o===0},pause:function(){a.paused!==!0&&(a.paused=!0)},resume:function(){if(a.paused!==!1){a.paused=!1;for(var t=1;t<=a.concurrency;t++)a.process()}}};return a}e.exports={eachSeries:n,queue:o}},{}],35:[function(t,e,r){"use strict";e.exports={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encodeBinary:function(t){for(var e,r="",i=new Array(4),n=0,s=0,o=0;n<t.length;){for(e=new Array(3),s=0;s<e.length;s++)n<t.length?e[s]=255&t.charCodeAt(n++):e[s]=0;switch(i[0]=e[0]>>2,i[1]=(3&e[0])<<4|e[1]>>4,i[2]=(15&e[1])<<2|e[2]>>6,i[3]=63&e[2],o=n-(t.length-1)){case 2:i[3]=64,i[2]=64;break;case 1:i[3]=64}for(s=0;s<i.length;s++)r+=this._keyStr.charAt(i[s])}return r}}},{}],36:[function(t,e,r){"use strict";e.exports=t("./Loader"),e.exports.Resource=t("./Resource"),e.exports.middleware={caching:{memory:t("./middlewares/caching/memory")},parsing:{blob:t("./middlewares/parsing/blob")}},e.exports.async=t("./async")},{"./Loader":32,"./Resource":33,"./async":34,"./middlewares/caching/memory":37,"./middlewares/parsing/blob":38}],37:[function(t,e,r){"use strict";var i={};e.exports=function(){return function(t,e){i[t.url]?(t.data=i[t.url],t.complete()):t.once("complete",function(){i[this.url]=this.data}),e()}}},{}],38:[function(t,e,r){"use strict";var i=t("../../Resource"),n=t("../../b64"),s=window.URL||window.webkitURL;e.exports=function(){return function(t,e){if(!t.data)return void e();if(t.xhr&&t.xhrType===i.XHR_RESPONSE_TYPE.BLOB)if(window.Blob&&"string"!=typeof t.data){if(0===t.data.type.indexOf("image")){var r=s.createObjectURL(t.data);return t.blob=t.data,t.data=new Image,t.data.src=r,t.isImage=!0,void(t.data.onload=function(){s.revokeObjectURL(r),t.data.onload=null,e()})}}else{var o=t.xhr.getResponseHeader("content-type");if(o&&0===o.indexOf("image"))return t.data=new Image,t.data.src="data:"+o+";base64,"+n.encodeBinary(t.xhr.responseText),t.isImage=!0,void(t.data.onload=function(){t.data.onload=null,e()})}e()}}},{"../../Resource":33,"../../b64":35}],39:[function(t,e,r){function i(t){
!s.tablet&&!s.phone||navigator.isCocoonJS||this.createTouchHook();var e=document.createElement("div");e.style.width="100px",e.style.height="100px",e.style.position="absolute",e.style.top=0,e.style.left=0,e.style.zIndex=2,this.div=e,this.pool=[],this.renderId=0,this.debug=!1,this.renderer=t,this.children=[],this._onKeyDown=this._onKeyDown.bind(this),this._onMouseMove=this._onMouseMove.bind(this),this.isActive=!1,this.isMobileAccessabillity=!1,window.addEventListener("keydown",this._onKeyDown,!1)}var n=t("../core"),s=t("ismobilejs");Object.assign(n.DisplayObject.prototype,t("./accessibleTarget")),i.prototype.constructor=i,e.exports=i,i.prototype.createTouchHook=function(){var t=document.createElement("button");t.style.width="1px",t.style.height="1px",t.style.position="absolute",t.style.top="-1000px",t.style.left="-1000px",t.style.zIndex=2,t.style.backgroundColor="#FF0000",t.title="HOOK DIV",t.addEventListener("focus",function(){this.isMobileAccessabillity=!0,this.activate(),document.body.removeChild(t)}.bind(this)),document.body.appendChild(t)},i.prototype.activate=function(){this.isActive||(this.isActive=!0,window.document.addEventListener("mousemove",this._onMouseMove,!0),window.removeEventListener("keydown",this._onKeyDown,!1),this.renderer.on("postrender",this.update,this),this.renderer.view.parentNode&&this.renderer.view.parentNode.appendChild(this.div))},i.prototype.deactivate=function(){this.isActive&&!this.isMobileAccessabillity&&(this.isActive=!1,window.document.removeEventListener("mousemove",this._onMouseMove),window.addEventListener("keydown",this._onKeyDown,!1),this.renderer.off("postrender",this.update),this.div.parentNode&&this.div.parentNode.removeChild(this.div))},i.prototype.updateAccessibleObjects=function(t){if(t.visible){t.accessible&&t.interactive&&(t._accessibleActive||this.addChild(t),t.renderId=this.renderId);for(var e=t.children,r=e.length-1;r>=0;r--)this.updateAccessibleObjects(e[r])}},i.prototype.update=function(){if(this.renderer.renderingToScreen){this.updateAccessibleObjects(this.renderer._lastObjectRendered);var t=this.renderer.view.getBoundingClientRect(),e=t.width/this.renderer.width,r=t.height/this.renderer.height,i=this.div;i.style.left=t.left+"px",i.style.top=t.top+"px",i.style.width=this.renderer.width+"px",i.style.height=this.renderer.height+"px";for(var s=0;s<this.children.length;s++){var o=this.children[s];if(o.renderId!==this.renderId)o._accessibleActive=!1,n.utils.removeItems(this.children,s,1),this.div.removeChild(o._accessibleDiv),this.pool.push(o._accessibleDiv),o._accessibleDiv=null,s--,0===this.children.length&&this.deactivate();else{i=o._accessibleDiv;var a=o.hitArea,h=o.worldTransform;o.hitArea?(i.style.left=(h.tx+a.x*h.a)*e+"px",i.style.top=(h.ty+a.y*h.d)*r+"px",i.style.width=a.width*h.a*e+"px",i.style.height=a.height*h.d*r+"px"):(a=o.getBounds(),this.capHitArea(a),i.style.left=a.x*e+"px",i.style.top=a.y*r+"px",i.style.width=a.width*e+"px",i.style.height=a.height*r+"px")}}this.renderId++}},i.prototype.capHitArea=function(t){t.x<0&&(t.width+=t.x,t.x=0),t.y<0&&(t.height+=t.y,t.y=0),t.x+t.width>this.renderer.width&&(t.width=this.renderer.width-t.x),t.y+t.height>this.renderer.height&&(t.height=this.renderer.height-t.y)},i.prototype.addChild=function(t){var e=this.pool.pop();e||(e=document.createElement("button"),e.style.width="100px",e.style.height="100px",e.style.backgroundColor=this.debug?"rgba(255,0,0,0.5)":"transparent",e.style.position="absolute",e.style.zIndex=2,e.style.borderStyle="none",e.addEventListener("click",this._onClick.bind(this)),e.addEventListener("focus",this._onFocus.bind(this)),e.addEventListener("focusout",this._onFocusOut.bind(this))),t.accessibleTitle?e.title=t.accessibleTitle:t.accessibleTitle||t.accessibleHint||(e.title="displayObject "+this.tabIndex),t.accessibleHint&&e.setAttribute("aria-label",t.accessibleHint),t._accessibleActive=!0,t._accessibleDiv=e,e.displayObject=t,this.children.push(t),this.div.appendChild(t._accessibleDiv),t._accessibleDiv.tabIndex=t.tabIndex},i.prototype._onClick=function(t){var e=this.renderer.plugins.interaction;e.dispatchEvent(t.target.displayObject,"click",e.eventData)},i.prototype._onFocus=function(t){var e=this.renderer.plugins.interaction;e.dispatchEvent(t.target.displayObject,"mouseover",e.eventData)},i.prototype._onFocusOut=function(t){var e=this.renderer.plugins.interaction;e.dispatchEvent(t.target.displayObject,"mouseout",e.eventData)},i.prototype._onKeyDown=function(t){9===t.keyCode&&this.activate()},i.prototype._onMouseMove=function(){this.deactivate()},i.prototype.destroy=function(){this.div=null;for(var t=0;t<this.children.length;t++)this.children[t].div=null;window.document.removeEventListener("mousemove",this._onMouseMove),window.removeEventListener("keydown",this._onKeyDown),this.pool=null,this.children=null,this.renderer=null},n.WebGLRenderer.registerPlugin("accessibility",i),n.CanvasRenderer.registerPlugin("accessibility",i)},{"../core":62,"./accessibleTarget":40,ismobilejs:4}],40:[function(t,e,r){var i={accessible:!1,accessibleTitle:null,accessibleHint:null,tabIndex:0,_accessibleActive:!1,_accessibleDiv:!1};e.exports=i},{}],41:[function(t,e,r){e.exports={accessibleTarget:t("./accessibleTarget"),AccessibilityManager:t("./AccessibilityManager")}},{"./AccessibilityManager":39,"./accessibleTarget":40}],42:[function(t,e,r){function i(t){if(t instanceof Array){if("precision"!==t[0].substring(0,9)){var e=t.slice(0);return e.unshift("precision "+s.PRECISION.DEFAULT+" float;"),e}}else if("precision"!==t.substring(0,9))return"precision "+s.PRECISION.DEFAULT+" float;\n"+t;return t}var n=t("pixi-gl-core").GLShader,s=t("./const"),o=function(t,e,r,s){n.call(this,t,i(e),i(r),s)};o.prototype=Object.create(n.prototype),o.prototype.constructor=o,e.exports=o},{"./const":43,"pixi-gl-core":12}],43:[function(t,e,r){var i={VERSION:"4.0.3",PI_2:2*Math.PI,RAD_TO_DEG:180/Math.PI,DEG_TO_RAD:Math.PI/180,TARGET_FPMS:.06,RENDERER_TYPE:{UNKNOWN:0,WEBGL:1,CANVAS:2},BLEND_MODES:{NORMAL:0,ADD:1,MULTIPLY:2,SCREEN:3,OVERLAY:4,DARKEN:5,LIGHTEN:6,COLOR_DODGE:7,COLOR_BURN:8,HARD_LIGHT:9,SOFT_LIGHT:10,DIFFERENCE:11,EXCLUSION:12,HUE:13,SATURATION:14,COLOR:15,LUMINOSITY:16},DRAW_MODES:{POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},SCALE_MODES:{DEFAULT:0,LINEAR:0,NEAREST:1},WRAP_MODES:{DEFAULT:0,CLAMP:0,REPEAT:1,MIRRORED_REPEAT:2},GC_MODES:{DEFAULT:0,AUTO:0,MANUAL:1},MIPMAP_TEXTURES:!0,RETINA_PREFIX:/@(.+)x/,RESOLUTION:1,FILTER_RESOLUTION:1,DEFAULT_RENDER_OPTIONS:{view:null,resolution:1,antialias:!1,forceFXAA:!1,autoResize:!1,transparent:!1,backgroundColor:0,clearBeforeRender:!0,preserveDrawingBuffer:!1,roundPixels:!1},SHAPES:{POLY:0,RECT:1,CIRC:2,ELIP:3,RREC:4},PRECISION:{DEFAULT:"mediump",LOW:"lowp",MEDIUM:"mediump",HIGH:"highp"},TRANSFORM_MODE:{DEFAULT:0,STATIC:0,DYNAMIC:1},TEXT_GRADIENT:{LINEAR_VERTICAL:0,LINEAR_HORIZONTAL:1},SPRITE_BATCH_SIZE:4096,SPRITE_MAX_TEXTURES:t("./utils/maxRecommendedTextures")(32)};e.exports=i},{"./utils/maxRecommendedTextures":117}],44:[function(t,e,r){function i(){this.minX=1/0,this.minY=1/0,this.maxX=-(1/0),this.maxY=-(1/0),this.rect=null}var n=t("../math"),s=n.Rectangle;i.prototype.constructor=i,e.exports=i,i.prototype.isEmpty=function(){return this.minX>this.maxX||this.minY>this.maxY},i.prototype.clear=function(){this.updateID++,this.minX=1/0,this.minY=1/0,this.maxX=-(1/0),this.maxY=-(1/0)},i.prototype.getRectangle=function(t){return this.minX>this.maxX||this.minY>this.maxY?s.EMPTY:(t=t||new s(0,0,1,1),t.x=this.minX,t.y=this.minY,t.width=this.maxX-this.minX,t.height=this.maxY-this.minY,t)},i.prototype.addPoint=function(t){this.minX=Math.min(this.minX,t.x),this.maxX=Math.max(this.maxX,t.x),this.minY=Math.min(this.minY,t.y),this.maxY=Math.max(this.maxY,t.y)},i.prototype.addQuad=function(t){var e=this.minX,r=this.minY,i=this.maxX,n=this.maxY,s=t[0],o=t[1];e=s<e?s:e,r=o<r?o:r,i=s>i?s:i,n=o>n?o:n,s=t[2],o=t[3],e=s<e?s:e,r=o<r?o:r,i=s>i?s:i,n=o>n?o:n,s=t[4],o=t[5],e=s<e?s:e,r=o<r?o:r,i=s>i?s:i,n=o>n?o:n,s=t[6],o=t[7],e=s<e?s:e,r=o<r?o:r,i=s>i?s:i,n=o>n?o:n,this.minX=e,this.minY=r,this.maxX=i,this.maxY=n},i.prototype.addFrame=function(t,e,r,i,n){var s=t.worldTransform,o=s.a,a=s.b,h=s.c,u=s.d,l=s.tx,c=s.ty,d=this.minX,p=this.minY,f=this.maxX,v=this.maxY,g=o*e+h*r+l,y=a*e+u*r+c;d=g<d?g:d,p=y<p?y:p,f=g>f?g:f,v=y>v?y:v,g=o*i+h*r+l,y=a*i+u*r+c,d=g<d?g:d,p=y<p?y:p,f=g>f?g:f,v=y>v?y:v,g=o*e+h*n+l,y=a*e+u*n+c,d=g<d?g:d,p=y<p?y:p,f=g>f?g:f,v=y>v?y:v,g=o*i+h*n+l,y=a*i+u*n+c,d=g<d?g:d,p=y<p?y:p,f=g>f?g:f,v=y>v?y:v,this.minX=d,this.minY=p,this.maxX=f,this.maxY=v},i.prototype.addVertices=function(t,e,r,i){for(var n=t.worldTransform,s=n.a,o=n.b,a=n.c,h=n.d,u=n.tx,l=n.ty,c=this.minX,d=this.minY,p=this.maxX,f=this.maxY,v=r;v<i;v+=2){var g=e[v],y=e[v+1],x=s*g+a*y+u,m=h*y+o*g+l;c=x<c?x:c,d=m<d?m:d,p=x>p?x:p,f=m>f?m:f}this.minX=c,this.minY=d,this.maxX=p,this.maxY=f},i.prototype.addBounds=function(t){var e=this.minX,r=this.minY,i=this.maxX,n=this.maxY;this.minX=t.minX<e?t.minX:e,this.minY=t.minY<r?t.minY:r,this.maxX=t.maxX>i?t.maxX:i,this.maxY=t.maxY>n?t.maxY:n}},{"../math":67}],45:[function(t,e,r){function i(){s.call(this),this.children=[]}var n=t("../utils"),s=t("./DisplayObject");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{width:{get:function(){return this.scale.x*this.getLocalBounds().width},set:function(t){var e=this.getLocalBounds().width;0!==e?this.scale.x=t/e:this.scale.x=1,this._width=t}},height:{get:function(){return this.scale.y*this.getLocalBounds().height},set:function(t){var e=this.getLocalBounds().height;0!==e?this.scale.y=t/e:this.scale.y=1,this._height=t}}}),i.prototype.onChildrenChange=function(){},i.prototype.addChild=function(t){var e=arguments.length;if(e>1)for(var r=0;r<e;r++)this.addChild(arguments[r]);else t.parent&&t.parent.removeChild(t),t.parent=this,this.transform._parentID=-1,this.children.push(t),this.onChildrenChange(this.children.length-1),t.emit("added",this);return t},i.prototype.addChildAt=function(t,e){if(e>=0&&e<=this.children.length)return t.parent&&t.parent.removeChild(t),t.parent=this,this.children.splice(e,0,t),this.onChildrenChange(e),t.emit("added",this),t;throw new Error(t+"addChildAt: The index "+e+" supplied is out of bounds "+this.children.length)},i.prototype.swapChildren=function(t,e){if(t!==e){var r=this.getChildIndex(t),i=this.getChildIndex(e);if(r<0||i<0)throw new Error("swapChildren: Both the supplied DisplayObjects must be children of the caller.");this.children[r]=e,this.children[i]=t,this.onChildrenChange(r<i?r:i)}},i.prototype.getChildIndex=function(t){var e=this.children.indexOf(t);if(e===-1)throw new Error("The supplied DisplayObject must be a child of the caller");return e},i.prototype.setChildIndex=function(t,e){if(e<0||e>=this.children.length)throw new Error("The supplied index is out of bounds");var r=this.getChildIndex(t);n.removeItems(this.children,r,1),this.children.splice(e,0,t),this.onChildrenChange(e)},i.prototype.getChildAt=function(t){if(t<0||t>=this.children.length)throw new Error("getChildAt: Supplied index "+t+" does not exist in the child list, or the supplied DisplayObject is not a child of the caller");return this.children[t]},i.prototype.removeChild=function(t){var e=arguments.length;if(e>1)for(var r=0;r<e;r++)this.removeChild(arguments[r]);else{var i=this.children.indexOf(t);if(i===-1)return;t.parent=null,n.removeItems(this.children,i,1),this.onChildrenChange(i),t.emit("removed",this)}return t},i.prototype.removeChildAt=function(t){var e=this.getChildAt(t);return e.parent=null,n.removeItems(this.children,t,1),this.onChildrenChange(t),e.emit("removed",this),e},i.prototype.removeChildren=function(t,e){var r,i,n=t||0,s="number"==typeof e?e:this.children.length,o=s-n;if(o>0&&o<=s){for(r=this.children.splice(n,o),i=0;i<r.length;++i)r[i].parent=null;for(this.onChildrenChange(t),i=0;i<r.length;++i)r[i].emit("removed",this);return r}if(0===o&&0===this.children.length)return[];throw new RangeError("removeChildren: numeric values are outside the acceptable range.")},i.prototype.updateTransform=function(){if(this._boundsID++,this.visible){this.transform.updateTransform(this.parent.transform),this.worldAlpha=this.alpha*this.parent.worldAlpha;for(var t=0,e=this.children.length;t<e;++t)this.children[t].updateTransform()}},i.prototype.containerUpdateTransform=i.prototype.updateTransform,i.prototype.calculateBounds=function(){if(this._bounds.clear(),this.visible){this._calculateBounds();for(var t=0;t<this.children.length;t++){var e=this.children[t];e.calculateBounds(),this._bounds.addBounds(e._bounds)}this._boundsID=this._lastBoundsID}},i.prototype._calculateBounds=function(){},i.prototype.renderWebGL=function(t){if(this.visible&&!(this.worldAlpha<=0)&&this.renderable)if(this._mask||this._filters)this.renderAdvancedWebGL(t);else{this._renderWebGL(t);for(var e=0,r=this.children.length;e<r;++e)this.children[e].renderWebGL(t)}},i.prototype.renderAdvancedWebGL=function(t){t.currentRenderer.flush();var e,r,i=this._filters,n=this._mask;if(i){for(this._enabledFilters||(this._enabledFilters=[]),this._enabledFilters.length=0,e=0;e<i.length;e++)i[e].enabled&&this._enabledFilters.push(i[e]);this._enabledFilters.length&&t.filterManager.pushFilter(this,this._enabledFilters)}for(n&&t.maskManager.pushMask(this,this._mask),t.currentRenderer.start(),this._renderWebGL(t),e=0,r=this.children.length;e<r;e++)this.children[e].renderWebGL(t);t.currentRenderer.flush(),n&&t.maskManager.popMask(this,this._mask),i&&this._enabledFilters&&this._enabledFilters.length&&t.filterManager.popFilter(),t.currentRenderer.start()},i.prototype._renderWebGL=function(t){},i.prototype._renderCanvas=function(t){},i.prototype.renderCanvas=function(t){if(this.visible&&!(this.alpha<=0)&&this.renderable){this._mask&&t.maskManager.pushMask(this._mask),this._renderCanvas(t);for(var e=0,r=this.children.length;e<r;++e)this.children[e].renderCanvas(t);this._mask&&t.maskManager.popMask(t)}},i.prototype.destroy=function(t){s.prototype.destroy.call(this);var e="boolean"==typeof t?t:t&&t.children,r=this.children;if(this.children=null,e)for(var i=r.length-1;i>=0;i--){var n=r[i];n.parent=null,n.destroy(t)}}},{"../utils":116,"./DisplayObject":46}],46:[function(t,e,r){function i(){n.call(this);var t=s.TRANSFORM_MODE.DEFAULT===s.TRANSFORM_MODE.STATIC?o:a;this.transform=new t,this.alpha=1,this.visible=!0,this.renderable=!0,this.parent=null,this.worldAlpha=1,this.filterArea=null,this._filters=null,this._enabledFilters=null,this._bounds=new h,this._boundsID=0,this._lastBoundsID=-1,this._boundsRect=null,this._localBoundsRect=null,this._mask=null}var n=t("eventemitter3"),s=t("../const"),o=t("./TransformStatic"),a=t("./Transform"),h=t("./Bounds"),u=t("../math"),l=new i;i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{x:{get:function(){return this.position.x},set:function(t){this.transform.position.x=t}},y:{get:function(){return this.position.y},set:function(t){this.transform.position.y=t}},worldTransform:{get:function(){return this.transform.worldTransform}},localTransform:{get:function(){return this.transform.localTransform}},position:{get:function(){return this.transform.position},set:function(t){this.transform.position.copy(t)}},scale:{get:function(){return this.transform.scale},set:function(t){this.transform.scale.copy(t)}},pivot:{get:function(){return this.transform.pivot},set:function(t){this.transform.pivot.copy(t)}},skew:{get:function(){return this.transform.skew},set:function(t){this.transform.skew.copy(t)}},rotation:{get:function(){return this.transform.rotation},set:function(t){this.transform.rotation=t}},worldVisible:{get:function(){var t=this;do{if(!t.visible)return!1;t=t.parent}while(t);return!0}},mask:{get:function(){return this._mask},set:function(t){this._mask&&(this._mask.renderable=!0),this._mask=t,this._mask&&(this._mask.renderable=!1)}},filters:{get:function(){return this._filters&&this._filters.slice()},set:function(t){this._filters=t&&t.slice()}}}),i.prototype.updateTransform=function(){this.transform.updateTransform(this.parent.transform),this.worldAlpha=this.alpha*this.parent.worldAlpha,this._bounds.updateID++},i.prototype.displayObjectUpdateTransform=i.prototype.updateTransform,i.prototype._recursivePostUpdateTransform=function(){this.parent?(this.parent._recursivePostUpdateTransform(),this.transform.updateTransform(this.parent.transform)):this.transform.updateTransform(l.transform)},i.prototype.getBounds=function(t,e){return t||(this.parent?(this._recursivePostUpdateTransform(),this.updateTransform()):(this.parent=l,this.parent.transform._worldID++,this.updateTransform(),this.parent=null)),this._boundsID!==this._lastBoundsID&&this.calculateBounds(),e||(this._boundsRect||(this._boundsRect=new u.Rectangle),e=this._boundsRect),this._bounds.getRectangle(e)},i.prototype.getLocalBounds=function(t){var e=this.transform,r=this.parent;this.parent=null,this.transform=l.transform,t||(this._localBoundsRect||(this._localBoundsRect=new u.Rectangle),t=this._localBoundsRect);var i=this.getBounds(!1,t);return this.parent=r,this.transform=e,i},i.prototype.toGlobal=function(t,e,r){return r||(this._recursivePostUpdateTransform(),this.parent?this.displayObjectUpdateTransform():(this.parent=l,this.displayObjectUpdateTransform(),this.parent=null)),this.worldTransform.apply(t,e)},i.prototype.toLocal=function(t,e,r,i){return e&&(t=e.toGlobal(t,r,i)),i||(this._recursivePostUpdateTransform(),this.parent?this.displayObjectUpdateTransform():(this.parent=l,this.displayObjectUpdateTransform(),this.parent=null)),this.worldTransform.applyInverse(t,r)},i.prototype.renderWebGL=function(t){},i.prototype.renderCanvas=function(t){},i.prototype.setParent=function(t){if(!t||!t.addChild)throw new Error("setParent: Argument must be a Container");return t.addChild(this),t},i.prototype.setTransform=function(t,e,r,i,n,s,o,a,h){return this.position.x=t||0,this.position.y=e||0,this.scale.x=r?r:1,this.scale.y=i?i:1,this.rotation=n||0,this.skew.x=s||0,this.skew.y=o||0,this.pivot.x=a||0,this.pivot.y=h||0,this},i.prototype.destroy=function(){this.removeAllListeners(),this.parent&&this.parent.removeChild(this),this.transform=null,this.parent=null,this._bounds=null,this._currentBounds=null,this._mask=null,this.filterArea=null,this.interactive=!1,this.interactiveChildren=!1}},{"../const":43,"../math":67,"./Bounds":44,"./Transform":47,"./TransformStatic":49,eventemitter3:3}],47:[function(t,e,r){function i(){s.call(this),this.position=new n.Point(0,0),this.scale=new n.Point(1,1),this.skew=new n.ObservablePoint(this.updateSkew,this,0,0),this.pivot=new n.Point(0,0),this._rotation=0,this._sr=Math.sin(0),this._cr=Math.cos(0),this._cy=Math.cos(0),this._sy=Math.sin(0),this._nsx=Math.sin(0),this._cx=Math.cos(0)}var n=t("../math"),s=t("./TransformBase");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,i.prototype.updateSkew=function(){this._cy=Math.cos(this.skew.y),this._sy=Math.sin(this.skew.y),this._nsx=Math.sin(this.skew.x),this._cx=Math.cos(this.skew.x)},i.prototype.updateLocalTransform=function(){var t,e,r,i,n=this.localTransform;t=this._cr*this.scale.x,e=this._sr*this.scale.x,r=-this._sr*this.scale.y,i=this._cr*this.scale.y,n.a=this._cy*t+this._sy*r,n.b=this._cy*e+this._sy*i,n.c=this._nsx*t+this._cx*r,n.d=this._nsx*e+this._cx*i},i.prototype.updateTransform=function(t){var e,r,i,n,s=t.worldTransform,o=this.worldTransform,a=this.localTransform;e=this._cr*this.scale.x,r=this._sr*this.scale.x,i=-this._sr*this.scale.y,n=this._cr*this.scale.y,a.a=this._cy*e+this._sy*i,a.b=this._cy*r+this._sy*n,a.c=this._nsx*e+this._cx*i,a.d=this._nsx*r+this._cx*n,a.tx=this.position.x-(this.pivot.x*a.a+this.pivot.y*a.c),a.ty=this.position.y-(this.pivot.x*a.b+this.pivot.y*a.d),o.a=a.a*s.a+a.b*s.c,o.b=a.a*s.b+a.b*s.d,o.c=a.c*s.a+a.d*s.c,o.d=a.c*s.b+a.d*s.d,o.tx=a.tx*s.a+a.ty*s.c+s.tx,o.ty=a.tx*s.b+a.ty*s.d+s.ty,this._worldID++},i.prototype.setFromMatrix=function(t){t.decompose(this)},Object.defineProperties(i.prototype,{rotation:{get:function(){return this._rotation},set:function(t){this._rotation=t,this._sr=Math.sin(t),this._cr=Math.cos(t)}}}),e.exports=i},{"../math":67,"./TransformBase":48}],48:[function(t,e,r){function i(){this.worldTransform=new n.Matrix,this.localTransform=new n.Matrix,this._worldID=0}var n=t("../math");i.prototype.constructor=i,i.prototype.updateLocalTransform=function(){},i.prototype.updateTransform=function(t){var e=t.worldTransform,r=this.worldTransform,i=this.localTransform;r.a=i.a*e.a+i.b*e.c,r.b=i.a*e.b+i.b*e.d,r.c=i.c*e.a+i.d*e.c,r.d=i.c*e.b+i.d*e.d,r.tx=i.tx*e.a+i.ty*e.c+e.tx,r.ty=i.tx*e.b+i.ty*e.d+e.ty,this._worldID++},i.prototype.updateWorldTransform=i.prototype.updateTransform,i.IDENTITY=new i,e.exports=i},{"../math":67}],49:[function(t,e,r){function i(){s.call(this),this.position=new n.ObservablePoint(this.onChange,this,0,0),this.scale=new n.ObservablePoint(this.onChange,this,1,1),this.pivot=new n.ObservablePoint(this.onChange,this,0,0),this.skew=new n.ObservablePoint(this.updateSkew,this,0,0),this._rotation=0,this._sr=Math.sin(0),this._cr=Math.cos(0),this._cy=Math.cos(0),this._sy=Math.sin(0),this._nsx=Math.sin(0),this._cx=Math.cos(0),this._localID=0,this._currentLocalID=0}var n=t("../math"),s=t("./TransformBase");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,i.prototype.onChange=function(){this._localID++},i.prototype.updateSkew=function(){this._cy=Math.cos(this.skew._y),this._sy=Math.sin(this.skew._y),this._nsx=Math.sin(this.skew._x),this._cx=Math.cos(this.skew._x),this._localID++},i.prototype.updateLocalTransform=function(){var t=this.localTransform;if(this._localID!==this._currentLocalID){var e,r,i,n;e=this._cr*this.scale._x,r=this._sr*this.scale._x,i=-this._sr*this.scale._y,n=this._cr*this.scale._y,t.a=this._cy*e+this._sy*i,t.b=this._cy*r+this._sy*n,t.c=this._nsx*e+this._cx*i,t.d=this._nsx*r+this._cx*n,t.tx=this.position._x-(this.pivot._x*t.a+this.pivot._y*t.c),t.ty=this.position._y-(this.pivot._x*t.b+this.pivot._y*t.d),this._currentLocalID=this._localID,this._parentID=-1}},i.prototype.updateTransform=function(t){var e=t.worldTransform,r=this.worldTransform,i=this.localTransform;if(this._localID!==this._currentLocalID){var n,s,o,a;n=this._cr*this.scale._x,s=this._sr*this.scale._x,o=-this._sr*this.scale._y,a=this._cr*this.scale._y,i.a=this._cy*n+this._sy*o,i.b=this._cy*s+this._sy*a,i.c=this._nsx*n+this._cx*o,i.d=this._nsx*s+this._cx*a,i.tx=this.position._x-(this.pivot._x*i.a+this.pivot._y*i.c),i.ty=this.position._y-(this.pivot._x*i.b+this.pivot._y*i.d),this._currentLocalID=this._localID,this._parentID=-1}this._parentID!==t._worldID&&(r.a=i.a*e.a+i.b*e.c,r.b=i.a*e.b+i.b*e.d,r.c=i.c*e.a+i.d*e.c,r.d=i.c*e.b+i.d*e.d,r.tx=i.tx*e.a+i.ty*e.c+e.tx,r.ty=i.tx*e.b+i.ty*e.d+e.ty,this._parentID=t._worldID,this._worldID++)},i.prototype.setFromMatrix=function(t){t.decompose(this),this._localID++},Object.defineProperties(i.prototype,{rotation:{get:function(){return this._rotation},set:function(t){this._rotation=t,this._sr=Math.sin(t),this._cr=Math.cos(t),this._localID++}}}),e.exports=i},{"../math":67,"./TransformBase":48}],50:[function(t,e,r){function i(){s.call(this),this.fillAlpha=1,this.lineWidth=0,this.lineColor=0,this.graphicsData=[],this.tint=16777215,this._prevTint=16777215,this.blendMode=c.BLEND_MODES.NORMAL,this.currentPath=null,this._webGL={},this.isMask=!1,this.boundsPadding=0,this._localBounds=new p,this.dirty=0,this.fastRectDirty=-1,this.clearDirty=0,this.boundsDirty=-1,this.cachedSpriteDirty=!1,this._spriteRect=null,this._fastRect=!1}var n,s=t("../display/Container"),o=t("../textures/RenderTexture"),a=t("../textures/Texture"),h=t("./GraphicsData"),u=t("../sprites/Sprite"),l=t("../math"),c=t("../const"),d=t("../utils"),p=t("../display/Bounds"),f=t("./utils/bezierCurveTo"),v=t("../renderers/canvas/CanvasRenderer"),g=new l.Matrix,y=new l.Point,x=new Float32Array(4),m=new Float32Array(4);i._SPRITE_TEXTURE=null,i.prototype=Object.create(s.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){var t=new i;t.renderable=this.renderable,t.fillAlpha=this.fillAlpha,t.lineWidth=this.lineWidth,t.lineColor=this.lineColor,t.tint=this.tint,t.blendMode=this.blendMode,t.isMask=this.isMask,t.boundsPadding=this.boundsPadding,t.dirty=0,t.cachedSpriteDirty=this.cachedSpriteDirty;for(var e=0;e<this.graphicsData.length;++e)t.graphicsData.push(this.graphicsData[e].clone());return t.currentPath=t.graphicsData[t.graphicsData.length-1],t.updateLocalBounds(),t},i.prototype.lineStyle=function(t,e,r){if(this.lineWidth=t||0,this.lineColor=e||0,this.lineAlpha=void 0===r?1:r,this.currentPath)if(this.currentPath.shape.points.length){var i=new l.Polygon(this.currentPath.shape.points.slice(-2));i.closed=!1,this.drawShape(i)}else this.currentPath.lineWidth=this.lineWidth,this.currentPath.lineColor=this.lineColor,this.currentPath.lineAlpha=this.lineAlpha;return this},i.prototype.moveTo=function(t,e){var r=new l.Polygon([t,e]);return r.closed=!1,this.drawShape(r),this},i.prototype.lineTo=function(t,e){return this.currentPath.shape.points.push(t,e),this.dirty++,this},i.prototype.quadraticCurveTo=function(t,e,r,i){this.currentPath?0===this.currentPath.shape.points.length&&(this.currentPath.shape.points=[0,0]):this.moveTo(0,0);var n,s,o=20,a=this.currentPath.shape.points;0===a.length&&this.moveTo(0,0);for(var h=a[a.length-2],u=a[a.length-1],l=0,c=1;c<=o;++c)l=c/o,n=h+(t-h)*l,s=u+(e-u)*l,a.push(n+(t+(r-t)*l-n)*l,s+(e+(i-e)*l-s)*l);return this.dirty++,this},i.prototype.bezierCurveTo=function(t,e,r,i,n,s){this.currentPath?0===this.currentPath.shape.points.length&&(this.currentPath.shape.points=[0,0]):this.moveTo(0,0);var o=this.currentPath.shape.points,a=o[o.length-2],h=o[o.length-1];return o.length-=2,f(a,h,t,e,r,i,n,s,o),this.dirty++,this},i.prototype.arcTo=function(t,e,r,i,n){this.currentPath?0===this.currentPath.shape.points.length&&this.currentPath.shape.points.push(t,e):this.moveTo(t,e);var s=this.currentPath.shape.points,o=s[s.length-2],a=s[s.length-1],h=a-e,u=o-t,l=i-e,c=r-t,d=Math.abs(h*c-u*l);if(d<1e-8||0===n)s[s.length-2]===t&&s[s.length-1]===e||s.push(t,e);else{var p=h*h+u*u,f=l*l+c*c,v=h*l+u*c,g=n*Math.sqrt(p)/d,y=n*Math.sqrt(f)/d,x=g*v/p,m=y*v/f,_=g*c+y*u,b=g*l+y*h,T=u*(y+x),E=h*(y+x),w=c*(g+m),S=l*(g+m),C=Math.atan2(E-b,T-_),R=Math.atan2(S-b,w-_);this.arc(_+t,b+e,n,C,R,u*l>c*h)}return this.dirty++,this},i.prototype.arc=function(t,e,r,i,n,s){if(s=s||!1,i===n)return this;!s&&n<=i?n+=2*Math.PI:s&&i<=n&&(i+=2*Math.PI);var o=s?(i-n)*-1:n-i,a=40*Math.ceil(Math.abs(o)/(2*Math.PI));if(0===o)return this;var h=t+Math.cos(i)*r,u=e+Math.sin(i)*r;this.currentPath?this.currentPath.shape.points.push(h,u):this.moveTo(h,u);for(var l=this.currentPath.shape.points,c=o/(2*a),d=2*c,p=Math.cos(c),f=Math.sin(c),v=a-1,g=v%1/v,y=0;y<=v;y++){var x=y+g*y,m=c+i+d*x,_=Math.cos(m),b=-Math.sin(m);l.push((p*_+f*b)*r+t,(p*-b+f*_)*r+e)}return this.dirty++,this},i.prototype.beginFill=function(t,e){return this.filling=!0,this.fillColor=t||0,this.fillAlpha=void 0===e?1:e,this.currentPath&&this.currentPath.shape.points.length<=2&&(this.currentPath.fill=this.filling,this.currentPath.fillColor=this.fillColor,this.currentPath.fillAlpha=this.fillAlpha),this},i.prototype.endFill=function(){return this.filling=!1,this.fillColor=null,this.fillAlpha=1,this},i.prototype.drawRect=function(t,e,r,i){return this.drawShape(new l.Rectangle(t,e,r,i)),this},i.prototype.drawRoundedRect=function(t,e,r,i,n){return this.drawShape(new l.RoundedRectangle(t,e,r,i,n)),this},i.prototype.drawCircle=function(t,e,r){return this.drawShape(new l.Circle(t,e,r)),this},i.prototype.drawEllipse=function(t,e,r,i){return this.drawShape(new l.Ellipse(t,e,r,i)),this},i.prototype.drawPolygon=function(t){var e=t,r=!0;if(e instanceof l.Polygon&&(r=e.closed,e=e.points),!Array.isArray(e)){e=new Array(arguments.length);for(var i=0;i<e.length;++i)e[i]=arguments[i]}var n=new l.Polygon(e);return n.closed=r,this.drawShape(n),this},i.prototype.clear=function(){return this.lineWidth=0,this.filling=!1,this.dirty++,this.clearDirty++,this.graphicsData=[],this},i.prototype.isFastRect=function(){return 1===this.graphicsData.length&&this.graphicsData[0].shape.type===c.SHAPES.RECT&&!this.graphicsData[0].lineWidth},i.prototype._renderWebGL=function(t){this.dirty!==this.fastRectDirty&&(this.fastRectDirty=this.dirty,this._fastRect=this.isFastRect()),this._fastRect?this._renderSpriteRect(t):(t.setObjectRenderer(t.plugins.graphics),t.plugins.graphics.render(this))},i.prototype._renderSpriteRect=function(t){var e=this.graphicsData[0].shape;if(!this._spriteRect){if(!i._SPRITE_TEXTURE){var r=document.createElement("canvas");r.width=10,r.height=10;var n=r.getContext("2d");n.fillStyle="white",n.fillRect(0,0,10,10),i._SPRITE_TEXTURE=a.fromCanvas(r)}this._spriteRect=new u(i._SPRITE_TEXTURE)}if(16777215===this.tint)this._spriteRect.tint=this.graphicsData[0].fillColor;else{var s=x,o=m;d.hex2rgb(this.graphicsData[0].fillColor,s),d.hex2rgb(this.tint,o),s[0]*=o[0],s[1]*=o[1],s[2]*=o[2],this._spriteRect.tint=d.rgb2hex(s)}this._spriteRect.alpha=this.graphicsData[0].fillAlpha,this._spriteRect.worldAlpha=this.worldAlpha*this._spriteRect.alpha,i._SPRITE_TEXTURE._frame.width=e.width,i._SPRITE_TEXTURE._frame.height=e.height,this._spriteRect.transform.worldTransform=this.transform.worldTransform,this._spriteRect.anchor.set(-e.x/e.width,-e.y/e.height),this._spriteRect.onAnchorUpdate(),this._spriteRect._renderWebGL(t)},i.prototype._renderCanvas=function(t){this.isMask!==!0&&t.plugins.graphics.render(this)},i.prototype._calculateBounds=function(){if(this.renderable){this.boundsDirty!==this.dirty&&(this.boundsDirty=this.dirty,this.updateLocalBounds(),this.dirty++,this.cachedSpriteDirty=!0);var t=this._localBounds;this._bounds.addFrame(this.transform,t.minX,t.minY,t.maxX,t.maxY)}},i.prototype.containsPoint=function(t){this.worldTransform.applyInverse(t,y);for(var e=this.graphicsData,r=0;r<e.length;r++){var i=e[r];if(i.fill&&i.shape&&i.shape.contains(y.x,y.y))return!0}return!1},i.prototype.updateLocalBounds=function(){var t=1/0,e=-(1/0),r=1/0,i=-(1/0);if(this.graphicsData.length)for(var n,s,o,a,h,u,l=0;l<this.graphicsData.length;l++){var d=this.graphicsData[l],p=d.type,f=d.lineWidth;if(n=d.shape,p===c.SHAPES.RECT||p===c.SHAPES.RREC)o=n.x-f/2,a=n.y-f/2,h=n.width+f,u=n.height+f,t=o<t?o:t,e=o+h>e?o+h:e,r=a<r?a:r,i=a+u>i?a+u:i;else if(p===c.SHAPES.CIRC)o=n.x,a=n.y,h=n.radius+f/2,u=n.radius+f/2,t=o-h<t?o-h:t,e=o+h>e?o+h:e,r=a-u<r?a-u:r,i=a+u>i?a+u:i;else if(p===c.SHAPES.ELIP)o=n.x,a=n.y,h=n.width+f/2,u=n.height+f/2,t=o-h<t?o-h:t,e=o+h>e?o+h:e,r=a-u<r?a-u:r,i=a+u>i?a+u:i;else{s=n.points;for(var v=0;v<s.length;v+=2)o=s[v],a=s[v+1],t=o-f<t?o-f:t,e=o+f>e?o+f:e,r=a-f<r?a-f:r,i=a+f>i?a+f:i}}else t=0,e=0,r=0,i=0;var g=this.boundsPadding;this._localBounds.minX=t-g,this._localBounds.maxX=e+2*g,this._localBounds.minY=r-g,this._localBounds.maxY=i+2*g},i.prototype.drawShape=function(t){this.currentPath&&this.currentPath.shape.points.length<=2&&this.graphicsData.pop(),this.currentPath=null;var e=new h(this.lineWidth,this.lineColor,this.lineAlpha,this.fillColor,this.fillAlpha,this.filling,t);return this.graphicsData.push(e),e.type===c.SHAPES.POLY&&(e.shape.closed=e.shape.closed||this.filling,this.currentPath=e),this.dirty++,e},i.prototype.generateCanvasTexture=function(t,e){e=e||1;var r=this.getLocalBounds(),i=new o.create(r.width*e,r.height*e);n||(n=new v),g.tx=-r.x,g.ty=-r.y,n.render(this,i,!1,g);var s=a.fromCanvas(i.baseTexture._canvasRenderTarget.canvas,t);return s.baseTexture.resolution=e,s},i.prototype.closePath=function(){var t=this.currentPath;return t&&t.shape&&t.shape.close(),this},i.prototype.addHole=function(){var t=this.graphicsData.pop();return this.currentPath=this.graphicsData[this.graphicsData.length-1],this.currentPath.addHole(t.shape),this.currentPath=null,this},i.prototype.destroy=function(){s.prototype.destroy.apply(this,arguments);for(var t=0;t<this.graphicsData.length;++t)this.graphicsData[t].destroy();for(var e in this._webgl)for(var r=0;r<this._webgl[e].data.length;++r)this._webgl[e].data[r].destroy();
this._spriteRect&&this._spriteRect.destroy(),this.graphicsData=null,this.currentPath=null,this._webgl=null,this._localBounds=null}},{"../const":43,"../display/Bounds":44,"../display/Container":45,"../math":67,"../renderers/canvas/CanvasRenderer":74,"../sprites/Sprite":98,"../textures/RenderTexture":108,"../textures/Texture":109,"../utils":116,"./GraphicsData":51,"./utils/bezierCurveTo":53}],51:[function(t,e,r){function i(t,e,r,i,n,s,o){this.lineWidth=t,this.lineColor=e,this.lineAlpha=r,this._lineTint=e,this.fillColor=i,this.fillAlpha=n,this._fillTint=i,this.fill=s,this.holes=[],this.shape=o,this.type=o.type}i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){return new i(this.lineWidth,this.lineColor,this.lineAlpha,this.fillColor,this.fillAlpha,this.fill,this.shape)},i.prototype.addHole=function(t){this.holes.push(t)},i.prototype.destroy=function(){this.shape=null,this.holes=null}},{}],52:[function(t,e,r){function i(t){this.renderer=t}var n=t("../../renderers/canvas/CanvasRenderer"),s=t("../../const");i.prototype.constructor=i,e.exports=i,n.registerPlugin("graphics",i),i.prototype.render=function(t){var e=this.renderer,r=e.context,i=t.worldAlpha,n=t.transform.worldTransform,o=e.resolution;this._prevTint!==this.tint&&(this.dirty=!0),r.setTransform(n.a*o,n.b*o,n.c*o,n.d*o,n.tx*o,n.ty*o),t.dirty&&(this.updateGraphicsTint(t),t.dirty=!1),e.setBlendMode(t.blendMode);for(var a=0;a<t.graphicsData.length;a++){var h=t.graphicsData[a],u=h.shape,l=h._fillTint,c=h._lineTint;if(r.lineWidth=h.lineWidth,h.type===s.SHAPES.POLY){r.beginPath(),this.renderPolygon(u.points,u.closed,r);for(var d=0;d<h.holes.length;d++){var p=h.holes[d];this.renderPolygon(p.points,!0,r)}h.fill&&(r.globalAlpha=h.fillAlpha*i,r.fillStyle="#"+("00000"+(0|l).toString(16)).substr(-6),r.fill()),h.lineWidth&&(r.globalAlpha=h.lineAlpha*i,r.strokeStyle="#"+("00000"+(0|c).toString(16)).substr(-6),r.stroke())}else if(h.type===s.SHAPES.RECT)(h.fillColor||0===h.fillColor)&&(r.globalAlpha=h.fillAlpha*i,r.fillStyle="#"+("00000"+(0|l).toString(16)).substr(-6),r.fillRect(u.x,u.y,u.width,u.height)),h.lineWidth&&(r.globalAlpha=h.lineAlpha*i,r.strokeStyle="#"+("00000"+(0|c).toString(16)).substr(-6),r.strokeRect(u.x,u.y,u.width,u.height));else if(h.type===s.SHAPES.CIRC)r.beginPath(),r.arc(u.x,u.y,u.radius,0,2*Math.PI),r.closePath(),h.fill&&(r.globalAlpha=h.fillAlpha*i,r.fillStyle="#"+("00000"+(0|l).toString(16)).substr(-6),r.fill()),h.lineWidth&&(r.globalAlpha=h.lineAlpha*i,r.strokeStyle="#"+("00000"+(0|c).toString(16)).substr(-6),r.stroke());else if(h.type===s.SHAPES.ELIP){var f=2*u.width,v=2*u.height,g=u.x-f/2,y=u.y-v/2;r.beginPath();var x=.5522848,m=f/2*x,_=v/2*x,b=g+f,T=y+v,E=g+f/2,w=y+v/2;r.moveTo(g,w),r.bezierCurveTo(g,w-_,E-m,y,E,y),r.bezierCurveTo(E+m,y,b,w-_,b,w),r.bezierCurveTo(b,w+_,E+m,T,E,T),r.bezierCurveTo(E-m,T,g,w+_,g,w),r.closePath(),h.fill&&(r.globalAlpha=h.fillAlpha*i,r.fillStyle="#"+("00000"+(0|l).toString(16)).substr(-6),r.fill()),h.lineWidth&&(r.globalAlpha=h.lineAlpha*i,r.strokeStyle="#"+("00000"+(0|c).toString(16)).substr(-6),r.stroke())}else if(h.type===s.SHAPES.RREC){var S=u.x,C=u.y,R=u.width,M=u.height,A=u.radius,O=Math.min(R,M)/2|0;A=A>O?O:A,r.beginPath(),r.moveTo(S,C+A),r.lineTo(S,C+M-A),r.quadraticCurveTo(S,C+M,S+A,C+M),r.lineTo(S+R-A,C+M),r.quadraticCurveTo(S+R,C+M,S+R,C+M-A),r.lineTo(S+R,C+A),r.quadraticCurveTo(S+R,C,S+R-A,C),r.lineTo(S+A,C),r.quadraticCurveTo(S,C,S,C+A),r.closePath(),(h.fillColor||0===h.fillColor)&&(r.globalAlpha=h.fillAlpha*i,r.fillStyle="#"+("00000"+(0|l).toString(16)).substr(-6),r.fill()),h.lineWidth&&(r.globalAlpha=h.lineAlpha*i,r.strokeStyle="#"+("00000"+(0|c).toString(16)).substr(-6),r.stroke())}}},i.prototype.updateGraphicsTint=function(t){t._prevTint=t.tint;for(var e=(t.tint>>16&255)/255,r=(t.tint>>8&255)/255,i=(255&t.tint)/255,n=0;n<t.graphicsData.length;n++){var s=t.graphicsData[n],o=0|s.fillColor,a=0|s.lineColor;s._fillTint=((o>>16&255)/255*e*255<<16)+((o>>8&255)/255*r*255<<8)+(255&o)/255*i*255,s._lineTint=((a>>16&255)/255*e*255<<16)+((a>>8&255)/255*r*255<<8)+(255&a)/255*i*255}},i.prototype.renderPolygon=function(t,e,r){r.moveTo(t[0],t[1]);for(var i=1;i<t.length/2;i++)r.lineTo(t[2*i],t[2*i+1]);e&&r.closePath()},i.prototype.destroy=function(){this.renderer=null}},{"../../const":43,"../../renderers/canvas/CanvasRenderer":74}],53:[function(t,e,r){var i=function(t,e,r,i,n,s,o,a,h){h=h||[];var u,l,c,d,p,f=20;h.push(t,e);for(var v=0,g=1;g<=f;++g)v=g/f,u=1-v,l=u*u,c=l*u,d=v*v,p=d*v,h.push(c*t+3*l*v*r+3*u*d*n+p*o,c*e+3*l*v*i+3*u*d*s+p*a);return h};e.exports=i},{}],54:[function(t,e,r){function i(t){o.call(this,t),this.graphicsDataPool=[],this.primitiveShader=null,this.gl=t.gl,this.CONTEXT_UID=0}var n=t("../../utils"),s=t("../../const"),o=t("../../renderers/webgl/utils/ObjectRenderer"),a=t("../../renderers/webgl/WebGLRenderer"),h=t("./WebGLGraphicsData"),u=t("./shaders/PrimitiveShader"),l=t("./utils/buildPoly"),c=t("./utils/buildRectangle"),d=t("./utils/buildRoundedRectangle"),p=t("./utils/buildCircle");i.prototype=Object.create(o.prototype),i.prototype.constructor=i,e.exports=i,a.registerPlugin("graphics",i),i.prototype.onContextChange=function(){this.gl=this.renderer.gl,this.CONTEXT_UID=this.renderer.CONTEXT_UID,this.primitiveShader=new u(this.gl)},i.prototype.destroy=function(){o.prototype.destroy.call(this);for(var t=0;t<this.graphicsDataPool.length;++t)this.graphicsDataPool[t].destroy();this.graphicsDataPool=null},i.prototype.render=function(t){var e,r=this.renderer,i=r.gl,s=t._webGL[this.CONTEXT_UID];s&&t.dirty===s.dirty||(this.updateGraphics(t),s=t._webGL[this.CONTEXT_UID]);var o=this.primitiveShader;r.bindShader(o),r.state.setBlendMode(t.blendMode);for(var a=0,h=s.data.length;a<h;a++){e=s.data[a];var u=e.shader;r.bindShader(u),u.uniforms.translationMatrix=t.transform.worldTransform.toArray(!0),u.uniforms.tint=n.hex2rgb(t.tint),u.uniforms.alpha=t.worldAlpha,e.vao.bind().draw(i.TRIANGLE_STRIP,e.indices.length).unbind()}},i.prototype.updateGraphics=function(t){var e=this.renderer.gl,r=t._webGL[this.CONTEXT_UID];r||(r=t._webGL[this.CONTEXT_UID]={lastIndex:0,data:[],gl:e,clearDirty:-1,dirty:-1}),r.dirty=t.dirty;var i;if(t.clearDirty!==r.clearDirty){for(r.clearDirty=t.clearDirty,i=0;i<r.data.length;i++){var n=r.data[i];this.graphicsDataPool.push(n)}r.data=[],r.lastIndex=0}var o;for(i=r.lastIndex;i<t.graphicsData.length;i++){var a=t.graphicsData[i];o=this.getWebGLData(r,0),a.type===s.SHAPES.POLY&&l(a,o),a.type===s.SHAPES.RECT?c(a,o):a.type===s.SHAPES.CIRC||a.type===s.SHAPES.ELIP?p(a,o):a.type===s.SHAPES.RREC&&d(a,o),r.lastIndex++}for(i=0;i<r.data.length;i++)o=r.data[i],o.dirty&&o.upload()},i.prototype.getWebGLData=function(t,e){var r=t.data[t.data.length-1];return(!r||r.points.length>32e4)&&(r=this.graphicsDataPool.pop()||new h(this.renderer.gl,this.primitiveShader,this.renderer.state.attribsState),r.reset(e),t.data.push(r)),r.dirty=!0,r}},{"../../const":43,"../../renderers/webgl/WebGLRenderer":81,"../../renderers/webgl/utils/ObjectRenderer":91,"../../utils":116,"./WebGLGraphicsData":55,"./shaders/PrimitiveShader":56,"./utils/buildCircle":57,"./utils/buildPoly":59,"./utils/buildRectangle":60,"./utils/buildRoundedRectangle":61}],55:[function(t,e,r){function i(t,e,r){this.gl=t,this.color=[0,0,0],this.points=[],this.indices=[],this.buffer=n.GLBuffer.createVertexBuffer(t),this.indexBuffer=n.GLBuffer.createIndexBuffer(t),this.dirty=!0,this.glPoints=null,this.glIndices=null,this.shader=e,this.vao=new n.VertexArrayObject(t,r).addIndex(this.indexBuffer).addAttribute(this.buffer,e.attributes.aVertexPosition,t.FLOAT,!1,24,0).addAttribute(this.buffer,e.attributes.aColor,t.FLOAT,!1,24,8)}var n=t("pixi-gl-core");i.prototype.constructor=i,e.exports=i,i.prototype.reset=function(){this.points.length=0,this.indices.length=0},i.prototype.upload=function(){this.glPoints=new Float32Array(this.points),this.buffer.upload(this.glPoints),this.glIndices=new Uint16Array(this.indices),this.indexBuffer.upload(this.glIndices),this.dirty=!1},i.prototype.destroy=function(){this.color=null,this.points=null,this.indices=null,this.vao.destroy(),this.buffer.destroy(),this.indexBuffer.destroy(),this.gl=null,this.buffer=null,this.indexBuffer=null,this.glPoints=null,this.glIndices=null}},{"pixi-gl-core":12}],56:[function(t,e,r){function i(t){n.call(this,t,["attribute vec2 aVertexPosition;","attribute vec4 aColor;","uniform mat3 translationMatrix;","uniform mat3 projectionMatrix;","uniform float alpha;","uniform vec3 tint;","varying vec4 vColor;","void main(void){","   gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);","   vColor = aColor * vec4(tint * alpha, alpha);","}"].join("\n"),["varying vec4 vColor;","void main(void){","   gl_FragColor = vColor;","}"].join("\n"))}var n=t("../../../Shader");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i},{"../../../Shader":42}],57:[function(t,e,r){var i=t("./buildLine"),n=t("../../../const"),s=t("../../../utils"),o=function(t,e){var r,o,a=t.shape,h=a.x,u=a.y;t.type===n.SHAPES.CIRC?(r=a.radius,o=a.radius):(r=a.width,o=a.height);var l=Math.floor(30*Math.sqrt(a.radius))||Math.floor(15*Math.sqrt(a.width+a.height)),c=2*Math.PI/l,d=0;if(t.fill){var p=s.hex2rgb(t.fillColor),f=t.fillAlpha,v=p[0]*f,g=p[1]*f,y=p[2]*f,x=e.points,m=e.indices,_=x.length/6;for(m.push(_),d=0;d<l+1;d++)x.push(h,u,v,g,y,f),x.push(h+Math.sin(c*d)*r,u+Math.cos(c*d)*o,v,g,y,f),m.push(_++,_++);m.push(_-1)}if(t.lineWidth){var b=t.points;for(t.points=[],d=0;d<l+1;d++)t.points.push(h+Math.sin(c*d)*r,u+Math.cos(c*d)*o);i(t,e),t.points=b}};e.exports=o},{"../../../const":43,"../../../utils":116,"./buildLine":58}],58:[function(t,e,r){var i=t("../../../math"),n=t("../../../utils"),s=function(t,e){var r=0,s=t.points;if(0!==s.length){var o=new i.Point(s[0],s[1]),a=new i.Point(s[s.length-2],s[s.length-1]);if(o.x===a.x&&o.y===a.y){s=s.slice(),s.pop(),s.pop(),a=new i.Point(s[s.length-2],s[s.length-1]);var h=a.x+.5*(o.x-a.x),u=a.y+.5*(o.y-a.y);s.unshift(h,u),s.push(h,u)}var l,c,d,p,f,v,g,y,x,m,_,b,T,E,w,S,C,R,M,A,O,D,P,I=e.points,L=e.indices,F=s.length/2,B=s.length,N=I.length/6,U=t.lineWidth/2,k=n.hex2rgb(t.lineColor),j=t.lineAlpha,W=k[0]*j,G=k[1]*j,X=k[2]*j;for(d=s[0],p=s[1],f=s[2],v=s[3],x=-(p-v),m=d-f,P=Math.sqrt(x*x+m*m),x/=P,m/=P,x*=U,m*=U,I.push(d-x,p-m,W,G,X,j),I.push(d+x,p+m,W,G,X,j),r=1;r<F-1;r++)d=s[2*(r-1)],p=s[2*(r-1)+1],f=s[2*r],v=s[2*r+1],g=s[2*(r+1)],y=s[2*(r+1)+1],x=-(p-v),m=d-f,P=Math.sqrt(x*x+m*m),x/=P,m/=P,x*=U,m*=U,_=-(v-y),b=f-g,P=Math.sqrt(_*_+b*b),_/=P,b/=P,_*=U,b*=U,w=-m+p-(-m+v),S=-x+f-(-x+d),C=(-x+d)*(-m+v)-(-x+f)*(-m+p),R=-b+y-(-b+v),M=-_+f-(-_+g),A=(-_+g)*(-b+v)-(-_+f)*(-b+y),O=w*M-R*S,Math.abs(O)<.1?(O+=10.1,I.push(f-x,v-m,W,G,X,j),I.push(f+x,v+m,W,G,X,j)):(l=(S*A-M*C)/O,c=(R*C-w*A)/O,D=(l-f)*(l-f)+(c-v)*(c-v),D>19600?(T=x-_,E=m-b,P=Math.sqrt(T*T+E*E),T/=P,E/=P,T*=U,E*=U,I.push(f-T,v-E),I.push(W,G,X,j),I.push(f+T,v+E),I.push(W,G,X,j),I.push(f-T,v-E),I.push(W,G,X,j),B++):(I.push(l,c),I.push(W,G,X,j),I.push(f-(l-f),v-(c-v)),I.push(W,G,X,j)));for(d=s[2*(F-2)],p=s[2*(F-2)+1],f=s[2*(F-1)],v=s[2*(F-1)+1],x=-(p-v),m=d-f,P=Math.sqrt(x*x+m*m),x/=P,m/=P,x*=U,m*=U,I.push(f-x,v-m),I.push(W,G,X,j),I.push(f+x,v+m),I.push(W,G,X,j),L.push(N),r=0;r<B;r++)L.push(N++);L.push(N-1)}};e.exports=s},{"../../../math":67,"../../../utils":116}],59:[function(t,e,r){var i=t("./buildLine"),n=t("../../../utils"),s=t("earcut"),o=function(t,e){t.points=t.shape.points.slice();var r=t.points;if(t.fill&&r.length>=6){for(var o=[],a=t.holes,h=0;h<a.length;h++){var u=a[h];o.push(r.length/2),r=r.concat(u.points)}var l=e.points,c=e.indices,d=r.length/2,p=n.hex2rgb(t.fillColor),f=t.fillAlpha,v=p[0]*f,g=p[1]*f,y=p[2]*f,x=s(r,o,2);if(!x)return;var m=l.length/6;for(h=0;h<x.length;h+=3)c.push(x[h]+m),c.push(x[h]+m),c.push(x[h+1]+m),c.push(x[h+2]+m),c.push(x[h+2]+m);for(h=0;h<d;h++)l.push(r[2*h],r[2*h+1],v,g,y,f)}t.lineWidth>0&&i(t,e)};e.exports=o},{"../../../utils":116,"./buildLine":58,earcut:2}],60:[function(t,e,r){var i=t("./buildLine"),n=t("../../../utils"),s=function(t,e){var r=t.shape,s=r.x,o=r.y,a=r.width,h=r.height;if(t.fill){var u=n.hex2rgb(t.fillColor),l=t.fillAlpha,c=u[0]*l,d=u[1]*l,p=u[2]*l,f=e.points,v=e.indices,g=f.length/6;f.push(s,o),f.push(c,d,p,l),f.push(s+a,o),f.push(c,d,p,l),f.push(s,o+h),f.push(c,d,p,l),f.push(s+a,o+h),f.push(c,d,p,l),v.push(g,g,g+1,g+2,g+3,g+3)}if(t.lineWidth){var y=t.points;t.points=[s,o,s+a,o,s+a,o+h,s,o+h,s,o],i(t,e),t.points=y}};e.exports=s},{"../../../utils":116,"./buildLine":58}],61:[function(t,e,r){var i=t("earcut"),n=t("./buildLine"),s=t("../../../utils"),o=function(t,e){var r=t.shape,o=r.x,h=r.y,u=r.width,l=r.height,c=r.radius,d=[];if(d.push(o,h+c),a(o,h+l-c,o,h+l,o+c,h+l,d),a(o+u-c,h+l,o+u,h+l,o+u,h+l-c,d),a(o+u,h+c,o+u,h,o+u-c,h,d),a(o+c,h,o,h,o,h+c+1e-10,d),t.fill){var p=s.hex2rgb(t.fillColor),f=t.fillAlpha,v=p[0]*f,g=p[1]*f,y=p[2]*f,x=e.points,m=e.indices,_=x.length/6,b=i(d,null,2),T=0;for(T=0;T<b.length;T+=3)m.push(b[T]+_),m.push(b[T]+_),m.push(b[T+1]+_),m.push(b[T+2]+_),m.push(b[T+2]+_);for(T=0;T<d.length;T++)x.push(d[T],d[++T],v,g,y,f)}if(t.lineWidth){var E=t.points;t.points=d,n(t,e),t.points=E}},a=function(t,e,r,i,n,s,o){function a(t,e,r){var i=e-t;return t+i*r}for(var h,u,l,c,d,p,f=20,v=o||[],g=0,y=0;y<=f;y++)g=y/f,h=a(t,r,g),u=a(e,i,g),l=a(r,n,g),c=a(i,s,g),d=a(h,l,g),p=a(u,c,g),v.push(d,p);return v};e.exports=o},{"../../../utils":116,"./buildLine":58,earcut:2}],62:[function(t,e,r){var i=e.exports=Object.assign(t("./const"),t("./math"),{utils:t("./utils"),ticker:t("./ticker"),DisplayObject:t("./display/DisplayObject"),Container:t("./display/Container"),Transform:t("./display/Transform"),TransformStatic:t("./display/TransformStatic"),TransformBase:t("./display/TransformBase"),Sprite:t("./sprites/Sprite"),CanvasSpriteRenderer:t("./sprites/canvas/CanvasSpriteRenderer"),CanvasTinter:t("./sprites/canvas/CanvasTinter"),SpriteRenderer:t("./sprites/webgl/SpriteRenderer"),Text:t("./text/Text"),TextStyle:t("./text/TextStyle"),Graphics:t("./graphics/Graphics"),GraphicsData:t("./graphics/GraphicsData"),GraphicsRenderer:t("./graphics/webgl/GraphicsRenderer"),CanvasGraphicsRenderer:t("./graphics/canvas/CanvasGraphicsRenderer"),Texture:t("./textures/Texture"),BaseTexture:t("./textures/BaseTexture"),RenderTexture:t("./textures/RenderTexture"),BaseRenderTexture:t("./textures/BaseRenderTexture"),VideoBaseTexture:t("./textures/VideoBaseTexture"),TextureUvs:t("./textures/TextureUvs"),CanvasRenderer:t("./renderers/canvas/CanvasRenderer"),CanvasRenderTarget:t("./renderers/canvas/utils/CanvasRenderTarget"),Shader:t("./Shader"),WebGLRenderer:t("./renderers/webgl/WebGLRenderer"),WebGLManager:t("./renderers/webgl/managers/WebGLManager"),ObjectRenderer:t("./renderers/webgl/utils/ObjectRenderer"),RenderTarget:t("./renderers/webgl/utils/RenderTarget"),Quad:t("./renderers/webgl/utils/Quad"),SpriteMaskFilter:t("./renderers/webgl/filters/spriteMask/SpriteMaskFilter"),Filter:t("./renderers/webgl/filters/Filter"),glCore:t("pixi-gl-core"),autoDetectRenderer:function(t,e,r,n){return t=t||800,e=e||600,!n&&i.utils.isWebGLSupported()?new i.WebGLRenderer(t,e,r):new i.CanvasRenderer(t,e,r)}})},{"./Shader":42,"./const":43,"./display/Container":45,"./display/DisplayObject":46,"./display/Transform":47,"./display/TransformBase":48,"./display/TransformStatic":49,"./graphics/Graphics":50,"./graphics/GraphicsData":51,"./graphics/canvas/CanvasGraphicsRenderer":52,"./graphics/webgl/GraphicsRenderer":54,"./math":67,"./renderers/canvas/CanvasRenderer":74,"./renderers/canvas/utils/CanvasRenderTarget":76,"./renderers/webgl/WebGLRenderer":81,"./renderers/webgl/filters/Filter":83,"./renderers/webgl/filters/spriteMask/SpriteMaskFilter":86,"./renderers/webgl/managers/WebGLManager":90,"./renderers/webgl/utils/ObjectRenderer":91,"./renderers/webgl/utils/Quad":92,"./renderers/webgl/utils/RenderTarget":93,"./sprites/Sprite":98,"./sprites/canvas/CanvasSpriteRenderer":99,"./sprites/canvas/CanvasTinter":100,"./sprites/webgl/SpriteRenderer":102,"./text/Text":104,"./text/TextStyle":105,"./textures/BaseRenderTexture":106,"./textures/BaseTexture":107,"./textures/RenderTexture":108,"./textures/Texture":109,"./textures/TextureUvs":110,"./textures/VideoBaseTexture":111,"./ticker":113,"./utils":116,"pixi-gl-core":12}],63:[function(t,e,r){function i(t){return t<0?-1:t>0?1:0}function n(){for(var t=0;t<16;t++){var e=[];c.push(e);for(var r=0;r<16;r++)for(var n=i(s[t]*s[r]+a[t]*o[r]),d=i(o[t]*s[r]+h[t]*o[r]),p=i(s[t]*a[r]+a[t]*h[r]),f=i(o[t]*a[r]+h[t]*h[r]),v=0;v<16;v++)if(s[v]===n&&o[v]===d&&a[v]===p&&h[v]===f){e.push(v);break}}for(t=0;t<16;t++){var g=new l;g.set(s[t],o[t],a[t],h[t],0,0),u.push(g)}}var s=[1,1,0,-1,-1,-1,0,1,1,1,0,-1,-1,-1,0,1],o=[0,1,1,1,0,-1,-1,-1,0,1,1,1,0,-1,-1,-1],a=[0,-1,-1,-1,0,1,1,1,0,1,1,1,0,-1,-1,-1],h=[1,1,0,-1,-1,-1,0,1,-1,-1,0,1,1,1,0,-1],u=[],l=t("./Matrix"),c=[];n();var d={E:0,SE:1,S:2,SW:3,W:4,NW:5,N:6,NE:7,MIRROR_VERTICAL:8,MIRROR_HORIZONTAL:12,uX:function(t){return s[t]},uY:function(t){return o[t]},vX:function(t){return a[t]},vY:function(t){return h[t]},inv:function(t){return 8&t?15&t:7&-t},add:function(t,e){return c[t][e]},sub:function(t,e){return c[t][d.inv(e)]},rotate180:function(t){return 4^t},isSwapWidthHeight:function(t){return 2===(3&t)},byDirection:function(t,e){return 2*Math.abs(t)<=Math.abs(e)?e>=0?d.S:d.N:2*Math.abs(e)<=Math.abs(t)?t>0?d.E:d.W:e>0?t>0?d.SE:d.SW:t>0?d.NE:d.NW},matrixAppendRotationInv:function(t,e,r,i){var n=u[d.inv(e)];r=r||0,i=i||0,n.tx=r,n.ty=i,t.append(n)}};e.exports=d},{"./Matrix":64}],64:[function(t,e,r){function i(){this.a=1,this.b=0,this.c=0,this.d=1,this.tx=0,this.ty=0,this.array=null}var n=t("./Point");i.prototype.constructor=i,e.exports=i,i.prototype.fromArray=function(t){this.a=t[0],this.b=t[1],this.c=t[3],this.d=t[4],this.tx=t[2],this.ty=t[5]},i.prototype.set=function(t,e,r,i,n,s){return this.a=t,this.b=e,this.c=r,this.d=i,this.tx=n,this.ty=s,this},i.prototype.toArray=function(t,e){this.array||(this.array=new Float32Array(9));var r=e||this.array;return t?(r[0]=this.a,r[1]=this.b,r[2]=0,r[3]=this.c,r[4]=this.d,r[5]=0,r[6]=this.tx,r[7]=this.ty,r[8]=1):(r[0]=this.a,r[1]=this.c,r[2]=this.tx,r[3]=this.b,r[4]=this.d,r[5]=this.ty,r[6]=0,r[7]=0,r[8]=1),r},i.prototype.apply=function(t,e){e=e||new n;var r=t.x,i=t.y;return e.x=this.a*r+this.c*i+this.tx,e.y=this.b*r+this.d*i+this.ty,e},i.prototype.applyInverse=function(t,e){e=e||new n;var r=1/(this.a*this.d+this.c*-this.b),i=t.x,s=t.y;return e.x=this.d*r*i+-this.c*r*s+(this.ty*this.c-this.tx*this.d)*r,e.y=this.a*r*s+-this.b*r*i+(-this.ty*this.a+this.tx*this.b)*r,e},i.prototype.translate=function(t,e){return this.tx+=t,this.ty+=e,this},i.prototype.scale=function(t,e){return this.a*=t,this.d*=e,this.c*=t,this.b*=e,this.tx*=t,this.ty*=e,this},i.prototype.rotate=function(t){var e=Math.cos(t),r=Math.sin(t),i=this.a,n=this.c,s=this.tx;return this.a=i*e-this.b*r,this.b=i*r+this.b*e,this.c=n*e-this.d*r,this.d=n*r+this.d*e,this.tx=s*e-this.ty*r,this.ty=s*r+this.ty*e,this},i.prototype.append=function(t){var e=this.a,r=this.b,i=this.c,n=this.d;return this.a=t.a*e+t.b*i,this.b=t.a*r+t.b*n,this.c=t.c*e+t.d*i,this.d=t.c*r+t.d*n,this.tx=t.tx*e+t.ty*i+this.tx,this.ty=t.tx*r+t.ty*n+this.ty,this},i.prototype.setTransform=function(t,e,r,i,n,s,o,a,h){var u,l,c,d,p,f,v,g,y,x;return p=Math.sin(o),f=Math.cos(o),v=Math.cos(h),g=Math.sin(h),y=-Math.sin(a),x=Math.cos(a),u=f*n,l=p*n,c=-p*s,d=f*s,this.a=v*u+g*c,this.b=v*l+g*d,this.c=y*u+x*c,this.d=y*l+x*d,this.tx=t+(r*u+i*c),this.ty=e+(r*l+i*d),this},i.prototype.prepend=function(t){var e=this.tx;if(1!==t.a||0!==t.b||0!==t.c||1!==t.d){var r=this.a,i=this.c;this.a=r*t.a+this.b*t.c,this.b=r*t.b+this.b*t.d,this.c=i*t.a+this.d*t.c,this.d=i*t.b+this.d*t.d}return this.tx=e*t.a+this.ty*t.c+t.tx,this.ty=e*t.b+this.ty*t.d+t.ty,this},i.prototype.decompose=function(t){var e=this.a,r=this.b,i=this.c,n=this.d,s=Math.atan2(-i,n),o=Math.atan2(r,e),a=Math.abs(1-s/o);return a<1e-5?(t.rotation=o,e<0&&n>=0&&(t.rotation+=t.rotation<=0?Math.PI:-Math.PI),t.skew.x=t.skew.y=0):(t.skew.x=s,t.skew.y=o),t.scale.x=Math.sqrt(e*e+r*r),t.scale.y=Math.sqrt(i*i+n*n),t.position.x=this.tx,t.position.y=this.ty,t},i.prototype.invert=function(){var t=this.a,e=this.b,r=this.c,i=this.d,n=this.tx,s=t*i-e*r;return this.a=i/s,this.b=-e/s,this.c=-r/s,this.d=t/s,this.tx=(r*this.ty-i*n)/s,this.ty=-(t*this.ty-e*n)/s,this},i.prototype.identity=function(){return this.a=1,this.b=0,this.c=0,this.d=1,this.tx=0,this.ty=0,this},i.prototype.clone=function(){var t=new i;return t.a=this.a,t.b=this.b,t.c=this.c,t.d=this.d,t.tx=this.tx,t.ty=this.ty,t},i.prototype.copy=function(t){return t.a=this.a,t.b=this.b,t.c=this.c,t.d=this.d,t.tx=this.tx,t.ty=this.ty,t},i.IDENTITY=new i,i.TEMP_MATRIX=new i},{"./Point":66}],65:[function(t,e,r){function i(t,e,r,i){this._x=r||0,this._y=i||0,this.cb=t,this.scope=e}i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{x:{get:function(){return this._x},set:function(t){this._x!==t&&(this._x=t,this.cb.call(this.scope))}},y:{get:function(){return this._y},set:function(t){this._y!==t&&(this._y=t,this.cb.call(this.scope))}}}),i.prototype.set=function(t,e){var r=t||0,i=e||(0!==e?r:0);this._x===r&&this._y===i||(this._x=r,this._y=i,this.cb.call(this.scope))},i.prototype.copy=function(t){this._x===t.x&&this._y===t.y||(this._x=t.x,this._y=t.y,this.cb.call(this.scope))}},{}],66:[function(t,e,r){function i(t,e){this.x=t||0,this.y=e||0}i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){return new i(this.x,this.y)},i.prototype.copy=function(t){this.set(t.x,t.y)},i.prototype.equals=function(t){return t.x===this.x&&t.y===this.y},i.prototype.set=function(t,e){this.x=t||0,this.y=e||(0!==e?this.x:0)}},{}],67:[function(t,e,r){e.exports={Point:t("./Point"),ObservablePoint:t("./ObservablePoint"),Matrix:t("./Matrix"),GroupD8:t("./GroupD8"),Circle:t("./shapes/Circle"),Ellipse:t("./shapes/Ellipse"),Polygon:t("./shapes/Polygon"),Rectangle:t("./shapes/Rectangle"),RoundedRectangle:t("./shapes/RoundedRectangle")}},{"./GroupD8":63,"./Matrix":64,"./ObservablePoint":65,"./Point":66,"./shapes/Circle":68,"./shapes/Ellipse":69,"./shapes/Polygon":70,"./shapes/Rectangle":71,"./shapes/RoundedRectangle":72}],68:[function(t,e,r){function i(t,e,r){this.x=t||0,this.y=e||0,this.radius=r||0,this.type=s.SHAPES.CIRC}var n=t("./Rectangle"),s=t("../../const");i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){return new i(this.x,this.y,this.radius)},i.prototype.contains=function(t,e){if(this.radius<=0)return!1;var r=this.x-t,i=this.y-e,n=this.radius*this.radius;return r*=r,i*=i,r+i<=n},i.prototype.getBounds=function(){return new n(this.x-this.radius,this.y-this.radius,2*this.radius,2*this.radius)}},{"../../const":43,"./Rectangle":71}],69:[function(t,e,r){function i(t,e,r,i){this.x=t||0,this.y=e||0,this.width=r||0,this.height=i||0,this.type=s.SHAPES.ELIP}var n=t("./Rectangle"),s=t("../../const");i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){return new i(this.x,this.y,this.width,this.height)},i.prototype.contains=function(t,e){if(this.width<=0||this.height<=0)return!1;var r=(t-this.x)/this.width,i=(e-this.y)/this.height;return r*=r,i*=i,r+i<=1},i.prototype.getBounds=function(){return new n(this.x-this.width,this.y-this.height,this.width,this.height)}},{"../../const":43,"./Rectangle":71}],70:[function(t,e,r){function i(t){var e=t;if(!Array.isArray(e)){e=new Array(arguments.length);for(var r=0;r<e.length;++r)e[r]=arguments[r]}if(e[0]instanceof n){for(var i=[],o=0,a=e.length;o<a;o++)i.push(e[o].x,e[o].y);e=i}this.closed=!0,this.points=e,this.type=s.SHAPES.POLY}var n=t("../Point"),s=t("../../const");i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){return new i(this.points.slice())},i.prototype.close=function(){var t=this.points;t[0]===t[t.length-2]&&t[1]===t[t.length-1]||t.push(t[0],t[1])},i.prototype.contains=function(t,e){for(var r=!1,i=this.points.length/2,n=0,s=i-1;n<i;s=n++){var o=this.points[2*n],a=this.points[2*n+1],h=this.points[2*s],u=this.points[2*s+1],l=a>e!=u>e&&t<(h-o)*(e-a)/(u-a)+o;l&&(r=!r)}return r}},{"../../const":43,"../Point":66}],71:[function(t,e,r){function i(t,e,r,i){this.x=t||0,this.y=e||0,this.width=r||0,this.height=i||0,this.type=n.SHAPES.RECT}var n=t("../../const");i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{left:{get:function(){return this.x}},right:{get:function(){return this.x+this.width}},top:{get:function(){return this.y}},bottom:{get:function(){return this.y+this.height}}}),i.EMPTY=new i(0,0,0,0),i.prototype.clone=function(){return new i(this.x,this.y,this.width,this.height)},i.prototype.copy=function(t){return this.x=t.x,this.y=t.y,this.width=t.width,this.height=t.height,this},i.prototype.contains=function(t,e){return!(this.width<=0||this.height<=0)&&(t>=this.x&&t<this.x+this.width&&e>=this.y&&e<this.y+this.height)},i.prototype.pad=function(t,e){t=t||0,e=e||(0!==e?t:0),this.x-=t,this.y-=e,this.width+=2*t,this.height+=2*e},i.prototype.fit=function(t){this.x<t.x&&(this.width+=this.x,this.width<0&&(this.width=0),this.x=t.x),this.y<t.y&&(this.height+=this.y,this.height<0&&(this.height=0),this.y=t.y),this.x+this.width>t.x+t.width&&(this.width=t.width-this.x,this.width<0&&(this.width=0)),this.y+this.height>t.y+t.height&&(this.height=t.height-this.y,this.height<0&&(this.height=0))},i.prototype.enlarge=function(t){if(t!==i.EMPTY){var e=Math.min(this.x,t.x),r=Math.max(this.x+this.width,t.x+t.width),n=Math.min(this.y,t.y),s=Math.max(this.y+this.height,t.y+t.height);this.x=e,this.width=r-e,this.y=n,this.height=s-n}}},{"../../const":43}],72:[function(t,e,r){function i(t,e,r,i,s){this.x=t||0,this.y=e||0,this.width=r||0,this.height=i||0,this.radius=s||20,this.type=n.SHAPES.RREC}var n=t("../../const");i.prototype.constructor=i,e.exports=i,i.prototype.clone=function(){return new i(this.x,this.y,this.width,this.height,this.radius)},i.prototype.contains=function(t,e){return!(this.width<=0||this.height<=0)&&(t>=this.x&&t<=this.x+this.width&&e>=this.y&&e<=this.y+this.height)}},{"../../const":43}],73:[function(t,e,r){function i(t,e,r,i){if(u.call(this),n.sayHello(t),i)for(var s in o.DEFAULT_RENDER_OPTIONS)"undefined"==typeof i[s]&&(i[s]=o.DEFAULT_RENDER_OPTIONS[s]);else i=o.DEFAULT_RENDER_OPTIONS;this.type=o.RENDERER_TYPE.UNKNOWN,this.width=e||800,this.height=r||600,this.view=i.view||document.createElement("canvas"),this.resolution=i.resolution,this.transparent=i.transparent,this.autoResize=i.autoResize||!1,this.blendModes=null,this.preserveDrawingBuffer=i.preserveDrawingBuffer,this.clearBeforeRender=i.clearBeforeRender,this.roundPixels=i.roundPixels,this._backgroundColor=0,this._backgroundColorRgba=[0,0,0,0],this._backgroundColorString="#000000",this.backgroundColor=i.backgroundColor||this._backgroundColor,this._tempDisplayObjectParent=new a,this._lastObjectRendered=this._tempDisplayObjectParent}var n=t("../utils"),s=t("../math"),o=t("../const"),a=t("../display/Container"),h=t("../textures/RenderTexture"),u=t("eventemitter3"),l=new s.Matrix;i.prototype=Object.create(u.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{backgroundColor:{get:function(){return this._backgroundColor},set:function(t){this._backgroundColor=t,this._backgroundColorString=n.hex2string(t),n.hex2rgb(t,this._backgroundColorRgba)}}}),i.prototype.resize=function(t,e){this.width=t*this.resolution,this.height=e*this.resolution,this.view.width=this.width,this.view.height=this.height,this.autoResize&&(this.view.style.width=this.width/this.resolution+"px",this.view.style.height=this.height/this.resolution+"px")},i.prototype.generateTexture=function(t,e,r){var i=t.getLocalBounds(),n=h.create(0|i.width,0|i.height,e,r);return l.tx=-i.x,l.ty=-i.y,this.render(t,n,!1,l,!0),n},i.prototype.destroy=function(t){t&&this.view.parentNode&&this.view.parentNode.removeChild(this.view),this.type=o.RENDERER_TYPE.UNKNOWN,this.width=0,this.height=0,this.view=null,this.resolution=0,this.transparent=!1,this.autoResize=!1,this.blendModes=null,this.preserveDrawingBuffer=!1,this.clearBeforeRender=!1,this.roundPixels=!1,this._backgroundColor=0,this._backgroundColorRgba=null,this._backgroundColorString=null,this.backgroundColor=0,this._tempDisplayObjectParent=null,this._lastObjectRendered=null}},{"../const":43,"../display/Container":45,"../math":67,"../textures/RenderTexture":108,"../utils":116,eventemitter3:3}],74:[function(t,e,r){function i(t,e,r){r=r||{},n.call(this,"Canvas",t,e,r),this.type=u.RENDERER_TYPE.CANVAS,this.rootContext=this.view.getContext("2d",{alpha:this.transparent}),this.rootResolution=this.resolution,this.refresh=!0,this.maskManager=new s(this),this.smoothProperty="imageSmoothingEnabled",this.rootContext.imageSmoothingEnabled||(this.rootContext.webkitImageSmoothingEnabled?this.smoothProperty="webkitImageSmoothingEnabled":this.rootContext.mozImageSmoothingEnabled?this.smoothProperty="mozImageSmoothingEnabled":this.rootContext.oImageSmoothingEnabled?this.smoothProperty="oImageSmoothingEnabled":this.rootContext.msImageSmoothingEnabled&&(this.smoothProperty="msImageSmoothingEnabled")),this.initPlugins(),this.blendModes=a(),this._activeBlendMode=null,this.context=null,this.renderingToScreen=!1,this.resize(t,e)}var n=t("../SystemRenderer"),s=t("./utils/CanvasMaskManager"),o=t("./utils/CanvasRenderTarget"),a=t("./utils/mapCanvasBlendModesToPixi"),h=t("../../utils"),u=t("../../const");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,h.pluginTarget.mixin(i),i.prototype.render=function(t,e,r,i,n){if(this.view){this.renderingToScreen=!e,this.emit("prerender"),e?(e=e.baseTexture||e,e._canvasRenderTarget||(e._canvasRenderTarget=new o(e.width,e.height,e.resolution),e.source=e._canvasRenderTarget.canvas,e.valid=!0),this.context=e._canvasRenderTarget.context,this.resolution=e._canvasRenderTarget.resolution):(this.context=this.rootContext,this.resolution=this.rootResolution);var s=this.context;if(e||(this._lastObjectRendered=t),!n){var a=t.parent,h=this._tempDisplayObjectParent.transform.worldTransform;i?i.copy(h):h.identity(),t.parent=this._tempDisplayObjectParent,t.updateTransform(),t.parent=a}s.setTransform(1,0,0,1,0,0),s.globalAlpha=1,s.globalCompositeOperation=this.blendModes[u.BLEND_MODES.NORMAL],navigator.isCocoonJS&&this.view.screencanvas&&(s.fillStyle="black",s.clear()),(void 0!==r?r:this.clearBeforeRender)&&this.renderingToScreen&&(this.transparent?s.clearRect(0,0,this.width,this.height):(s.fillStyle=this._backgroundColorString,s.fillRect(0,0,this.width,this.height)));var l=this.context;this.context=s,t.renderCanvas(this),this.context=l,this.emit("postrender")}},i.prototype.setBlendMode=function(t){this._activeBlendMode!==t&&(this.context.globalCompositeOperation=this.blendModes[t])},i.prototype.destroy=function(t){this.destroyPlugins(),n.prototype.destroy.call(this,t),this.context=null,this.refresh=!0,this.maskManager.destroy(),this.maskManager=null,this.smoothProperty=null},i.prototype.resize=function(t,e){n.prototype.resize.call(this,t,e),this.smoothProperty&&(this.rootContext[this.smoothProperty]=u.SCALE_MODES.DEFAULT===u.SCALE_MODES.LINEAR)}},{"../../const":43,"../../utils":116,"../SystemRenderer":73,"./utils/CanvasMaskManager":75,"./utils/CanvasRenderTarget":76,"./utils/mapCanvasBlendModesToPixi":78}],75:[function(t,e,r){function i(t){this.renderer=t}var n=t("../../../const");i.prototype.constructor=i,e.exports=i,i.prototype.pushMask=function(t){var e=this.renderer;e.context.save();var r=t.alpha,i=t.transform.worldTransform,n=e.resolution;e.context.setTransform(i.a*n,i.b*n,i.c*n,i.d*n,i.tx*n,i.ty*n),t._texture||(this.renderGraphicsShape(t),e.context.clip()),t.worldAlpha=r},i.prototype.renderGraphicsShape=function(t){var e=this.renderer.context,r=t.graphicsData.length;if(0!==r){e.beginPath();for(var i=0;i<r;i++){var s=t.graphicsData[i],o=s.shape;if(s.type===n.SHAPES.POLY){var a=o.points;e.moveTo(a[0],a[1]);for(var h=1;h<a.length/2;h++)e.lineTo(a[2*h],a[2*h+1]);a[0]===a[a.length-2]&&a[1]===a[a.length-1]&&e.closePath()}else if(s.type===n.SHAPES.RECT)e.rect(o.x,o.y,o.width,o.height),
e.closePath();else if(s.type===n.SHAPES.CIRC)e.arc(o.x,o.y,o.radius,0,2*Math.PI),e.closePath();else if(s.type===n.SHAPES.ELIP){var u=2*o.width,l=2*o.height,c=o.x-u/2,d=o.y-l/2,p=.5522848,f=u/2*p,v=l/2*p,g=c+u,y=d+l,x=c+u/2,m=d+l/2;e.moveTo(c,m),e.bezierCurveTo(c,m-v,x-f,d,x,d),e.bezierCurveTo(x+f,d,g,m-v,g,m),e.bezierCurveTo(g,m+v,x+f,y,x,y),e.bezierCurveTo(x-f,y,c,m+v,c,m),e.closePath()}else if(s.type===n.SHAPES.RREC){var _=o.x,b=o.y,T=o.width,E=o.height,w=o.radius,S=Math.min(T,E)/2|0;w=w>S?S:w,e.moveTo(_,b+w),e.lineTo(_,b+E-w),e.quadraticCurveTo(_,b+E,_+w,b+E),e.lineTo(_+T-w,b+E),e.quadraticCurveTo(_+T,b+E,_+T,b+E-w),e.lineTo(_+T,b+w),e.quadraticCurveTo(_+T,b,_+T-w,b),e.lineTo(_+w,b),e.quadraticCurveTo(_,b,_,b+w),e.closePath()}}}},i.prototype.popMask=function(t){t.context.restore()},i.prototype.destroy=function(){}},{"../../../const":43}],76:[function(t,e,r){function i(t,e,r){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.resolution=r||n.RESOLUTION,this.resize(t,e)}var n=t("../../../const");i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{width:{get:function(){return this.canvas.width},set:function(t){this.canvas.width=t}},height:{get:function(){return this.canvas.height},set:function(t){this.canvas.height=t}}}),i.prototype.clear=function(){this.context.setTransform(1,0,0,1,0,0),this.context.clearRect(0,0,this.canvas.width,this.canvas.height)},i.prototype.resize=function(t,e){this.canvas.width=t*this.resolution,this.canvas.height=e*this.resolution},i.prototype.destroy=function(){this.context=null,this.canvas=null}},{"../../../const":43}],77:[function(t,e,r){var i=function(t){var e=document.createElement("canvas");e.width=6,e.height=1;var r=e.getContext("2d");return r.fillStyle=t,r.fillRect(0,0,6,1),e},n=function(){if("undefined"==typeof document)return!1;var t=i("#ff00ff"),e=i("#ffff00"),r=document.createElement("canvas");r.width=6,r.height=1;var n=r.getContext("2d");n.globalCompositeOperation="multiply",n.drawImage(t,0,0),n.drawImage(e,2,0);var s=n.getImageData(2,0,1,1);if(!s)return!1;var o=s.data;return 255===o[0]&&0===o[1]&&0===o[2]};e.exports=n},{}],78:[function(t,e,r){function i(t){return t=t||[],s()?(t[n.BLEND_MODES.NORMAL]="source-over",t[n.BLEND_MODES.ADD]="lighter",t[n.BLEND_MODES.MULTIPLY]="multiply",t[n.BLEND_MODES.SCREEN]="screen",t[n.BLEND_MODES.OVERLAY]="overlay",t[n.BLEND_MODES.DARKEN]="darken",t[n.BLEND_MODES.LIGHTEN]="lighten",t[n.BLEND_MODES.COLOR_DODGE]="color-dodge",t[n.BLEND_MODES.COLOR_BURN]="color-burn",t[n.BLEND_MODES.HARD_LIGHT]="hard-light",t[n.BLEND_MODES.SOFT_LIGHT]="soft-light",t[n.BLEND_MODES.DIFFERENCE]="difference",t[n.BLEND_MODES.EXCLUSION]="exclusion",t[n.BLEND_MODES.HUE]="hue",t[n.BLEND_MODES.SATURATION]="saturate",t[n.BLEND_MODES.COLOR]="color",t[n.BLEND_MODES.LUMINOSITY]="luminosity"):(t[n.BLEND_MODES.NORMAL]="source-over",t[n.BLEND_MODES.ADD]="lighter",t[n.BLEND_MODES.MULTIPLY]="source-over",t[n.BLEND_MODES.SCREEN]="source-over",t[n.BLEND_MODES.OVERLAY]="source-over",t[n.BLEND_MODES.DARKEN]="source-over",t[n.BLEND_MODES.LIGHTEN]="source-over",t[n.BLEND_MODES.COLOR_DODGE]="source-over",t[n.BLEND_MODES.COLOR_BURN]="source-over",t[n.BLEND_MODES.HARD_LIGHT]="source-over",t[n.BLEND_MODES.SOFT_LIGHT]="source-over",t[n.BLEND_MODES.DIFFERENCE]="source-over",t[n.BLEND_MODES.EXCLUSION]="source-over",t[n.BLEND_MODES.HUE]="source-over",t[n.BLEND_MODES.SATURATION]="source-over",t[n.BLEND_MODES.COLOR]="source-over",t[n.BLEND_MODES.LUMINOSITY]="source-over"),t}var n=t("../../../const"),s=t("./canUseNewCanvasBlendModes");e.exports=i},{"../../../const":43,"./canUseNewCanvasBlendModes":77}],79:[function(t,e,r){function i(t){this.renderer=t,this.count=0,this.checkCount=0,this.maxIdle=3600,this.checkCountMax=600,this.mode=n.GC_MODES.DEFAULT}var n=t("../../const");i.prototype.constructor=i,e.exports=i,i.prototype.update=function(){this.count++,this.mode!==n.GC_MODES.MANUAL&&(this.checkCount++,this.checkCount>this.checkCountMax&&(this.checkCount=0,this.run()))},i.prototype.run=function(){var t,e,r=this.renderer.textureManager,i=r._managedTextures,n=!1;for(t=0;t<i.length;t++){var s=i[t];!s._glRenderTargets&&this.count-s.touched>this.maxIdle&&(r.destroyTexture(s,!0),i[t]=null,n=!0)}if(n){for(e=0,t=0;t<i.length;t++)null!==i[t]&&(i[e++]=i[t]);i.length=e}},i.prototype.unload=function(t){var e=this.renderer.textureManager;t._texture&&e.destroyTexture(t._texture,!0);for(var r=t.children.length-1;r>=0;r--)this.unload(t.children[r])}},{"../../const":43}],80:[function(t,e,r){var i=t("pixi-gl-core").GLTexture,n=t("../../const"),s=t("./utils/RenderTarget"),o=t("../../utils"),a=function(t){this.renderer=t,this.gl=t.gl,this._managedTextures=[]};a.prototype.bindTexture=function(){},a.prototype.getTexture=function(){},a.prototype.updateTexture=function(t){t=t.baseTexture||t;var e=!!t._glRenderTargets;if(t.hasLoaded){var r=t._glTextures[this.renderer.CONTEXT_UID];if(r)e?t._glRenderTargets[this.renderer.CONTEXT_UID].resize(t.width,t.height):r.upload(t.source);else{if(e){var o=new s(this.gl,t.width,t.height,t.scaleMode,t.resolution);o.resize(t.width,t.height),t._glRenderTargets[this.renderer.CONTEXT_UID]=o,r=o.texture}else r=new i(this.gl),r.premultiplyAlpha=!0,r.upload(t.source);t._glTextures[this.renderer.CONTEXT_UID]=r,t.on("update",this.updateTexture,this),t.on("dispose",this.destroyTexture,this),this._managedTextures.push(t),t.isPowerOfTwo?(t.mipmap&&r.enableMipmap(),t.wrapMode===n.WRAP_MODES.CLAMP?r.enableWrapClamp():t.wrapMode===n.WRAP_MODES.REPEAT?r.enableWrapRepeat():r.enableWrapMirrorRepeat()):r.enableWrapClamp(),t.scaleMode===n.SCALE_MODES.NEAREST?r.enableNearestScaling():r.enableLinearScaling()}return r}},a.prototype.destroyTexture=function(t,e){if(t=t.baseTexture||t,t.hasLoaded&&t._glTextures[this.renderer.CONTEXT_UID]&&(t._glTextures[this.renderer.CONTEXT_UID].destroy(),t.off("update",this.updateTexture,this),t.off("dispose",this.destroyTexture,this),delete t._glTextures[this.renderer.CONTEXT_UID],!e)){var r=this._managedTextures.indexOf(t);r!==-1&&o.removeItems(this._managedTextures,r,1)}},a.prototype.removeAll=function(){for(var t=0;t<this._managedTextures.length;++t){var e=this._managedTextures[t];e._glTextures[this.renderer.CONTEXT_UID]&&delete e._glTextures[this.renderer.CONTEXT_UID]}},a.prototype.destroy=function(){for(var t=0;t<this._managedTextures.length;++t){var e=this._managedTextures[t];this.destroyTexture(e,!0),e.off("update",this.updateTexture,this),e.off("dispose",this.destroyTexture,this)}this._managedTextures=null},e.exports=a},{"../../const":43,"../../utils":116,"./utils/RenderTarget":93,"pixi-gl-core":12}],81:[function(t,e,r){function i(t,e,r){r=r||{},n.call(this,"WebGL",t,e,r),this.type=x.RENDERER_TYPE.WEBGL,this.handleContextLost=this.handleContextLost.bind(this),this.handleContextRestored=this.handleContextRestored.bind(this),this.view.addEventListener("webglcontextlost",this.handleContextLost,!1),this.view.addEventListener("webglcontextrestored",this.handleContextRestored,!1),this._contextOptions={alpha:this.transparent,antialias:r.antialias,premultipliedAlpha:this.transparent&&"notMultiplied"!==this.transparent,stencil:!0,preserveDrawingBuffer:r.preserveDrawingBuffer},this._backgroundColorRgba[3]=this.transparent?0:1,this.maskManager=new s(this),this.stencilManager=new o(this),this.emptyRenderer=new u(this),this.currentRenderer=this.emptyRenderer,this.initPlugins(),r.context&&v(r.context),this.gl=r.context||p(this.view,this._contextOptions),this.CONTEXT_UID=m++,this.state=new d(this.gl),this.renderingToScreen=!0,this._initContext(),this.filterManager=new a(this),this.drawModes=f(this.gl),this._activeShader=null,this._activeRenderTarget=null,this._activeTextureLocation=999,this._activeTexture=null,this.setBlendMode(0)}var n=t("../SystemRenderer"),s=t("./managers/MaskManager"),o=t("./managers/StencilManager"),a=t("./managers/FilterManager"),h=t("./utils/RenderTarget"),u=t("./utils/ObjectRenderer"),l=t("./TextureManager"),c=t("./TextureGarbageCollector"),d=t("./WebGLState"),p=t("pixi-gl-core").createContext,f=t("./utils/mapWebGLDrawModesToPixi"),v=t("./utils/validateContext"),g=t("../../utils"),y=t("pixi-gl-core"),x=t("../../const"),m=0;i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,g.pluginTarget.mixin(i),i.prototype._initContext=function(){var t=this.gl;this.textureManager=new l(this),this.textureGC=new c(this),this.state.resetToDefault(),this.rootRenderTarget=new h(t,this.width,this.height,null,this.resolution,(!0)),this.rootRenderTarget.clearColor=this._backgroundColorRgba,this.bindRenderTarget(this.rootRenderTarget),this.emit("context",t),this.resize(this.width,this.height)},i.prototype.render=function(t,e,r,i,n){if(this.renderingToScreen=!e,this.emit("prerender"),this.gl&&!this.gl.isContextLost()){if(e||(this._lastObjectRendered=t),!n){var s=t.parent;t.parent=this._tempDisplayObjectParent,t.updateTransform(),t.parent=s}this.bindRenderTexture(e,i),this.currentRenderer.start(),(void 0!==r?r:this.clearBeforeRender)&&this._activeRenderTarget.clear(),t.renderWebGL(this),this.currentRenderer.flush(),this.textureGC.update(),this.emit("postrender")}},i.prototype.setObjectRenderer=function(t){this.currentRenderer!==t&&(this.currentRenderer.stop(),this.currentRenderer=t,this.currentRenderer.start())},i.prototype.flush=function(){this.setObjectRenderer(this.emptyRenderer)},i.prototype.resize=function(t,e){n.prototype.resize.call(this,t,e),this.rootRenderTarget.resize(t,e),this._activeRenderTarget===this.rootRenderTarget&&(this.rootRenderTarget.activate(),this._activeShader&&(this._activeShader.uniforms.projectionMatrix=this.rootRenderTarget.projectionMatrix.toArray(!0)))},i.prototype.setBlendMode=function(t){this.state.setBlendMode(t)},i.prototype.clear=function(t){this._activeRenderTarget.clear(t)},i.prototype.setTransform=function(t){this._activeRenderTarget.transform=t},i.prototype.bindRenderTexture=function(t,e){var r;if(t){var i=t.baseTexture,n=this.gl;i._glRenderTargets[this.CONTEXT_UID]?(this._activeTextureLocation=i._id,n.activeTexture(n.TEXTURE0+i._id),n.bindTexture(n.TEXTURE_2D,null)):(this.textureManager.updateTexture(i),n.bindTexture(n.TEXTURE_2D,null)),r=i._glRenderTargets[this.CONTEXT_UID],r.setFrame(t.frame)}else r=this.rootRenderTarget;return r.transform=e,this.bindRenderTarget(r),this},i.prototype.bindRenderTarget=function(t){return t!==this._activeRenderTarget&&(this._activeRenderTarget=t,t.activate(),this._activeShader&&(this._activeShader.uniforms.projectionMatrix=t.projectionMatrix.toArray(!0)),this.stencilManager.setMaskStack(t.stencilMaskStack)),this},i.prototype.bindShader=function(t){return this._activeShader!==t&&(this._activeShader=t,t.bind(),t.uniforms.projectionMatrix=this._activeRenderTarget.projectionMatrix.toArray(!0)),this},i.prototype.bindTexture=function(t,e){t=t.baseTexture||t;var r=this.gl;return e=e||0,this._activeTextureLocation!==e&&(this._activeTextureLocation=e,r.activeTexture(r.TEXTURE0+e)),this._activeTexture=t,t._glTextures[this.CONTEXT_UID]?(t.touched=this.textureGC.count,t._glTextures[this.CONTEXT_UID].bind()):this.textureManager.updateTexture(t),this},i.prototype.createVao=function(){return new y.VertexArrayObject(this.gl,this.state.attribState)},i.prototype.reset=function(){return this.setObjectRenderer(this.emptyRenderer),this._activeShader=null,this._activeRenderTarget=this.rootRenderTarget,this._activeTextureLocation=999,this._activeTexture=null,this.rootRenderTarget.activate(),this.state.resetToDefault(),this},i.prototype.handleContextLost=function(t){t.preventDefault()},i.prototype.handleContextRestored=function(){this._initContext(),this.textureManager.removeAll()},i.prototype.destroy=function(t){this.destroyPlugins(),this.view.removeEventListener("webglcontextlost",this.handleContextLost),this.view.removeEventListener("webglcontextrestored",this.handleContextRestored),this.textureManager.destroy(),n.prototype.destroy.call(this,t),this.uid=0,this.maskManager.destroy(),this.stencilManager.destroy(),this.filterManager.destroy(),this.maskManager=null,this.filterManager=null,this.textureManager=null,this.currentRenderer=null,this.handleContextLost=null,this.handleContextRestored=null,this._contextOptions=null,this.gl.useProgram(null),this.gl.getExtension("WEBGL_lose_context")&&this.gl.getExtension("WEBGL_lose_context").loseContext(),this.gl=null}},{"../../const":43,"../../utils":116,"../SystemRenderer":73,"./TextureGarbageCollector":79,"./TextureManager":80,"./WebGLState":82,"./managers/FilterManager":87,"./managers/MaskManager":88,"./managers/StencilManager":89,"./utils/ObjectRenderer":91,"./utils/RenderTarget":93,"./utils/mapWebGLDrawModesToPixi":96,"./utils/validateContext":97,"pixi-gl-core":12}],82:[function(t,e,r){function i(t){this.activeState=new Uint8Array(16),this.defaultState=new Uint8Array(16),this.defaultState[0]=1,this.stackIndex=0,this.stack=[],this.gl=t,this.maxAttribs=t.getParameter(t.MAX_VERTEX_ATTRIBS),this.attribState={tempAttribState:new Array(this.maxAttribs),attribState:new Array(this.maxAttribs)},this.blendModes=n(t),this.nativeVaoExtension=t.getExtension("OES_vertex_array_object")||t.getExtension("MOZ_OES_vertex_array_object")||t.getExtension("WEBKIT_OES_vertex_array_object")}var n=t("./utils/mapWebGLBlendModesToPixi");i.prototype.push=function(){var t=this.stack[++this.stackIndex];t||(t=this.stack[this.stackIndex]=new Uint8Array(16));for(var e=0;e<this.activeState.length;e++)this.activeState[e]=t[e]};var s=0,o=1,a=2,h=3,u=4;i.prototype.pop=function(){var t=this.stack[--this.stackIndex];this.setState(t)},i.prototype.setState=function(t){this.setBlend(t[s]),this.setDepthTest(t[o]),this.setFrontFace(t[a]),this.setCullFace(t[h]),this.setBlendMode(t[u])},i.prototype.setBlend=function(t){if(!(this.activeState[s]===t|0)){this.activeState[s]=0|t;var e=this.gl;t?e.enable(e.BLEND):e.disable(e.BLEND)}},i.prototype.setBlendMode=function(t){t!==this.activeState[u]&&(this.activeState[u]=t,this.gl.blendFunc(this.blendModes[t][0],this.blendModes[t][1]))},i.prototype.setDepthTest=function(t){if(!(this.activeState[o]===t|0)){this.activeState[o]=0|t;var e=this.gl;t?e.enable(e.DEPTH_TEST):e.disable(e.DEPTH_TEST)}},i.prototype.setCullFace=function(t){if(!(this.activeState[h]===t|0)){this.activeState[h]=0|t;var e=this.gl;t?e.enable(e.CULL_FACE):e.disable(e.CULL_FACE)}},i.prototype.setFrontFace=function(t){if(!(this.activeState[a]===t|0)){this.activeState[a]=0|t;var e=this.gl;t?e.frontFace(e.CW):e.frontFace(e.CCW)}},i.prototype.resetAttributes=function(){var t;for(t=0;t<this.attribState.tempAttribState.length;t++)this.attribState.tempAttribState[t]=0;for(t=0;t<this.attribState.attribState.length;t++)this.attribState.attribState[t]=0;var e=this.gl;for(t=1;t<this.maxAttribs;t++)e.disableVertexAttribArray(t)},i.prototype.resetToDefault=function(){this.nativeVaoExtension&&this.nativeVaoExtension.bindVertexArrayOES(null),this.resetAttributes();for(var t=0;t<this.activeState.length;t++)this.activeState[t]=32;var e=this.gl;e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),this.setState(this.defaultState)},e.exports=i},{"./utils/mapWebGLBlendModesToPixi":95}],83:[function(t,e,r){function i(t,e,r){this.vertexSrc=t||i.defaultVertexSrc,this.fragmentSrc=e||i.defaultFragmentSrc,this.blendMode=o.BLEND_MODES.NORMAL,this.uniformData=r||n(this.vertexSrc,this.fragmentSrc,"projectionMatrix|uSampler"),this.uniforms={};for(var h in this.uniformData)this.uniforms[h]=this.uniformData[h].value;this.glShaders=[],a[this.vertexSrc+this.fragmentSrc]||(a[this.vertexSrc+this.fragmentSrc]=s.uid()),this.glShaderKey=a[this.vertexSrc+this.fragmentSrc],this.padding=4,this.resolution=1,this.enabled=!0}var n=t("./extractUniformsFromSrc"),s=t("../../../utils"),o=t("../../../const"),a={};e.exports=i,i.prototype.apply=function(t,e,r,i){t.applyFilter(this,e,r,i)},i.defaultVertexSrc=["attribute vec2 aVertexPosition;","attribute vec2 aTextureCoord;","uniform mat3 projectionMatrix;","uniform mat3 filterMatrix;","varying vec2 vTextureCoord;","varying vec2 vFilterCoord;","void main(void){","   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);","   vFilterCoord = ( filterMatrix * vec3( aTextureCoord, 1.0)  ).xy;","   vTextureCoord = aTextureCoord ;","}"].join("\n"),i.defaultFragmentSrc=["varying vec2 vTextureCoord;","varying vec2 vFilterCoord;","uniform sampler2D uSampler;","uniform sampler2D filterSampler;","void main(void){","   vec4 masky = texture2D(filterSampler, vFilterCoord);","   vec4 sample = texture2D(uSampler, vTextureCoord);","   vec4 color;","   if(mod(vFilterCoord.x, 1.0) > 0.5)","   {","     color = vec4(1.0, 0.0, 0.0, 1.0);","   }","   else","   {","     color = vec4(0.0, 1.0, 0.0, 1.0);","   }","   gl_FragColor = mix(sample, masky, 0.5);","   gl_FragColor *= sample.a;","}"].join("\n")},{"../../../const":43,"../../../utils":116,"./extractUniformsFromSrc":84}],84:[function(t,e,r){function i(t,e,r){var i=n(t,r),s=n(e,r);return Object.assign(i,s)}function n(t){for(var e,r=new RegExp("^(projectionMatrix|uSampler|filterArea)$"),i={},n=t.replace(/\s+/g," ").split(/\s*;\s*/),o=0;o<n.length;o++){var a=n[o].trim();if(a.indexOf("uniform")>-1){var h=a.split(" "),u=h[1],l=h[2],c=1;l.indexOf("[")>-1&&(e=l.split(/\[|\]/),l=e[0],c*=Number(e[1])),l.match(r)||(i[l]={value:s(u,c),name:l,type:u})}}return i}var s=t("pixi-gl-core").shader.defaultValue;e.exports=i},{"pixi-gl-core":12}],85:[function(t,e,r){var i=t("../../../math"),n=function(t,e,r){var i=t.identity();return i.translate(e.x/r.width,e.y/r.height),i.scale(r.width,r.height),i},s=function(t,e,r){var i=t.identity();i.translate(e.x/r.width,e.y/r.height);var n=r.width/e.width,s=r.height/e.height;return i.scale(n,s),i},o=function(t,e,r,n){var s=n.worldTransform.copy(i.Matrix.TEMP_MATRIX),o=n._texture.baseTexture,a=t.identity(),h=r.height/r.width;a.translate(e.x/r.width,e.y/r.height),a.scale(1,h);var u=r.width/o.width,l=r.height/o.height;return s.tx/=o.width*u,s.ty/=o.width*u,s.invert(),a.prepend(s),a.scale(1,1/h),a.scale(u,l),a.translate(n.anchor.x,n.anchor.y),a};e.exports={calculateScreenSpaceMatrix:n,calculateNormalizedScreenSpaceMatrix:s,calculateSpriteMatrix:o}},{"../../../math":67}],86:[function(t,e,r){function i(t){var e=new s.Matrix;n.call(this,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 otherMatrix;\n\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n    vMaskCoord = ( otherMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n}\n","#define GLSLIFY 1\nvarying vec2 vMaskCoord;\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform float alpha;\nuniform sampler2D mask;\n\nvoid main(void)\n{\n    // check clip! this will stop the mask bleeding out from the edges\n    vec2 text = abs( vMaskCoord - 0.5 );\n    text = step(0.5, text);\n    float clip = 1.0 - max(text.y, text.x);\n    vec4 original = texture2D(uSampler, vTextureCoord);\n    vec4 masky = texture2D(mask, vMaskCoord);\n    original *= (masky.r * masky.a * alpha * clip);\n    gl_FragColor = original;\n}\n"),t.renderable=!1,this.maskSprite=t,this.maskMatrix=e}var n=t("../Filter"),s=t("../../../../math");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.apply=function(t,e,r){var i=this.maskSprite;this.uniforms.mask=i._texture,this.uniforms.otherMatrix=t.calculateSpriteMatrix(this.maskMatrix,i),this.uniforms.alpha=i.worldAlpha,t.applyFilter(this,e,r)}},{"../../../../math":67,"../Filter":83}],87:[function(t,e,r){function i(t){n.call(this,t),this.gl=this.renderer.gl,this.quad=new o(this.gl,t.state.attribState),this.shaderCache={},this.pool={},this.filterData=null}var n=t("./WebGLManager"),s=t("../utils/RenderTarget"),o=t("../utils/Quad"),a=t("../../../math"),h=t("../../../Shader"),u=t("../filters/filterTransforms"),l=t("bit-twiddle"),c=function(){this.renderTarget=null,this.sourceFrame=new a.Rectangle,this.destinationFrame=new a.Rectangle,this.filters=[],this.target=null,this.resolution=1};i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.pushFilter=function(t,e){var r=this.renderer,i=this.filterData;if(!i){i=this.renderer._activeRenderTarget.filterStack;var n=new c;n.sourceFrame=n.destinationFrame=this.renderer._activeRenderTarget.size,n.renderTarget=r._activeRenderTarget,this.renderer._activeRenderTarget.filterData=i={index:0,stack:[n]},this.filterData=i}var s=i.stack[++i.index];s||(s=i.stack[i.index]=new c);var o=e[0].resolution,a=e[0].padding,h=t.filterArea||t.getBounds(!0),u=s.sourceFrame,l=s.destinationFrame;u.x=(h.x*o|0)/o,u.y=(h.y*o|0)/o,u.width=(h.width*o|0)/o,u.height=(h.height*o|0)/o,i.stack[0].renderTarget.transform||u.fit(i.stack[0].destinationFrame),u.pad(a),l.width=u.width,l.height=u.height;var d=this.getPotRenderTarget(r.gl,u.width,u.height,o);s.target=t,s.filters=e,s.resolution=o,s.renderTarget=d,d.setFrame(l,u),r.bindRenderTarget(d),r.clear()},i.prototype.popFilter=function(){var t=this.filterData,e=t.stack[t.index-1],r=t.stack[t.index];this.quad.map(r.renderTarget.size,r.sourceFrame).upload();var i=r.filters;if(1===i.length)i[0].apply(this,r.renderTarget,e.renderTarget,!1),this.freePotRenderTarget(r.renderTarget);else{var n=r.renderTarget,s=this.getPotRenderTarget(this.renderer.gl,r.sourceFrame.width,r.sourceFrame.height,1);s.setFrame(r.destinationFrame,r.sourceFrame);for(var o=0;o<i.length-1;o++){i[o].apply(this,n,s,!0);var a=n;n=s,s=a}i[o].apply(this,n,e.renderTarget,!1),this.freePotRenderTarget(n),this.freePotRenderTarget(s)}t.index--,0===t.index&&(this.filterData=null)},i.prototype.applyFilter=function(t,e,r,i){var n=this.renderer,s=t.glShaders[n.CONTEXT_UID];if(s||(t.glShaderKey?(s=this.shaderCache[t.glShaderKey],s||(s=t.glShaders[n.CONTEXT_UID]=this.shaderCache[t.glShaderKey]=new h(this.gl,t.vertexSrc,t.fragmentSrc))):s=t.glShaders[n.CONTEXT_UID]=new h(this.gl,t.vertexSrc,t.fragmentSrc),this.quad.initVao(s)),n.bindRenderTarget(r),i){var o=n.gl;o.disable(o.SCISSOR_TEST),n.clear(),o.enable(o.SCISSOR_TEST)}r===n.maskManager.scissorRenderTarget&&n.maskManager.pushScissorMask(null,n.maskManager.scissorData),n.bindShader(s),this.syncUniforms(s,t),e.texture.bind(0),n._activeTextureLocation=0,n.state.setBlendMode(t.blendMode),this.quad.draw()},i.prototype.syncUniforms=function(t,e){var r,i=e.uniformData,n=e.uniforms,s=1;if(t.uniforms.data.filterArea){r=this.filterData.stack[this.filterData.index];var o=t.uniforms.filterArea;o[0]=r.renderTarget.size.width,o[1]=r.renderTarget.size.height,o[2]=r.sourceFrame.x,o[3]=r.sourceFrame.y,t.uniforms.filterArea=o}if(t.uniforms.data.filterClamp){r=this.filterData.stack[this.filterData.index];var a=t.uniforms.filterClamp;a[0]=.5/r.renderTarget.size.width,a[1]=.5/r.renderTarget.size.height,a[2]=(r.sourceFrame.width-.5)/r.renderTarget.size.width,a[3]=(r.sourceFrame.height-.5)/r.renderTarget.size.height,t.uniforms.filterClamp=a}var h;for(var u in i)if("sampler2D"===i[u].type){if(t.uniforms[u]=s,n[u].baseTexture)this.renderer.bindTexture(n[u].baseTexture,s);else{var l=this.renderer.gl;this.renderer._activeTextureLocation=l.TEXTURE0+s,l.activeTexture(l.TEXTURE0+s),n[u].texture.bind()}s++}else"mat3"===i[u].type?void 0!==n[u].a?t.uniforms[u]=n[u].toArray(!0):t.uniforms[u]=n[u]:"vec2"===i[u].type?void 0!==n[u].x?(h=t.uniforms[u]||new Float32Array(2),h[0]=n[u].x,h[1]=n[u].y,t.uniforms[u]=h):t.uniforms[u]=n[u]:"float"===i[u].type?t.uniforms.data[u].value!==i[u]&&(t.uniforms[u]=n[u]):t.uniforms[u]=n[u]},i.prototype.getRenderTarget=function(t,e){var r=this.filterData.stack[this.filterData.index],i=this.getPotRenderTarget(this.renderer.gl,r.sourceFrame.width,r.sourceFrame.height,e||r.resolution);return i.setFrame(r.destinationFrame,r.sourceFrame),i},i.prototype.returnRenderTarget=function(t){return this.freePotRenderTarget(t)},i.prototype.calculateScreenSpaceMatrix=function(t){var e=this.filterData.stack[this.filterData.index];return u.calculateScreenSpaceMatrix(t,e.sourceFrame,e.renderTarget.size)},i.prototype.calculateNormalizedScreenSpaceMatrix=function(t){var e=this.filterData.stack[this.filterData.index];return u.calculateNormalizedScreenSpaceMatrix(t,e.sourceFrame,e.renderTarget.size,e.destinationFrame)},i.prototype.calculateSpriteMatrix=function(t,e){var r=this.filterData.stack[this.filterData.index];return u.calculateSpriteMatrix(t,r.sourceFrame,r.renderTarget.size,e)},i.prototype.destroy=function(){this.shaderCache=[],this.emptyPool()},i.prototype.getPotRenderTarget=function(t,e,r,i){e=l.nextPow2(e*i),r=l.nextPow2(r*i);var n=(65535&e)<<16|65535&r;this.pool[n]||(this.pool[n]=[]);var o=this.pool[n].pop()||new s(t,e,r,null,1);return o.resolution=i,o.defaultFrame.width=o.size.width=e/i,o.defaultFrame.height=o.size.height=r/i,o},i.prototype.emptyPool=function(){for(var t in this.pool){var e=this.pool[t];if(e)for(var r=0;r<e.length;r++)e[r].destroy(!0)}this.pool={}},i.prototype.freePotRenderTarget=function(t){var e=t.size.width*t.resolution,r=t.size.height*t.resolution,i=(65535&e)<<16|65535&r;this.pool[i].push(t)}},{"../../../Shader":42,"../../../math":67,"../filters/filterTransforms":85,"../utils/Quad":92,"../utils/RenderTarget":93,"./WebGLManager":90,"bit-twiddle":1}],88:[function(t,e,r){function i(t){n.call(this,t),this.scissor=!1,this.scissorData=null,this.scissorRenderTarget=null,this.enableScissor=!0,this.alphaMaskPool=[],this.alphaMaskIndex=0}var n=t("./WebGLManager"),s=t("../filters/spriteMask/SpriteMaskFilter");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.pushMask=function(t,e){if(e.texture)this.pushSpriteMask(t,e);else if(this.enableScissor&&!this.scissor&&!this.renderer.stencilManager.stencilMaskStack.length&&e.isFastRect()){var r=e.worldTransform,i=Math.atan2(r.b,r.a);i=Math.round(i*(180/Math.PI)),i%90?this.pushStencilMask(e):this.pushScissorMask(t,e)}else this.pushStencilMask(e)},i.prototype.popMask=function(t,e){e.texture?this.popSpriteMask(t,e):this.enableScissor&&!this.renderer.stencilManager.stencilMaskStack.length?this.popScissorMask(t,e):this.popStencilMask(t,e)},i.prototype.pushSpriteMask=function(t,e){var r=this.alphaMaskPool[this.alphaMaskIndex];r||(r=this.alphaMaskPool[this.alphaMaskIndex]=[new s(e)]),r[0].resolution=this.renderer.resolution,r[0].maskSprite=e,t.filterArea=e.getBounds(!0),this.renderer.filterManager.pushFilter(t,r),this.alphaMaskIndex++},i.prototype.popSpriteMask=function(){this.renderer.filterManager.popFilter(),this.alphaMaskIndex--},i.prototype.pushStencilMask=function(t){this.renderer.currentRenderer.stop(),this.renderer.stencilManager.pushStencil(t)},i.prototype.popStencilMask=function(){this.renderer.currentRenderer.stop(),this.renderer.stencilManager.popStencil()},i.prototype.pushScissorMask=function(t,e){e.renderable=!0;var r=this.renderer._activeRenderTarget,i=e.getBounds();i.fit(r.size),e.renderable=!1,this.renderer.gl.enable(this.renderer.gl.SCISSOR_TEST);var n=this.renderer.resolution;this.renderer.gl.scissor(i.x*n,(r.root?r.size.height-i.y-i.height:i.y)*n,i.width*n,i.height*n),this.scissorRenderTarget=r,this.scissorData=e,this.scissor=!0},i.prototype.popScissorMask=function(){this.scissorRenderTarget=null,this.scissorData=null,this.scissor=!1;var t=this.renderer.gl;t.disable(t.SCISSOR_TEST)}},{"../filters/spriteMask/SpriteMaskFilter":86,"./WebGLManager":90}],89:[function(t,e,r){function i(t){n.call(this,t),this.stencilMaskStack=null}var n=t("./WebGLManager");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.setMaskStack=function(t){this.stencilMaskStack=t;var e=this.renderer.gl;0===t.length?e.disable(e.STENCIL_TEST):e.enable(e.STENCIL_TEST)},i.prototype.pushStencil=function(t){this.renderer.setObjectRenderer(this.renderer.plugins.graphics),this.renderer._activeRenderTarget.attachStencilBuffer();var e=this.renderer.gl,r=this.stencilMaskStack;0===r.length&&(e.enable(e.STENCIL_TEST),e.clear(e.STENCIL_BUFFER_BIT),e.stencilFunc(e.ALWAYS,1,1)),r.push(t),e.colorMask(!1,!1,!1,!1),e.stencilOp(e.KEEP,e.KEEP,e.INCR),this.renderer.plugins.graphics.render(t),e.colorMask(!0,!0,!0,!0),e.stencilFunc(e.NOTEQUAL,0,r.length),e.stencilOp(e.KEEP,e.KEEP,e.KEEP)},i.prototype.popStencil=function(){this.renderer.setObjectRenderer(this.renderer.plugins.graphics);var t=this.renderer.gl,e=this.stencilMaskStack,r=e.pop();0===e.length?t.disable(t.STENCIL_TEST):(t.colorMask(!1,!1,!1,!1),t.stencilOp(t.KEEP,t.KEEP,t.DECR),this.renderer.plugins.graphics.render(r),t.colorMask(!0,!0,!0,!0),t.stencilFunc(t.NOTEQUAL,0,e.length),t.stencilOp(t.KEEP,t.KEEP,t.KEEP))},i.prototype.destroy=function(){n.prototype.destroy.call(this),this.stencilMaskStack.stencilStack=null}},{"./WebGLManager":90}],90:[function(t,e,r){function i(t){this.renderer=t,this.renderer.on("context",this.onContextChange,this)}i.prototype.constructor=i,e.exports=i,i.prototype.onContextChange=function(){},i.prototype.destroy=function(){this.renderer.off("context",this.onContextChange,this),this.renderer=null}},{}],91:[function(t,e,r){function i(t){n.call(this,t)}var n=t("../managers/WebGLManager");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.start=function(){},i.prototype.stop=function(){this.flush()},i.prototype.flush=function(){},i.prototype.render=function(t){}},{"../managers/WebGLManager":90}],92:[function(t,e,r){function i(t,e){this.gl=t,this.vertices=new Float32Array([-1,-1,1,-1,1,1,-1,1]),this.uvs=new Float32Array([0,0,1,0,1,1,0,1]),this.interleaved=new Float32Array(16);for(var r=0;r<4;r++)this.interleaved[4*r]=this.vertices[2*r],this.interleaved[4*r+1]=this.vertices[2*r+1],this.interleaved[4*r+2]=this.uvs[2*r],this.interleaved[4*r+3]=this.uvs[2*r+1];this.indices=s(1),this.vertexBuffer=n.GLBuffer.createVertexBuffer(t,this.interleaved,t.STATIC_DRAW),this.indexBuffer=n.GLBuffer.createIndexBuffer(t,this.indices,t.STATIC_DRAW),this.vao=new n.VertexArrayObject(t,e)}var n=t("pixi-gl-core"),s=t("../../../utils/createIndicesForQuads");i.prototype.constructor=i,i.prototype.initVao=function(t){this.vao.clear().addIndex(this.indexBuffer).addAttribute(this.vertexBuffer,t.attributes.aVertexPosition,this.gl.FLOAT,!1,16,0).addAttribute(this.vertexBuffer,t.attributes.aTextureCoord,this.gl.FLOAT,!1,16,8)},i.prototype.map=function(t,e){var r=0,i=0;return this.uvs[0]=r,this.uvs[1]=i,this.uvs[2]=r+e.width/t.width,this.uvs[3]=i,this.uvs[4]=r+e.width/t.width,this.uvs[5]=i+e.height/t.height,this.uvs[6]=r,this.uvs[7]=i+e.height/t.height,r=e.x,i=e.y,this.vertices[0]=r,this.vertices[1]=i,this.vertices[2]=r+e.width,this.vertices[3]=i,this.vertices[4]=r+e.width,this.vertices[5]=i+e.height,this.vertices[6]=r,this.vertices[7]=i+e.height,this},i.prototype.draw=function(){return this.vao.bind().draw(this.gl.TRIANGLES,6,0).unbind(),this},i.prototype.upload=function(){for(var t=0;t<4;t++)this.interleaved[4*t]=this.vertices[2*t],this.interleaved[4*t+1]=this.vertices[2*t+1],this.interleaved[4*t+2]=this.uvs[2*t],this.interleaved[4*t+3]=this.uvs[2*t+1];return this.vertexBuffer.upload(this.interleaved),this},i.prototype.destroy=function(){var t=this.gl;t.deleteBuffer(this.vertexBuffer),t.deleteBuffer(this.indexBuffer)},e.exports=i},{"../../../utils/createIndicesForQuads":114,"pixi-gl-core":12}],93:[function(t,e,r){var i=t("../../../math"),n=t("../../../const"),s=t("pixi-gl-core").GLFramebuffer,o=function(t,e,r,o,a,h){this.gl=t,this.frameBuffer=null,this.texture=null,this.clearColor=[0,0,0,0],this.size=new i.Rectangle(0,0,1,1),this.resolution=a||n.RESOLUTION,this.projectionMatrix=new i.Matrix,this.transform=null,this.frame=null,this.defaultFrame=new i.Rectangle,this.destinationFrame=null,this.sourceFrame=null,this.stencilBuffer=null,this.stencilMaskStack=[],this.filterData=null,this.scaleMode=o||n.SCALE_MODES.DEFAULT,this.root=h,this.root?(this.frameBuffer=new s(t,100,100),this.frameBuffer.framebuffer=null):(this.frameBuffer=s.createRGBA(t,100,100),this.scaleMode===n.SCALE_MODES.NEAREST?this.frameBuffer.texture.enableNearestScaling():this.frameBuffer.texture.enableLinearScaling(),
this.texture=this.frameBuffer.texture),this.setFrame(),this.resize(e,r)};o.prototype.constructor=o,e.exports=o,o.prototype.clear=function(t){var e=t||this.clearColor;this.frameBuffer.clear(e[0],e[1],e[2],e[3])},o.prototype.attachStencilBuffer=function(){this.root||this.frameBuffer.enableStencil()},o.prototype.setFrame=function(t,e){this.destinationFrame=t||this.destinationFrame||this.defaultFrame,this.sourceFrame=e||this.sourceFrame||t},o.prototype.activate=function(){var t=this.gl;this.frameBuffer.bind(),this.calculateProjection(this.destinationFrame,this.sourceFrame),this.transform&&this.projectionMatrix.append(this.transform),this.destinationFrame!==this.sourceFrame?(t.enable(t.SCISSOR_TEST),t.scissor(0|this.destinationFrame.x,0|this.destinationFrame.y,this.destinationFrame.width*this.resolution|0,this.destinationFrame.height*this.resolution|0)):t.disable(t.SCISSOR_TEST),t.viewport(0|this.destinationFrame.x,0|this.destinationFrame.y,this.destinationFrame.width*this.resolution|0,this.destinationFrame.height*this.resolution|0)},o.prototype.calculateProjection=function(t,e){var r=this.projectionMatrix;e=e||t,r.identity(),this.root?(r.a=1/t.width*2,r.d=-1/t.height*2,r.tx=-1-e.x*r.a,r.ty=1-e.y*r.d):(r.a=1/t.width*2,r.d=1/t.height*2,r.tx=-1-e.x*r.a,r.ty=-1-e.y*r.d)},o.prototype.resize=function(t,e){if(t=0|t,e=0|e,this.size.width!==t||this.size.height!==e){this.size.width=t,this.size.height=e,this.defaultFrame.width=t,this.defaultFrame.height=e,this.frameBuffer.resize(t*this.resolution,e*this.resolution);var r=this.frame||this.size;this.calculateProjection(r)}},o.prototype.destroy=function(){this.frameBuffer.destroy(),this.frameBuffer=null,this.texture=null}},{"../../../const":43,"../../../math":67,"pixi-gl-core":12}],94:[function(t,e,r){function i(t){for(var e="",r=0;r<t;r++)r>0&&(e+="\nelse "),r<t-1&&(e+="if(test == "+r+".0){}");return e}var n=t("pixi-gl-core"),s=["precision mediump float;","void main(void){","float test = 0.1;","%forloop%","gl_FragColor = vec4(0.0);","}"].join("\n"),o=function(t,e){var r=!e;if(r){var o=document.createElement("canvas");o.width=1,o.height=1,e=n.createContext(o)}for(var a=e.createShader(e.FRAGMENT_SHADER);;){var h=s.replace(/%forloop%/gi,i(t));if(e.shaderSource(a,h),e.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS))break;t=t/2|0}return r&&e.getExtension("WEBGL_lose_context")&&e.getExtension("WEBGL_lose_context").loseContext(),t};e.exports=o},{"pixi-gl-core":12}],95:[function(t,e,r){function i(t,e){return e=e||[],e[n.BLEND_MODES.NORMAL]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.ADD]=[t.ONE,t.DST_ALPHA],e[n.BLEND_MODES.MULTIPLY]=[t.DST_COLOR,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.SCREEN]=[t.ONE,t.ONE_MINUS_SRC_COLOR],e[n.BLEND_MODES.OVERLAY]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.DARKEN]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.LIGHTEN]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.COLOR_DODGE]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.COLOR_BURN]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.HARD_LIGHT]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.SOFT_LIGHT]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.DIFFERENCE]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.EXCLUSION]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.HUE]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.SATURATION]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.COLOR]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e[n.BLEND_MODES.LUMINOSITY]=[t.ONE,t.ONE_MINUS_SRC_ALPHA],e}var n=t("../../../const");e.exports=i},{"../../../const":43}],96:[function(t,e,r){function i(t,e){e=e||{},e[n.DRAW_MODES.POINTS]=t.POINTS,e[n.DRAW_MODES.LINES]=t.LINES,e[n.DRAW_MODES.LINE_LOOP]=t.LINE_LOOP,e[n.DRAW_MODES.LINE_STRIP]=t.LINE_STRIP,e[n.DRAW_MODES.TRIANGLES]=t.TRIANGLES,e[n.DRAW_MODES.TRIANGLE_STRIP]=t.TRIANGLE_STRIP,e[n.DRAW_MODES.TRIANGLE_FAN]=t.TRIANGLE_FAN}var n=t("../../../const");e.exports=i},{"../../../const":43}],97:[function(t,e,r){function i(t){var e=t.getContextAttributes();e.stencil||console.warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly")}e.exports=i},{}],98:[function(t,e,r){function i(t){o.call(this),this.anchor=new n.ObservablePoint(this.onAnchorUpdate,this),this._texture=null,this._width=0,this._height=0,this._tint=null,this._tintRGB=null,this.tint=16777215,this.blendMode=h.BLEND_MODES.NORMAL,this.shader=null,this.cachedTint=16777215,this.texture=t||s.EMPTY,this.vertexData=new Float32Array(8),this.vertexTrimmedData=null,this._transformID=-1,this._textureID=-1}var n=t("../math"),s=t("../textures/Texture"),o=t("../display/Container"),a=t("../utils"),h=t("../const"),u=new n.Point;i.prototype=Object.create(o.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{width:{get:function(){return Math.abs(this.scale.x)*this.texture.orig.width},set:function(t){var e=a.sign(this.scale.x)||1;this.scale.x=e*t/this.texture.orig.width,this._width=t}},height:{get:function(){return Math.abs(this.scale.y)*this.texture.orig.height},set:function(t){var e=a.sign(this.scale.y)||1;this.scale.y=e*t/this.texture.orig.height,this._height=t}},tint:{get:function(){return this._tint},set:function(t){this._tint=t,this._tintRGB=(t>>16)+(65280&t)+((255&t)<<16)}},texture:{get:function(){return this._texture},set:function(t){this._texture!==t&&(this._texture=t,this.cachedTint=16777215,this._textureID=-1,t&&(t.baseTexture.hasLoaded?this._onTextureUpdate():t.once("update",this._onTextureUpdate,this)))}}}),i.prototype._onTextureUpdate=function(){this._textureID=-1,this._width&&(this.scale.x=a.sign(this.scale.x)*this._width/this.texture.orig.width),this._height&&(this.scale.y=a.sign(this.scale.y)*this._height/this.texture.orig.height)},i.prototype.onAnchorUpdate=function(){this._transformID=-1},i.prototype.calculateVertices=function(){if(this._transformID!==this.transform._worldID||this._textureID!==this._texture._updateID){this._transformID=this.transform._worldID,this._textureID=this._texture._updateID;var t,e,r,i,n=this._texture,s=this.transform.worldTransform,o=s.a,a=s.b,h=s.c,u=s.d,l=s.tx,c=s.ty,d=this.vertexData,p=n.trim,f=n.orig;p?(e=p.x-this.anchor._x*f.width,t=e+p.width,i=p.y-this.anchor._y*f.height,r=i+p.height):(t=f.width*(1-this.anchor._x),e=f.width*-this.anchor._x,r=f.height*(1-this.anchor._y),i=f.height*-this.anchor._y),d[0]=o*e+h*i+l,d[1]=u*i+a*e+c,d[2]=o*t+h*i+l,d[3]=u*i+a*t+c,d[4]=o*t+h*r+l,d[5]=u*r+a*t+c,d[6]=o*e+h*r+l,d[7]=u*r+a*e+c}},i.prototype.calculateTrimmedVertices=function(){this.vertexTrimmedData||(this.vertexTrimmedData=new Float32Array(8));var t,e,r,i,n=this._texture,s=this.vertexTrimmedData,o=n.orig,a=this.transform.worldTransform,h=a.a,u=a.b,l=a.c,c=a.d,d=a.tx,p=a.ty;t=o.width*(1-this.anchor._x),e=o.width*-this.anchor._x,r=o.height*(1-this.anchor._y),i=o.height*-this.anchor._y,s[0]=h*e+l*i+d,s[1]=c*i+u*e+p,s[2]=h*t+l*i+d,s[3]=c*i+u*t+p,s[4]=h*t+l*r+d,s[5]=c*r+u*t+p,s[6]=h*e+l*r+d,s[7]=c*r+u*e+p},i.prototype._renderWebGL=function(t){this.calculateVertices(),t.setObjectRenderer(t.plugins.sprite),t.plugins.sprite.render(this)},i.prototype._renderCanvas=function(t){t.plugins.sprite.render(this)},i.prototype._calculateBounds=function(){var t=this._texture.trim,e=this._texture.orig;!t||t.width===e.width&&t.height===e.height?(this.calculateVertices(),this._bounds.addQuad(this.vertexData)):(this.calculateTrimmedVertices(),this._bounds.addQuad(this.vertexTrimmedData))},i.prototype.getLocalBounds=function(t){return 0===this.children.length?(this._bounds.minX=-this._texture.orig.width*this.anchor._x,this._bounds.minY=-this._texture.orig.height*this.anchor._y,this._bounds.maxX=this._texture.orig.width,this._bounds.maxY=this._texture.orig.height,t||(this._localBoundsRect||(this._localBoundsRect=new n.Rectangle),t=this._localBoundsRect),this._bounds.getRectangle(t)):o.prototype.getLocalBounds.call(this,t)},i.prototype.containsPoint=function(t){this.worldTransform.applyInverse(t,u);var e,r=this._texture.orig.width,i=this._texture.orig.height,n=-r*this.anchor.x;return u.x>n&&u.x<n+r&&(e=-i*this.anchor.y,u.y>e&&u.y<e+i)},i.prototype.destroy=function(t){o.prototype.destroy.call(this,t),this.anchor=null;var e="boolean"==typeof t?t:t&&t.texture;if(e){var r="boolean"==typeof t?t:t&&t.baseTexture;this._texture.destroy(!!r)}this._texture=null,this.shader=null},i.from=function(t){return new i(s.from(t))},i.fromFrame=function(t){var e=a.TextureCache[t];if(!e)throw new Error('The frameId "'+t+'" does not exist in the texture cache');return new i(e)},i.fromImage=function(t,e,r){return new i(s.fromImage(t,e,r))}},{"../const":43,"../display/Container":45,"../math":67,"../textures/Texture":109,"../utils":116}],99:[function(t,e,r){function i(t){this.renderer=t}var n=t("../../renderers/canvas/CanvasRenderer"),s=t("../../const"),o=t("../../math"),a=new o.Matrix,h=t("./CanvasTinter");i.prototype.constructor=i,e.exports=i,n.registerPlugin("sprite",i),i.prototype.render=function(t){var e,r,i=t._texture,n=this.renderer,u=t.transform.worldTransform,l=i._frame.width,c=i._frame.height;if(!(i.orig.width<=0||i.orig.height<=0)&&i.baseTexture.source&&(n.setBlendMode(t.blendMode),i.valid)){n.context.globalAlpha=t.worldAlpha;var d=i.baseTexture.scaleMode===s.SCALE_MODES.LINEAR;n.smoothProperty&&n.context[n.smoothProperty]!==d&&(n.context[n.smoothProperty]=d),i.trim?(e=i.trim.width/2+i.trim.x-t.anchor.x*i.orig.width,r=i.trim.height/2+i.trim.y-t.anchor.y*i.orig.height):(e=(.5-t.anchor.x)*i.orig.width,r=(.5-t.anchor.y)*i.orig.height),i.rotate&&(u.copy(a),u=a,o.GroupD8.matrixAppendRotationInv(u,i.rotate,e,r),e=0,r=0),e-=l/2,r-=c/2,n.roundPixels?(n.context.setTransform(u.a,u.b,u.c,u.d,u.tx*n.resolution|0,u.ty*n.resolution|0),e=0|e,r=0|r):n.context.setTransform(u.a,u.b,u.c,u.d,u.tx*n.resolution,u.ty*n.resolution);var p=i.baseTexture.resolution;16777215!==t.tint?(t.cachedTint!==t.tint&&(t.cachedTint=t.tint,t.tintedTexture=h.getTintedTexture(t,t.tint)),n.context.drawImage(t.tintedTexture,0,0,l*p,c*p,e*n.resolution,r*n.resolution,l*n.resolution,c*n.resolution)):n.context.drawImage(i.baseTexture.source,i._frame.x*p,i._frame.y*p,l*p,c*p,e*n.resolution,r*n.resolution,l*n.resolution,c*n.resolution)}},i.prototype.destroy=function(){this.renderer=null}},{"../../const":43,"../../math":67,"../../renderers/canvas/CanvasRenderer":74,"./CanvasTinter":100}],100:[function(t,e,r){var i=t("../../utils"),n=t("../../renderers/canvas/utils/canUseNewCanvasBlendModes"),s=e.exports={getTintedTexture:function(t,e){var r=t.texture;e=s.roundColor(e);var i="#"+("00000"+(0|e).toString(16)).substr(-6);if(r.tintCache=r.tintCache||{},r.tintCache[i])return r.tintCache[i];var n=s.canvas||document.createElement("canvas");if(s.tintMethod(r,e,n),s.convertTintToImage){var o=new Image;o.src=n.toDataURL(),r.tintCache[i]=o}else r.tintCache[i]=n,s.canvas=null;return n},tintWithMultiply:function(t,e,r){var i=r.getContext("2d"),n=t._frame.clone(),s=t.baseTexture.resolution;n.x*=s,n.y*=s,n.width*=s,n.height*=s,r.width=n.width,r.height=n.height,i.fillStyle="#"+("00000"+(0|e).toString(16)).substr(-6),i.fillRect(0,0,n.width,n.height),i.globalCompositeOperation="multiply",i.drawImage(t.baseTexture.source,n.x,n.y,n.width,n.height,0,0,n.width,n.height),i.globalCompositeOperation="destination-atop",i.drawImage(t.baseTexture.source,n.x,n.y,n.width,n.height,0,0,n.width,n.height)},tintWithOverlay:function(t,e,r){var i=r.getContext("2d"),n=t._frame.clone(),s=t.baseTexture.resolution;n.x*=s,n.y*=s,n.width*=s,n.height*=s,r.width=n.width,r.height=n.height,i.globalCompositeOperation="copy",i.fillStyle="#"+("00000"+(0|e).toString(16)).substr(-6),i.fillRect(0,0,n.width,n.height),i.globalCompositeOperation="destination-atop",i.drawImage(t.baseTexture.source,n.x,n.y,n.width,n.height,0,0,n.width,n.height)},tintWithPerPixel:function(t,e,r){var n=r.getContext("2d"),s=t._frame.clone(),o=t.baseTexture.resolution;s.x*=o,s.y*=o,s.width*=o,s.height*=o,r.width=s.width,r.height=s.height,n.globalCompositeOperation="copy",n.drawImage(t.baseTexture.source,s.x,s.y,s.width,s.height,0,0,s.width,s.height);for(var a=i.hex2rgb(e),h=a[0],u=a[1],l=a[2],c=n.getImageData(0,0,s.width,s.height),d=c.data,p=0;p<d.length;p+=4)d[p+0]*=h,d[p+1]*=u,d[p+2]*=l;n.putImageData(c,0,0)},roundColor:function(t){var e=s.cacheStepsPerColorChannel,r=i.hex2rgb(t);return r[0]=Math.min(255,r[0]/e*e),r[1]=Math.min(255,r[1]/e*e),r[2]=Math.min(255,r[2]/e*e),i.rgb2hex(r)},cacheStepsPerColorChannel:8,convertTintToImage:!1,canUseMultiply:n(),tintMethod:0};s.tintMethod=s.canUseMultiply?s.tintWithMultiply:s.tintWithPerPixel},{"../../renderers/canvas/utils/canUseNewCanvasBlendModes":77,"../../utils":116}],101:[function(t,e,r){var i=function(t){this.vertices=new ArrayBuffer(t),this.float32View=new Float32Array(this.vertices),this.uint32View=new Uint32Array(this.vertices)};e.exports=i,i.prototype.destroy=function(){this.vertices=null,this.positions=null,this.uvs=null,this.colors=null}},{}],102:[function(t,e,r){function i(t){n.call(this,t),this.vertSize=5,this.vertByteSize=4*this.vertSize,this.size=l.SPRITE_BATCH_SIZE,this.buffers=[];for(var e=1;e<=d.nextPow2(this.size);e*=2){var r=4*e*this.vertByteSize;this.buffers.push(new u(r))}this.indices=o(this.size),this.shaders=null,this.currentIndex=0,p=0,this.groups=[];for(var i=0;i<this.size;i++)this.groups[i]={textures:[],textureCount:0,ids:[],size:0,start:0,blend:0};this.sprites=[],this.vertexBuffers=[],this.vaos=[],this.vaoMax=2,this.vertexCount=0,this.renderer.on("prerender",this.onPrerender,this)}var n=t("../../renderers/webgl/utils/ObjectRenderer"),s=t("../../renderers/webgl/WebGLRenderer"),o=t("../../utils/createIndicesForQuads"),a=t("./generateMultiTextureShader"),h=t("../../renderers/webgl/utils/checkMaxIfStatmentsInShader"),u=t("./BatchBuffer"),l=t("../../const"),c=t("pixi-gl-core"),d=t("bit-twiddle"),p=0;i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,s.registerPlugin("sprite",i),i.prototype.onContextChange=function(){var t=this.renderer.gl;this.MAX_TEXTURES=Math.min(t.getParameter(t.MAX_TEXTURE_IMAGE_UNITS),l.SPRITE_MAX_TEXTURES),this.MAX_TEXTURES=h(this.MAX_TEXTURES,t),this.shaders=new Array(this.MAX_TEXTURES),this.shaders[0]=a(t,1),this.shaders[1]=a(t,2),this.indexBuffer=c.GLBuffer.createIndexBuffer(t,this.indices,t.STATIC_DRAW);for(var e=this.shaders[1],r=0;r<this.vaoMax;r++)this.vertexBuffers[r]=c.GLBuffer.createVertexBuffer(t,null,t.STREAM_DRAW),this.vaos[r]=this.renderer.createVao().addIndex(this.indexBuffer).addAttribute(this.vertexBuffers[r],e.attributes.aVertexPosition,t.FLOAT,!1,this.vertByteSize,0).addAttribute(this.vertexBuffers[r],e.attributes.aTextureCoord,t.UNSIGNED_SHORT,!0,this.vertByteSize,8).addAttribute(this.vertexBuffers[r],e.attributes.aColor,t.UNSIGNED_BYTE,!0,this.vertByteSize,12).addAttribute(this.vertexBuffers[r],e.attributes.aTextureId,t.FLOAT,!1,this.vertByteSize,16);this.vao=this.vaos[0],this.currentBlendMode=99999},i.prototype.onPrerender=function(){this.vertexCount=0},i.prototype.render=function(t){this.currentIndex>=this.size&&this.flush(),t.texture._uvs&&(this.sprites[this.currentIndex++]=t)},i.prototype.flush=function(){if(0!==this.currentIndex){var t,e,r,i,n,s,o,h=this.renderer.gl,u=d.nextPow2(this.currentIndex),l=d.log2(u),f=this.buffers[l],v=this.sprites,g=this.groups,y=f.float32View,x=f.uint32View,m=0,_=1,b=0,T=g[0],E=v[0].blendMode;T.textureCount=0,T.start=0,T.blend=E,p++;for(var w=0;w<this.currentIndex;w++){var S=v[w];if(t=S._texture.baseTexture,E!==S.blendMode&&(E=S.blendMode,e=null,b=this.MAX_TEXTURES,p++),e!==t&&(e=t,t._enabled!==p&&(b===this.MAX_TEXTURES&&(p++,b=0,T.size=w-T.start,T=g[_++],T.textureCount=0,T.blend=E,T.start=w),t._enabled=p,t._id=b,T.textures[T.textureCount++]=t,b++)),r=S.vertexData,i=S._tintRGB+(255*S.worldAlpha<<24),n=S._texture._uvs.uvsUint32,s=t._id,this.renderer.roundPixels){var C=this.renderer.resolution;y[m]=(r[0]*C|0)/C,y[m+1]=(r[1]*C|0)/C,y[m+5]=(r[2]*C|0)/C,y[m+6]=(r[3]*C|0)/C,y[m+10]=(r[4]*C|0)/C,y[m+11]=(r[5]*C|0)/C,y[m+15]=(r[6]*C|0)/C,y[m+16]=(r[7]*C|0)/C}else y[m]=r[0],y[m+1]=r[1],y[m+5]=r[2],y[m+6]=r[3],y[m+10]=r[4],y[m+11]=r[5],y[m+15]=r[6],y[m+16]=r[7];x[m+2]=n[0],x[m+7]=n[1],x[m+12]=n[2],x[m+17]=n[3],x[m+3]=x[m+8]=x[m+13]=x[m+18]=i,y[m+4]=y[m+9]=y[m+14]=y[m+19]=s,m+=20}for(T.size=w-T.start,this.vertexCount++,this.vaoMax<=this.vertexCount&&(this.vaoMax++,o=this.shaders[1],this.vertexBuffers[this.vertexCount]=c.GLBuffer.createVertexBuffer(h,null,h.STREAM_DRAW),this.vaos[this.vertexCount]=this.renderer.createVao().addIndex(this.indexBuffer).addAttribute(this.vertexBuffers[this.vertexCount],o.attributes.aVertexPosition,h.FLOAT,!1,this.vertByteSize,0).addAttribute(this.vertexBuffers[this.vertexCount],o.attributes.aTextureCoord,h.UNSIGNED_SHORT,!0,this.vertByteSize,8).addAttribute(this.vertexBuffers[this.vertexCount],o.attributes.aColor,h.UNSIGNED_BYTE,!0,this.vertByteSize,12).addAttribute(this.vertexBuffers[this.vertexCount],o.attributes.aTextureId,h.FLOAT,!1,this.vertByteSize,16)),this.vertexBuffers[this.vertexCount].upload(f.vertices,0),this.vao=this.vaos[this.vertexCount].bind(),w=0;w<_;w++){var R=g[w],M=R.textureCount;o=this.shaders[M-1],o||(o=this.shaders[M-1]=a(h,M)),this.renderer.bindShader(o);for(var A=0;A<M;A++)this.renderer.bindTexture(R.textures[A],A);this.renderer.state.setBlendMode(R.blend),h.drawElements(h.TRIANGLES,6*R.size,h.UNSIGNED_SHORT,6*R.start*2)}this.currentIndex=0}},i.prototype.start=function(){},i.prototype.stop=function(){this.flush(),this.vao.unbind()},i.prototype.destroy=function(){for(var t=0;t<this.vaoMax;t++)this.vertexBuffers[t].destroy(),this.vaos[t].destroy();for(this.indexBuffer.destroy(),this.renderer.off("prerender",this.onPrerender,this),n.prototype.destroy.call(this),t=0;t<this.shaders.length;t++)this.shaders[t]&&this.shaders[t].destroy();for(this.vertexBuffers=null,this.vaos=null,this.indexBuffer=null,this.indices=null,this.sprites=null,t=0;t<this.buffers.length;t++)this.buffers[t].destroy()}},{"../../const":43,"../../renderers/webgl/WebGLRenderer":81,"../../renderers/webgl/utils/ObjectRenderer":91,"../../renderers/webgl/utils/checkMaxIfStatmentsInShader":94,"../../utils/createIndicesForQuads":114,"./BatchBuffer":101,"./generateMultiTextureShader":103,"bit-twiddle":1,"pixi-gl-core":12}],103:[function(t,e,r){function i(t,e){var r="#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\nattribute vec4 aColor;\nattribute float aTextureId;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\nvarying float vTextureId;\n\nvoid main(void){\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vTextureCoord = aTextureCoord;\n   vTextureId = aTextureId;\n   vColor = vec4(aColor.rgb * aColor.a, aColor.a);\n}\n",i=o;i=i.replace(/%count%/gi,e),i=i.replace(/%forloop%/gi,n(e));for(var a=new s(t,r,i,{aVertexPosition:3,aColor:2,aTextureCoord:1,aTextureId:0}),h=[],u=0;u<e;u++)h[u]=u;return a.bind(),a.uniforms.uSamplers=h,a}function n(t){var e="";e+="\n",e+="\n";for(var r=0;r<t;r++)r>0&&(e+="\nelse "),r<t-1&&(e+="if(textureId == "+r+".0)"),e+="\n{",e+="\n\tcolor = texture2D(uSamplers["+r+"], vTextureCoord);",e+="\n}";return e+="\n",e+="\n"}var s=t("../../Shader"),o=["varying vec2 vTextureCoord;","varying vec4 vColor;","varying float vTextureId;","uniform sampler2D uSamplers[%count%];","void main(void){","vec4 color;","float textureId = floor(vTextureId+0.5);","%forloop%","gl_FragColor = color * vColor;","}"].join("\n");e.exports=i},{"../../Shader":42}],104:[function(t,e,r){function i(t,e){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.resolution=h.RESOLUTION,this._text=null,this._style=null,this._styleListener=null,this._font="";var r=s.fromCanvas(this.canvas);r.orig=new o.Rectangle,r.trim=new o.Rectangle,n.call(this,r),this.text=t,this.style=e,this.localStyleID=-1}var n=t("../sprites/Sprite"),s=t("../textures/Texture"),o=t("../math"),a=t("../utils"),h=t("../const"),u=t("./TextStyle"),l={texture:!0,children:!1,baseTexture:!0};i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.fontPropertiesCache={},i.fontPropertiesCanvas=document.createElement("canvas"),i.fontPropertiesContext=i.fontPropertiesCanvas.getContext("2d"),Object.defineProperties(i.prototype,{width:{get:function(){return this.updateText(!0),Math.abs(this.scale.x)*this.texture.orig.width},set:function(t){this.updateText(!0);var e=a.sign(this.scale.x)||1;this.scale.x=e*t/this.texture.orig.width,this._width=t}},height:{get:function(){return this.updateText(!0),Math.abs(this.scale.y)*this._texture.orig.height},set:function(t){this.updateText(!0);var e=a.sign(this.scale.y)||1;this.scale.y=e*t/this.texture.orig.height,this._height=t}},style:{get:function(){return this._style},set:function(t){t=t||{},t instanceof u?this._style=t:this._style=new u(t),this.localStyleID=-1,this.dirty=!0}},text:{get:function(){return this._text},set:function(t){t=t||" ",t=t.toString(),this._text!==t&&(this._text=t,this.dirty=!0)}}}),i.prototype.updateText=function(t){var e=this._style;if(this.localStyleID!==e.styleID&&(this.dirty=!0,this.localStyleID=e.styleID),this.dirty||!t){var r="number"==typeof e.fontSize?e.fontSize+"px":e.fontSize;this._font=e.fontStyle+" "+e.fontVariant+" "+e.fontWeight+" "+r+" "+e.fontFamily,this.context.font=this._font;var i,n=e.wordWrap?this.wordWrap(this._text):this._text,s=n.split(/(?:\r\n|\r|\n)/),o=new Array(s.length),a=0,h=this.determineFontProperties(this._font);for(i=0;i<s.length;i++){var u=this.context.measureText(s[i]).width+(s[i].length-1)*e.letterSpacing;o[i]=u,a=Math.max(a,u)}var l=a+e.strokeThickness;e.dropShadow&&(l+=e.dropShadowDistance),l+=2*e.padding,this.canvas.width=Math.ceil((l+this.context.lineWidth)*this.resolution);var c=this.style.lineHeight||h.fontSize+e.strokeThickness,d=Math.max(c,h.fontSize+e.strokeThickness)+(s.length-1)*c;e.dropShadow&&(d+=e.dropShadowDistance),this.canvas.height=Math.ceil((d+2*this._style.padding)*this.resolution),this.context.scale(this.resolution,this.resolution),navigator.isCocoonJS&&this.context.clearRect(0,0,this.canvas.width,this.canvas.height),this.context.font=this._font,this.context.strokeStyle=e.stroke,this.context.lineWidth=e.strokeThickness,this.context.textBaseline=e.textBaseline,this.context.lineJoin=e.lineJoin,this.context.miterLimit=e.miterLimit;var p,f;if(e.dropShadow){e.dropShadowBlur>0?(this.context.shadowColor=e.dropShadowColor,this.context.shadowBlur=e.dropShadowBlur):this.context.fillStyle=e.dropShadowColor;var v=Math.cos(e.dropShadowAngle)*e.dropShadowDistance,g=Math.sin(e.dropShadowAngle)*e.dropShadowDistance;for(i=0;i<s.length;i++)p=e.strokeThickness/2,f=e.strokeThickness/2+i*c+h.ascent,"right"===e.align?p+=a-o[i]:"center"===e.align&&(p+=(a-o[i])/2),e.fill&&(this.drawLetterSpacing(s[i],p+v+e.padding,f+g+e.padding),e.stroke&&e.strokeThickness&&(this.context.strokeStyle=e.dropShadowColor,this.drawLetterSpacing(s[i],p+v+e.padding,f+g+e.padding,!0),this.context.strokeStyle=e.stroke))}for(this.context.fillStyle=this._generateFillStyle(e,s),i=0;i<s.length;i++)p=e.strokeThickness/2,f=e.strokeThickness/2+i*c+h.ascent,"right"===e.align?p+=a-o[i]:"center"===e.align&&(p+=(a-o[i])/2),e.stroke&&e.strokeThickness&&this.drawLetterSpacing(s[i],p+e.padding,f+e.padding,!0),e.fill&&this.drawLetterSpacing(s[i],p+e.padding,f+e.padding);this.updateTexture()}},i.prototype.drawLetterSpacing=function(t,e,r,i){var n=this._style,s=n.letterSpacing;if(0===s)return void(i?this.context.strokeText(t,e,r):this.context.fillText(t,e,r));for(var o,a=String.prototype.split.call(t,""),h=0,u=e;h<t.length;)o=a[h++],i?this.context.strokeText(o,u,r):this.context.fillText(o,u,r),u+=this.context.measureText(o).width+s},i.prototype.updateTexture=function(){var t=this._texture,e=this._style;t.baseTexture.hasLoaded=!0,t.baseTexture.resolution=this.resolution,t.baseTexture.realWidth=this.canvas.width,t.baseTexture.realHeight=this.canvas.height,t.baseTexture.width=this.canvas.width/this.resolution,t.baseTexture.height=this.canvas.height/this.resolution,t.trim.width=t._frame.width=this.canvas.width/this.resolution,t.trim.height=t._frame.height=this.canvas.height/this.resolution,t.trim.x=-e.padding,t.trim.y=-e.padding,t.orig.width=t._frame.width-2*e.padding,t.orig.height=t._frame.height-2*e.padding,this._onTextureUpdate(),t.baseTexture.emit("update",t.baseTexture),this.dirty=!1},i.prototype.renderWebGL=function(t){this.resolution!==t.resolution&&(this.resolution=t.resolution,this.dirty=!0),this.updateText(!0),n.prototype.renderWebGL.call(this,t)},i.prototype._renderCanvas=function(t){this.resolution!==t.resolution&&(this.resolution=t.resolution,this.dirty=!0),this.updateText(!0),n.prototype._renderCanvas.call(this,t)},i.prototype.determineFontProperties=function(t){var e=i.fontPropertiesCache[t];if(!e){e={};var r=i.fontPropertiesCanvas,n=i.fontPropertiesContext;n.font=t;var s=Math.ceil(n.measureText("|MÉq").width),o=Math.ceil(n.measureText("M").width),a=2*o;o=1.4*o|0,r.width=s,r.height=a,n.fillStyle="#f00",n.fillRect(0,0,s,a),n.font=t,n.textBaseline="alphabetic",n.fillStyle="#000",n.fillText("|MÉq",0,o);var h,u,l=n.getImageData(0,0,s,a).data,c=l.length,d=4*s,p=0,f=!1;for(h=0;h<o;h++){for(u=0;u<d;u+=4)if(255!==l[p+u]){f=!0;break}if(f)break;p+=d}for(e.ascent=o-h,p=c-d,f=!1,h=a;h>o;h--){for(u=0;u<d;u+=4)if(255!==l[p+u]){f=!0;break}if(f)break;p-=d}e.descent=h-o,e.fontSize=e.ascent+e.descent,i.fontPropertiesCache[t]=e}return e},i.prototype.wordWrap=function(t){for(var e="",r=t.split("\n"),i=this._style.wordWrapWidth,n=0;n<r.length;n++){for(var s=i,o=r[n].split(" "),a=0;a<o.length;a++){var h=this.context.measureText(o[a]).width;if(this._style.breakWords&&h>i)for(var u=o[a].split(""),l=0;l<u.length;l++){var c=this.context.measureText(u[l]).width;c>s?(e+="\n"+u[l],s=i-c):(0===l&&(e+=" "),e+=u[l],s-=c)}else{var d=h+this.context.measureText(" ").width;0===a||d>s?(a>0&&(e+="\n"),e+=o[a],s=i-h):(s-=d,e+=" "+o[a])}}n<r.length-1&&(e+="\n")}return e},i.prototype._calculateBounds=function(){this.updateText(!0),this.calculateVertices(),this._bounds.addQuad(this.vertexData)},i.prototype._onStyleChange=function(){this.dirty=!0},i.prototype._generateFillStyle=function(t,e){if(Array.isArray(t.fill)){if(navigator.isCocoonJS)return t.fill[0];var r,i,n,s,o,a=this.canvas.width/this.resolution,u=this.canvas.height/this.resolution;if(t.fillGradientType===h.TEXT_GRADIENT.LINEAR_VERTICAL)for(i=this.context.createLinearGradient(a/2,0,a/2,u),n=(t.fill.length+1)*e.length,s=0,r=0;r<e.length;r++){s+=1;for(var l=0;l<t.fill.length;l++)o=s/n,i.addColorStop(o,t.fill[l]),s++}else for(i=this.context.createLinearGradient(0,u/2,a,u/2),n=t.fill.length+1,s=1,r=0;r<t.fill.length;r++)o=s/n,i.addColorStop(o,t.fill[r]),s++;return i}return t.fill},i.prototype.destroy=function(t){"boolean"==typeof t&&(t={children:t}),t=Object.assign({},l,t),n.prototype.destroy.call(this,t),this.context=null,this.canvas=null,this._style=null}},{"../const":43,"../math":67,"../sprites/Sprite":98,"../textures/Texture":109,"../utils":116,"./TextStyle":105}],105:[function(t,e,r){function i(t){this.styleID=0,Object.assign(this,this._defaults,t)}function n(t){if("number"==typeof t)return o.hex2string(t);if(Array.isArray(t))for(var e=0;e<t.length;++e)"number"==typeof t[e]&&(t[e]=o.hex2string(t[e]));return t}var s=t("../const"),o=t("../utils");i.prototype.constructor=i,e.exports=i,i.prototype._defaults={align:"left",breakWords:!1,dropShadow:!1,dropShadowAngle:Math.PI/6,dropShadowBlur:0,dropShadowColor:"#000000",dropShadowDistance:5,fill:"black",fillGradientType:s.TEXT_GRADIENT.LINEAR_VERTICAL,fontFamily:"Arial",fontSize:26,fontStyle:"normal",fontVariant:"normal",fontWeight:"normal",letterSpacing:0,lineHeight:0,lineJoin:"miter",miterLimit:10,padding:0,stroke:"black",strokeThickness:0,textBaseline:"alphabetic",wordWrap:!1,wordWrapWidth:100},i.prototype.clone=function(){var t={};for(var e in this._defaults)t[e]=this[e];return new i(t)},i.prototype.reset=function(){Object.assign(this,this._defaults)},Object.defineProperties(i.prototype,{align:{get:function(){return this._align},set:function(t){this._align!==t&&(this._align=t,this.styleID++)}},breakWords:{get:function(){return this._breakWords},set:function(t){this._breakWords!==t&&(this._breakWords=t,this.styleID++)}},dropShadow:{get:function(){return this._dropShadow},set:function(t){this._dropShadow!==t&&(this._dropShadow=t,this.styleID++)}},dropShadowAngle:{get:function(){return this._dropShadowAngle},set:function(t){this._dropShadowAngle!==t&&(this._dropShadowAngle=t,this.styleID++)}},dropShadowBlur:{get:function(){return this._dropShadowBlur},set:function(t){this._dropShadowBlur!==t&&(this._dropShadowBlur=t,this.styleID++)}},dropShadowColor:{get:function(){return this._dropShadowColor},set:function(t){var e=n(t);this._dropShadowColor!==e&&(this._dropShadowColor=e,this.styleID++)}},dropShadowDistance:{get:function(){return this._dropShadowDistance},set:function(t){this._dropShadowDistance!==t&&(this._dropShadowDistance=t,this.styleID++)}},fill:{get:function(){return this._fill},set:function(t){var e=n(t);this._fill!==e&&(this._fill=e,this.styleID++)}},fillGradientType:{get:function(){return this._fillGradientType},set:function(t){this._fillGradientType!==t&&(this._fillGradientType=t,this.styleID++)}},fontFamily:{get:function(){return this._fontFamily},set:function(t){this.fontFamily!==t&&(this._fontFamily=t,this.styleID++)}},fontSize:{get:function(){return this._fontSize},set:function(t){this._fontSize!==t&&(this._fontSize=t,this.styleID++)}},fontStyle:{get:function(){return this._fontStyle},set:function(t){this._fontStyle!==t&&(this._fontStyle=t,this.styleID++)}},fontVariant:{get:function(){return this._fontVariant},set:function(t){this._fontVariant!==t&&(this._fontVariant=t,this.styleID++)}},fontWeight:{get:function(){return this._fontWeight},set:function(t){this._fontWeight!==t&&(this._fontWeight=t,this.styleID++)}},letterSpacing:{get:function(){return this._letterSpacing},set:function(t){this._letterSpacing!==t&&(this._letterSpacing=t,this.styleID++)}},lineHeight:{get:function(){return this._lineHeight},set:function(t){this._lineHeight!==t&&(this._lineHeight=t,this.styleID++)}},lineJoin:{get:function(){return this._lineJoin},set:function(t){this._lineJoin!==t&&(this._lineJoin=t,this.styleID++)}},miterLimit:{get:function(){return this._miterLimit},set:function(t){this._miterLimit!==t&&(this._miterLimit=t,this.styleID++)}},padding:{get:function(){return this._padding},set:function(t){this._padding!==t&&(this._padding=t,this.styleID++)}},stroke:{get:function(){return this._stroke},set:function(t){var e=n(t);this._stroke!==e&&(this._stroke=e,this.styleID++)}},strokeThickness:{get:function(){return this._strokeThickness},set:function(t){this._strokeThickness!==t&&(this._strokeThickness=t,this.styleID++)}},textBaseline:{get:function(){return this._textBaseline},set:function(t){this._textBaseline!==t&&(this._textBaseline=t,this.styleID++)}},wordWrap:{get:function(){return this._wordWrap},set:function(t){this._wordWrap!==t&&(this._wordWrap=t,this.styleID++)}},wordWrapWidth:{get:function(){return this._wordWrapWidth},set:function(t){this._wordWrapWidth!==t&&(this._wordWrapWidth=t,this.styleID++)}}})},{"../const":43,"../utils":116}],106:[function(t,e,r){function i(t,e,r,i){n.call(this,null,r),this.resolution=i||s.RESOLUTION,this.width=t||100,this.height=e||100,this.realWidth=this.width*this.resolution,this.realHeight=this.height*this.resolution,this.scaleMode=r||s.SCALE_MODES.DEFAULT,this.hasLoaded=!0,this._glRenderTargets=[],this._canvasRenderTarget=null,this.valid=!1}var n=t("./BaseTexture"),s=t("../const");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.resize=function(t,e){t===this.width&&e===this.height||(this.valid=t>0&&e>0,this.width=t,this.height=e,this.realWidth=this.width*this.resolution,this.realHeight=this.height*this.resolution,this.valid&&this.emit("update",this))},i.prototype.destroy=function(){n.prototype.destroy.call(this,!0),this.renderer=null}},{"../const":43,"./BaseTexture":107}],107:[function(t,e,r){function i(t,e,r){o.call(this),
this.uid=n.uid(),this.touched=0,this.resolution=r||s.RESOLUTION,this.width=100,this.height=100,this.realWidth=100,this.realHeight=100,this.scaleMode=e||s.SCALE_MODES.DEFAULT,this.hasLoaded=!1,this.isLoading=!1,this.source=null,this.premultipliedAlpha=!0,this.imageUrl=null,this.isPowerOfTwo=!1,this.mipmap=s.MIPMAP_TEXTURES,this.wrapMode=s.WRAP_MODES.DEFAULT,this._glTextures=[],this._enabled=0,this._id=0,t&&this.loadSource(t)}var n=t("../utils"),s=t("../const"),o=t("eventemitter3"),a=t("../utils/determineCrossOrigin"),h=t("bit-twiddle");i.prototype=Object.create(o.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.update=function(){this.realWidth=this.source.naturalWidth||this.source.videoWidth||this.source.width,this.realHeight=this.source.naturalHeight||this.source.videoHeight||this.source.height,this.width=this.realWidth/this.resolution,this.height=this.realHeight/this.resolution,this.isPowerOfTwo=h.isPow2(this.realWidth)&&h.isPow2(this.realHeight),this.emit("update",this)},i.prototype.loadSource=function(t){var e=this.isLoading;if(this.hasLoaded=!1,this.isLoading=!1,e&&this.source&&(this.source.onload=null,this.source.onerror=null),this.source=t,(this.source.complete||this.source.getContext)&&this.source.width&&this.source.height)this._sourceLoaded();else if(!t.getContext){this.isLoading=!0;var r=this;t.onload=function(){t.onload=null,t.onerror=null,r.isLoading&&(r.isLoading=!1,r._sourceLoaded(),r.emit("loaded",r))},t.onerror=function(){t.onload=null,t.onerror=null,r.isLoading&&(r.isLoading=!1,r.emit("error",r))},t.complete&&t.src&&(this.isLoading=!1,t.onload=null,t.onerror=null,t.width&&t.height?(this._sourceLoaded(),e&&this.emit("loaded",this)):e&&this.emit("error",this))}},i.prototype._sourceLoaded=function(){this.hasLoaded=!0,this.update()},i.prototype.destroy=function(){this.imageUrl?(delete n.BaseTextureCache[this.imageUrl],delete n.TextureCache[this.imageUrl],this.imageUrl=null,navigator.isCocoonJS||(this.source.src="")):this.source&&this.source._pixiId&&delete n.BaseTextureCache[this.source._pixiId],this.source=null,this.dispose()},i.prototype.dispose=function(){this.emit("dispose",this)},i.prototype.updateSourceImage=function(t){this.source.src=t,this.loadSource(this.source)},i.fromImage=function(t,e,r){var s=n.BaseTextureCache[t];if(!s){var o=new Image;void 0===e&&0!==t.indexOf("data:")&&(o.crossOrigin=a(t)),s=new i(o,r),s.imageUrl=t,o.src=t,n.BaseTextureCache[t]=s,s.resolution=n.getResolutionOfUrl(t)}return s},i.fromCanvas=function(t,e){t._pixiId||(t._pixiId="canvas_"+n.uid());var r=n.BaseTextureCache[t._pixiId];return r||(r=new i(t,e),n.BaseTextureCache[t._pixiId]=r),r}},{"../const":43,"../utils":116,"../utils/determineCrossOrigin":115,"bit-twiddle":1,eventemitter3:3}],108:[function(t,e,r){function i(t,e){if(this.legacyRenderer=null,!(t instanceof n)){var r=arguments[1],i=arguments[2],o=arguments[3]||0,a=arguments[4]||1;console.warn("v4 RenderTexture now expects a new BaseRenderTexture. Please use RenderTexture.create("+r+", "+i+")"),this.legacyRenderer=arguments[0],e=null,t=new n(r,i,o,a)}s.call(this,t,e),this.valid=!0,this._updateUvs()}var n=t("./BaseRenderTexture"),s=t("./Texture");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.resize=function(t,e,r){this.valid=t>0&&e>0,this._frame.width=this.orig.width=t,this._frame.height=this.orig.height=e,r||this.baseTexture.resize(t,e),this._updateUvs()},i.create=function(t,e,r,s){return new i(new n(t,e,r,s))}},{"./BaseRenderTexture":106,"./Texture":109}],109:[function(t,e,r){function i(t,e,r,n,s){if(a.call(this),this.noFrame=!1,e||(this.noFrame=!0,e=new h.Rectangle(0,0,1,1)),t instanceof i&&(t=t.baseTexture),this.baseTexture=t,this._frame=e,this.trim=n,this.valid=!1,this.requiresUpdate=!1,this._uvs=null,this.orig=r||e,this._rotate=+(s||0),s===!0)this._rotate=2;else if(this._rotate%2!==0)throw"attempt to use diamond-shaped UVs. If you are sure, set rotation manually";t.hasLoaded?(this.noFrame&&(e=new h.Rectangle(0,0,t.width,t.height),t.on("update",this.onBaseTextureUpdated,this)),this.frame=e):t.once("loaded",this.onBaseTextureLoaded,this),this._updateID=0}var n=t("./BaseTexture"),s=t("./VideoBaseTexture"),o=t("./TextureUvs"),a=t("eventemitter3"),h=t("../math"),u=t("../utils");i.prototype=Object.create(a.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{frame:{get:function(){return this._frame},set:function(t){if(this._frame=t,this.noFrame=!1,t.x+t.width>this.baseTexture.width||t.y+t.height>this.baseTexture.height)throw new Error("Texture Error: frame does not fit inside the base Texture dimensions "+this);this.valid=t&&t.width&&t.height&&this.baseTexture.hasLoaded,this.trim||this.rotate||(this.orig=t),this.valid&&this._updateUvs()}},rotate:{get:function(){return this._rotate},set:function(t){this._rotate=t,this.valid&&this._updateUvs()}},width:{get:function(){return this.orig?this.orig.width:0}},height:{get:function(){return this.orig?this.orig.height:0}}}),i.prototype.update=function(){this.baseTexture.update()},i.prototype.onBaseTextureLoaded=function(t){this._updateID++,this.noFrame?this.frame=new h.Rectangle(0,0,t.width,t.height):this.frame=this._frame,this.baseTexture.on("update",this.onBaseTextureUpdated,this),this.emit("update",this)},i.prototype.onBaseTextureUpdated=function(t){this._updateID++,this._frame.width=t.width,this._frame.height=t.height,this.emit("update",this)},i.prototype.destroy=function(t){this.baseTexture&&(t&&(u.TextureCache[this.baseTexture.imageUrl]&&delete u.TextureCache[this.baseTexture.imageUrl],this.baseTexture.destroy()),this.baseTexture.off("update",this.onBaseTextureUpdated,this),this.baseTexture.off("loaded",this.onBaseTextureLoaded,this),this.baseTexture=null),this._frame=null,this._uvs=null,this.trim=null,this.orig=null,this.valid=!1,this.off("dispose",this.dispose,this),this.off("update",this.update,this)},i.prototype.clone=function(){return new i(this.baseTexture,this.frame,this.orig,this.trim,this.rotate)},i.prototype._updateUvs=function(){this._uvs||(this._uvs=new o),this._uvs.set(this._frame,this.baseTexture,this.rotate),this._updateID++},i.fromImage=function(t,e,r){var s=u.TextureCache[t];return s||(s=new i(n.fromImage(t,e,r)),u.TextureCache[t]=s),s},i.fromFrame=function(t){var e=u.TextureCache[t];if(!e)throw new Error('The frameId "'+t+'" does not exist in the texture cache');return e},i.fromCanvas=function(t,e){return new i(n.fromCanvas(t,e))},i.fromVideo=function(t,e){return"string"==typeof t?i.fromVideoUrl(t,e):new i(s.fromVideo(t,e))},i.fromVideoUrl=function(t,e){return new i(s.fromUrl(t,e))},i.from=function(t){if("string"==typeof t){var e=u.TextureCache[t];if(!e){var r=null!==t.match(/\.(mp4|webm|ogg|h264|avi|mov)$/);return r?i.fromVideoUrl(t):i.fromImage(t)}return e}return t instanceof HTMLCanvasElement?i.fromCanvas(t):t instanceof HTMLVideoElement?i.fromVideo(t):t instanceof n?new i(n):t},i.addTextureToCache=function(t,e){u.TextureCache[e]=t},i.removeTextureFromCache=function(t){var e=u.TextureCache[t];return delete u.TextureCache[t],delete u.BaseTextureCache[t],e},i.EMPTY=new i(new n),i.EMPTY.destroy=function(){},i.EMPTY.on=function(){},i.EMPTY.once=function(){},i.EMPTY.emit=function(){}},{"../math":67,"../utils":116,"./BaseTexture":107,"./TextureUvs":110,"./VideoBaseTexture":111,eventemitter3:3}],110:[function(t,e,r){function i(){this.x0=0,this.y0=0,this.x1=1,this.y1=0,this.x2=1,this.y2=1,this.x3=0,this.y3=1,this.uvsUint32=new Uint32Array(4)}e.exports=i;var n=t("../math/GroupD8");i.prototype.set=function(t,e,r){var i=e.width,s=e.height;if(r){var o=t.width/2/i,a=t.height/2/s,h=t.x/i+o,u=t.y/s+a;r=n.add(r,n.NW),this.x0=h+o*n.uX(r),this.y0=u+a*n.uY(r),r=n.add(r,2),this.x1=h+o*n.uX(r),this.y1=u+a*n.uY(r),r=n.add(r,2),this.x2=h+o*n.uX(r),this.y2=u+a*n.uY(r),r=n.add(r,2),this.x3=h+o*n.uX(r),this.y3=u+a*n.uY(r)}else this.x0=t.x/i,this.y0=t.y/s,this.x1=(t.x+t.width)/i,this.y1=t.y/s,this.x2=(t.x+t.width)/i,this.y2=(t.y+t.height)/s,this.x3=t.x/i,this.y3=(t.y+t.height)/s;this.uvsUint32[0]=(65535*this.y0&65535)<<16|65535*this.x0&65535,this.uvsUint32[1]=(65535*this.y1&65535)<<16|65535*this.x1&65535,this.uvsUint32[2]=(65535*this.y2&65535)<<16|65535*this.x2&65535,this.uvsUint32[3]=(65535*this.y3&65535)<<16|65535*this.x3&65535}},{"../math/GroupD8":63}],111:[function(t,e,r){function i(t,e){if(!t)throw new Error("No video source element specified.");(t.readyState===t.HAVE_ENOUGH_DATA||t.readyState===t.HAVE_FUTURE_DATA)&&t.width&&t.height&&(t.complete=!0),s.call(this,t,e),this.autoUpdate=!1,this._onUpdate=this._onUpdate.bind(this),this._onCanPlay=this._onCanPlay.bind(this),t.complete||(t.addEventListener("canplay",this._onCanPlay),t.addEventListener("canplaythrough",this._onCanPlay),t.addEventListener("play",this._onPlayStart.bind(this)),t.addEventListener("pause",this._onPlayStop.bind(this))),this.__loaded=!1}function n(t,e){e||(e="video/"+t.substr(t.lastIndexOf(".")+1));var r=document.createElement("source");return r.src=t,r.type=e,r}var s=t("./BaseTexture"),o=t("../utils");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,e.exports=i,i.prototype._onUpdate=function(){this.autoUpdate&&(window.requestAnimationFrame(this._onUpdate),this.update())},i.prototype._onPlayStart=function(){this.hasLoaded||this._onCanPlay(),this.autoUpdate||(window.requestAnimationFrame(this._onUpdate),this.autoUpdate=!0)},i.prototype._onPlayStop=function(){this.autoUpdate=!1},i.prototype._onCanPlay=function(){this.hasLoaded=!0,this.source&&(this.source.removeEventListener("canplay",this._onCanPlay),this.source.removeEventListener("canplaythrough",this._onCanPlay),this.width=this.source.videoWidth,this.height=this.source.videoHeight,this.source.play(),this.__loaded||(this.__loaded=!0,this.emit("loaded",this)))},i.prototype.destroy=function(){this.source&&this.source._pixiId&&(delete o.BaseTextureCache[this.source._pixiId],delete this.source._pixiId),s.prototype.destroy.call(this)},i.fromVideo=function(t,e){t._pixiId||(t._pixiId="video_"+o.uid());var r=o.BaseTextureCache[t._pixiId];return r||(r=new i(t,e),o.BaseTextureCache[t._pixiId]=r),r},i.fromUrl=function(t,e){var r=document.createElement("video");if(Array.isArray(t))for(var s=0;s<t.length;++s)r.appendChild(n(t[s].src||t[s],t[s].mime));else r.appendChild(n(t.src||t,t.mime));return r.load(),r.play(),i.fromVideo(r,e)},i.fromUrls=i.fromUrl},{"../utils":116,"./BaseTexture":107}],112:[function(t,e,r){function i(){var t=this;this._tick=function(e){t._requestId=null,t.started&&(t.update(e),t.started&&null===t._requestId&&t._emitter.listeners(o,!0)&&(t._requestId=requestAnimationFrame(t._tick)))},this._emitter=new s,this._requestId=null,this._maxElapsedMS=100,this.autoStart=!1,this.deltaTime=1,this.elapsedMS=1/n.TARGET_FPMS,this.lastTime=0,this.speed=1,this.started=!1}var n=t("../const"),s=t("eventemitter3"),o="tick";Object.defineProperties(i.prototype,{FPS:{get:function(){return 1e3/this.elapsedMS}},minFPS:{get:function(){return 1e3/this._maxElapsedMS},set:function(t){var e=Math.min(Math.max(0,t)/1e3,n.TARGET_FPMS);this._maxElapsedMS=1/e}}}),i.prototype._requestIfNeeded=function(){null===this._requestId&&this._emitter.listeners(o,!0)&&(this.lastTime=performance.now(),this._requestId=requestAnimationFrame(this._tick))},i.prototype._cancelIfNeeded=function(){null!==this._requestId&&(cancelAnimationFrame(this._requestId),this._requestId=null)},i.prototype._startIfPossible=function(){this.started?this._requestIfNeeded():this.autoStart&&this.start()},i.prototype.add=function(t,e){return this._emitter.on(o,t,e),this._startIfPossible(),this},i.prototype.addOnce=function(t,e){return this._emitter.once(o,t,e),this._startIfPossible(),this},i.prototype.remove=function(t,e){return this._emitter.off(o,t,e),this._emitter.listeners(o,!0)||this._cancelIfNeeded(),this},i.prototype.start=function(){this.started||(this.started=!0,this._requestIfNeeded())},i.prototype.stop=function(){this.started&&(this.started=!1,this._cancelIfNeeded())},i.prototype.update=function(t){var e;t=t||performance.now(),t>this.lastTime?(e=this.elapsedMS=t-this.lastTime,e>this._maxElapsedMS&&(e=this._maxElapsedMS),this.deltaTime=e*n.TARGET_FPMS*this.speed,this._emitter.emit(o,this.deltaTime)):this.deltaTime=this.elapsedMS=0,this.lastTime=t},e.exports=i},{"../const":43,eventemitter3:3}],113:[function(t,e,r){var i=t("./Ticker"),n=new i;n.autoStart=!0,e.exports={shared:n,Ticker:i}},{"./Ticker":112}],114:[function(t,e,r){var i=function(t){for(var e=6*t,r=new Uint16Array(e),i=0,n=0;i<e;i+=6,n+=4)r[i+0]=n+0,r[i+1]=n+1,r[i+2]=n+2,r[i+3]=n+0,r[i+4]=n+2,r[i+5]=n+3;return r};e.exports=i},{}],115:[function(t,e,r){var i,n=t("url"),s=function(t,e){if(0===t.indexOf("data:"))return"";e=e||window.location,i||(i=document.createElement("a")),i.href=t,t=n.parse(i.href);var r=!t.port&&""===e.port||t.port===e.port;return t.hostname===e.hostname&&r&&t.protocol===e.protocol?"":"anonymous"};e.exports=s},{url:28}],116:[function(t,e,r){var i=t("../const"),n=e.exports={_uid:0,_saidHello:!1,EventEmitter:t("eventemitter3"),pluginTarget:t("./pluginTarget"),uid:function(){return++n._uid},hex2rgb:function(t,e){return e=e||[],e[0]=(t>>16&255)/255,e[1]=(t>>8&255)/255,e[2]=(255&t)/255,e},hex2string:function(t){return t=t.toString(16),t="000000".substr(0,6-t.length)+t,"#"+t},rgb2hex:function(t){return(255*t[0]<<16)+(255*t[1]<<8)+255*t[2]},getResolutionOfUrl:function(t){var e=i.RETINA_PREFIX.exec(t);return e?parseFloat(e[1]):1},sayHello:function(t){if(!n._saidHello){if(navigator.userAgent.toLowerCase().indexOf("chrome")>-1){var e=["\n %c %c %c Pixi.js "+i.VERSION+" - ✰ "+t+" ✰  %c  %c  http://www.pixijs.com/  %c %c ♥%c♥%c♥ \n\n","background: #ff66a5; padding:5px 0;","background: #ff66a5; padding:5px 0;","color: #ff66a5; background: #030307; padding:5px 0;","background: #ff66a5; padding:5px 0;","background: #ffc3dc; padding:5px 0;","background: #ff66a5; padding:5px 0;","color: #ff2424; background: #fff; padding:5px 0;","color: #ff2424; background: #fff; padding:5px 0;","color: #ff2424; background: #fff; padding:5px 0;"];window.console.log.apply(console,e)}else window.console&&window.console.log("Pixi.js "+i.VERSION+" - "+t+" - http://www.pixijs.com/");n._saidHello=!0}},isWebGLSupported:function(){var t={stencil:!0,failIfMajorPerformanceCaveat:!0};try{if(!window.WebGLRenderingContext)return!1;var e=document.createElement("canvas"),r=e.getContext("webgl",t)||e.getContext("experimental-webgl",t),i=!(!r||!r.getContextAttributes().stencil);if(r){var n=r.getExtension("WEBGL_lose_context");n&&n.loseContext()}return r=null,i}catch(t){return!1}},sign:function(t){return t?t<0?-1:1:0},removeItems:function(t,e,r){var i=t.length;if(!(e>=i||0===r)){r=e+r>i?i-e:r;for(var n=e,s=i-r;n<s;++n)t[n]=t[n+r];t.length=s}},TextureCache:{},BaseTextureCache:{}}},{"../const":43,"./pluginTarget":118,eventemitter3:3}],117:[function(t,e,r){var i=t("ismobilejs"),n=function(t){return i.tablet||i.phone?2:t};e.exports=n},{ismobilejs:4}],118:[function(t,e,r){function i(t){t.__plugins={},t.registerPlugin=function(e,r){t.__plugins[e]=r},t.prototype.initPlugins=function(){this.plugins=this.plugins||{};for(var e in t.__plugins)this.plugins[e]=new t.__plugins[e](this)},t.prototype.destroyPlugins=function(){for(var t in this.plugins)this.plugins[t].destroy(),this.plugins[t]=null;this.plugins=null}}e.exports={mixin:function(t){i(t)}}},{}],119:[function(t,e,r){var i=t("./core"),n=t("./mesh"),s=t("./particles"),o=t("./extras"),a=t("./filters");i.SpriteBatch=function(){throw new ReferenceError("SpriteBatch does not exist any more, please use the new ParticleContainer instead.")},i.AssetLoader=function(){throw new ReferenceError("The loader system was overhauled in pixi v3, please see the new PIXI.loaders.Loader class.")},Object.defineProperties(i,{Stage:{get:function(){return i.Container}},DisplayObjectContainer:{get:function(){return i.Container}},Strip:{get:function(){return n.Mesh}},Rope:{get:function(){return n.Rope}},ParticleContainer:{get:function(){return s.ParticleContainer}},MovieClip:{get:function(){return o.MovieClip}},TilingSprite:{get:function(){return o.TilingSprite}},BitmapText:{get:function(){return o.BitmapText}},blendModes:{get:function(){return i.BLEND_MODES}},scaleModes:{get:function(){return i.SCALE_MODES}},BaseTextureCache:{get:function(){return i.utils.BaseTextureCache}},TextureCache:{get:function(){return i.utils.TextureCache}},math:{get:function(){return i}},AbstractFilter:{get:function(){return i.Filter}},TransformManual:{get:function(){return i.TransformBase}}}),i.DisplayObject.prototype.generateTexture=function(t,e,r){return t.generateTexture(this,e,r)},i.Graphics.prototype.generateTexture=function(t,e){return this.generateCanvasTexture(t,e)},i.RenderTexture.prototype.render=function(t,e,r,i){this.legacyRenderer.render(t,this,r,e,!i)},i.RenderTexture.prototype.getImage=function(t){return this.legacyRenderer.extract.image(t)},i.RenderTexture.prototype.getBase64=function(t){return this.legacyRenderer.extract.base64(t)},i.RenderTexture.prototype.getCanvas=function(t){return this.legacyRenderer.extract.canvas(t)},i.RenderTexture.prototype.getPixels=function(t){return this.legacyRenderer.pixels(t)},i.Sprite.prototype.setTexture=function(t){this.texture=t},o.BitmapText.prototype.setText=function(t){this.text=t},i.Text.prototype.setText=function(t){this.text=t},i.Text.prototype.setStyle=function(t){this.style=t},Object.defineProperties(i.TextStyle.prototype,{font:{get:function(){var t="number"==typeof this._fontSize?this._fontSize+"px":this._fontSize;return this._fontStyle+" "+this._fontVariant+" "+this._fontWeight+" "+t+" "+this._fontFamily},set:function(t){t.indexOf("italic")>1?this._fontStyle="italic":t.indexOf("oblique")>-1?this._fontStyle="oblique":this._fontStyle="normal",t.indexOf("small-caps")>-1?this._fontVariant="small-caps":this._fontVariant="normal";var e,r=t.split(" "),i=-1;for(this._fontSize=26,e=0;e<r.length;++e)if(r[e].match(/(px|pt|em|%)/)){i=e,this._fontSize=r[e];break}for(this._fontWeight="normal",e=0;e<i;++e)if(r[e].match(/(bold|bolder|lighter|100|200|300|400|500|600|700|800|900)/)){this._fontWeight=r[e];break}if(i>-1&&i<r.length-1){for(this._fontFamily="",e=i+1;e<r.length;++e)this._fontFamily+=r[e]+" ";this._fontFamily=this._fontFamily.slice(0,-1)}else this._fontFamily="Arial";this.styleID++}}}),i.Texture.prototype.setFrame=function(t){this.frame=t},Object.defineProperties(a,{AbstractFilter:{get:function(){return i.AbstractFilter}},SpriteMaskFilter:{get:function(){return i.SpriteMaskFilter}}}),i.utils.uuid=function(){return i.utils.uid()},i.utils.canUseNewCanvasBlendModes=function(){return i.CanvasTinter.canUseMultiply}},{"./core":62,"./extras":129,"./filters":140,"./mesh":156,"./particles":159}],120:[function(t,e,r){function i(t){this.renderer=t,t.extract=this}var n=t("../../core"),s=new n.Rectangle;i.prototype.constructor=i,e.exports=i,i.prototype.image=function(t){var e=new Image;return e.src=this.base64(t),e},i.prototype.base64=function(t){return this.canvas(t).toDataURL()},i.prototype.canvas=function(t){var e,r,i,o,a=this.renderer;t&&(o=t instanceof n.RenderTexture?t:a.generateTexture(t)),o?(e=o.baseTexture._canvasRenderTarget.context,r=o.baseTexture._canvasRenderTarget.resolution,i=o.frame):(e=a.rootContext,r=a.rootResolution,i=s,i.width=this.renderer.width,i.height=this.renderer.height);var h=i.width*r,u=i.height*r,l=new n.CanvasRenderTarget(h,u),c=e.getImageData(i.x*r,i.y*r,h,u);return l.context.putImageData(c,0,0),l.canvas},i.prototype.pixels=function(t){var e,r,i,o,a=this.renderer;return t&&(o=t instanceof n.RenderTexture?t:a.generateTexture(t)),o?(e=o.baseTexture._canvasRenderTarget.context,r=o.baseTexture._canvasRenderTarget.resolution,i=o.frame):(e=a.rootContext,r=a.rootResolution,i=s,i.width=a.width,i.height=a.height),e.getImageData(0,0,i.width*r,i.height*r).data},i.prototype.destroy=function(){this.renderer.extract=null,this.renderer=null},n.CanvasRenderer.registerPlugin("extract",i)},{"../../core":62}],121:[function(t,e,r){e.exports={webGL:t("./webgl/WebGLExtract"),canvas:t("./canvas/CanvasExtract")}},{"./canvas/CanvasExtract":120,"./webgl/WebGLExtract":122}],122:[function(t,e,r){function i(t){this.renderer=t,t.extract=this}var n=t("../../core"),s=new n.Rectangle;i.prototype.constructor=i,e.exports=i,i.prototype.image=function(t){var e=new Image;return e.src=this.base64(t),e},i.prototype.base64=function(t){return this.canvas(t).toDataURL()},i.prototype.canvas=function(t){var e,r,i,o,a=this.renderer,h=!1;t&&(o=t instanceof n.RenderTexture?t:this.renderer.generateTexture(t)),o?(e=o.baseTexture._glRenderTargets[this.renderer.CONTEXT_UID],r=e.resolution,i=o.frame,h=!1):(e=this.renderer.rootRenderTarget,r=e.resolution,h=!0,i=s,i.width=e.size.width,i.height=e.size.height);var u=i.width*r,l=i.height*r,c=new n.CanvasRenderTarget(u,l);if(e){a.bindRenderTarget(e);var d=new Uint8Array(4*u*l),p=a.gl;p.readPixels(i.x*r,i.y*r,u,l,p.RGBA,p.UNSIGNED_BYTE,d);var f=c.context.getImageData(0,0,u,l);f.data.set(d),c.context.putImageData(f,0,0),h&&(c.context.scale(1,-1),c.context.drawImage(c.canvas,0,-l))}return c.canvas},i.prototype.pixels=function(t){var e,r,i,o,a=this.renderer;t&&(o=t instanceof n.RenderTexture?t:this.renderer.generateTexture(t)),o?(e=o.baseTexture._glRenderTargets[this.renderer.CONTEXT_UID],r=e.resolution,i=o.frame):(e=this.renderer.rootRenderTarget,r=e.resolution,i=s,i.width=e.size.width,i.height=e.size.height);var h=i.width*r,u=i.height*r,l=new Uint8Array(4*h*u);if(e){a.bindRenderTarget(e);var c=a.gl;c.readPixels(i.x*r,i.y*r,h,u,c.RGBA,c.UNSIGNED_BYTE,l)}return l},i.prototype.destroy=function(){this.renderer.extract=null,this.renderer=null},n.WebGLRenderer.registerPlugin("extract",i)},{"../../core":62}],123:[function(t,e,r){function i(t,e){n.Container.call(this),e=e||{},this.textWidth=0,this.textHeight=0,this._glyphs=[],this._font={tint:void 0!==e.tint?e.tint:16777215,align:e.align||"left",name:null,size:0},this.font=e.font,this._text=t,this.maxWidth=0,this.maxLineHeight=0,this._anchor=new s(this.makeDirty,this,0,0),this.dirty=!1,this.updateText()}var n=t("../core"),s=t("../core/math/ObservablePoint");i.prototype=Object.create(n.Container.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{tint:{get:function(){return this._font.tint},set:function(t){this._font.tint="number"==typeof t&&t>=0?t:16777215,this.dirty=!0}},align:{get:function(){return this._font.align},set:function(t){this._font.align=t||"left",this.dirty=!0}},anchor:{get:function(){return this._anchor},set:function(t){"number"==typeof t?this._anchor.set(t):this._anchor.copy(t)}},font:{get:function(){return this._font},set:function(t){t&&("string"==typeof t?(t=t.split(" "),this._font.name=1===t.length?t[0]:t.slice(1).join(" "),this._font.size=t.length>=2?parseInt(t[0],10):i.fonts[this._font.name].size):(this._font.name=t.name,this._font.size="number"==typeof t.size?t.size:parseInt(t.size,10)),this.dirty=!0)}},text:{get:function(){return this._text},set:function(t){t=t.toString()||" ",this._text!==t&&(this._text=t,this.dirty=!0)}}}),i.prototype.updateText=function(){for(var t=i.fonts[this._font.name],e=new n.Point,r=null,s=[],o=0,a=0,h=[],u=0,l=this._font.size/t.size,c=-1,d=0,p=0,f=0;f<this.text.length;f++){var v=this.text.charCodeAt(f);if(/(\s)/.test(this.text.charAt(f))&&(c=f,d=o),/(?:\r\n|\r|\n)/.test(this.text.charAt(f)))h.push(o),a=Math.max(a,o),u++,e.x=0,e.y+=t.lineHeight,r=null;else if(c!==-1&&this.maxWidth>0&&e.x*l>this.maxWidth)n.utils.removeItems(s,c,f-c),f=c,c=-1,h.push(d),a=Math.max(a,d),u++,e.x=0,e.y+=t.lineHeight,r=null;else{var g=t.chars[v];g&&(r&&g.kerning[r]&&(e.x+=g.kerning[r]),s.push({texture:g.texture,line:u,charCode:v,position:new n.Point(e.x+g.xOffset,e.y+g.yOffset)}),o=e.x+(g.texture.width+g.xOffset),e.x+=g.xAdvance,p=Math.max(p,g.yOffset+g.texture.height),r=v)}}h.push(o),a=Math.max(a,o);var y=[];for(f=0;f<=u;f++){var x=0;"right"===this._font.align?x=a-h[f]:"center"===this._font.align&&(x=(a-h[f])/2),y.push(x)}var m=s.length,_=this.tint;for(f=0;f<m;f++){var b=this._glyphs[f];b?b.texture=s[f].texture:(b=new n.Sprite(s[f].texture),this._glyphs.push(b)),b.position.x=(s[f].position.x+y[s[f].line])*l,b.position.y=s[f].position.y*l,b.scale.x=b.scale.y=l,b.tint=_,b.parent||this.addChild(b)}for(f=m;f<this._glyphs.length;++f)this.removeChild(this._glyphs[f]);if(this.textWidth=a*l,this.textHeight=(e.y+t.lineHeight)*l,0!==this.anchor.x||0!==this.anchor.y)for(f=0;f<m;f++)this._glyphs[f].x-=this.textWidth*this.anchor.x,this._glyphs[f].y-=this.textHeight*this.anchor.y;this.maxLineHeight=p*l},i.prototype.updateTransform=function(){this.validate(),this.containerUpdateTransform()},i.prototype.getLocalBounds=function(){return this.validate(),n.Container.prototype.getLocalBounds.call(this)},i.prototype.validate=function(){this.dirty&&(this.updateText(),this.dirty=!1)},i.prototype.makeDirty=function(){this.dirty=!0},i.fonts={}},{"../core":62,"../core/math/ObservablePoint":65}],124:[function(t,e,r){function i(t){n.Sprite.call(this,t[0]instanceof n.Texture?t[0]:t[0].texture),this._textures=null,this._durations=null,this.textures=t,this.animationSpeed=1,this.loop=!0,this.onComplete=null,this._currentTime=0,this.playing=!1}var n=t("../core");i.prototype=Object.create(n.Sprite.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{totalFrames:{get:function(){return this._textures.length}},textures:{get:function(){return this._textures},set:function(t){if(t[0]instanceof n.Texture)this._textures=t,this._durations=null;else{this._textures=[],this._durations=[];for(var e=0;e<t.length;e++)this._textures.push(t[e].texture),this._durations.push(t[e].time)}}},currentFrame:{get:function(){var t=Math.floor(this._currentTime)%this._textures.length;return t<0&&(t+=this._textures.length),t}}}),i.prototype.stop=function(){this.playing&&(this.playing=!1,n.ticker.shared.remove(this.update,this))},i.prototype.play=function(){this.playing||(this.playing=!0,n.ticker.shared.add(this.update,this))},i.prototype.gotoAndStop=function(t){this.stop(),this._currentTime=t,this._texture=this._textures[this.currentFrame],this._textureID=-1},i.prototype.gotoAndPlay=function(t){this._currentTime=t,this.play()},i.prototype.update=function(t){var e=this.animationSpeed*t;if(null!==this._durations){var r=this._currentTime%1*this._durations[this.currentFrame];for(r+=e/60*1e3;r<0;)this._currentTime--,r+=this._durations[this.currentFrame];var i=Math.sign(this.animationSpeed*t);for(this._currentTime=Math.floor(this._currentTime);r>=this._durations[this.currentFrame];)r-=this._durations[this.currentFrame]*i,this._currentTime+=i;this._currentTime+=r/this._durations[this.currentFrame]}else this._currentTime+=e;this._currentTime<0&&!this.loop?(this.gotoAndStop(0),this.onComplete&&this.onComplete()):this._currentTime>=this._textures.length&&!this.loop?(this.gotoAndStop(this._textures.length-1),this.onComplete&&this.onComplete()):(this._texture=this._textures[this.currentFrame],this._textureID=-1)},i.prototype.destroy=function(){this.stop(),n.Sprite.prototype.destroy.call(this)},i.fromFrames=function(t){for(var e=[],r=0;r<t.length;++r)e.push(n.Texture.fromFrame(t[r]));return new i(e)},i.fromImages=function(t){for(var e=[],r=0;r<t.length;++r)e.push(n.Texture.fromImage(t[r]));return new i(e)}},{"../core":62}],125:[function(t,e,r){function i(t,e,r){n.Sprite.call(this,t),this.tileScale=new n.Point(1,1),this.tilePosition=new n.Point(0,0),this._width=e||100,this._height=r||100,this._uvs=new n.TextureUvs,this._canvasPattern=null,this._glDatas=[]}var n=t("../core"),s=new n.Point,o=t("../core/textures/Texture"),a=t("../core/sprites/canvas/CanvasTinter"),h=t("./webgl/TilingShader"),u=new Float32Array(4);i.prototype=Object.create(n.Sprite.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{width:{get:function(){return this._width},set:function(t){this._width=t}},height:{get:function(){return this._height},set:function(t){this._height=t}}}),i.prototype._onTextureUpdate=function(){},i.prototype._renderWebGL=function(t){var e=this._texture;if(e&&e._uvs){t.flush();var r=t.gl,i=this._glDatas[t.CONTEXT_UID];i||(i={shader:new h(r),quad:new n.Quad(r)},this._glDatas[t.CONTEXT_UID]=i,i.quad.initVao(i.shader));var s=i.quad.vertices;s[0]=s[6]=this._width*-this.anchor.x,s[1]=s[3]=this._height*-this.anchor.y,s[2]=s[4]=this._width*(1-this.anchor.x),s[5]=s[7]=this._height*(1-this.anchor.y),i.quad.upload(),t.bindShader(i.shader);var o=e._uvs,a=e._frame.width,l=e._frame.height,c=e.baseTexture.width,d=e.baseTexture.height,p=i.shader.uniforms.uPixelSize;p[0]=1/c,p[1]=1/d,i.shader.uniforms.uPixelSize=p;var f=i.shader.uniforms.uFrame;f[0]=o.x0,f[1]=o.y0,f[2]=o.x1-o.x0,f[3]=o.y2-o.y0,i.shader.uniforms.uFrame=f;var v=i.shader.uniforms.uTransform;v[0]=this.tilePosition.x%(a*this.tileScale.x)/this._width,v[1]=this.tilePosition.y%(l*this.tileScale.y)/this._height,v[2]=c/this._width*this.tileScale.x,v[3]=d/this._height*this.tileScale.y,i.shader.uniforms.uTransform=v,i.shader.uniforms.translationMatrix=this.worldTransform.toArray(!0);var g=u;n.utils.hex2rgb(this.tint,g),g[3]=this.worldAlpha,i.shader.uniforms.uColor=g,t.bindTexture(this._texture,0),t.state.setBlendMode(this.blendMode),i.quad.draw()}},i.prototype._renderCanvas=function(t){var e=this._texture;if(e.baseTexture.hasLoaded){var r=t.context,i=this.worldTransform,s=t.resolution,o=e.baseTexture,h=this.tilePosition.x/this.tileScale.x%e._frame.width,u=this.tilePosition.y/this.tileScale.y%e._frame.height;if(!this._canvasPattern){var l=new n.CanvasRenderTarget(e._frame.width,e._frame.height);16777215!==this.tint?(this.cachedTint!==this.tint&&(this.cachedTint=this.tint,this.tintedTexture=a.getTintedTexture(this,this.tint)),l.context.drawImage(this.tintedTexture,0,0)):l.context.drawImage(o.source,-e._frame.x,-e._frame.y),this._canvasPattern=l.context.createPattern(l.canvas,"repeat")}r.globalAlpha=this.worldAlpha,r.setTransform(i.a*s,i.b*s,i.c*s,i.d*s,i.tx*s,i.ty*s),r.scale(this.tileScale.x,this.tileScale.y),r.translate(h+this.anchor.x*-this._width,u+this.anchor.y*-this._height);var c=t.blendModes[this.blendMode];c!==t.context.globalCompositeOperation&&(r.globalCompositeOperation=c),r.fillStyle=this._canvasPattern,r.fillRect(-h,-u,this._width/this.tileScale.x,this._height/this.tileScale.y)}},i.prototype.getBounds=function(){var t,e,r,i,n=this._width,s=this._height,o=n*(1-this.anchor.x),a=n*-this.anchor.x,h=s*(1-this.anchor.y),u=s*-this.anchor.y,l=this.worldTransform,c=l.a,d=l.b,p=l.c,f=l.d,v=l.tx,g=l.ty,y=c*a+p*u+v,x=f*u+d*a+g,m=c*o+p*u+v,_=f*u+d*o+g,b=c*o+p*h+v,T=f*h+d*o+g,E=c*a+p*h+v,w=f*h+d*a+g;t=y,t=m<t?m:t,t=b<t?b:t,t=E<t?E:t,r=x,r=_<r?_:r,r=T<r?T:r,r=w<r?w:r,e=y,e=m>e?m:e,e=b>e?b:e,e=E>e?E:e,i=x,i=_>i?_:i,i=T>i?T:i,i=w>i?w:i;var S=this._bounds;return S.x=t,S.width=e-t,S.y=r,S.height=i-r,this._currentBounds=S,S},i.prototype.containsPoint=function(t){this.worldTransform.applyInverse(t,s);var e,r=this._width,i=this._height,n=-r*this.anchor.x;return s.x>n&&s.x<n+r&&(e=-i*this.anchor.y,s.y>e&&s.y<e+i)},i.prototype.destroy=function(){n.Sprite.prototype.destroy.call(this),this.tileScale=null,this._tileScaleOffset=null,this.tilePosition=null,this._uvs=null},i.from=function(t,e,r){return new i(o.from(t),e,r)},i.fromFrame=function(t,e,r){var s=n.utils.TextureCache[t];if(!s)throw new Error('The frameId "'+t+'" does not exist in the texture cache '+this);return new i(s,e,r)},i.fromImage=function(t,e,r,s,o){return new i(n.Texture.fromImage(t,s,o),e,r)}},{"../core":62,"../core/sprites/canvas/CanvasTinter":100,"../core/textures/Texture":109,"./webgl/TilingShader":130}],126:[function(t,e,r){var i=t("../core"),n=i.DisplayObject,s=new i.Matrix;n.prototype._cacheAsBitmap=!1,n.prototype._cacheData=!1;var o=function(){this.originalRenderWebGL=null,this.originalRenderCanvas=null,this.originalCalculateBounds=null,this.originalGetLocalBounds=null,this.originalUpdateTransform=null,this.originalHitTest=null,this.originalDestroy=null,this.originalMask=null,this.originalFilterArea=null,this.sprite=null};Object.defineProperties(n.prototype,{
cacheAsBitmap:{get:function(){return this._cacheAsBitmap},set:function(t){if(this._cacheAsBitmap!==t){this._cacheAsBitmap=t;var e;t?(this._cacheData||(this._cacheData=new o),e=this._cacheData,e.originalRenderWebGL=this.renderWebGL,e.originalRenderCanvas=this.renderCanvas,e.originalUpdateTransform=this.updateTransform,e.originalCalculateBounds=this._calculateBounds,e.originalGetLocalBounds=this.getLocalBounds,e.originalDestroy=this.destroy,e.originalContainsPoint=this.containsPoint,e.originalMask=this._mask,e.originalFilterArea=this.filterArea,this.renderWebGL=this._renderCachedWebGL,this.renderCanvas=this._renderCachedCanvas,this.destroy=this._cacheAsBitmapDestroy):(e=this._cacheData,e.sprite&&this._destroyCachedDisplayObject(),this.renderWebGL=e.originalRenderWebGL,this.renderCanvas=e.originalRenderCanvas,this._calculateBounds=e.originalCalculateBounds,this.getLocalBounds=e.originalGetLocalBounds,this.destroy=e.originalDestroy,this.updateTransform=e.originalUpdateTransform,this.containsPoint=e.originalContainsPoint,this._mask=e.originalMask,this.filterArea=e.originalFilterArea)}}}}),n.prototype._renderCachedWebGL=function(t){!this.visible||this.worldAlpha<=0||!this.renderable||(this._initCachedDisplayObject(t),this._cacheData.sprite._transformID=-1,this._cacheData.sprite.worldAlpha=this.worldAlpha,this._cacheData.sprite._renderWebGL(t))},n.prototype._initCachedDisplayObject=function(t){if(!this._cacheData||!this._cacheData.sprite){var e=this.alpha;this.alpha=1,t.currentRenderer.flush();var r=this.getLocalBounds().clone();if(this._filters){var n=this._filters[0].padding;r.pad(n)}var o=t._activeRenderTarget,a=t.filterManager.filterStack,h=i.RenderTexture.create(0|r.width,0|r.height),u=s;u.tx=-r.x,u.ty=-r.y,this.transform.worldTransform.identity(),this.renderWebGL=this._cacheData.originalRenderWebGL,t.render(this,h,!0,u,!0),t.bindRenderTarget(o),t.filterManager.filterStack=a,this.renderWebGL=this._renderCachedWebGL,this.updateTransform=this.displayObjectUpdateTransform,this._mask=null,this.filterArea=null;var l=new i.Sprite(h);l.transform.worldTransform=this.transform.worldTransform,l.anchor.x=-(r.x/r.width),l.anchor.y=-(r.y/r.height),l.alpha=e,l._bounds=this._bounds,this._calculateBounds=this._calculateCachedBounds,this.getLocalBounds=this._getCachedLocalBounds,this._cacheData.sprite=l,this.transform._parentID=-1,this.updateTransform(),this.containsPoint=l.containsPoint.bind(l)}},n.prototype._renderCachedCanvas=function(t){!this.visible||this.worldAlpha<=0||!this.renderable||(this._initCachedDisplayObjectCanvas(t),this._cacheData.sprite.worldAlpha=this.worldAlpha,this._cacheData.sprite.renderCanvas(t))},n.prototype._initCachedDisplayObjectCanvas=function(t){if(!this._cacheData||!this._cacheData.sprite){var e=this.getLocalBounds(),r=this.alpha;this.alpha=1;var n=t.context,o=new i.RenderTexture.create(0|e.width,0|e.height),a=s;this.transform.worldTransform.copy(a),a.invert(),a.tx-=e.x,a.ty-=e.y,this.renderCanvas=this._cacheData.originalRenderCanvas,t.render(this,o,!0,a,!1),t.context=n,this.renderCanvas=this._renderCachedCanvas,this._calculateBounds=this._calculateCachedBounds,this._mask=null,this.filterArea=null;var h=new i.Sprite(o);h.transform.worldTransform=this.transform.worldTransform,h.anchor.x=-(e.x/e.width),h.anchor.y=-(e.y/e.height),h._bounds=this._bounds,h.alpha=r,this.updateTransform(),this.updateTransform=this.displayObjectUpdateTransform,this._cacheData.sprite=h,this.containsPoint=h.containsPoint.bind(h)}},n.prototype._calculateCachedBounds=function(){return this._cacheData.sprite._calculateBounds()},n.prototype._getCachedLocalBounds=function(){return this._cacheData.sprite.getLocalBounds()},n.prototype._destroyCachedDisplayObject=function(){this._cacheData.sprite._texture.destroy(!0),this._cacheData.sprite=null},n.prototype._cacheAsBitmapDestroy=function(){this.cacheAsBitmap=!1,this.destroy()}},{"../core":62}],127:[function(t,e,r){var i=t("../core");i.DisplayObject.prototype.name=null,i.Container.prototype.getChildByName=function(t){for(var e=0;e<this.children.length;e++)if(this.children[e].name===t)return this.children[e];return null}},{"../core":62}],128:[function(t,e,r){var i=t("../core");i.DisplayObject.prototype.getGlobalPosition=function(t){return t=t||new i.Point,this.parent?(this.displayObjectUpdateTransform(),t.x=this.worldTransform.tx,t.y=this.worldTransform.ty):(t.x=this.position.x,t.y=this.position.y),t}},{"../core":62}],129:[function(t,e,r){t("./cacheAsBitmap"),t("./getChildByName"),t("./getGlobalPosition"),e.exports={MovieClip:t("./MovieClip"),TilingSprite:t("./TilingSprite"),BitmapText:t("./BitmapText")}},{"./BitmapText":123,"./MovieClip":124,"./TilingSprite":125,"./cacheAsBitmap":126,"./getChildByName":127,"./getGlobalPosition":128}],130:[function(t,e,r){function i(t){n.call(this,t,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 translationMatrix;\n\nuniform vec4 uFrame;\nuniform vec4 uTransform;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n    vec2 coord = aTextureCoord;\n    coord -= uTransform.xy;\n    coord /= uTransform.zw;\n    vTextureCoord = coord;\n}\n","#define GLSLIFY 1\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\nuniform vec4 uColor;\nuniform vec4 uFrame;\nuniform vec2 uPixelSize;\n\nvoid main(void)\n{\n\n   \tvec2 coord = mod(vTextureCoord, uFrame.zw);\n   \tcoord = clamp(coord, uPixelSize, uFrame.zw - uPixelSize);\n   \tcoord += uFrame.xy;\n\n   \tvec4 sample = texture2D(uSampler, coord);\n  \tvec4 color = vec4(uColor.rgb * uColor.a, uColor.a);\n\n   \tgl_FragColor = sample * color ;\n}\n")}var n=t("../../core/Shader");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i},{"../../core/Shader":42}],131:[function(t,e,r){function i(t,e,r){n.Filter.call(this),this.blurXFilter=new s,this.blurYFilter=new o,this.resolution=1,this.padding=0,this.resolution=r||1,this.quality=e||4,this.blur=t||8}var n=t("../../core"),s=t("./BlurXFilter"),o=t("./BlurYFilter");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.apply=function(t,e,r){var i=t.getRenderTarget(!0);this.blurXFilter.apply(t,e,i,!0),this.blurYFilter.apply(t,i,r,!1),t.returnRenderTarget(i)},Object.defineProperties(i.prototype,{blur:{get:function(){return this.blurXFilter.blur},set:function(t){this.blurXFilter.blur=this.blurYFilter.blur=t,this.padding=2*Math.max(Math.abs(this.blurYFilter.strength),Math.abs(this.blurYFilter.strength))}},quality:{get:function(){return this.blurXFilter.quality},set:function(t){this.blurXFilter.quality=this.blurYFilter.quality=t}},blurX:{get:function(){return this.blurXFilter.blur},set:function(t){this.blurXFilter.blur=t,this.padding=2*Math.max(Math.abs(this.blurYFilter.strength),Math.abs(this.blurYFilter.strength))}},blurY:{get:function(){return this.blurYFilter.blur},set:function(t){this.blurYFilter.blur=t,this.padding=2*Math.max(Math.abs(this.blurYFilter.strength),Math.abs(this.blurYFilter.strength))}}})},{"../../core":62,"./BlurXFilter":132,"./BlurYFilter":133}],132:[function(t,e,r){function i(t,e,r){var i=s(5,!0),a=o(5);n.Filter.call(this,i,a),this.resolution=r||1,this._quality=0,this.quality=e||4,this.strength=t||8,this.firstRun=!0}var n=t("../../core"),s=t("./generateBlurVertSource"),o=t("./generateBlurFragSource"),a=t("./getMaxBlurKernelSize");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.apply=function(t,e,r,i){if(this.firstRun){var n=t.renderer.gl,h=a(n);this.vertexSrc=s(h,!0),this.fragmentSrc=o(h),this.firstRun=!1}if(this.uniforms.strength=1/r.size.width*(r.size.width/e.size.width),this.uniforms.strength*=this.strength,this.uniforms.strength/=this.passes,1===this.passes)t.applyFilter(this,e,r,i);else{for(var u=t.getRenderTarget(!0),l=e,c=u,d=0;d<this.passes-1;d++){t.applyFilter(this,l,c,!0);var p=c;c=l,l=p}t.applyFilter(this,l,r,i),t.returnRenderTarget(u)}},Object.defineProperties(i.prototype,{blur:{get:function(){return this.strength},set:function(t){this.padding=2*Math.abs(t),this.strength=t}},quality:{get:function(){return this._quality},set:function(t){this._quality=t,this.passes=t}}})},{"../../core":62,"./generateBlurFragSource":134,"./generateBlurVertSource":135,"./getMaxBlurKernelSize":136}],133:[function(t,e,r){function i(t,e,r){var i=s(5,!1),a=o(5);n.Filter.call(this,i,a),this.resolution=r||1,this._quality=0,this.quality=e||4,this.strength=t||8,this.firstRun=!0}var n=t("../../core"),s=t("./generateBlurVertSource"),o=t("./generateBlurFragSource"),a=t("./getMaxBlurKernelSize");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.apply=function(t,e,r,i){if(this.firstRun){var n=t.renderer.gl,h=a(n);this.vertexSrc=s(h,!1),this.fragmentSrc=o(h),this.firstRun=!1}if(this.uniforms.strength=1/r.size.height*(r.size.height/e.size.height),this.uniforms.strength*=this.strength,this.uniforms.strength/=this.passes,1===this.passes)t.applyFilter(this,e,r,i);else{for(var u=t.getRenderTarget(!0),l=e,c=u,d=0;d<this.passes-1;d++){t.applyFilter(this,l,c,!0);var p=c;c=l,l=p}t.applyFilter(this,l,r,i),t.returnRenderTarget(u)}},Object.defineProperties(i.prototype,{blur:{get:function(){return this.strength},set:function(t){this.padding=2*Math.abs(t),this.strength=t}},quality:{get:function(){return this._quality},set:function(t){this._quality=t,this.passes=t}}})},{"../../core":62,"./generateBlurFragSource":134,"./generateBlurVertSource":135,"./getMaxBlurKernelSize":136}],134:[function(t,e,r){var i={5:[.153388,.221461,.250301],7:[.071303,.131514,.189879,.214607],9:[.028532,.067234,.124009,.179044,.20236],11:[.0093,.028002,.065984,.121703,.175713,.198596],13:[.002406,.009255,.027867,.065666,.121117,.174868,.197641],15:[489e-6,.002403,.009246,.02784,.065602,.120999,.174697,.197448]},n=["varying vec2 vBlurTexCoords[%size%];","uniform sampler2D uSampler;","void main(void)","{","\tgl_FragColor = vec4(0.0);","\t%blur%","}"].join("\n"),s=function(t){for(var e,r=i[t],s=r.length,o=n,a="",h="gl_FragColor += texture2D(uSampler, vBlurTexCoords[%index%]) * %value%;",u=0;u<t;u++){var l=h.replace("%index%",u);e=u,u>=s&&(e=t-u-1),l=l.replace("%value%",r[e]),a+=l,a+="\n"}return o=o.replace("%blur%",a),o=o.replace("%size%",t)};e.exports=s},{}],135:[function(t,e,r){var i=["attribute vec2 aVertexPosition;","attribute vec2 aTextureCoord;","uniform float strength;","uniform mat3 projectionMatrix;","varying vec2 vBlurTexCoords[%size%];","void main(void)","{","gl_Position = vec4((projectionMatrix * vec3((aVertexPosition), 1.0)).xy, 0.0, 1.0);","%blur%","}"].join("\n"),n=function(t,e){var r,n,s=Math.ceil(t/2),o=i,a="";r=e?"vBlurTexCoords[%index%] = aTextureCoord + vec2(%sampleIndex% * strength, 0.0);":"vBlurTexCoords[%index%] = aTextureCoord + vec2(0.0, %sampleIndex% * strength);";for(var h=0;h<t;h++){var u=r.replace("%index%",h);n=h,h>=s&&(n=t-h-1),u=u.replace("%sampleIndex%",h-(s-1)+".0"),a+=u,a+="\n"}return o=o.replace("%blur%",a),o=o.replace("%size%",t)};e.exports=n},{}],136:[function(t,e,r){var i=function(t){for(var e=t.getParameter(t.MAX_VARYING_VECTORS),r=15;r>e;)r-=2;return r};e.exports=i},{}],137:[function(t,e,r){function i(){n.Filter.call(this,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}","#define GLSLIFY 1\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform float m[20];\n\nvoid main(void)\n{\n\n    vec4 c = texture2D(uSampler, vTextureCoord);\n\n    gl_FragColor.r = (m[0] * c.r);\n        gl_FragColor.r += (m[1] * c.g);\n        gl_FragColor.r += (m[2] * c.b);\n        gl_FragColor.r += (m[3] * c.a);\n        gl_FragColor.r += m[4] * c.a;\n\n    gl_FragColor.g = (m[5] * c.r);\n        gl_FragColor.g += (m[6] * c.g);\n        gl_FragColor.g += (m[7] * c.b);\n        gl_FragColor.g += (m[8] * c.a);\n        gl_FragColor.g += m[9] * c.a;\n\n     gl_FragColor.b = (m[10] * c.r);\n        gl_FragColor.b += (m[11] * c.g);\n        gl_FragColor.b += (m[12] * c.b);\n        gl_FragColor.b += (m[13] * c.a);\n        gl_FragColor.b += m[14] * c.a;\n\n     gl_FragColor.a = (m[15] * c.r);\n        gl_FragColor.a += (m[16] * c.g);\n        gl_FragColor.a += (m[17] * c.b);\n        gl_FragColor.a += (m[18] * c.a);\n        gl_FragColor.a += m[19] * c.a;\n\n//    gl_FragColor = vec4(m[0]);\n}\n"),this.uniforms.m=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0]}var n=t("../../core");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i,i.prototype._loadMatrix=function(t,e){e=!!e;var r=t;e&&(this._multiply(r,this.uniforms.m,t),r=this._colorMatrix(r)),this.uniforms.m=r},i.prototype._multiply=function(t,e,r){return t[0]=e[0]*r[0]+e[1]*r[5]+e[2]*r[10]+e[3]*r[15],t[1]=e[0]*r[1]+e[1]*r[6]+e[2]*r[11]+e[3]*r[16],t[2]=e[0]*r[2]+e[1]*r[7]+e[2]*r[12]+e[3]*r[17],t[3]=e[0]*r[3]+e[1]*r[8]+e[2]*r[13]+e[3]*r[18],t[4]=e[0]*r[4]+e[1]*r[9]+e[2]*r[14]+e[3]*r[19],t[5]=e[5]*r[0]+e[6]*r[5]+e[7]*r[10]+e[8]*r[15],t[6]=e[5]*r[1]+e[6]*r[6]+e[7]*r[11]+e[8]*r[16],t[7]=e[5]*r[2]+e[6]*r[7]+e[7]*r[12]+e[8]*r[17],t[8]=e[5]*r[3]+e[6]*r[8]+e[7]*r[13]+e[8]*r[18],t[9]=e[5]*r[4]+e[6]*r[9]+e[7]*r[14]+e[8]*r[19],t[10]=e[10]*r[0]+e[11]*r[5]+e[12]*r[10]+e[13]*r[15],t[11]=e[10]*r[1]+e[11]*r[6]+e[12]*r[11]+e[13]*r[16],t[12]=e[10]*r[2]+e[11]*r[7]+e[12]*r[12]+e[13]*r[17],t[13]=e[10]*r[3]+e[11]*r[8]+e[12]*r[13]+e[13]*r[18],t[14]=e[10]*r[4]+e[11]*r[9]+e[12]*r[14]+e[13]*r[19],t[15]=e[15]*r[0]+e[16]*r[5]+e[17]*r[10]+e[18]*r[15],t[16]=e[15]*r[1]+e[16]*r[6]+e[17]*r[11]+e[18]*r[16],t[17]=e[15]*r[2]+e[16]*r[7]+e[17]*r[12]+e[18]*r[17],t[18]=e[15]*r[3]+e[16]*r[8]+e[17]*r[13]+e[18]*r[18],t[19]=e[15]*r[4]+e[16]*r[9]+e[17]*r[14]+e[18]*r[19],t},i.prototype._colorMatrix=function(t){var e=new Float32Array(t);return e[4]/=255,e[9]/=255,e[14]/=255,e[19]/=255,e},i.prototype.brightness=function(t,e){var r=[t,0,0,0,0,0,t,0,0,0,0,0,t,0,0,0,0,0,1,0];this._loadMatrix(r,e)},i.prototype.greyscale=function(t,e){var r=[t,t,t,0,0,t,t,t,0,0,t,t,t,0,0,0,0,0,1,0];this._loadMatrix(r,e)},i.prototype.grayscale=i.prototype.greyscale,i.prototype.blackAndWhite=function(t){var e=[.3,.6,.1,0,0,.3,.6,.1,0,0,.3,.6,.1,0,0,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.hue=function(t,e){t=(t||0)/180*Math.PI;var r=Math.cos(t),i=Math.sin(t),n=Math.sqrt,s=1/3,o=n(s),a=r+(1-r)*s,h=s*(1-r)-o*i,u=s*(1-r)+o*i,l=s*(1-r)+o*i,c=r+s*(1-r),d=s*(1-r)-o*i,p=s*(1-r)-o*i,f=s*(1-r)+o*i,v=r+s*(1-r),g=[a,h,u,0,0,l,c,d,0,0,p,f,v,0,0,0,0,0,1,0];this._loadMatrix(g,e)},i.prototype.contrast=function(t,e){var r=(t||0)+1,i=-128*(r-1),n=[r,0,0,0,i,0,r,0,0,i,0,0,r,0,i,0,0,0,1,0];this._loadMatrix(n,e)},i.prototype.saturate=function(t,e){var r=2*(t||0)/3+1,i=(r-1)*-.5,n=[r,i,i,0,0,i,r,i,0,0,i,i,r,0,0,0,0,0,1,0];this._loadMatrix(n,e)},i.prototype.desaturate=function(){this.saturate(-1)},i.prototype.negative=function(t){var e=[0,1,1,0,0,1,0,1,0,0,1,1,0,0,0,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.sepia=function(t){var e=[.393,.7689999,.18899999,0,0,.349,.6859999,.16799999,0,0,.272,.5339999,.13099999,0,0,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.technicolor=function(t){var e=[1.9125277891456083,-.8545344976951645,-.09155508482755585,0,11.793603434377337,-.3087833385928097,1.7658908555458428,-.10601743074722245,0,-70.35205161461398,-.231103377548616,-.7501899197440212,1.847597816108189,0,30.950940869491138,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.polaroid=function(t){var e=[1.438,-.062,-.062,0,0,-.122,1.378,-.122,0,0,-.016,-.016,1.483,0,0,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.toBGR=function(t){var e=[0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.kodachrome=function(t){var e=[1.1285582396593525,-.3967382283601348,-.03992559172921793,0,63.72958762196502,-.16404339962244616,1.0835251566291304,-.05498805115633132,0,24.732407896706203,-.16786010706155763,-.5603416277695248,1.6014850761964943,0,35.62982807460946,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.browni=function(t){var e=[.5997023498159715,.34553243048391263,-.2708298674538042,0,47.43192855600873,-.037703249837783157,.8609577587992641,.15059552388459913,0,-36.96841498319127,.24113635128153335,-.07441037908422492,.44972182064877153,0,-7.562075277591283,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.vintage=function(t){var e=[.6279345635605994,.3202183420819367,-.03965408211312453,0,9.651285835294123,.02578397704808868,.6441188644374771,.03259127616149294,0,7.462829176470591,.0466055556782719,-.0851232987247891,.5241648018700465,0,5.159190588235296,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.colorTone=function(t,e,r,i,n){t=t||.2,e=e||.15,r=r||16770432,i=i||3375104;var s=(r>>16&255)/255,o=(r>>8&255)/255,a=(255&r)/255,h=(i>>16&255)/255,u=(i>>8&255)/255,l=(255&i)/255,c=[.3,.59,.11,0,0,s,o,a,t,0,h,u,l,e,0,s-h,o-u,a-l,0,0];this._loadMatrix(c,n)},i.prototype.night=function(t,e){t=t||.1;var r=[t*-2,-t,0,0,0,-t,0,t,0,0,0,t,2*t,0,0,0,0,0,1,0];this._loadMatrix(r,e)},i.prototype.predator=function(t,e){var r=[11.224130630493164*t,-4.794486999511719*t,-2.8746118545532227*t,0*t,.40342438220977783*t,-3.6330697536468506*t,9.193157196044922*t,-2.951810836791992*t,0*t,-1.316135048866272*t,-3.2184197902679443*t,-4.2375030517578125*t,7.476448059082031*t,0*t,.8044459223747253*t,0,0,0,1,0];this._loadMatrix(r,e)},i.prototype.lsd=function(t){var e=[2,-.4,.5,0,0,-.5,2,-.4,0,0,-.4,-.5,3,0,0,0,0,0,1,0];this._loadMatrix(e,t)},i.prototype.reset=function(){var t=[1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0];this._loadMatrix(t,!1)},Object.defineProperties(i.prototype,{matrix:{get:function(){return this.uniforms.m},set:function(t){this.uniforms.m=t}}})},{"../../core":62}],138:[function(t,e,r){function i(t,e){var r=new n.Matrix;t.renderable=!1,n.Filter.call(this,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\nuniform mat3 filterMatrix;\n\nvarying vec2 vTextureCoord;\nvarying vec2 vFilterCoord;\n\nvoid main(void)\n{\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n   vFilterCoord = ( filterMatrix * vec3( aTextureCoord, 1.0)  ).xy;\n   vTextureCoord = aTextureCoord;\n}","#define GLSLIFY 1\nvarying vec2 vFilterCoord;\nvarying vec2 vTextureCoord;\n\nuniform vec2 scale;\n\nuniform sampler2D uSampler;\nuniform sampler2D mapSampler;\n\nuniform vec4 filterClamp;\n\nvoid main(void)\n{\n   vec4 map =  texture2D(mapSampler, vFilterCoord);\n\n   map -= 0.5;\n   map.xy *= scale;\n\n   gl_FragColor = texture2D(uSampler, clamp(vec2(vTextureCoord.x + map.x, vTextureCoord.y + map.y), filterClamp.xy, filterClamp.zw));\n}\n"),this.maskSprite=t,this.maskMatrix=r,this.uniforms.mapSampler=t.texture,this.uniforms.filterMatrix=r.toArray(!0),this.uniforms.scale={x:1,y:1},null!==e&&void 0!==e||(e=20),this.scale=new n.Point(e,e)}var n=t("../../core");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.apply=function(t,e,r){var i=1/r.destinationFrame.width*(r.size.width/e.size.width);this.uniforms.filterMatrix=t.calculateSpriteMatrix(this.maskMatrix,this.maskSprite),this.uniforms.scale.x=this.scale.x*i,this.uniforms.scale.y=this.scale.y*i,t.applyFilter(this,e,r)},Object.defineProperties(i.prototype,{map:{get:function(){return this.uniforms.mapSampler},set:function(t){this.uniforms.mapSampler=t}}})},{"../../core":62}],139:[function(t,e,r){function i(){n.Filter.call(this,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nuniform vec4 filterArea;\n\nvarying vec2 vTextureCoord;\n\nvec2 mapCoord( vec2 coord )\n{\n    coord *= filterArea.xy;\n    coord += filterArea.zw;\n\n    return coord;\n}\n\nvec2 unmapCoord( vec2 coord )\n{\n    coord -= filterArea.zw;\n    coord /= filterArea.xy;\n\n    return coord;\n}\n\nvoid texcoords(vec2 fragCoord, vec2 resolution,\n               out vec2 v_rgbNW, out vec2 v_rgbNE,\n               out vec2 v_rgbSW, out vec2 v_rgbSE,\n               out vec2 v_rgbM) {\n    vec2 inverseVP = 1.0 / resolution.xy;\n    v_rgbNW = (fragCoord + vec2(-1.0, -1.0)) * inverseVP;\n    v_rgbNE = (fragCoord + vec2(1.0, -1.0)) * inverseVP;\n    v_rgbSW = (fragCoord + vec2(-1.0, 1.0)) * inverseVP;\n    v_rgbSE = (fragCoord + vec2(1.0, 1.0)) * inverseVP;\n    v_rgbM = vec2(fragCoord * inverseVP);\n}\n\nvoid main(void) {\n\n   gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n\n   vTextureCoord = aTextureCoord;\n\n   vec2 fragCoord = vTextureCoord * filterArea.xy;\n\n   texcoords(fragCoord, filterArea.xy, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n}",'#define GLSLIFY 1\nvarying vec2 v_rgbNW;\nvarying vec2 v_rgbNE;\nvarying vec2 v_rgbSW;\nvarying vec2 v_rgbSE;\nvarying vec2 v_rgbM;\n\nvarying vec2 vTextureCoord;\nuniform sampler2D uSampler;\nuniform vec4 filterArea;\n\n/**\n Basic FXAA implementation based on the code on geeks3d.com with the\n modification that the texture2DLod stuff was removed since it\'s\n unsupported by WebGL.\n \n --\n \n From:\n https://github.com/mitsuhiko/webgl-meincraft\n \n Copyright (c) 2011 by Armin Ronacher.\n \n Some rights reserved.\n \n Redistribution and use in source and binary forms, with or without\n modification, are permitted provided that the following conditions are\n met:\n \n * Redistributions of source code must retain the above copyright\n notice, this list of conditions and the following disclaimer.\n \n * Redistributions in binary form must reproduce the above\n copyright notice, this list of conditions and the following\n disclaimer in the documentation and/or other materials provided\n with the distribution.\n \n * The names of the contributors may not be used to endorse or\n promote products derived from this software without specific\n prior written permission.\n \n THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS\n "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT\n LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR\n A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT\n OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,\n SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT\n LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,\n DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY\n THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT\n (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE\n OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.\n */\n\n#ifndef FXAA_REDUCE_MIN\n#define FXAA_REDUCE_MIN   (1.0/ 128.0)\n#endif\n#ifndef FXAA_REDUCE_MUL\n#define FXAA_REDUCE_MUL   (1.0 / 8.0)\n#endif\n#ifndef FXAA_SPAN_MAX\n#define FXAA_SPAN_MAX     8.0\n#endif\n\n//optimized version for mobile, where dependent\n//texture reads can be a bottleneck\nvec4 fxaa(sampler2D tex, vec2 fragCoord, vec2 resolution,\n          vec2 v_rgbNW, vec2 v_rgbNE,\n          vec2 v_rgbSW, vec2 v_rgbSE,\n          vec2 v_rgbM) {\n    vec4 color;\n    mediump vec2 inverseVP = vec2(1.0 / resolution.x, 1.0 / resolution.y);\n    vec3 rgbNW = texture2D(tex, v_rgbNW).xyz;\n    vec3 rgbNE = texture2D(tex, v_rgbNE).xyz;\n    vec3 rgbSW = texture2D(tex, v_rgbSW).xyz;\n    vec3 rgbSE = texture2D(tex, v_rgbSE).xyz;\n    vec4 texColor = texture2D(tex, v_rgbM);\n    vec3 rgbM  = texColor.xyz;\n    vec3 luma = vec3(0.299, 0.587, 0.114);\n    float lumaNW = dot(rgbNW, luma);\n    float lumaNE = dot(rgbNE, luma);\n    float lumaSW = dot(rgbSW, luma);\n    float lumaSE = dot(rgbSE, luma);\n    float lumaM  = dot(rgbM,  luma);\n    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));\n    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));\n    \n    mediump vec2 dir;\n    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));\n    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));\n    \n    float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) *\n                          (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);\n    \n    float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);\n    dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX),\n              max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),\n                  dir * rcpDirMin)) * inverseVP;\n    \n    vec3 rgbA = 0.5 * (\n                       texture2D(tex, fragCoord * inverseVP + dir * (1.0 / 3.0 - 0.5)).xyz +\n                       texture2D(tex, fragCoord * inverseVP + dir * (2.0 / 3.0 - 0.5)).xyz);\n    vec3 rgbB = rgbA * 0.5 + 0.25 * (\n                                     texture2D(tex, fragCoord * inverseVP + dir * -0.5).xyz +\n                                     texture2D(tex, fragCoord * inverseVP + dir * 0.5).xyz);\n    \n    float lumaB = dot(rgbB, luma);\n    if ((lumaB < lumaMin) || (lumaB > lumaMax))\n        color = vec4(rgbA, texColor.a);\n    else\n        color = vec4(rgbB, texColor.a);\n    return color;\n}\n\nvoid main() {\n\n  \tvec2 fragCoord = vTextureCoord * filterArea.xy;\n\n  \tvec4 color;\n\n    color = fxaa(uSampler, fragCoord, filterArea.xy, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);\n\n  \tgl_FragColor = color;\n}\n')}var n=t("../../core");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i},{"../../core":62}],140:[function(t,e,r){e.exports={FXAAFilter:t("./fxaa/FXAAFilter"),NoiseFilter:t("./noise/NoiseFilter"),DisplacementFilter:t("./displacement/DisplacementFilter"),BlurFilter:t("./blur/BlurFilter"),BlurXFilter:t("./blur/BlurXFilter"),BlurYFilter:t("./blur/BlurYFilter"),ColorMatrixFilter:t("./colormatrix/ColorMatrixFilter"),VoidFilter:t("./void/VoidFilter")}},{"./blur/BlurFilter":131,"./blur/BlurXFilter":132,"./blur/BlurYFilter":133,"./colormatrix/ColorMatrixFilter":137,"./displacement/DisplacementFilter":138,"./fxaa/FXAAFilter":139,"./noise/NoiseFilter":141,"./void/VoidFilter":142}],141:[function(t,e,r){function i(){n.Filter.call(this,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}","precision highp float;\n#define GLSLIFY 1\n\nvarying vec2 vTextureCoord;\nvarying vec4 vColor;\n\nuniform float noise;\nuniform sampler2D uSampler;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture2D(uSampler, vTextureCoord);\n\n    float diff = (rand(gl_FragCoord.xy) - 0.5) * noise;\n\n    color.r += diff;\n    color.g += diff;\n    color.b += diff;\n\n    gl_FragColor = color;\n}\n"),this.noise=.5}var n=t("../../core");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{noise:{get:function(){return this.uniforms.noise},set:function(t){this.uniforms.noise=t}}})},{"../../core":62}],142:[function(t,e,r){function i(){n.Filter.call(this,"#define GLSLIFY 1\nattribute vec2 aVertexPosition;\nattribute vec2 aTextureCoord;\n\nuniform mat3 projectionMatrix;\n\nvarying vec2 vTextureCoord;\n\nvoid main(void)\n{\n    gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);\n    vTextureCoord = aTextureCoord;\n}","#define GLSLIFY 1\nvarying vec2 vTextureCoord;\n\nuniform sampler2D uSampler;\n\nvoid main(void)\n{\n   gl_FragColor = texture2D(uSampler, vTextureCoord);\n}\n"),this.glShaderKey="void"}var n=t("../../core");i.prototype=Object.create(n.Filter.prototype),i.prototype.constructor=i,e.exports=i},{"../../core":62}],143:[function(t,e,r){function i(){this.global=new n.Point,this.target=null,this.originalEvent=null}var n=t("../core");i.prototype.constructor=i,e.exports=i,i.prototype.getLocalPosition=function(t,e,r){return t.worldTransform.applyInverse(r||this.global,e)}},{"../core":62}],144:[function(t,e,r){function i(t,e){o.call(this),e=e||{},this.renderer=t,this.autoPreventDefault=void 0===e.autoPreventDefault||e.autoPreventDefault,this.interactionFrequency=e.interactionFrequency||10,this.mouse=new s,this.mouse.global.set(-999999),this.eventData={stopped:!1,target:null,type:null,data:this.mouse,stopPropagation:function(){this.stopped=!0}},this.interactiveDataPool=[],this.interactionDOMElement=null,this.moveWhenInside=!1,this.eventsAdded=!1,this.onMouseUp=this.onMouseUp.bind(this),this.processMouseUp=this.processMouseUp.bind(this),this.onMouseDown=this.onMouseDown.bind(this),this.processMouseDown=this.processMouseDown.bind(this),this.onMouseMove=this.onMouseMove.bind(this),this.processMouseMove=this.processMouseMove.bind(this),this.onMouseOut=this.onMouseOut.bind(this),this.processMouseOverOut=this.processMouseOverOut.bind(this),this.onMouseOver=this.onMouseOver.bind(this),this.onTouchStart=this.onTouchStart.bind(this),this.processTouchStart=this.processTouchStart.bind(this),this.onTouchEnd=this.onTouchEnd.bind(this),this.processTouchEnd=this.processTouchEnd.bind(this),this.onTouchMove=this.onTouchMove.bind(this),this.processTouchMove=this.processTouchMove.bind(this),this.defaultCursorStyle="inherit",this.currentCursorStyle="inherit",this._tempPoint=new n.Point,this.resolution=1,this.setTargetElement(this.renderer.view,this.renderer.resolution)}var n=t("../core"),s=t("./InteractionData"),o=t("eventemitter3");Object.assign(n.DisplayObject.prototype,t("./interactiveTarget")),i.prototype=Object.create(o.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.setTargetElement=function(t,e){this.removeEvents(),this.interactionDOMElement=t,this.resolution=e||1,this.addEvents()},i.prototype.addEvents=function(){this.interactionDOMElement&&(n.ticker.shared.add(this.update,this),window.navigator.msPointerEnabled&&(this.interactionDOMElement.style["-ms-content-zooming"]="none",this.interactionDOMElement.style["-ms-touch-action"]="none"),window.document.addEventListener("mousemove",this.onMouseMove,!0),this.interactionDOMElement.addEventListener("mousedown",this.onMouseDown,!0),this.interactionDOMElement.addEventListener("mouseout",this.onMouseOut,!0),this.interactionDOMElement.addEventListener("mouseover",this.onMouseOver,!0),this.interactionDOMElement.addEventListener("touchstart",this.onTouchStart,!0),this.interactionDOMElement.addEventListener("touchend",this.onTouchEnd,!0),this.interactionDOMElement.addEventListener("touchmove",this.onTouchMove,!0),window.addEventListener("mouseup",this.onMouseUp,!0),this.eventsAdded=!0)},i.prototype.removeEvents=function(){this.interactionDOMElement&&(n.ticker.shared.remove(this.update),window.navigator.msPointerEnabled&&(this.interactionDOMElement.style["-ms-content-zooming"]="",this.interactionDOMElement.style["-ms-touch-action"]=""),window.document.removeEventListener("mousemove",this.onMouseMove,!0),this.interactionDOMElement.removeEventListener("mousedown",this.onMouseDown,!0),this.interactionDOMElement.removeEventListener("mouseout",this.onMouseOut,!0),this.interactionDOMElement.removeEventListener("mouseover",this.onMouseOver,!0),this.interactionDOMElement.removeEventListener("touchstart",this.onTouchStart,!0),this.interactionDOMElement.removeEventListener("touchend",this.onTouchEnd,!0),this.interactionDOMElement.removeEventListener("touchmove",this.onTouchMove,!0),this.interactionDOMElement=null,window.removeEventListener("mouseup",this.onMouseUp,!0),this.eventsAdded=!1)},i.prototype.update=function(t){if(this._deltaTime+=t,!(this._deltaTime<this.interactionFrequency)&&(this._deltaTime=0,this.interactionDOMElement)){if(this.didMove)return void(this.didMove=!1);this.cursor=this.defaultCursorStyle,
this.processInteractive(this.mouse.global,this.renderer._lastObjectRendered,this.processMouseOverOut,!0),this.currentCursorStyle!==this.cursor&&(this.currentCursorStyle=this.cursor,this.interactionDOMElement.style.cursor=this.cursor)}},i.prototype.dispatchEvent=function(t,e,r){r.stopped||(r.target=t,r.type=e,t.emit(e,r),t[e]&&t[e](r))},i.prototype.mapPositionToPoint=function(t,e,r){var i;i=this.interactionDOMElement.parentElement?this.interactionDOMElement.getBoundingClientRect():{x:0,y:0,width:0,height:0},t.x=(e-i.left)*(this.interactionDOMElement.width/i.width)/this.resolution,t.y=(r-i.top)*(this.interactionDOMElement.height/i.height)/this.resolution},i.prototype.processInteractive=function(t,e,r,i,n){if(!e||!e.visible)return!1;var s=!1,o=n=e.interactive||n;if(e.hitArea&&(o=!1),i&&e._mask&&(e._mask.containsPoint(t)||(i=!1)),i&&e.filterArea&&(e.filterArea.contains(t.x,t.y)||(i=!1)),e.interactiveChildren)for(var a=e.children,h=a.length-1;h>=0;h--){var u=a[h];if(this.processInteractive(t,u,r,i,o)){if(!u.parent)continue;s=!0,o=!1,i=!1}}return n&&(i&&!s&&(e.hitArea?(e.worldTransform.applyInverse(t,this._tempPoint),s=e.hitArea.contains(this._tempPoint.x,this._tempPoint.y)):e.containsPoint&&(s=e.containsPoint(t))),e.interactive&&r(e,s)),s},i.prototype.onMouseDown=function(t){this.mouse.originalEvent=t,this.eventData.data=this.mouse,this.eventData.stopped=!1,this.mapPositionToPoint(this.mouse.global,t.clientX,t.clientY),this.autoPreventDefault&&this.mouse.originalEvent.preventDefault(),this.processInteractive(this.mouse.global,this.renderer._lastObjectRendered,this.processMouseDown,!0);var e=2===t.button||3===t.which;this.emit(e?"rightdown":"mousedown",this.eventData)},i.prototype.processMouseDown=function(t,e){var r=this.mouse.originalEvent,i=2===r.button||3===r.which;e&&(t[i?"_isRightDown":"_isLeftDown"]=!0,this.dispatchEvent(t,i?"rightdown":"mousedown",this.eventData))},i.prototype.onMouseUp=function(t){this.mouse.originalEvent=t,this.eventData.data=this.mouse,this.eventData.stopped=!1,this.mapPositionToPoint(this.mouse.global,t.clientX,t.clientY),this.processInteractive(this.mouse.global,this.renderer._lastObjectRendered,this.processMouseUp,!0);var e=2===t.button||3===t.which;this.emit(e?"rightup":"mouseup",this.eventData)},i.prototype.processMouseUp=function(t,e){var r=this.mouse.originalEvent,i=2===r.button||3===r.which,n=i?"_isRightDown":"_isLeftDown";e?(this.dispatchEvent(t,i?"rightup":"mouseup",this.eventData),t[n]&&(t[n]=!1,this.dispatchEvent(t,i?"rightclick":"click",this.eventData))):t[n]&&(t[n]=!1,this.dispatchEvent(t,i?"rightupoutside":"mouseupoutside",this.eventData))},i.prototype.onMouseMove=function(t){this.mouse.originalEvent=t,this.eventData.data=this.mouse,this.eventData.stopped=!1,this.mapPositionToPoint(this.mouse.global,t.clientX,t.clientY),this.didMove=!0,this.cursor=this.defaultCursorStyle,this.processInteractive(this.mouse.global,this.renderer._lastObjectRendered,this.processMouseMove,!0),this.emit("mousemove",this.eventData),this.currentCursorStyle!==this.cursor&&(this.currentCursorStyle=this.cursor,this.interactionDOMElement.style.cursor=this.cursor)},i.prototype.processMouseMove=function(t,e){this.processMouseOverOut(t,e),this.moveWhenInside&&!e||this.dispatchEvent(t,"mousemove",this.eventData)},i.prototype.onMouseOut=function(t){this.mouse.originalEvent=t,this.eventData.data=this.mouse,this.eventData.stopped=!1,this.mapPositionToPoint(this.mouse.global,t.clientX,t.clientY),this.interactionDOMElement.style.cursor=this.defaultCursorStyle,this.mapPositionToPoint(this.mouse.global,t.clientX,t.clientY),this.processInteractive(this.mouse.global,this.renderer._lastObjectRendered,this.processMouseOverOut,!1),this.emit("mouseout",this.eventData)},i.prototype.processMouseOverOut=function(t,e){e?(t._over||(t._over=!0,this.dispatchEvent(t,"mouseover",this.eventData)),t.buttonMode&&(this.cursor=t.defaultCursor)):t._over&&(t._over=!1,this.dispatchEvent(t,"mouseout",this.eventData))},i.prototype.onMouseOver=function(t){this.mouse.originalEvent=t,this.eventData.data=this.mouse,this.eventData.stopped=!1,this.emit("mouseover",this.eventData)},i.prototype.onTouchStart=function(t){this.autoPreventDefault&&t.preventDefault();for(var e=t.changedTouches,r=e.length,i=0;i<r;i++){var n=e[i],s=this.getTouchData(n);s.originalEvent=t,this.eventData.data=s,this.eventData.stopped=!1,this.processInteractive(s.global,this.renderer._lastObjectRendered,this.processTouchStart,!0),this.emit("touchstart",this.eventData),this.returnTouchData(s)}},i.prototype.processTouchStart=function(t,e){e&&(t._touchDown=!0,this.dispatchEvent(t,"touchstart",this.eventData))},i.prototype.onTouchEnd=function(t){this.autoPreventDefault&&t.preventDefault();for(var e=t.changedTouches,r=e.length,i=0;i<r;i++){var n=e[i],s=this.getTouchData(n);s.originalEvent=t,this.eventData.data=s,this.eventData.stopped=!1,this.processInteractive(s.global,this.renderer._lastObjectRendered,this.processTouchEnd,!0),this.emit("touchend",this.eventData),this.returnTouchData(s)}},i.prototype.processTouchEnd=function(t,e){e?(this.dispatchEvent(t,"touchend",this.eventData),t._touchDown&&(t._touchDown=!1,this.dispatchEvent(t,"tap",this.eventData))):t._touchDown&&(t._touchDown=!1,this.dispatchEvent(t,"touchendoutside",this.eventData))},i.prototype.onTouchMove=function(t){this.autoPreventDefault&&t.preventDefault();for(var e=t.changedTouches,r=e.length,i=0;i<r;i++){var n=e[i],s=this.getTouchData(n);s.originalEvent=t,this.eventData.data=s,this.eventData.stopped=!1,this.processInteractive(s.global,this.renderer._lastObjectRendered,this.processTouchMove,this.moveWhenInside),this.emit("touchmove",this.eventData),this.returnTouchData(s)}},i.prototype.processTouchMove=function(t,e){this.moveWhenInside&&!e||this.dispatchEvent(t,"touchmove",this.eventData)},i.prototype.getTouchData=function(t){var e=this.interactiveDataPool.pop();return e||(e=new s),e.identifier=t.identifier,this.mapPositionToPoint(e.global,t.clientX,t.clientY),navigator.isCocoonJS&&(e.global.x=e.global.x/this.resolution,e.global.y=e.global.y/this.resolution),t.globalX=e.global.x,t.globalY=e.global.y,e},i.prototype.returnTouchData=function(t){this.interactiveDataPool.push(t)},i.prototype.destroy=function(){this.removeEvents(),this.removeAllListeners(),this.renderer=null,this.mouse=null,this.eventData=null,this.interactiveDataPool=null,this.interactionDOMElement=null,this.onMouseUp=null,this.processMouseUp=null,this.onMouseDown=null,this.processMouseDown=null,this.onMouseMove=null,this.processMouseMove=null,this.onMouseOut=null,this.processMouseOverOut=null,this.onMouseOver=null,this.onTouchStart=null,this.processTouchStart=null,this.onTouchEnd=null,this.processTouchEnd=null,this.onTouchMove=null,this.processTouchMove=null,this._tempPoint=null},n.WebGLRenderer.registerPlugin("interaction",i),n.CanvasRenderer.registerPlugin("interaction",i)},{"../core":62,"./InteractionData":143,"./interactiveTarget":146,eventemitter3:3}],145:[function(t,e,r){e.exports={InteractionData:t("./InteractionData"),InteractionManager:t("./InteractionManager"),interactiveTarget:t("./interactiveTarget")}},{"./InteractionData":143,"./InteractionManager":144,"./interactiveTarget":146}],146:[function(t,e,r){var i={interactive:!1,interactiveChildren:!0,hitArea:null,buttonMode:!1,defaultCursor:"pointer",_over:!1,_isLeftDown:!1,_isRightDown:!1,_touchDown:!1};e.exports=i},{}],147:[function(t,e,r){function i(t,e){var r={},i=t.data.getElementsByTagName("info")[0],n=t.data.getElementsByTagName("common")[0];r.font=i.getAttribute("face"),r.size=parseInt(i.getAttribute("size"),10),r.lineHeight=parseInt(n.getAttribute("lineHeight"),10),r.chars={};for(var a=t.data.getElementsByTagName("char"),h=0;h<a.length;h++){var u=parseInt(a[h].getAttribute("id"),10),l=new s.Rectangle(parseInt(a[h].getAttribute("x"),10)+e.frame.x,parseInt(a[h].getAttribute("y"),10)+e.frame.y,parseInt(a[h].getAttribute("width"),10),parseInt(a[h].getAttribute("height"),10));r.chars[u]={xOffset:parseInt(a[h].getAttribute("xoffset"),10),yOffset:parseInt(a[h].getAttribute("yoffset"),10),xAdvance:parseInt(a[h].getAttribute("xadvance"),10),kerning:{},texture:new s.Texture(e.baseTexture,l)}}var c=t.data.getElementsByTagName("kerning");for(h=0;h<c.length;h++){var d=parseInt(c[h].getAttribute("first"),10),p=parseInt(c[h].getAttribute("second"),10),f=parseInt(c[h].getAttribute("amount"),10);r.chars[p]&&(r.chars[p].kerning[d]=f)}t.bitmapFont=r,o.BitmapText.fonts[r.font]=r}var n=t("resource-loader").Resource,s=t("../core"),o=t("../extras"),a=t("path");e.exports=function(){return function(t,e){if(!t.data||!t.isXml)return e();if(0===t.data.getElementsByTagName("page").length||0===t.data.getElementsByTagName("info").length||null===t.data.getElementsByTagName("info")[0].getAttribute("face"))return e();var r=t.isDataUrl?"":a.dirname(t.url);t.isDataUrl&&("."===r&&(r=""),this.baseUrl&&r&&("/"===this.baseUrl.charAt(this.baseUrl.length-1)&&(r+="/"),r=r.replace(this.baseUrl,""))),r&&"/"!==r.charAt(r.length-1)&&(r+="/");var o=r+t.data.getElementsByTagName("page")[0].getAttribute("file");if(s.utils.TextureCache[o])i(t,s.utils.TextureCache[o]),e();else{var h={crossOrigin:t.crossOrigin,loadType:n.LOAD_TYPE.IMAGE,metadata:t.metadata.imageMetadata};this.add(t.name+"_image",o,h,function(r){i(t,r.texture),e()})}}}},{"../core":62,"../extras":129,path:22,"resource-loader":36}],148:[function(t,e,r){e.exports={Loader:t("./loader"),bitmapFontParser:t("./bitmapFontParser"),spritesheetParser:t("./spritesheetParser"),textureParser:t("./textureParser"),Resource:t("resource-loader").Resource}},{"./bitmapFontParser":147,"./loader":149,"./spritesheetParser":150,"./textureParser":151,"resource-loader":36}],149:[function(t,e,r){function i(t,e){n.call(this,t,e);for(var r=0;r<i._pixiMiddleware.length;++r)this.use(i._pixiMiddleware[r]())}var n=t("resource-loader"),s=t("./textureParser"),o=t("./spritesheetParser"),a=t("./bitmapFontParser");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i._pixiMiddleware=[n.middleware.parsing.blob,s,o,a],i.addPixiMiddleware=function(t){i._pixiMiddleware.push(t)};var h=n.Resource;h.setExtensionXhrType("fnt",h.XHR_RESPONSE_TYPE.DOCUMENT)},{"./bitmapFontParser":147,"./spritesheetParser":150,"./textureParser":151,"resource-loader":36}],150:[function(t,e,r){var i=t("resource-loader").Resource,n=t("path"),s=t("../core"),o=1e3;e.exports=function(){return function(t,e){var r,a=t.name+"_image";if(!t.data||!t.isJson||!t.data.frames||this.resources[a])return e();var h={crossOrigin:t.crossOrigin,loadType:i.LOAD_TYPE.IMAGE,metadata:t.metadata.imageMetadata};r=t.isDataUrl?t.data.meta.image:n.dirname(t.url.replace(this.baseUrl,""))+"/"+t.data.meta.image,this.add(a,r,h,function(r){function i(e,i){for(var n=e;n-e<i&&n<l.length;){var o=l[n],a=u[o].frame;if(a){var h=null,d=null,p=new s.Rectangle(0,0,u[o].sourceSize.w/c,u[o].sourceSize.h/c);h=u[o].rotated?new s.Rectangle(a.x/c,a.y/c,a.h/c,a.w/c):new s.Rectangle(a.x/c,a.y/c,a.w/c,a.h/c),u[o].trimmed&&(d=new s.Rectangle(u[o].spriteSourceSize.x/c,u[o].spriteSourceSize.y/c,u[o].spriteSourceSize.w/c,u[o].spriteSourceSize.h/c)),t.textures[o]=new s.Texture(r.texture.baseTexture,h,p,d,u[o].rotated?2:0),s.utils.TextureCache[o]=t.textures[o]}n++}}function n(){return d*o<l.length}function a(t){i(d*o,o),d++,setTimeout(t,0)}function h(){a(function(){n()?h():e()})}t.textures={};var u=t.data.frames,l=Object.keys(u),c=s.utils.getResolutionOfUrl(t.url),d=0;l.length<=o?(i(0,o),e()):h()})}}},{"../core":62,path:22,"resource-loader":36}],151:[function(t,e,r){var i=t("../core");e.exports=function(){return function(t,e){if(t.data&&t.isImage){var r=new i.BaseTexture(t.data,null,i.utils.getResolutionOfUrl(t.url));r.imageUrl=t.url,t.texture=new i.Texture(r),i.utils.BaseTextureCache[t.url]=r,i.utils.TextureCache[t.url]=t.texture}e()}}},{"../core":62}],152:[function(t,e,r){function i(t,e,r,s,o){n.Container.call(this),this._texture=null,this.uvs=r||new Float32Array([0,0,1,0,1,1,0,1]),this.vertices=e||new Float32Array([0,0,100,0,100,100,0,100]),this.indices=s||new Uint16Array([0,1,3,2]),this.dirty=0,this.indexDirty=0,this.blendMode=n.BLEND_MODES.NORMAL,this.canvasPadding=0,this.drawMode=o||i.DRAW_MODES.TRIANGLE_MESH,this.texture=t,this.shader=null,this.tintRgb=new Float32Array([1,1,1]),this._glDatas=[]}var n=t("../core"),s=t("pixi-gl-core"),o=t("./webgl/MeshShader"),a=new n.Point,h=new n.Polygon;i.prototype=Object.create(n.Container.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{texture:{get:function(){return this._texture},set:function(t){this._texture!==t&&(this._texture=t,t&&(t.baseTexture.hasLoaded?this._onTextureUpdate():t.once("update",this._onTextureUpdate,this)))}},tint:{get:function(){return n.utils.rgb2hex(this.tintRgb)},set:function(t){this.tintRgb=n.utils.hex2rgb(t,this.tintRgb)}}}),i.prototype._renderWebGL=function(t){t.flush();var e=t.gl,r=this._glDatas[t.CONTEXT_UID];r||(r={shader:new o(e),vertexBuffer:s.GLBuffer.createVertexBuffer(e,this.vertices,e.STREAM_DRAW),uvBuffer:s.GLBuffer.createVertexBuffer(e,this.uvs,e.STREAM_DRAW),indexBuffer:s.GLBuffer.createIndexBuffer(e,this.indices,e.STATIC_DRAW),vao:new s.VertexArrayObject(e),dirty:this.dirty,indexDirty:this.indexDirty},r.vao=new s.VertexArrayObject(e).addIndex(r.indexBuffer).addAttribute(r.vertexBuffer,r.shader.attributes.aVertexPosition,e.FLOAT,!1,8,0).addAttribute(r.uvBuffer,r.shader.attributes.aTextureCoord,e.FLOAT,!1,8,0),this._glDatas[t.CONTEXT_UID]=r),this.dirty!==r.dirty&&(r.dirty=this.dirty,r.uvBuffer.upload()),this.indexDirty!==r.indexDirty&&(r.indexDirty=this.indexDirty,r.indexBuffer.upload()),r.vertexBuffer.upload(),t.bindShader(r.shader),t.bindTexture(this._texture,0),t.state.setBlendMode(this.blendMode),r.shader.uniforms.translationMatrix=this.worldTransform.toArray(!0),r.shader.uniforms.alpha=this.worldAlpha,r.shader.uniforms.tint=this.tintRgb;var n=this.drawMode===i.DRAW_MODES.TRIANGLE_MESH?e.TRIANGLE_STRIP:e.TRIANGLES;r.vao.bind().draw(n,this.indices.length).unbind()},i.prototype._renderCanvas=function(t){var e=t.context,r=this.worldTransform,n=t.resolution;t.roundPixels?e.setTransform(r.a*n,r.b*n,r.c*n,r.d*n,r.tx*n|0,r.ty*n|0):e.setTransform(r.a*n,r.b*n,r.c*n,r.d*n,r.tx*n,r.ty*n),this.drawMode===i.DRAW_MODES.TRIANGLE_MESH?this._renderCanvasTriangleMesh(e):this._renderCanvasTriangles(e)},i.prototype._renderCanvasTriangleMesh=function(t){for(var e=this.vertices,r=this.uvs,i=e.length/2,n=0;n<i-2;n++){var s=2*n;this._renderCanvasDrawTriangle(t,e,r,s,s+2,s+4)}},i.prototype._renderCanvasTriangles=function(t){for(var e=this.vertices,r=this.uvs,i=this.indices,n=i.length,s=0;s<n;s+=3){var o=2*i[s],a=2*i[s+1],h=2*i[s+2];this._renderCanvasDrawTriangle(t,e,r,o,a,h)}},i.prototype._renderCanvasDrawTriangle=function(t,e,r,i,n,s){var o=this._texture.baseTexture,a=o.source,h=o.width,u=o.height,l=e[i],c=e[n],d=e[s],p=e[i+1],f=e[n+1],v=e[s+1],g=r[i]*o.width,y=r[n]*o.width,x=r[s]*o.width,m=r[i+1]*o.height,_=r[n+1]*o.height,b=r[s+1]*o.height;if(this.canvasPadding>0){var T=this.canvasPadding/this.worldTransform.a,E=this.canvasPadding/this.worldTransform.d,w=(l+c+d)/3,S=(p+f+v)/3,C=l-w,R=p-S,M=Math.sqrt(C*C+R*R);l=w+C/M*(M+T),p=S+R/M*(M+E),C=c-w,R=f-S,M=Math.sqrt(C*C+R*R),c=w+C/M*(M+T),f=S+R/M*(M+E),C=d-w,R=v-S,M=Math.sqrt(C*C+R*R),d=w+C/M*(M+T),v=S+R/M*(M+E)}t.save(),t.beginPath(),t.moveTo(l,p),t.lineTo(c,f),t.lineTo(d,v),t.closePath(),t.clip();var A=g*_+m*x+y*b-_*x-m*y-g*b,O=l*_+m*d+c*b-_*d-m*c-l*b,D=g*c+l*x+y*d-c*x-l*y-g*d,P=g*_*d+m*c*x+l*y*b-l*_*x-m*y*d-g*c*b,I=p*_+m*v+f*b-_*v-m*f-p*b,L=g*f+p*x+y*v-f*x-p*y-g*v,F=g*_*v+m*f*x+p*y*b-p*_*x-m*y*v-g*f*b;t.transform(O/A,I/A,D/A,L/A,P/A,F/A),t.drawImage(a,0,0,h*o.resolution,u*o.resolution,0,0,h,u),t.restore()},i.prototype.renderMeshFlat=function(t){var e=this.context,r=t.vertices,i=r.length/2;e.beginPath();for(var n=1;n<i-2;n++){var s=2*n,o=r[s],a=r[s+2],h=r[s+4],u=r[s+1],l=r[s+3],c=r[s+5];e.moveTo(o,u),e.lineTo(a,l),e.lineTo(h,c)}e.fillStyle="#FF0000",e.fill(),e.closePath()},i.prototype._onTextureUpdate=function(){},i.prototype._calculateBounds=function(){this._bounds.addVertices(this.transform,this.vertices,0,this.vertices.length)},i.prototype.containsPoint=function(t){if(!this.getBounds().contains(t.x,t.y))return!1;this.worldTransform.applyInverse(t,a);for(var e=this.vertices,r=h.points,n=this.indices,s=this.indices.length,o=this.drawMode===i.DRAW_MODES.TRIANGLES?3:1,u=0;u+2<s;u+=o){var l=2*n[u],c=2*n[u+1],d=2*n[u+2];if(r[0]=e[l],r[1]=e[l+1],r[2]=e[c],r[3]=e[c+1],r[4]=e[d],r[5]=e[d+1],h.contains(a.x,a.y))return!0}return!1},i.DRAW_MODES={TRIANGLE_MESH:0,TRIANGLES:1}},{"../core":62,"./webgl/MeshShader":157,"pixi-gl-core":12}],153:[function(t,e,r){function i(t,e,r,i,o){s.call(this,t,4,4);var a=this.uvs;a[6]=a[14]=a[22]=a[30]=1,a[25]=a[27]=a[29]=a[31]=1,this._origWidth=t.width,this._origHeight=t.height,this._uvw=1/this._origWidth,this._uvh=1/this._origHeight,this.width=t.width,this.height=t.height,a[2]=a[10]=a[18]=a[26]=this._uvw*e,a[4]=a[12]=a[20]=a[28]=1-this._uvw*i,a[9]=a[11]=a[13]=a[15]=this._uvh*r,a[17]=a[19]=a[21]=a[23]=1-this._uvh*o,this.leftWidth="undefined"!=typeof e?e:n,this.rightWidth="undefined"!=typeof i?i:n,this.topHeight="undefined"!=typeof r?r:n,this.bottomHeight="undefined"!=typeof o?o:n}var n=10,s=t("./Plane");i.prototype=Object.create(s.prototype),i.prototype.constructor=i,e.exports=i,Object.defineProperties(i.prototype,{width:{get:function(){return this._width},set:function(t){this._width=t,this.updateVerticalVertices()}},height:{get:function(){return this._height},set:function(t){this._height=t,this.updateHorizontalVertices()}},leftWidth:{get:function(){return this._leftWidth},set:function(t){this._leftWidth=t;var e=this.uvs,r=this.vertices;e[2]=e[10]=e[18]=e[26]=this._uvw*t,r[2]=r[10]=r[18]=r[26]=t,this.dirty=!0}},rightWidth:{get:function(){return this._rightWidth},set:function(t){this._rightWidth=t;var e=this.uvs,r=this.vertices;e[4]=e[12]=e[20]=e[28]=1-this._uvw*t,r[4]=r[12]=r[20]=r[28]=this._width-t,this.dirty=!0}},topHeight:{get:function(){return this._topHeight},set:function(t){this._topHeight=t;var e=this.uvs,r=this.vertices;e[9]=e[11]=e[13]=e[15]=this._uvh*t,r[9]=r[11]=r[13]=r[15]=t,this.dirty=!0}},bottomHeight:{get:function(){return this._bottomHeight},set:function(t){this._bottomHeight=t;var e=this.uvs,r=this.vertices;e[17]=e[19]=e[21]=e[23]=1-this._uvh*t,r[17]=r[19]=r[21]=r[23]=this._height-t,this.dirty=!0}}}),i.prototype.updateHorizontalVertices=function(){var t=this.vertices;t[9]=t[11]=t[13]=t[15]=this._topHeight,t[17]=t[19]=t[21]=t[23]=this._height-this._bottomHeight,t[25]=t[27]=t[29]=t[31]=this._height},i.prototype.updateVerticalVertices=function(){var t=this.vertices;t[2]=t[10]=t[18]=t[26]=this._leftWidth,t[4]=t[12]=t[20]=t[28]=this._width-this._rightWidth,t[6]=t[14]=t[22]=t[30]=this._width},i.prototype._renderCanvas=function(t){var e=t.context;e.globalAlpha=this.worldAlpha;var r=this.worldTransform,i=t.resolution;t.roundPixels?e.setTransform(r.a*i,r.b*i,r.c*i,r.d*i,r.tx*i|0,r.ty*i|0):e.setTransform(r.a*i,r.b*i,r.c*i,r.d*i,r.tx*i,r.ty*i);var n=this._texture.baseTexture,s=n.source,o=n.width,a=n.height;this.drawSegment(e,s,o,a,0,1,10,11),this.drawSegment(e,s,o,a,2,3,12,13),this.drawSegment(e,s,o,a,4,5,14,15),this.drawSegment(e,s,o,a,8,9,18,19),this.drawSegment(e,s,o,a,10,11,20,21),this.drawSegment(e,s,o,a,12,13,22,23),this.drawSegment(e,s,o,a,16,17,26,27),this.drawSegment(e,s,o,a,18,19,28,29),this.drawSegment(e,s,o,a,20,21,30,31)},i.prototype.drawSegment=function(t,e,r,i,n,s,o,a){var h=this.uvs,u=this.vertices,l=(h[o]-h[n])*r,c=(h[a]-h[s])*i,d=u[o]-u[n],p=u[a]-u[s];l<1&&(l=1),c<1&&(c=1),d<1&&(d=1),p<1&&(p=1),t.drawImage(e,h[n]*r,h[s]*i,l,c,u[n],u[s],d,p)}},{"./Plane":154}],154:[function(t,e,r){function i(t,e,r){n.call(this,t),this._ready=!0,this.verticesX=e||10,this.verticesY=r||10,this.drawMode=n.DRAW_MODES.TRIANGLES,this.refresh()}var n=t("./Mesh");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.refresh=function(){var t=this.verticesX*this.verticesY,e=[],r=[],i=[],n=[],s=this.texture,o=this.verticesX-1,a=this.verticesY-1,h=0,u=s.width/o,l=s.height/a;for(h=0;h<t;h++){var c=h%this.verticesX,d=h/this.verticesX|0;e.push(c*u,d*l),i.push(s._uvs.x0+(s._uvs.x1-s._uvs.x0)*(c/(this.verticesX-1)),s._uvs.y0+(s._uvs.y3-s._uvs.y0)*(d/(this.verticesY-1)))}var p=o*a;for(h=0;h<p;h++){var f=h%o,v=h/o|0,g=v*this.verticesX+f,y=v*this.verticesX+f+1,x=(v+1)*this.verticesX+f,m=(v+1)*this.verticesX+f+1;n.push(g,y,x),n.push(y,m,x)}this.vertices=new Float32Array(e),this.uvs=new Float32Array(i),this.colors=new Float32Array(r),this.indices=new Uint16Array(n),this.indexDirty=!0},i.prototype._onTextureUpdate=function(){n.prototype._onTextureUpdate.call(this),this._ready&&this.refresh()}},{"./Mesh":152}],155:[function(t,e,r){function i(t,e){n.call(this,t),this.points=e,this.vertices=new Float32Array(4*e.length),this.uvs=new Float32Array(4*e.length),this.colors=new Float32Array(2*e.length),this.indices=new Uint16Array(2*e.length),this._ready=!0,this.refresh()}var n=t("./Mesh"),s=t("../core");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.refresh=function(){var t=this.points;if(!(t.length<1)&&this._texture._uvs){var e=this.uvs,r=this.indices,i=this.colors,n=this._texture._uvs,o=new s.Point(n.x0,n.y0),a=new s.Point(n.x2-n.x0,n.y2-n.y0);e[0]=0+o.x,e[1]=0+o.y,e[2]=0+o.x,e[3]=1*a.y+o.y,i[0]=1,i[1]=1,r[0]=0,r[1]=1;for(var h,u,l,c=t.length,d=1;d<c;d++)h=t[d],u=4*d,l=d/(c-1),e[u]=l*a.x+o.x,e[u+1]=0+o.y,e[u+2]=l*a.x+o.x,e[u+3]=1*a.y+o.y,u=2*d,i[u]=1,i[u+1]=1,u=2*d,r[u]=u,r[u+1]=u+1;this.dirty=!0,this.indexDirty=!0}},i.prototype._onTextureUpdate=function(){n.prototype._onTextureUpdate.call(this),this._ready&&this.refresh()},i.prototype.updateTransform=function(){var t=this.points;if(!(t.length<1)){for(var e,r,i,n,s,o,a=t[0],h=0,u=0,l=this.vertices,c=t.length,d=0;d<c;d++)r=t[d],i=4*d,e=d<t.length-1?t[d+1]:r,u=-(e.x-a.x),h=e.y-a.y,n=10*(1-d/(c-1)),n>1&&(n=1),s=Math.sqrt(h*h+u*u),o=this._texture.height/2,h/=s,u/=s,h*=o,u*=o,l[i]=r.x+h,l[i+1]=r.y+u,l[i+2]=r.x-h,l[i+3]=r.y-u,a=r;this.containerUpdateTransform()}}},{"../core":62,"./Mesh":152}],156:[function(t,e,r){e.exports={Mesh:t("./Mesh"),Plane:t("./Plane"),NineSlicePlane:t("./NineSlicePlane"),Rope:t("./Rope"),MeshShader:t("./webgl/MeshShader")}},{"./Mesh":152,"./NineSlicePlane":153,"./Plane":154,"./Rope":155,"./webgl/MeshShader":157}],157:[function(t,e,r){function i(t){n.call(this,t,["attribute vec2 aVertexPosition;","attribute vec2 aTextureCoord;","uniform mat3 translationMatrix;","uniform mat3 projectionMatrix;","varying vec2 vTextureCoord;","void main(void){","   gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);","   vTextureCoord = aTextureCoord;","}"].join("\n"),["varying vec2 vTextureCoord;","uniform float alpha;","uniform vec3 tint;","uniform sampler2D uSampler;","void main(void){","   gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(tint * alpha, alpha);","}"].join("\n"))}var n=t("../../core/Shader");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i},{"../../core/Shader":42}],158:[function(t,e,r){function i(t,e,r){n.Container.call(this),r=r||15e3,t=t||15e3;var i=16384;r>i&&(r=i),r>t&&(r=t),this._properties=[!1,!0,!1,!1,!1],this._maxSize=t,this._batchSize=r,this._glBuffers=[],this._bufferToUpdate=0,this.interactiveChildren=!1,this.blendMode=n.BLEND_MODES.NORMAL,this.roundPixels=!0,this.baseTexture=null,this.setProperties(e)}var n=t("../core");i.prototype=Object.create(n.Container.prototype),i.prototype.constructor=i,e.exports=i,i.prototype.setProperties=function(t){t&&(this._properties[0]="scale"in t?!!t.scale:this._properties[0],this._properties[1]="position"in t?!!t.position:this._properties[1],this._properties[2]="rotation"in t?!!t.rotation:this._properties[2],this._properties[3]="uvs"in t?!!t.uvs:this._properties[3],this._properties[4]="alpha"in t?!!t.alpha:this._properties[4])},i.prototype.updateTransform=function(){this.displayObjectUpdateTransform()},i.prototype.renderWebGL=function(t){this.visible&&!(this.worldAlpha<=0)&&this.children.length&&this.renderable&&(this.baseTexture||(this.baseTexture=this.children[0]._texture.baseTexture,this.baseTexture.hasLoaded||this.baseTexture.once("update",function(){this.onChildrenChange(0)},this)),t.setObjectRenderer(t.plugins.particle),t.plugins.particle.render(this))},i.prototype.onChildrenChange=function(t){var e=Math.floor(t/this._batchSize);e<this._bufferToUpdate&&(this._bufferToUpdate=e)},i.prototype.renderCanvas=function(t){if(this.visible&&!(this.worldAlpha<=0)&&this.children.length&&this.renderable){var e=t.context,r=this.worldTransform,i=!0,n=0,s=0,o=0,a=0,h=t.blendModes[this.blendMode];h!==e.globalCompositeOperation&&(e.globalCompositeOperation=h),e.globalAlpha=this.worldAlpha,this.displayObjectUpdateTransform();for(var u=0;u<this.children.length;++u){var l=this.children[u];if(l.visible){var c=l.texture.frame;if(e.globalAlpha=this.worldAlpha*l.alpha,l.rotation%(2*Math.PI)===0)i&&(e.setTransform(r.a,r.b,r.c,r.d,r.tx*t.resolution,r.ty*t.resolution),i=!1),n=l.anchor.x*(-c.width*l.scale.x)+l.position.x+.5,s=l.anchor.y*(-c.height*l.scale.y)+l.position.y+.5,o=c.width*l.scale.x,a=c.height*l.scale.y;else{i||(i=!0),l.displayObjectUpdateTransform();var d=l.worldTransform;t.roundPixels?e.setTransform(d.a,d.b,d.c,d.d,d.tx*t.resolution|0,d.ty*t.resolution|0):e.setTransform(d.a,d.b,d.c,d.d,d.tx*t.resolution,d.ty*t.resolution),n=l.anchor.x*-c.width+.5,s=l.anchor.y*-c.height+.5,o=c.width,a=c.height}var p=l.texture.baseTexture.resolution;e.drawImage(l.texture.baseTexture.source,c.x*p,c.y*p,c.width*p,c.height*p,n*p,s*p,o*p,a*p)}}}},i.prototype.destroy=function(){if(n.Container.prototype.destroy.apply(this,arguments),this._buffers)for(var t=0;t<this._buffers.length;++t)this._buffers[t].destroy();this._properties=null,this._buffers=null}},{"../core":62}],159:[function(t,e,r){e.exports={ParticleContainer:t("./ParticleContainer"),ParticleRenderer:t("./webgl/ParticleRenderer")}},{"./ParticleContainer":158,"./webgl/ParticleRenderer":161}],160:[function(t,e,r){function i(t,e,r,i){this.gl=t,this.vertSize=2,this.vertByteSize=4*this.vertSize,this.size=i,this.dynamicProperties=[],this.staticProperties=[];for(var n=0;n<e.length;n++){var s=e[n];s={attribute:s.attribute,size:s.size,uploadFunction:s.uploadFunction,offset:s.offset},r[n]?this.dynamicProperties.push(s):this.staticProperties.push(s)}this.staticStride=0,this.staticBuffer=null,this.staticData=null,this.dynamicStride=0,this.dynamicBuffer=null,this.dynamicData=null,this.initBuffers()}var n=t("pixi-gl-core"),s=t("../../core/utils/createIndicesForQuads");i.prototype.constructor=i,e.exports=i,i.prototype.initBuffers=function(){var t,e,r=this.gl,i=0;for(this.indices=s(this.size),this.indexBuffer=n.GLBuffer.createIndexBuffer(r,this.indices,r.STATIC_DRAW),this.dynamicStride=0,t=0;t<this.dynamicProperties.length;t++)e=this.dynamicProperties[t],e.offset=i,i+=e.size,this.dynamicStride+=e.size;this.dynamicData=new Float32Array(this.size*this.dynamicStride*4),this.dynamicBuffer=n.GLBuffer.createVertexBuffer(r,this.dynamicData,r.STREAM_DRAW);var o=0;for(this.staticStride=0,t=0;t<this.staticProperties.length;t++)e=this.staticProperties[t],e.offset=o,o+=e.size,this.staticStride+=e.size;for(this.staticData=new Float32Array(this.size*this.staticStride*4),this.staticBuffer=n.GLBuffer.createVertexBuffer(r,this.staticData,r.STATIC_DRAW),this.vao=new n.VertexArrayObject(r).addIndex(this.indexBuffer),t=0;t<this.dynamicProperties.length;t++)e=this.dynamicProperties[t],this.vao.addAttribute(this.dynamicBuffer,e.attribute,r.FLOAT,!1,4*this.dynamicStride,4*e.offset);for(t=0;t<this.staticProperties.length;t++)e=this.staticProperties[t],this.vao.addAttribute(this.staticBuffer,e.attribute,r.FLOAT,!1,4*this.staticStride,4*e.offset)},i.prototype.uploadDynamic=function(t,e,r){for(var i=0;i<this.dynamicProperties.length;i++){var n=this.dynamicProperties[i];n.uploadFunction(t,e,r,this.dynamicData,this.dynamicStride,n.offset)}this.dynamicBuffer.upload()},i.prototype.uploadStatic=function(t,e,r){for(var i=0;i<this.staticProperties.length;i++){var n=this.staticProperties[i];n.uploadFunction(t,e,r,this.staticData,this.staticStride,n.offset)}this.staticBuffer.upload()},i.prototype.bind=function(){this.vao.bind()},i.prototype.destroy=function(){this.dynamicProperties=null,this.dynamicData=null,this.dynamicBuffer.destroy(),this.staticProperties=null,this.staticData=null,this.staticBuffer.destroy()}},{"../../core/utils/createIndicesForQuads":114,"pixi-gl-core":12}],161:[function(t,e,r){function i(t){n.ObjectRenderer.call(this,t),this.shader=null,this.indexBuffer=null,this.properties=null,this.tempMatrix=new n.Matrix,this.CONTEXT_UID=0}var n=t("../../core"),s=t("./ParticleShader"),o=t("./ParticleBuffer");i.prototype=Object.create(n.ObjectRenderer.prototype),i.prototype.constructor=i,e.exports=i,n.WebGLRenderer.registerPlugin("particle",i),i.prototype.onContextChange=function(){var t=this.renderer.gl;this.CONTEXT_UID=this.renderer.CONTEXT_UID,this.shader=new s(t),this.properties=[{attribute:this.shader.attributes.aVertexPosition,size:2,uploadFunction:this.uploadVertices,offset:0},{attribute:this.shader.attributes.aPositionCoord,size:2,uploadFunction:this.uploadPosition,offset:0},{attribute:this.shader.attributes.aRotation,size:1,uploadFunction:this.uploadRotation,offset:0},{attribute:this.shader.attributes.aTextureCoord,size:2,uploadFunction:this.uploadUvs,offset:0},{attribute:this.shader.attributes.aColor,size:1,uploadFunction:this.uploadAlpha,offset:0}]},i.prototype.start=function(){this.renderer.bindShader(this.shader)},i.prototype.render=function(t){var e=t.children,r=e.length,i=t._maxSize,n=t._batchSize;if(0!==r){r>i&&(r=i);var s=t._glBuffers[this.renderer.CONTEXT_UID];s||(s=t._glBuffers[this.renderer.CONTEXT_UID]=this.generateBuffers(t)),this.renderer.setBlendMode(t.blendMode);var o=this.renderer.gl,a=t.worldTransform.copy(this.tempMatrix);a.prepend(this.renderer._activeRenderTarget.projectionMatrix),this.shader.uniforms.projectionMatrix=a.toArray(!0),this.shader.uniforms.uAlpha=t.worldAlpha;var h=e[0]._texture.baseTexture;this.renderer.bindTexture(h);for(var u=0,l=0;u<r;u+=n,l+=1){var c=r-u;c>n&&(c=n);var d=s[l];d.uploadDynamic(e,u,c),t._bufferToUpdate===l&&(d.uploadStatic(e,u,c),t._bufferToUpdate=l+1),d.vao.bind().draw(o.TRIANGLES,6*c).unbind()}}},i.prototype.generateBuffers=function(t){var e,r=this.renderer.gl,i=[],n=t._maxSize,s=t._batchSize,a=t._properties;for(e=0;e<n;e+=s)i.push(new o(r,this.properties,a,s));return i},i.prototype.uploadVertices=function(t,e,r,i,n,s){for(var o,a,h,u,l,c,d,p,f,v,g=0;g<r;g++)o=t[e+g],a=o._texture,l=o.scale.x,c=o.scale.y,h=a.trim,u=a.orig,h?(p=h.x-o.anchor.x*u.width,d=p+h.width,v=h.y-o.anchor.y*u.height,f=v+h.height):(d=u.width*(1-o.anchor.x),p=u.width*-o.anchor.x,f=u.height*(1-o.anchor.y),v=u.height*-o.anchor.y),i[s]=p*l,i[s+1]=v*c,i[s+n]=d*l,i[s+n+1]=v*c,i[s+2*n]=d*l,i[s+2*n+1]=f*c,i[s+3*n]=p*l,i[s+3*n+1]=f*c,s+=4*n},i.prototype.uploadPosition=function(t,e,r,i,n,s){for(var o=0;o<r;o++){var a=t[e+o].position;i[s]=a.x,i[s+1]=a.y,i[s+n]=a.x,i[s+n+1]=a.y,i[s+2*n]=a.x,i[s+2*n+1]=a.y,i[s+3*n]=a.x,i[s+3*n+1]=a.y,s+=4*n}},i.prototype.uploadRotation=function(t,e,r,i,n,s){for(var o=0;o<r;o++){var a=t[e+o].rotation;i[s]=a,i[s+n]=a,i[s+2*n]=a,i[s+3*n]=a,s+=4*n}},i.prototype.uploadUvs=function(t,e,r,i,n,s){for(var o=0;o<r;o++){var a=t[e+o]._texture._uvs;a?(i[s]=a.x0,i[s+1]=a.y0,i[s+n]=a.x1,i[s+n+1]=a.y1,i[s+2*n]=a.x2,i[s+2*n+1]=a.y2,i[s+3*n]=a.x3,i[s+3*n+1]=a.y3,s+=4*n):(i[s]=0,i[s+1]=0,i[s+n]=0,i[s+n+1]=0,i[s+2*n]=0,i[s+2*n+1]=0,i[s+3*n]=0,i[s+3*n+1]=0,s+=4*n)}},i.prototype.uploadAlpha=function(t,e,r,i,n,s){for(var o=0;o<r;o++){var a=t[e+o].alpha;i[s]=a,i[s+n]=a,i[s+2*n]=a,i[s+3*n]=a,s+=4*n}},i.prototype.destroy=function(){this.renderer.gl&&this.renderer.gl.deleteBuffer(this.indexBuffer),n.ObjectRenderer.prototype.destroy.apply(this,arguments),this.shader.destroy(),this.indices=null,this.tempMatrix=null}},{"../../core":62,
"./ParticleBuffer":160,"./ParticleShader":162}],162:[function(t,e,r){function i(t){n.call(this,t,["attribute vec2 aVertexPosition;","attribute vec2 aTextureCoord;","attribute float aColor;","attribute vec2 aPositionCoord;","attribute vec2 aScale;","attribute float aRotation;","uniform mat3 projectionMatrix;","varying vec2 vTextureCoord;","varying float vColor;","void main(void){","   vec2 v = aVertexPosition;","   v.x = (aVertexPosition.x) * cos(aRotation) - (aVertexPosition.y) * sin(aRotation);","   v.y = (aVertexPosition.x) * sin(aRotation) + (aVertexPosition.y) * cos(aRotation);","   v = v + aPositionCoord;","   gl_Position = vec4((projectionMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);","   vTextureCoord = aTextureCoord;","   vColor = aColor;","}"].join("\n"),["varying vec2 vTextureCoord;","varying float vColor;","uniform sampler2D uSampler;","uniform float uAlpha;","void main(void){","  vec4 color = texture2D(uSampler, vTextureCoord) * vColor * uAlpha;","  if (color.a == 0.0) discard;","  gl_FragColor = color;","}"].join("\n"))}var n=t("../../core/Shader");i.prototype=Object.create(n.prototype),i.prototype.constructor=i,e.exports=i},{"../../core/Shader":42}],163:[function(t,e,r){Math.sign||(Math.sign=function(t){return t=+t,0===t||isNaN(t)?t:t>0?1:-1})},{}],164:[function(t,e,r){Object.assign||(Object.assign=t("object-assign"))},{"object-assign":5}],165:[function(t,e,r){t("./Object.assign"),t("./requestAnimationFrame"),t("./Math.sign"),window.ArrayBuffer||(window.ArrayBuffer=Array),window.Float32Array||(window.Float32Array=Array),window.Uint32Array||(window.Uint32Array=Array),window.Uint16Array||(window.Uint16Array=Array)},{"./Math.sign":163,"./Object.assign":164,"./requestAnimationFrame":166}],166:[function(t,e,r){(function(t){if(Date.now&&Date.prototype.getTime||(Date.now=function(){return(new Date).getTime()}),!t.performance||!t.performance.now){var e=Date.now();t.performance||(t.performance={}),t.performance.now=function(){return Date.now()-e}}for(var r=Date.now(),i=["ms","moz","webkit","o"],n=0;n<i.length&&!t.requestAnimationFrame;++n)t.requestAnimationFrame=t[i[n]+"RequestAnimationFrame"],t.cancelAnimationFrame=t[i[n]+"CancelAnimationFrame"]||t[i[n]+"CancelRequestAnimationFrame"];t.requestAnimationFrame||(t.requestAnimationFrame=function(t){if("function"!=typeof t)throw new TypeError(t+"is not a function");var e=Date.now(),i=16+r-e;return i<0&&(i=0),r=e,setTimeout(function(){r=Date.now(),t(performance.now())},i)}),t.cancelAnimationFrame||(t.cancelAnimationFrame=function(t){clearTimeout(t)})}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],167:[function(t,e,r){function i(){}var n=t("../../core");i.prototype.constructor=i,e.exports=i,i.prototype.upload=function(t,e){"function"==typeof t&&(e=t,t=null),e()},i.prototype.register=function(){return this},i.prototype.add=function(){return this},i.prototype.destroy=function(){},n.CanvasRenderer.registerPlugin("prepare",i)},{"../../core":62}],168:[function(t,e,r){e.exports={webGL:t("./webgl/WebGLPrepare"),canvas:t("./canvas/CanvasPrepare")}},{"./canvas/CanvasPrepare":167,"./webgl/WebGLPrepare":169}],169:[function(t,e,r){function i(t){this.renderer=t,this.queue=[],this.addHooks=[],this.uploadHooks=[],this.completes=[],this.ticking=!1,this.register(o,n).register(a,s)}function n(t,e){return e instanceof h.BaseTexture&&(t.textureManager.updateTexture(e),!0)}function s(t,e){return e instanceof h.Graphics&&(t.plugins.graphics.updateGraphics(e),!0)}function o(t,e){if(t instanceof h.BaseTexture)return e.indexOf(t)===-1&&e.push(t),!0;if(t._texture&&t._texture instanceof h.Texture){var r=t._texture.baseTexture;return e.indexOf(r)===-1&&e.push(r),!0}return!1}function a(t,e){return t instanceof h.Graphics&&(e.push(t),!0)}var h=t("../../core"),u=h.ticker.shared;i.UPLOADS_PER_FRAME=4,i.prototype.constructor=i,e.exports=i,i.prototype.upload=function(t,e){"function"==typeof t&&(e=t,t=null),t&&this.add(t),this.queue.length?(this.numLeft=i.UPLOADS_PER_FRAME,this.completes.push(e),this.ticking||(this.ticking=!0,u.add(this.tick,this))):e()},i.prototype.tick=function(){for(var t,e;this.queue.length&&this.numLeft>0;){var r=this.queue[0],n=!1;for(t=0,e=this.uploadHooks.length;t<e;t++)if(this.uploadHooks[t](this.renderer,r)){this.numLeft--,this.queue.shift(),n=!0;break}n||this.queue.shift()}if(this.queue.length)this.numLeft=i.UPLOADS_PER_FRAME;else{this.ticking=!1,u.remove(this.tick,this);var s=this.completes.slice(0);for(this.completes.length=0,t=0,e=s.length;t<e;t++)s[t]()}},i.prototype.register=function(t,e){return t&&this.addHooks.push(t),e&&this.uploadHooks.push(e),this},i.prototype.add=function(t){var e,r;for(e=0,r=this.addHooks.length;e<r&&!this.addHooks[e](t,this.queue);e++);if(t instanceof h.Container)for(e=t.children.length-1;e>=0;e--)this.add(t.children[e]);return this},i.prototype.destroy=function(){this.ticking&&u.remove(this.tick,this),this.ticking=!1,this.addHooks=null,this.uploadHooks=null,this.renderer=null,this.completes=null,this.queue=null},h.WebGLRenderer.registerPlugin("prepare",i)},{"../../core":62}],170:[function(t,e,r){(function(r){t("./polyfill");var i=e.exports=t("./core");i.extras=t("./extras"),i.filters=t("./filters"),i.interaction=t("./interaction"),i.loaders=t("./loaders"),i.mesh=t("./mesh"),i.particles=t("./particles"),i.accessibility=t("./accessibility"),i.extract=t("./extract"),i.prepare=t("./prepare"),i.loader=new i.loaders.Loader,Object.assign(i,t("./deprecation")),r.PIXI=i}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./accessibility":41,"./core":62,"./deprecation":119,"./extract":121,"./extras":129,"./filters":140,"./interaction":145,"./loaders":148,"./mesh":156,"./particles":159,"./polyfill":165,"./prepare":168}]},{},[170])(170)});


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
module.exports = {
    manipulator:     require('./manipulations')
};

},{"./manipulations":12}],12:[function(require,module,exports){
"use strict";

var manipulator = exports;

manipulator.searchArrayElemByName = function(name, array){
  for(let i = 0; i < array.length; i++){
    let o = array[i];
    if(o.name  == name)
      return array[i];
  }
  return null;
}

manipulator.searchChildByName = function(name, object){
  return manipulator.searchArrayElemByName(name, object.children);
}

//to-do
manipulator.traverseData = function(object){
  return array;
}

manipulator.searchArrayElemByPropName = function(propName, propValue, array){
  //ES 5
  for(var i = 0; i < array.length; i++){
    var o = array[i];
    if(o[propName] == propValue)
      return array[i];
  }
  return null;
}

},{}],13:[function(require,module,exports){
module.exports = {
    common: require('./common/'),
    loader: require('./loader/'),
    sceneManagement : require('./sceneManagement/'),
    objectManagement : require('./objectManagement/')
};

},{"./common/":11,"./loader/":16,"./objectManagement/":23,"./sceneManagement/":32}],14:[function(require,module,exports){
"use strict";


var assetManager = exports;

var pixi = require('pixi.js');

var assetLoader = require('./loaders/assetLoader.js');
var animAssetLoader = require('./loaders/animAssetLoader.js');
var fileLoader = require('./loaders/fileLoader.js');
var manipulator = require('./../common/manipulations.js');
var callbackFunc = null;
var callbackFuncArgs = null;

//contains all of the visual assets
assetManager.loader = pixi.loader;
assetManager.animations = [];

assetManager.loadImageBatch = function(args, callback){
  var ctr = 0;
  var toLoad = args.assets.length;
  args.assets.forEach(elm=>{
    //console.log("name: " + elm.name + " path: " + (args.pathPrefix + elm.path));
    loadFile(elm.name, args.pathPrefix + elm.path);
  })

  function loadFile(name, path){
    assetManager.loader.add(name, path);
    assetManager.loader.once('complete', loadCallback);
    assetManager.loader.load();
  }

  function loadCallback(){
    ctr++;
    if(ctr == toLoad)
      callback();
  }
}

assetManager.loadAnimBatch = function(args, callback){
  var ctr = 0;
  var toLoad = 0;
  var assetArr = args.assets;
  var animDataKeys = Object.keys(assetArr);
  animDataKeys.forEach(key=>{
    var elem = assetArr[key];
    toLoad = elem.assetCount * animDataKeys.length;
    var sInd;
    elem.startIndex != null ? sInd = elem.startIndex : sInd = 0;
    for(var i = sInd; i < sInd + elem.assetCount; i++){
      if(i < 10)
        var ind = "0" + i.toString();
      else {
        var ind = i;
      }
      var name = elem.assetPref + (i - sInd);
      assetManager.loader.add(name, elem.path + elem.assetPref + ind + "." + elem.fileType);
      assetManager.loader.once('complete', loadCallback);
      assetManager.loader.load();
    }
  });
  function loadCallback(){
    ctr++;
    if(ctr == toLoad){
      callback();
    }
  }
}

function createAnimAssetBatchCallback(o){
    assetManager.registerAnimAssetBatch(o);
}

assetManager.registerAssetBatch = function(o, type = null){
  switch (type) {
    case "image":
      assetManager.assets.push(o);
      break;
    case "animation":
      assetManager.animAssets.push(o);
      break;
    case "sound":
      assetManager.soundAssets.push(o);
      break;
    default:
      assetManager.assets.push(o);
      break;
  }
  assetManager.assets.push(o);
}

assetManager.registerAnimAssetBatch = function(o){
  assetManager.animAssets.push(o);
}

assetManager.findBatchByName = function(name){
  return manipulator.searchArrayElemByName(name, assetManager.assets);
}

assetManager.findBatchBySceneName = function(sceneName){
  return manipulator.searchArrayElemByPropName("scene", sceneName, assetManager.assets);
}

},{"./../common/manipulations.js":12,"./loaders/animAssetLoader.js":17,"./loaders/assetLoader.js":18,"./loaders/fileLoader.js":19,"pixi.js":10}],15:[function(require,module,exports){
"use strict";

var dataManager = exports;

var fileLoader = require('./loaders/fileLoader.js');
var manipulator = require('./../common/manipulations.js');

//all of below are optional to use
dataManager.gameData;
dataManager.settingsData;
dataManager.sceneData = [];
dataManager.assetData = [];
dataManager.animData = [];
//--------end - optional----------

//to keep any kind of data. also optional
dataManager.dataPile = [];

var loadFinishedCallbackFunction;

var loadedCount = 0;
var toLoad = 0;


dataManager.loadData = function(path, callbackFunction, dataType = null ,fileType = "json"){
  toLoad = 0;
  fileLoader.loadFile(path, loadDataCallback, callbackFunction, dataType, fileType);
}

function loadDataCallback(data, callbackFunction, dataType){
  dataManager.registerData(data, dataType);

  if(toLoad == 0)
    callbackFunction(JSON.parse(data));
  else{
    if(checkFinished(toLoad))
      loadFinishedCallbackFunction();
  }

}

dataManager.loadAllGameData = function(gameDataFilePath, callback){
  fileLoader.loadFile(gameDataFilePath, loadAllGameDataCallback);
  loadFinishedCallbackFunction = callback;
}

function loadAllGameDataCallback(data){
  //console.log(JSON.parse(data));
  dataManager.registerData(data, "gameData");
  let datKeys = Object.keys(dataManager.gameData.dataFiles);
  toLoad = 0;
  loadedCount = 0;

  //how many files to be loaded?
  datKeys.forEach(datKey=>{
    dataManager.gameData.dataFiles[datKey].forEach(fKey => {
      toLoad++;
    })
  });

  //load data files
  datKeys.forEach(datKey => {
    let datElems = dataManager.gameData.dataFiles[datKey];

    var datType = "";
    datElems.forEach(datElem=>{
      switch (datKey) {
        case "settingsDataFiles":
          datType = "settingsData";
          break;
        case "assetDataFiles":
          datType = "assetData";
          break;
        case "sceneDataFiles":
          datType = "sceneData";
          break;
        default:
          datType = data.name;
          break;
      }
      fileLoader.loadFile(datElem.path, loadDataCallback, loadFinishedCallbackFunction, datType);
    });
  });
}

dataManager.registerData = function(data, dataType){
  switch(dataType){
    case "gameData":
      dataManager.gameData = JSON.parse(data);
      break;
    case "settingsData":
      dataManager.settingsData = JSON.parse(data);
      break;
    case "sceneData":
      dataManager.sceneData.push(JSON.parse(data));
      break;
    case "assetData":
      dataManager.assetData.push(JSON.parse(data));
      break;
    default:
      let o = Object();
      o.name = dataType;
      o.data = JSON.parse(data);
      dataManager.dataPile.push(o);
      break;
  }
}

dataManager.getAnimDataByName = function(name, dataBatch = dataManager.assetData){
  var animData = manipulator.searchArrayElemByPropName("type", "animation", dataBatch);
  var animKeys = Object.keys(animData.assets);
  var returnVal;
  animKeys.forEach(animKey => {
    if(animKey == name){
      returnVal = animData.assets[animKey];
    }
  });
  return returnVal;
}

dataManager.getAssetDataByName = function(name, dataBatch = dataManager.assetData){
  return manipulator.searchArrayElemByName(name, dataBatch);
}

dataManager.getSceneDataByName = function(name, dataBatch = dataManager.sceneData){
  return manipulator.searchArrayElemByName(name, dataBatch);
}

function checkFinished(total){
  loadedCount++;
  if(loadedCount == toLoad)
    return true;
  else
    return false;
}

},{"./../common/manipulations.js":12,"./loaders/fileLoader.js":19}],16:[function(require,module,exports){
module.exports = {
    loaders: require('./loaders/'),
    assetManager: require('./assetManager'),
    dataManager : require('./dataManager')
};

},{"./assetManager":14,"./dataManager":15,"./loaders/":21}],17:[function(require,module,exports){
"use strict";

var pixi = require('pixi.js');

module.exports = function(args){
    var callbackFunc;

    var loader = pixi.loader;
    var counter = 0;
    var toLoad = 0;

    var loadObject = new Object();
    var startIndex;
    var pileName;

    this.Load = function(key, callback){
        pileName = key;
        console.log("path: " + args.path);
        args.startIndex != null ? startIndex = args.startIndex : startIndex = 0;
        console.log("startIndex: "+ args.count);
        callbackFunc = callback;
        toLoad = args.count;
        for(let i = startIndex; i < (args.startIndex + args.count); i++){
          console.log("loading");
          if(i < 10)
            var ind = "0" + i.toString();
          else
            var ind = i;
          loader.add(args.assetPref + ind, args.path + args.assetPref + ind + "." + args.fileType);
          loader.once('complete', onAssetsLoaded);
          loader.load();
        }
    }

    function onAssetsLoaded(){
      console.log("checking");
        counter++;
        if(counter == toLoad){
          loadObject.name = pileName;
          loadObject.type = args.type;
          loadObject.scene = args.scene;
          loadObject.loader = loader;
          callbackFunc(loadObject);
        }
    }
    return this;
}

},{"pixi.js":10}],18:[function(require,module,exports){
"use strict";

var pixi = require('pixi.js');

module.exports = function(args){
    var callbackFunc;

    var loader = pixi.loader;
    var counter = 0;

    var loadObject = new Object();

    this.Load = function(callback){
      console.log("loading asset: ");
        callbackFunc = callback;
        args.assets.forEach(v =>{
            loader.add(v.name, args.pathPrefix + v.path);
            loader.once('complete', onAssetsLoaded);
            loader.load();
        });
    }

    function onAssetsLoaded(){
        counter++;
        if(counter == args.assets.length){
          loadObject.name = args.name;
          loadObject.type = args.type;
          loadObject.scene = args.scene;
          loadObject.loader = loader;
          callbackFunc(loadObject);
        }
    }
    return this;
}

},{"pixi.js":10}],19:[function(require,module,exports){
"use strict";

var fileLoader = exports;
var dataManager = require('./../dataManager.js');

//loads text file from server, casts its MIME type
//when load is finished, executes callback function
fileLoader.loadFile = function (path, callback, callbackVar = null, dataType = null, fileType = "json") {
    var fileObject = new XMLHttpRequest();
    switch (fileType) {
      case "json":
        fileObject.overrideMimeType("application/json");
        break;
      case "xml":
        fileObject.overrideMimeType("text/xml");
        break;
      default:
        fileObject.overrideMimeType("application/json");
        break;
    }

    fileObject.open('GET', path, true);

    fileObject.onreadystatechange = function() {
        if (fileObject.readyState == 4 && fileObject.status == "200") {
          if(callbackVar != null){
            if(dataType != null)
              callback(fileObject.responseText, callbackVar, dataType);
            else
              callback(fileObject.responseText, callbackVar);
          }
          else
            callback(fileObject.responseText)
        }
    }
    fileObject.send(null);
}

},{"./../dataManager.js":15}],20:[function(require,module,exports){
//to change load size in main json file

},{}],21:[function(require,module,exports){
module.exports = {
    assetLoader: require('./assetLoader'),
    animAssetLoader: require('./animAssetLoader'),
    fileLoader : require('./fileLoader'),
    fileWriter: require('./fileWriter'),
    jsonProcessor : require('./jsonProcessor')
};

},{"./animAssetLoader":17,"./assetLoader":18,"./fileLoader":19,"./fileWriter":20,"./jsonProcessor":22}],22:[function(require,module,exports){
var jsonProcessor = exports;

},{}],23:[function(require,module,exports){
module.exports = {
    objectTypes: require('./objectTypes/'),
    objectManager: require('./objectManager')
};

},{"./objectManager":24,"./objectTypes/":30}],24:[function(require,module,exports){
"use strict";

var pixi = require('pixi.js');
var main = require('./../../');

var objectTypes = require('./objectTypes');

var dynamicTypes = objectTypes.dynamicTypes;
var gameObject = objectTypes.gameObject;
var container = objectTypes.container;
var button = objectTypes.button;
var textObject = objectTypes.textObject;

var assetManager =  require('./../loader/assetManager.js');
var manipulator = require('./../common/manipulations');

var objectManager = exports;

objectManager.objectBatch = [];

objectManager.setCommonProperties = function(o, args){
  //console.log("o: " + o + " args.name: " + args.name);

  args.name != null ? o.name = args.name : o.name = "";
  args.x != null ? o.position.x = args.x : o.position.x = 0;
  args.y != null ? o.position.y = args.y : o.position.y = 0;
  args.visible != null ? o.visible = args.visible : o.visible = true;
  args.tag != null ? o.tag = args.tag : o.tag = "none";
  if(args.width != null) o.width = args.width;
  if(args.height != null) o.height = args.height;
  if(args.states != null) o.states = args.states;
  o.interactive = true;
  args.buttonMode != null ? o.buttonMode = args.buttonMode : o.buttonMode = false;

  if(args.state != null)o.setState(args.state);

  return o;
}

objectManager.registerActions = function(o, args){

  if(args.actions!=null){
    if(args.actions.mouseDown != null){
      o.mousedown = function(){
        o.processState(args.actions.mouseDown);
      }
    }
    if(args.actions.mouseUp != null){
      o.mouseup = function(){
        o.processState(args.actions.mouseUp)
      }
    }
    if(args.actions.mouseOver != null){
      o.mouseover = function(){
        o.processState(args.actions.mouseOver)
      }
    }
    if(args.actions.mouseOut != null){
      o.mouseout = function(){
        o.processState(args.actions.mouseOut)
      }
    }
    if(args.actions.click != null){
      o.click = function(){
        o.processState(args.actions.click)
      }
    }
    if(args.actions.touchStart != null){
      o.touchstart = function(){
        o.processState(args.actions.touchstart)
      }
    }
    if(args.actions.touchEnd != null){
      o.touchend = function(){
        o.processState(args.actions.touchend)
      }
    }
    if(args.actions.tap != null){
      o.tap = function(){
        o.processState(args.actions.tap)
      }
    }
    if(args.actions.mouseUpOutside != null){
      o.mouseupoutside = function(mouseData){
        o.mouseData = mouseData;
        o.processState(args.actions.mouseUpOutside)
      }
    }
    if(args.actions.mouseMove != null){
      o.mousemove = function(mouseData){
        o.mouseData = mouseData;
        o.processState(args.actions.mouseMove)
      }
    }
    if(args.actions.touchEndOutside != null){
      o.touchendoutside = function(mouseData){
        o.mouseData = mouseData;
        o.processState(args.actions.touchEndOutside)
      }
    }
    if(args.actions.touchMove != null){
      o.touchmove = function(mouseData){
        o.mouseData = mouseData;
        o.processState(args.actions.touchMove)
      }
    }
  }
  return o;
}

objectManager.setCommonFunctions = function(o){

  o.setProperty = function(args){
    args.foreach(e => {
      o[e.property] = e.value;
    })
  }

  o.executeFunction = function(name, args){
    o[name](args);
  }

  o.background = function(assetID){
    o.texture = assetManager.loader.resources[assetID].texture;
  }

  o.setProperty = function(args){
    //processes every key in the properties list and applies them to the object
    Object.keys(args).forEach(key => {
      //property set also can be defined as function such as "background"
      //where displayObject texture has to be changed and applied
      if(o[key].constructor === Function)
        o.executeFunction(key, args[key]);
      else
        //or it's a property to set.
        o[key] = args[key];
    });
  }

  o.setObjectProperty = function(args){
    var objToSet = objectManager.getObjectByName(args.target);
    //console.log("setting object property " + objToSet.displayObject.name);
    objToSet.displayObject.setProperty(args.props);
  }

  o.processState = function(args){
    if(args.constructor !== Array){
      Object.keys(args).forEach(key => {
        if(key != "state" && o[key].constructor === Function){
          o.executeFunction(key, args[key]);
        }else if(key == "state")
          o.setState(args[key]);
        else
          o[key] = args[key];
      });
    }
    else{
      args.forEach(elm => {
        Object.keys(elm).forEach(key => {
          if(key != "state" && o[key].constructor === Function){
            o.executeFunction(key, elm[key]);
          }else if(key == "state")
            o.setState(elm[key]);
          else
            o[key] = elm[key];
        });
      })
    }
  }

  o.setState = function(stateName){
    var args = o.states[stateName];
    o.processState(args);
  }

  o.executeDynamicCode = function(funcData){

    //determine if code in json file is written multi-line or single-line
    var codePart;
    if(funcData.code.constructor === Array){
      codePart = funcData.code.join(" ");
    }else {
      codePart = funcData.code;
    }

    var f = Function(codePart);
    f();
  }

  o.registerDynamicFunction = function(funcData){
    //determine if code in json file is written multi-line or single-line
    var codePart;
    if(funcData.code.constructor === Array){
      codePart = funcData.code.join(" ");
    }else {
      codePart = funcData.code;
    }

    let f = Function(...funcData.args, codePart);

    gameManager[funcData.functionName] = f;
  }

  o.executeDynamicFunction = function(funcData){
    let f = gameManager[funcData.functionName];
    f(...funcData.args);
  }
  return o;
}

objectManager.processProperty = function(o){

}

objectManager.createObject = function(args){
  //console.log("inisde createobject in object manager")
  switch (args.type) {
    case "object":
      //console.log("game object");
      return new gameObject().createObject(args);
    case "container":
      //console.log("container object");
      return new container().createObject(args);
    case "button":
      //console.log("button object");
      return  new button().createObject(args);
    case "textObject":
      //console.log("text object");
      return new textObject().createObject(args);
    case "dynamicObject":
      //console.log("dynamic object");
      return dynamicTypes.searchDynamicTypeByName(args.dynTypeName).createObject(args);
    default:
      return new gameObject().createObject(args);
  }
}

objectManager.registerObject = function(o){
  objectManager.objectBatch.push(o);
}

objectManager.getObjectByName = function(name){
  let v = manipulator.searchArrayElemByName(name, objectManager.objectBatch);
  return v;
}

objectManager.registerFunctionToObject = function(objectName, functionName, f){
  var o = objectManager.getObjectByName(objectName);
  o[functionName] = f;
}

objectManager.registerFunction = function(functionName, f){
  objectManager[functionName] = f;
}

//TO-DO
objectManager.broadcastMessage = function(o, args){

}

},{"./../../":35,"./../common/manipulations":12,"./../loader/assetManager.js":14,"./objectTypes":30,"pixi.js":10}],25:[function(require,module,exports){
"use strict";

var animation = exports;
var assetManager = require('./../../loader/assetManager.js');
var dataManager = require('./../../loader/dataManager.js');
//var slot = require('./../slot/slot.js');

module.exports = function(){
  var mc;
  this.createObject = function(args){

    var data = dataManager.getAnimDataByName(args);
    console.log(data);
    this.name = args;

    var resources = gameManager.assetManager.loader.resources;
    //console.log(resources);
    var textureArray = [];
    for (let i=0; i < data.assetCount; i++)
    {
        textureArray.push(resources[data.assetPref + i].texture);
    };

    mc = new PIXI.MovieClip(textureArray);

    this. displayObject = mc;
    return mc;
  }

  this.playAnimation = function(animName){
      mc.play();
  }

  this.stopAnimation = function(){
      mc.stop();
  }

  this.gotoAndPlay = function(ind){
      mc.gotoAndPlay(ind);
  }
  return this;
}

},{"./../../loader/assetManager.js":14,"./../../loader/dataManager.js":15}],26:[function(require,module,exports){
"use strict";

var objectManager = require('./../objectManager.js');
var assetManager = require('./../../loader/assetManager.js');
var pixi = require('pixi.js');

module.exports = function(){

  this.createObject = function(args){
    this.name = args.name;

    //*********************create sprite**********************
    var bgAsset;
    if(args.images != null && args.images.default != null){
      bgAsset = args.images.default;
    }
    else {
      bgAsset = args.background;
    }
    //var batch = assetManager.findBatchByName(assetNameArr[0]);

    var o = new pixi.Sprite(assetManager.loader.resources[bgAsset].texture);
    //********************end create-sprite*******************

    o = objectManager.setCommonProperties(o, args);

    o = objectManager.setCommonFunctions(o);

    o.clicked = false;

    args.toggleButton != null ? o.toggleButton = args.toggleButton : o.toggleButton = false;
    args.active != null ? o.active = args.active : o.active = true;

    if(args.images != null){
      args.images.default != null ? o.defaultImage = args.images.default : o.defaultImage = args.background;
      o.clickedImage = args.images.clicked;
      o.activeImage = args.images.active;
      o.passiveImage = args.images.passive;
      o.overImage = args.images.over;
      o.downImage = args.images.down;
      o.upImage = args.images.up;
    }

    o.parentObj = this;

    this.displayObject = o;

    objectManager.registerObject(this);

    o.setTexture = function(textureName){
      o.texture = assetManager.loader.resources[textureName].texture;
    }

    o.mousedown = function(){
      if(args.actions != null && args.actions.mouseDown != null)
        o.processState(args.actions.mouseDown);
    }

    o.mouseup = function(){
      if(args.actions != null && args.actions.mouseUp != null)
        o.processState(args.actions.mouseUp)
    }

    o.mouseover = function(){
      if(o.active){
        if(o.toggleButton){
          if(!o.clicked){
            if(o.overImage != null)
              o.setTexture(o.overImage);
          }
        }else {
          if(o.overImage != null)
            o.setTexture(o.overImage);
        }
      }
      if(args.actions != null && args.actions.mouseOver != null)
        o.processState(args.actions.mouseOver)
    }

    o.mouseout = function(){
      if(o.active && !o.clicked)
          o.setTexture(o.defaultImage);
      if(args.actions != null && args.actions.mouseOut != null)
        o.processState(args.actions.mouseOut)
    }

    o.click = function(){
      if(o.toggleButton)
        o.toggle();
      if(args.actions != null && args.actions.click != null)
        o.processState(args.actions.click)
    }
    /*
      if(args.actions.touchStart != null){
        o.touchstart = function(){
          o.processState(args.actions.touchstart)
        }
      }
      if(args.actions.touchEnd != null){
        o.touchend = function(){
          o.processState(args.actions.touchend)
        }
      }
      if(args.actions.tap != null){
        o.tap = function(){
          o.processState(args.actions.tap)
        }
      }
      if(args.actions.mouseUpOutside != null){
        o.mouseupoutside = function(mouseData){
          o.mouseData = mouseData;
          o.processState(args.actions.mouseUpOutside)
        }
      }
      if(args.actions.mouseMove != null){
        o.mousemove = function(mouseData){
          o.mouseData = mouseData;
          o.processState(args.actions.mouseMove)
        }
      }
      if(args.actions.touchEndOutside != null){
        o.touchendoutside = function(mouseData){
          o.mouseData = mouseData;
          o.processState(args.actions.touchEndOutside)
        }
      }
      if(args.actions.touchMove != null){
        o.touchmove = function(mouseData){
          o.mouseData = mouseData;
          o.processState(args.actions.touchMove)
        }
      }
*/

    o.setActive = function(v){
      if(o.active){
        o.setTexture(o.passiveImage);
      }
      else{
        if(o.activeImage != null)
          o.setTexture(o.activeImage);
        else
          o.setTexture(o.defaultImage);
      }
      o.active = v;
    }

    o.toggleActive = function(){
      if(o.active){
        o.setTexture(o.passiveImage);
        o.active = false;
      }
      else{
        if(o.activeImage != null)
          o.setTexture(o.activeImage);
        else
          o.setTexture(o.defaultImage);

        o.active = true;
      }
    }

    o.toggle = function(){
      if(o.toggleButton && o.active){
        if(!o.clicked){
          o.clicked = true;
          if(o.clickedImage!=null)
            o.setTexture(o.clickedImage);
        }else{
          o.clicked = false;
          o.setTexture(o.defaultImage);
        }
      }
    }
    return o;
  }

  return this;
}

},{"./../../loader/assetManager.js":14,"./../objectManager.js":24,"pixi.js":10}],27:[function(require,module,exports){
"use strict";

var objectManager = require('./../objectManager.js');

var pixi = require('pixi.js');
module.exports = function(){

  this.createObject = function(args){
    this.name = args.name;
    var o = new pixi.Container(true);
    o = objectManager.setCommonProperties(o, args);

    this.displayObject = o;
    objectManager.registerObject(this);

    return o;
  }

  return this;
}

},{"./../objectManager.js":24,"pixi.js":10}],28:[function(require,module,exports){
"use strict";
var manipulator = require('./../../common/manipulations.js');
var dynamicTypes = exports;

dynamicTypes.types = [];

dynamicTypes.registerDynamicObjectType = function(o){
  dynamicTypes.types.push(o);
}

dynamicTypes.searchDynamicTypeByName = function(name){
  return manipulator.searchArrayElemByPropName("dynTypeName", name, dynamicTypes.types);
}

},{"./../../common/manipulations.js":12}],29:[function(require,module,exports){
"use strict";

var objectManager = require('./../objectManager.js');
var assetManager = require('./../../loader/assetManager.js');
var pixi = require('pixi.js');

module.exports = function(){

  this.createObject = function(args){
    this.name = args.name;
    //find corresponding loader

    //var batch = assetManager.findBatchByName(assetNameArr[0]);

    var texture = assetManager.loader.resources[args.background].texture;
    //console.log("creating " + args.name + "bg: " + assetNameArr[1] + " texture: " + texture);

    var o = new pixi.Sprite(texture);

    o = objectManager.setCommonProperties(o, args);

    o = objectManager.setCommonFunctions(o);

    o = objectManager.registerActions(o, args);

    o.parentObj = this;

    this.displayObject = o;

    objectManager.registerObject(this);

    return o;
  }

  return this;
}

},{"./../../loader/assetManager.js":14,"./../objectManager.js":24,"pixi.js":10}],30:[function(require,module,exports){
module.exports = {
    animation: require('./animation'),
    button : require('./button'),
    container: require('./container'),
    dynamicTypes : require('./dynamicTypes'),
    gameObject: require('./gameObject'),
    textObject : require('./textObject')
};

},{"./animation":25,"./button":26,"./container":27,"./dynamicTypes":28,"./gameObject":29,"./textObject":31}],31:[function(require,module,exports){
"use strict";

var objectManager = require('./../objectManager.js');

var pixi = require('pixi.js');
module.exports = function(){

  this.createObject = function(args){
    this.name = args.name;
    var fFamily;
    args.props.fontFamily == null ? fFamily = 'Arial' : fFamily = args.props.fontFamily;
    var fSize;
    args.props.fontSize == null ? fSize = 20 : fSize = args.props.fontSize;
    var fFill;
    args.props.fill == null ? fFill = 0xffffff : fFill = args.props.fill;
    var fAlign;
    args.props.align == null ? fAlign = 'left' : fAlign = args.props.align;
    var text = new PIXI.Text(args.content,{fontFamily : fFamily, fontSize: fSize, fill : fFill, align : fAlign});
    text.name = args.name;

    args.x == null ? text.position.x = 0 : text.position.x = args.x;
    args.y == null ? text.position.y = 0 : text.position.y = args.y;
    args.visible == null ? text.visible = true : text.visible = args.visible;

    text.setProperty = function(args){
      args.foreach(e => {
        text[e.property] = e.value;
      })
    }

    text.executeFunction = function(name, args){
      text[name](args);
    }

    text.background = function(assetID){
      /*var assetNameArr = assetID.split(".");
      var batch = assetManager.findBatchByName(assetNameArr[0]);

      text.texture = batch.loader.resources[assetNameArr[1]].texture;*/
    }

    text.content = function(txt){
      text.setText(txt);
    }

    text.setProperty = function(args){
      //processes every key in the properties list and applies them to the object
      Object.keys(args).forEach(key => {
        //property set also can be defined as function such as "background"
        //where displayObject texture has to be changed and applied
        if(text[key].constructor === Function)
          text.executeFunction(key, args[key]);
        else
          //or it's a property to set.
          text[key] = args[key];
      });
    }

    text.setObjectProperty = function(args){
      var objToSet = objectManager.getObjectByName(args.target);
      objToSet.displayObject.setProperty(args.props);
    }

    text.processState = function(args){
      if(args.constructor !== Array){
        Object.keys(args).forEach(key => {
          if(key != "state" && text[key].constructor === Function){
            text.executeFunction(key, args[key]);
          }else if(key == "state")
            text.setState(args[key]);
          else
            text[key] = args[key];
        });
      }
      else{
        args.forEach(elm => {
          Object.keys(elm).forEach(key => {
            if(key != "state" && text[key].constructor === Function){
              text.executeFunction(key, elm[key]);
            }else if(key == "state")
              text.setState(elm[key]);
            else
              text[key] = elm[key];
          });
        })
      }
    }

    text.setState = function(stateName){
      var args = text.states[stateName];
      text.processState(args);
    }

    text.executeDynamicCode = function(funcData){

      //determine if code in json file is written multi-line or single-line
      var codePart;
      if(funcData.code.constructor === Array){
        codePart = funcData.code.join(" ");
      }else {
        codePart = funcData.code;
      }

      var f = Function(codePart);
      f();
    }

    text.registerDynamicFunction = function(funcData){
      //determine if code in json file is written multi-line or single-line
      var codePart;
      if(funcData.code.constructor === Array){
        codePart = funcData.code.join(" ");
      }else {
        codePart = funcData.code;
      }

      let f = Function(...funcData.args, codePart);

      gameManager[funcData.functionName] = f;
    }

    text.executeDynamicFunction = function(funcData){
      let f = gameManager[funcData.functionName];
      f(...funcData.args);
    }

    this.displayObject = text;

    objectManager.registerObject(this);

    return text;
  }

  return this;
}

},{"./../objectManager.js":24,"pixi.js":10}],32:[function(require,module,exports){
module.exports = {
    sceneManager:     require('./sceneManager'),
    scene: require('./scene')
};

},{"./scene":33,"./sceneManager":34}],33:[function(require,module,exports){
/******************************************************************************
Scene is simply a pixi container. There can be multiple scenes in a game so
there can be multiple instances of scene class. All scnes are manipulated by
sceneManager class which is a singleton.
*******************************************************************************/
"use strict";

var dataManager = require('./../loader/dataManager.js');
var objectManager = require('./../objectManagement/objectManager.js');
var pixi = require('pixi.js');

//constructor
module.exports = function(data){
  this.name = data.name;

  this.container = new pixi.Container(true);


/*member functions*************************************************************/
  this.initScene = function(data){
    this.createScene(data);
  }

  this.createScene = function(data){
    //console.log("scene '" + this.name + "' is getting created");
    let d = this.traverse(data.scene);

    d.forEach(v => {
      this.container.addChild(v);
    });

    return this;
  }

  this.addObject = function(object){
    this.addChild(object);
  }

  this.show = function(args){
    this.visible = true;
  }

  this.hide = function(args){
    this.visible = false;
  }

  this.traverse = function(p){
      var objArr = new Array();
      for(let i = 0; i < p.length; i++){
          //console.log("creating object: " + p[i].name + " objectManager: " + objectManager);
          let v = objectManager.createObject(p[i]);
          if(v!=null){
              objArr.push(v);
              if(p[i].children!=undefined){
                  let ob = this.traverse(p[i].children);
                  for(let j = 0; j < ob.length;j++)
                      v.addChild(ob[j]);
              }
          }
      }
      return objArr;
  }

  this.initScene(data);
}
/*end-member functions*********************************************************/

},{"./../loader/dataManager.js":15,"./../objectManagement/objectManager.js":24,"pixi.js":10}],34:[function(require,module,exports){
"use strict";

var pixi = require('pixi.js');
var scene = require('./scene.js');
var manipulator = require('./../common/manipulations.js');
var dataManager = require('./../loader/dataManager.js');

var sceneManager = exports;

sceneManager.scenes = [];
sceneManager.currentScene;

sceneManager.initScenes = function(){

}

sceneManager.createScene = function(args){
  //to-do
  //sceneManager.scenes.push(new scene(args));
  return new scene(args);
}

sceneManager.getSceneByName = function(name){
  return manipulator.searchArrayElemByName(name, sceneManager.scenes);
}

sceneManager.openScene = function(name){
  sceneManager.currentScene.hide();
  sceneManager.getSceneByName(name).show();
}

sceneManager.closeScene = function(name){
  sceneManager.getSceneByName(name).hide();
}

sceneManager.closeCurrentScene = function(){
  sceneManager.currentScene.hide();
}

},{"./../common/manipulations.js":12,"./../loader/dataManager.js":15,"./scene.js":33,"pixi.js":10}],35:[function(require,module,exports){
var core = module.exports = require('./engine/');

},{"./engine/":13}]},{},[1]);
