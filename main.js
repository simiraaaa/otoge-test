/// <reference path="tmlib.js"/>

/// <reference path="tmlib.js"/>
!function (tm, undefined) {

    /**
    ログから譜面を作る
    まず、始まったら、あらかじめ決めておいた表示可能領域までの譜面を表示する。
    譜面の描画順はあとから(一番手前が最前面)
    描画の更新はUPDATEで行う。

    */

    var SCREEN_SIZE = 640;
    var ASSETS = {
        bgm: 'sound/bgm/bgm_maoudamashii_neorock33.mp3',
        se: 'sound/se/se_maoudamashii_instruments_drum1_cymbal.mp3',
        snare: 'sound/se/se_maoudamashii_instruments_drum1_snare.mp3'
    };
    var window = tm.global;

    var display = tm.display;
    var Label = display.Label;
    var CanvasElement = display.CanvasElement;
    var context = tm.sound.WebAudio.context;
    var assetManager = tm.asset.AssetManager;
    var assets = assetManager.assets;


    //押した判定n秒以内
    //1秒以内は無視する
    var CHECKER = {
        just: 0.1,
        good: 0.25,
        bad: 0.4,
        miss: 0.6,
        none:1,
    };

    //3秒以内に押すやつまで表示
    var DRAW_TIME = 3.0;

    var app;
    var pointing;
    var otoge = {};
    var logger = tm.util.Log();
    logger.create(['D', 'F', 'J', 'K']);

    var SCORE = { "_order": ["D", "F", "J", "K"], "D": [4.672000000000001, 5.311999999999999, 10.360000000000001, 10.701333333333334, 11.010666666666667, 22.730666666666664, 23.461333333333332, 24.032, 25.050666666666665, 25.72, 27.072, 31.312, 34.61066666666667, 38.552, 39.90133333333333, 44.752, 44.94133333333333, 45.141333333333336, 45.49066666666667, 45.68, 45.800000000000004, 47.62133333333333, 47.98133333333334, 48.352000000000004, 48.68, 49.120000000000005, 49.792, 51.832, 52.53066666666667, 52.93066666666667, 53.072, 53.45066666666667, 53.6, 53.992000000000004, 54.141333333333336, 54.512, 55.800000000000004, 56.41066666666667, 57.080000000000005, 57.69066666666667, 58.312000000000005, 58.992000000000004, 59.36, 59.89066666666667, 60.432, 61.080000000000005, 61.730666666666664, 62.38133333333333, 63.032, 63.66133333333333, 64.30133333333333, 70.12, 70.52, 71.09066666666666, 71.272, 74.04, 74.72, 75.37066666666666, 76.02133333333333, 76.34133333333334], "F": [1.04, 3.621333333333333, 4.68, 6.352, 6.701333333333334, 6.9013333333333335, 7.181333333333333, 7.3919999999999995, 7.9013333333333335, 8.170666666666667, 8.592, 11.701333333333334, 12.330666666666668, 12.992, 13.610666666666667, 16.18133333333333, 16.490666666666666, 17.090666666666664, 20.70133333333333, 21.151999999999997, 21.741333333333333, 22.050666666666665, 22.72, 23.421333333333333, 24.032, 24.68, 25.4, 26.06133333333333, 26.84, 29.479999999999997, 29.639999999999997, 29.810666666666666, 29.992, 30.381333333333334, 30.69066666666667, 31.010666666666662, 31.591999999999995, 31.981333333333335, 32.25066666666667, 32.53066666666667, 34.04, 35.501333333333335, 36.92, 38.2, 39.57066666666667, 42.792, 42.952000000000005, 43.120000000000005, 43.30133333333333, 43.45066666666667, 43.73066666666667, 43.992000000000004, 44.28, 44.57066666666667, 46.072, 46.221333333333334, 46.440000000000005, 46.632000000000005, 46.81066666666667, 47, 47.17066666666667, 47.56, 47.912, 48.26133333333333, 48.592, 48.800000000000004, 49.45066666666667, 50.17066666666667, 50.32, 50.552, 50.872, 51.032000000000004, 52.192, 54.330666666666666, 54.800000000000004, 56.832, 58.04, 60.760000000000005, 63.352000000000004, 64.74133333333333, 65.32000000000001, 65.912, 66.09066666666666, 66.4, 66.70133333333334, 67.02133333333333, 67.33066666666667, 67.66133333333333, 67.952, 68.28, 68.60000000000001, 68.93066666666667, 69.29066666666667, 69.56, 69.912, 71.552, 71.98133333333334, 72.32000000000001, 73, 73.62133333333334, 74.37066666666666, 75.032, 75.712, 76.19200000000001, 76.50133333333333], "J": [0.8906666666666667, 1.0613333333333332, 2.0613333333333332, 2.1919999999999997, 2.3813333333333335, 3.44, 3.7706666666666666, 4.690666666666667, 5.981333333333334, 6.1306666666666665, 11.381333333333334, 12.040000000000001, 12.68, 13.32, 14.000000000000002, 14.160000000000002, 14.690666666666667, 14.831999999999999, 15.341333333333333, 15.501333333333333, 16, 16.32, 16.631999999999998, 17.36, 18.08, 18.741333333333333, 19.38133333333333, 20.04, 20.712, 21.170666666666666, 21.752, 22.06133333333333, 22.712, 23.410666666666664, 24.050666666666665, 24.690666666666665, 25.38133333333333, 26.06133333333333, 26.671999999999997, 30.151999999999997, 30.84, 31.471999999999998, 32.112, 32.4, 32.821333333333335, 34.032000000000004, 35.330666666666666, 36.72, 38.04, 39.432, 40.74133333333334, 41.32, 42.032000000000004, 42.36, 42.712, 42.872, 43.04, 43.21066666666667, 43.36, 43.832, 44.38133333333334, 44.672000000000004, 44.84, 44.98133333333334, 45.141333333333336, 45.30133333333333, 45.472, 45.64, 45.792, 45.952000000000005, 46.120000000000005, 46.28, 46.58133333333333, 46.752, 47.080000000000005, 47.2, 47.480000000000004, 47.821333333333335, 48.21066666666667, 48.53066666666667, 48.781333333333336, 49.461333333333336, 50.13066666666667, 50.26133333333333, 50.81066666666667, 50.94133333333333, 51.501333333333335, 52.192, 54.32, 54.81066666666667, 56.832, 58.05066666666667, 60.77066666666667, 63.352000000000004, 64.68, 64.82133333333334, 65.26133333333334, 65.41066666666667, 65.84, 65.98133333333334, 66.50133333333333, 67.13066666666667, 67.77066666666667, 68.4, 69.08, 69.712, 71.47200000000001, 72.16, 74.06133333333334, 74.73066666666666, 75.38133333333333, 76.04, 76.37066666666666], "K": [4.68, 5.32, 6.4719999999999995, 7.0213333333333345, 7.730666666666666, 8.410666666666668, 9.112, 9.701333333333334, 10.360000000000001, 10.701333333333334, 11.021333333333335, 11.690666666666667, 12.32, 12.992, 13.621333333333334, 14.312, 14.991999999999999, 15.680000000000001, 16.831999999999997, 17.730666666666664, 18.36, 19.032, 19.70133333333333, 20.352, 22.4, 23.06133333333333, 23.730666666666664, 24.370666666666665, 25.050666666666665, 25.72, 26.410666666666664, 27.450666666666667, 28, 28.639999999999997, 29.272, 30.52, 31.16, 31.781333333333333, 33.461333333333336, 34.6, 35.970666666666666, 37.392, 37.69066666666667, 38.392, 39.74133333333334, 43.58133333333333, 44.101333333333336, 46.4, 46.90133333333333, 47.41066666666667, 47.752, 48.13066666666667, 48.472, 49.13066666666667, 49.800000000000004, 50.42133333333334, 51.141333333333336, 51.85066666666667, 52.541333333333334, 52.90133333333333, 53.05066666666667, 53.440000000000005, 53.61066666666667, 53.992000000000004, 54.141333333333336, 54.52, 55.800000000000004, 56.416000000000004, 57.101333333333336, 57.70133333333334, 58.32, 58.992000000000004, 59.36, 59.89066666666667, 60.440000000000005, 61.09066666666667, 61.72, 62.38133333333333, 63.032, 63.68000000000001, 64.30133333333333, 66.17066666666666, 66.8, 67.432, 68.08, 68.74133333333333, 69.392, 70.08, 70.53066666666668, 71.10133333333333, 71.30133333333333, 71.8, 72.45066666666666, 73, 73.632, 74.36, 75.04, 75.70133333333334, 76.232] };



    tm.main(function () {
        app = tm.display.CanvasApp('#world');
        pointing = app.pointing;
        app.fps = 30;
        app.resize(SCREEN_SIZE, SCREEN_SIZE).fitWindow().background = '#eee';
        var isSoundAvailable = false;
        var func;
        window.addEventListener('touchstart', func = function (e) {
            if (isSoundAvailable) return false;
            isSoundAvailable = true;
            tm.sound.WebAudio.unlock();
            window.removeEventListener('touchstart', func);
        });

        app.replaceScene(tm.game.LoadingScene({
            nextScene: GameScene,
            width: SCREEN_SIZE,
            height: SCREEN_SIZE,
            assets: ASSETS,
        }));
        app.run();
    });

    var GameScene = tm.define('', {
        superClass: tm.app.Scene,

        init: function () {
            this.superInit();
            var bgm = assets.bgm.clone();
            bgm.play();
            otoge.delayTime = context.currentTime;

            var self = this;
            KeyButton.SE = [assets.se, assets.snare, assets.snare, assets.se];
            this.addChild(KeyButtonManager());
        },

        update: function (app) {

        }
    });

    //譜面描画クラス
    var ScoreWriter = tm.define('', {
        superClass: CanvasElement,
        score: null,
        _elements:null,

        init: function (score) {
            this.superInit();
            this.setScore(score);
            this._elements = {
                D: [],
                F: [],
                J: [],
                K: [],
            };

        },

        getRelativeTime: function () {
            return context.currentTime - otoge.delayTime;
        },


        //描画する対象になる時間を入れていく
        check: function () {
            var score = this.score;
            var elms = this._elements;
            var rTime = this.getRelativeTime();
            score._order.forEach(function (k) {
                var s = score[k];
                var _e = elms[k];
                for (var i = 0, len = s.length; i < len; ++i) {
                    var t = s[i];
                    if (DRAW_TIME < t) break;
                    _e.push(s.shift());
                }
            });
        },

        setScore: function (score) {
            this.score = score;
            return this;
        },

    });


    //譜面管理クラス
    var Music = tm.define('', {
        superClass: tm.event.EventDispatcher,

        score: null,
        delayTime: 0,



        init: function (score) {
            this.superInit();
            this.setScore(score);
            this.delayTime = context.currentTime;
        },

        setScore: function (score) {
            this.score = score;
            return this;
        },

        setup: function () {

            return this;
        },

    });

    //楽譜クラス
    var Score = tm.define('', {
        superClass: tm.event.EventDispatcher,
        init: function () {
            this.superInit();
        }
    });

    //押すところ
    var KeyButton = tm.define('', {
        superClass: display.CircleShape,
        type: null,
        keyCode: null,
        _index: 0,
        se: null,


        init: function (index) {
            this.superInit({
                width: 150,
                height: 150,
                y: KeyButton.DEFAULT_Y,
                x: (index + 1) * 0.25 * SCREEN_SIZE - 80,
                lineWidth: 10,
            }.$extend(KeyButton.KEY_PARAM[index]));

            this.type = KeyButton.TYPES[index];
            this.keyCode = KeyButton.KEY_CODES[index];
            this._index = index;
            this.se = KeyButton.SE[index];

            this.addChild(Label(this.type).setFontSize(this.width));
        },

        push: function () {
            this.se.clone().play();
            this.pushWave();
            //this.log();
        },

        check: function () {

        },

        log: function () {
            var o = {};
            o[this.type] = context.currentTime - otoge.delayTime;
            logger.push(o);
        },

        pushWave: function () {
            var wave = Wave(this.canvas);
            wave.$extend({
                x: this.x,
                y: this.y,
            });
            this.parent.addChild(wave);
        },

    });

    //ほわんってやつ
    var Wave = tm.define('', {
        superClass: display.Sprite,

        init: function (canvas) {
            this.superInit(canvas);
        },

        update: function (app) {
            if (this.alpha < 0.1) { this.remove(); }
            this.setScale(this.scaleX + 0.1);
            this.alpha *= 0.82;
        }
    });

    var KeyButtonManager = tm.define('', {
        superClass: CanvasElement,

        keyButtonList: null,

        __keydown: null,
        __keyup: null,
        __mousedown: null,
        __touchstart: null,
        __touchend: null,



        init: function () {
            this.superInit();
            var self = this;
            self.keyButtonList = [];
            (4).times(function (i) {
                self.keyButtonList.push(self.addChild(KeyButton(i)));
            });

            this.setup();
        },

        setup: function () {
            this.setOnkeydown();
            this.setOnmousedown();
            this.setOntouchstart();
        },

        close: function () {
            !{
                mousedown: this.__mousedown,
                keydown: this.__keydown,
                keyup: this.__keyup,
                touchstart: this.__touchstart,
                touchend: this.__touchend,
            }.$forIn(function (k, v) {
                window.removeEventListener(k, v);
            });
        },

        setOntouchstart: function () {
            var keyList = this.keyButtonList;
            var isTouch = [];

            this.__touchstart = function (e) {
                var touches = e.changedTouches;
                for (var i = 0, len = touches.length; i < len; ++i) {
                    var _touch = touches[i];
                    var touch = KeyButtonManager.getPoint(_touch);

                    keyList.some(function (e) {
                        if (e._touch) return false;
                        if (e.isHitPointRect(touch.x, touch.y)) {
                            e.push();
                            e._touch = _touch;
                            return true;
                        }
                    });
                }
            };
            this.__touchend = function (e) {
                var touches = e.changedTouches;
                for (var i = 0, len = touches.length; i < len; ++i) {
                    var _touch = touches[i];

                    keyList.some(function (e) {
                        if (!e._touch) return false;
                        if (e._touch === _touch) {
                            e._touch = null;
                            return true;
                        }
                    });
                }
            };
            app.element.addEventListener('touchstart', this.__touchstart);
            app.element.addEventListener('touchend', this.__touchend);
        },


        setOnkeydown: function () {
            var codeList = [];
            var isDown = [0, 0, 0, 0];
            var keyList = this.keyButtonList;
            keyList.forEach(function (e) {
                codeList.push(e.keyCode);
            });
            this.__keydown = function (e) {
                var index = codeList.indexOf(e.which);
                if (index === -1 || isDown[index]) return false;
                isDown[index] = true;
                keyList[index].push();
            };

            this.__keyup = function (e) {
                var index = codeList.indexOf(e.which);
                if (index === -1 || !isDown[index]) return false;
                isDown[index] = false;
            };
            window.addEventListener('keydown', this.__keydown, false);
            window.addEventListener('keyup', this.__keyup, false);
        },


        setOnmousedown: function () {

            var keyList = this.keyButtonList;

            this.__mousedown = function (e) {
                var mouse = KeyButtonManager.getPoint(e);

                keyList.forEach(function (e) {
                    e.isHitPointRect(mouse.x, mouse.y) && e.push();
                });
            };
            app.element.addEventListener('mousedown', this.__mousedown);
        },

    });

    KeyButtonManager.getPoint = function (e) {
        var elm = app.element;
        var style = elm.style;

        var rect = elm.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        x *= elm.width / window.parseInt(style.width, 10);
        y *= elm.height / window.parseInt(style.height, 10);
        return { x: x, y: y };
    };

    KeyButton.$extend({
        TYPES: ['D', 'F', 'J', 'K'],
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
        KEY_PARAM: [
            {
                fillStyle: '#c55',
                strokeStyle: '#f77',
            },
            {
                fillStyle: '#55c',
                strokeStyle: '#77f',
            },
            {
                fillStyle: '#5c5',
                strokeStyle: '#7f7',
            },
            {
                fillStyle: '#bb2',
                strokeStyle: 'yellow',
            },
        ],

        DEFAULT_Y: SCREEN_SIZE - 100,

    });

}(tm);