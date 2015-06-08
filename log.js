
!function (tm,undefined){
    /**
     * 音ゲー (上から降ってくるタイプ)
     * タイミングは判定するとき audiocontext.currentTime と比較
     * タッチイベント類は update で取らずに、 window でやる
     * とりあえず、これではキーボードイベントでやってみる
     * DFJK
     * 68, 70, 74, 75
     * */

    var SCREEN_SIZE = 640;
    var ASSETS={
        bgm: 'sound/bgm/bgm_maoudamashii_neorock33.mp3',
        se: 'sound/se/se_maoudamashii_instruments_drum1_cymbal.mp3',
        snare: 'sound/se/se_maoudamashii_instruments_drum1_snare.mp3'
    };
    var window = tm.global;
    
    var display = tm.display;
    var Label = display.Label;
    var CanvasElement = display.CanvasElement;
    var context = tm.sound.WebAudio.context;
    var assetManager =tm.asset.AssetManager;
    var assets = assetManager.assets;
    
    var app;
    var pointing;
    
    tm.main(function(){
       app = tm.display.CanvasApp('#world');
       pointing = app.pointing;
       app.fps = 30;
       app.resize(SCREEN_SIZE,SCREEN_SIZE).fitWindow().background='#eee';
       app.replaceScene(tm.scene.LoadingScene({
           nextScene:GameScene,
           width:SCREEN_SIZE,
           height:SCREEN_SIZE,
           assets:ASSETS,
       }));
       app.run();
    });
    
    var GameScene = tm.define('',{
        superClass:tm.app.Scene,
        
        init:function(){
            this.superInit();
            var self = this;
            this.addChild(KeyButtonManager());
        },
        
        update:function(app){
            
        }
    });
    
    
    //譜面管理クラス
    var Music = tm.define('',{
        superClass:tm.event.EventDispatcher,
        
        score:null,
        delayTime:0,
        
        
        
        init:function(score){
            this.superInit();
            this.setScore(score);
            this.delayTime = context.currentTime;
        },
        
        setScore:function(score){
            this.score=score;
            return this;
        },
        
        setup:function(){
            
            return this;
        },
        
    });
    
    //楽譜クラス
    var Score = tm.define('',{
        superClass:tm.event.EventDispatcher,
        init:function(){
            this.superInit();
        }
    });
    
    //押すところ
    var KeyButton = tm.define('',{
        superClass:display.CircleShape,
        type:null,
        keyCode:null,
        _index:0,
        
        
        init:function(index){
            this.superInit({
                width:150,
                height:150,
                y: KeyButton.DEFAULT_Y,
                x: (index + 1) * 0.25 * SCREEN_SIZE - 80,
                lineWidth:10,
            }.$extend(KeyButton.KEY_PARAM[index]));
            
            this.type = KeyButton.TYPES[index];
            this.keyCode = KeyButton.KEY_CODES[index];
            this._index = index;
            
            this.addChild(Label(this.type).setFontSize(this.width));
        },
        
        push:function(){
            this.pushWave();
        },
        
        
        pushWave:function(){
            var wave = Wave(this.canvas);
            wave.$extend({
                x:this.x,
                y:this.y,
            });
            this.parent.addChild(wave);
        },
        
    });
    
    //ほわんってやつ
    var Wave =tm.define('',{
        superClass:display.Sprite,
        
        init:function(canvas){
            this.superInit(canvas);
        },
        
        update : function(app){
            if(this.alpha<0.1){this.remove();}
            this.setScale(this.scaleX + 0.1);
            this.alpha *= 0.82;
        }
    });
    
    var KeyButtonManager = tm.define('',{
        superClass:CanvasElement,
        
        keyButtonList : null,
        
        __keydown:null,
        __keyup:null,
        __mousedown:null,
        __touchstart:null,
        __touchend:null,
        
        
        
        init:function(){
            this.superInit();
            var self = this;
            self.keyButtonList=[];
            (4).times(function(i){
                self.keyButtonList.push (self.addChild(KeyButton(i)));
            });
            
            this.setup();
        },
        
        setup:function(){
            this.setOnkeydown();
            this.setOnmousedown();
            this.setOntouchstart();
        },
        
        close:function(){
            !{
                mousedown:this.__mousedown,
                keydown:this.__keydown,
                keyup:this.__keyup,
                touchstart:this.__touchstart,
                touchend:this.__touchend,
            }.$forIn(function(k,v){
               window.removeEventListener(k,v); 
            });
        },
        
        setOntouchstart:function(){
            var keyList = this.keyButtonList;
            var isTouch = [];
            
            this.__touchstart = function(e){
                var touches = e.changedTouches;
                for(var i = 0,len = touches.length;i<len;++i){
                    var _touch = touches[i];
                    var touch = KeyButtonManager.getPoint(_touch);
                    
                    keyList.some(function(e){
                       if(e._touch) return false;
                       if(e.isHitPointRect(touch.x,touch.y)){
                           e.push();
                           e._touch = _touch;
                           return true;
                       } 
                    });
                }
            };
            this.__touchend = function(e){
              var touches = e.changedTouches;
              for(var i = 0,len = touches.length;i<len;++i){
                    var _touch = touches[i];
                    
                    keyList.some(function(e){
                       if(!e._touch) return false;
                       if(e._touch === _touch){
                           e._touch = null;
                           return true;
                       }
                    });
                }
            };
            app.element.addEventListener('touchstart',this.__touchstart);
            app.element.addEventListener('touchend',this.__touchend);
        },
        
        
        setOnkeydown:function(){
            var codeList = [];
            var isDown = [0,0,0,0];
            var keyList = this.keyButtonList;
            keyList.forEach(function(e){
                codeList.push(e.keyCode);
            });
            this.__keydown = function(e){
                var index = codeList.indexOf(e.which);
                if(index===-1||isDown[index])return false;
                isDown[index] = true;
                keyList[index].push();
            };
            
            this.__keyup = function(e){
              var index = codeList.indexOf(e.which);
              if(index===-1 || !isDown[index])return false;
              isDown[index] = false;
            };
            window.addEventListener('keydown',this.__keydown,false);
            window.addEventListener('keyup',this.__keyup,false);
        },
        
        
        setOnmousedown:function(){
            
            var keyList = this.keyButtonList;
            
            this.__mousedown = function(e){
                var mouse = KeyButtonManager.getPoint(e);
                
                keyList.forEach(function(e){
                   e.isHitPointRect(mouse.x,mouse.y) && e.push(); 
                });
            };
            app.element.addEventListener('mousedown',this.__mousedown);
        },

    });
    
    KeyButtonManager.getPoint = function(e){
        var elm = app.element;
        var style = elm.style;
        
        var rect = elm.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        x*= elm.width / window.parseInt(style.width ,10);
        y*= elm.height / window.parseInt(style.height ,10);
        return {x:x,y:y};
    };
    
    KeyButton.$extend({
        TYPES: ['D','F','J','K'],
        KEY_CODES: [68, 70, 74, 75],
        TYPE_INDEX: {
            d: 0,
            f: 1,
            j: 2,
            k: 3,
            D: 0,
            F: 1,
            J: 2,
            K: 3,
        },
        KEY_PARAM:[
            {
                fillStyle:'#c55',
                strokeStyle:'#f77',
            },
            {
                fillStyle:'#55c',
                strokeStyle:'#77f',
            },
            {
                fillStyle:'#5c5',
                strokeStyle:'#7f7',
            },
            {
                fillStyle:'#bb2',
                strokeStyle:'yellow',
            },
        ],
        
        DEFAULT_Y: SCREEN_SIZE - 100,
    
    });
    
}(tm);