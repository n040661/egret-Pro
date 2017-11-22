/**
 *  虚拟杯
 * 
 * ( 用户信息和场地优化 new实例减少 )
 */

class Main extends egret.DisplayObjectContainer {

    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView: LoadingUI;

    /**
     * websocket
     */
    private webSocket:egret.WebSocket;

    //  头部lei
    private top;
    private cnt;
    //   底部
    private bottom;
    //  弹窗
    private pop;
    // 聊天实例
    private popChat;
    // 杯赛过场
    private change;

    private textfield:egret.TextField;
    
    private Width;
    private Height;
    private anWidth;
    private anHeight;
    
    private position:Array<number> =  [];

    public constructor() {
        super();
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }
   
    private onAddToStage(event: egret.Event) {
        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin
            context.onUpdate = () => {
            }
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }
        //设置加载进度界面
        //Config to load process interface


        // this.loadingView = new LoadingUI(750,1334);
        // this.stage.addChild(this.loadingView);
 
        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event: RES.ResourceEvent): void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("load");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event: RES.ResourceEvent) {
        if (event.groupName == "load") {
            this.loadingView = new LoadingUI(750,1334);
            this.stage.addChild(this.loadingView);
            RES.loadGroup("preload");
        }
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event: RES.ResourceEvent) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event: RES.ResourceEvent) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event: RES.ResourceEvent) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }


    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene() {

        let $store = window['store'];
        this.Width = $store['stage_Width'] = this.stage.stageWidth;
        this.Height = $store['stage_Height'] = this.stage.stageHeight;
        this.anWidth = $store['stage_anWidth'] = this.Width/2;
        const anHeight =  $store['stage_anHeight'] = this.Height/2;


        // let sky = this.createBitmapByName("btn-500_png");
        // this.addChild(sky)

        // 头部实例
        // let header:Header = new Header(Width);
        // header.x = 0;
        // header.y = 0;
        // this.addChild(header);

        // 内容区实例
        this.cnt = new Cnt(this.Width,this.Height,this.anWidth,anHeight);
        this.cnt.x = 0;
        this.cnt.y = 0;
        this.addChild(this.cnt);

         //头部实例2
        this.top = new Top(this.Width);
        this.top.x = 0;
        this.top.y = 0;
        this.addChild(this.top);

        // 底部实例
        this.bottom = new Foot();
        this.bottom.anchorOffsetY = 90;
        this.bottom.x = 0;
        this.bottom.y = this.Height;
        this.addChild(this.bottom);

        //聊天区域实例
        this.popChat = new PopChat();
        this.popChat.y = this.Height;
        this.addChild(this.popChat);

        // 弹窗实例,竞猜开始or竞猜完毕
        // text-begin_png text-over_png

        // this.pop = new Pop(this.Width,this.Height,'text-begin_png');
        // this.addChild(this.pop);

        //杯赛过场change
        this.change = new Change();
        this.change.x = 0;
        this.addChild(this.change);
        setTimeout(function(){
            // egret.Tween.get(this.change).to({x:20},200);
            console.log('move')
        },2000)

        



        // 层级控制
        // this.setChildIndex(header,0)
        // this.setChildIndex(this.cnt,1)
        // this.setChildIndex(this.top,2)
        // this.setChildIndex(this.bottom,3)
        // this.setChildIndex(this.pop,4)
        // this.setChildIndex(this.popChampionRecord,4)


        /*
        优化：
        1.图片合并，使用纹理集
        2. 函数
        */

        this.initStage();

        $store['this_main'] = this;

        // websocket
        try{
            this.webSocket = new egret.WebSocket();
            this.webSocket.addEventListener( egret.ProgressEvent.SOCKET_DATA , this.onReceiveMess ,this );
            this.webSocket.addEventListener( egret.Event.CONNECT ,this.onSocketOpen ,this );
            this.webSocket.addEventListener( egret.IOErrorEvent.IO_ERROR ,this.onIOError ,this );
            this.webSocket.addEventListener( egret.Event.CLOSE ,this.onCloseSock ,this );
            if( $store['env_variable'].uid ){
                this.webSocket.connectByUrl("ws://192.168.81.240:9777/ws?uid="+ $store['env_variable'].uid );
            }else{
                this.webSocket.connectByUrl("ws://192.168.81.240:9777/ws?uid=1002900");
                console.error('uid null at main.ts 219 1002900')
            }


        }catch(e){
            alert('websock error')
        }
    }

    /**
     * 常用数据初始化
     */
    private initStage(){
        // uid  还得有个uid ..
        let $store = window['store'];
        // 桌子缩放计算 
        $store.scale = 0.91;
        // 取ck 按src+ck 的形式，防止串号 = 替换 $
        if( window['urlData'] && window['urlData'].ck ){
            $store['orderObj'].ck = window['urlData'].ck.replace(/\$/g,'=');
            $store['env_variable'].ck = window['urlData'].ck.replace(/\$/g,'=');
        }else{
            $store['orderObj'].ck = egret.localStorage.getItem('ck');
            $store['env_variable'].ck = egret.localStorage.getItem('ck');
        }

        if( window['urlData'] && window['urlData'].src ){
            $store['env_variable'].src = window['urlData'].src ;
        }else{
            $store['env_variable'].src = egret.localStorage.getItem('src')
        }

        if( window['urlData'] && window['urlData'].uid ){
            $store['env_variable'].uid = window['urlData'].uid ;
        }
        // platform
        if( window['platform'] ){
            $store['env_variable'].platform = window['platform'] ;
        }else{
            $store['env_variable'].platform =egret.localStorage.getItem('platform'); 
        }

        // 头像随机的位置
        $store['userPosition'] = window['randomArray']( 9 );

        //  用户头像的9个 实例对象 
        this.cnt.initUserImg();
        //  场地容器 实例对象

    }


    // 函数：生成图片
    private createBitmapByName(name: string): egret.Bitmap {
        let result = new egret.Bitmap();
        let texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }

    /**
     *  onReceiveMess  websock 接收消息
     */
    private onReceiveMess(e:egret.Event):void{
        let $store = window['store'];

// event.updateAfterEvent();  //  什么时候进行强制刷新 ??????手机上用户立场 舞台不刷新 
        let msg = this.webSocket.readUTF();
        if(~msg.indexOf('You said')|| !~msg.indexOf('{')){
            console.log(msg)
        }else{
            //  后台数据  分发
            var msgObj = JSON.parse( msg );
            console.log( msgObj );
            let $msgObjBody = msgObj.body;
            switch ( msgObj.messageid ) {
                    // 进场的数据 2000
                case '2000':

                    if( $msgObjBody ){
                        // 房间信息
                        if( $msgObjBody.room_info ){
                            this.top.setTextDate( $msgObjBody.room_info.desc )
                            this.top.setTextTitle(  $msgObjBody.room_info.title )
                            $store['cur_room_info'] = $msgObjBody.room_info;
                        }
                        if( $msgObjBody.user_info ){
                            $store.user_info =  $msgObjBody.user_info ;
                            // 初始化用户信息
                            this.cnt.initUserMsg();
                            // 初始化底部按钮
                            this.bottom.initBtn();
                        }
                        if( $msgObjBody.matches ){
                            $store.matches =  $msgObjBody.matches;
                            //  初始化场地容器 数据
                            this.cnt.initFieldCon();
                            // this.cnt.initFieldCon();
                        }
                    }
                    ;break;
                case '2012':
                    // 用户进场
                    if( $msgObjBody ){
                        this.cnt.addUserImage( $msgObjBody.username, $msgObjBody.photo , $msgObjBody.total , $msgObjBody.uid );
                    }
                    break;
                case '2013':
                    // 删除用户
                    if( $msgObjBody ){
                        this.cnt.removeUserImage( $msgObjBody.uid );
                    }
                break;
                case '2001':
                    // 赛事消息 2001
                    if( $msgObjBody ){
                        if( $msgObjBody.room_info ){
                            this.top.setTextDate(  $msgObjBody.room_info.desc )
                            this.top.setTextTitle(  $msgObjBody.room_info.title )
                            $store['cur_room_info'] = $msgObjBody.room_info;
                        }
                        if( $msgObjBody.matches ){
                            $store.matches =  $msgObjBody.matches;
                            //  初始化场地容器 数据
                            this.cnt.initFieldCon();
                            // this.cnt.initFieldCon();
                        }
                    }
                break;
                case '2002':
                // 准备下注
                    if( $msgObjBody ){

                    }
                ;break;
                case '2003':
                // 开始下注
                    if( $msgObjBody ){

                    }
                ;break;
                case '2003':
                 // 停止下注
                    if( $msgObjBody ){

                    }               
                ;break;
                case '2003':;break;
                case '2003':;break;
                case '2003':;break;
                case '2003':;break;
                case '2003':;break;
        
            }
            setTimeout(()=>{
                // console.log('收起金币 测试 ok')
                // this.cnt.cnt_collectCoin()
                // this.cnt.cnt_sendEndCoin( '1002999','' )
                // this.cnt.cnt_sendEndCoin( '1002988','' )

                // this.cnt.cnt_upTextTips( '比赛开始' )
                // setTimeout(()=>{
                //     this.cnt.cnt_upTextTips( '' )
                // },1000)

                this.cnt.cnt_timer('6')

            },5000)
        }
    }
    
    /**
     *  onSocketOpen  websock 接收消息
     */
    private onSocketOpen():void{
        let $store = window['store'];
        let uid = '1002900'  // default

        this.stage.removeChild(this.loadingView);
        // this.stage.removeChild(this.loadingView);

        
        if( $store['env_variable'].uid ){
            uid = $store['env_variable'].uid
        }

        var start = {
            "msg_type":"user_join",
            "msg_id":"225",
            "data":{
                "uid": uid ,
            }               
        }
        this.webSocket.writeUTF(JSON.stringify(start))

        // this.webSocket.writeUTF('x')

        this.webSocket.flush();
    }

    
    /**
     *  onIOError  websock 接收消息
     */
    private onIOError():void{
        console.error('linsten error')
    }
    /**
     *  onCloseSock  websock 接收消息
     */
    private onCloseSock():void{
        
    }

}

window['store'] = {

    this_main: null ,

    stage_Width: null ,
    stage_Height: null ,
    stage_anWidth: null ,
    stage_anHeight: null ,

    env_variable:{ // 查询当前的环境变量
        src : null ,
        ck : null ,
        uid : null ,
        platform : null ,
    },

    scale: 1,  // 桌子缩放
    userPosition:[],  //  随机数组
    userPositionID:[],  // 头像的uid
    userPositionLocal:{},  // 维护一套 位置，为了金币分发
    emptyUserPosition:[],  // 空闲的位置
    user_info:[],
    curr_btn_coin:null,
    curr_btn_arr:[],
    coin_arr:[], // 为了收起
    userMySelf:null,  // 自己的实例便于修改自身金币
    cur_room_info:{
        // 当前房间信息

    },
    orderObj:{
        // 下单
        ck:null,
        golds:null,
        matchid:null,
        expect:null,
        odds:null,
        homeid:null,
        awayid:null,
        stageid:null,
        selection:null,
        roomid:null,
        node:null,
    },
    matches:[],  // 赛事信息

    commit:function(key,val){
        console.log(key)
        console.log(val)
    },
    // 冠军记录
    recording:[
        {'期号':121501,'赛事':'世界杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'世界杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'世界杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'世界杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'世界杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'欧洲杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'欧洲杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'欧洲杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'欧洲杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        {'期号':121501,'赛事':'欧洲杯','url':'https://imgsa.baidu.com/news/pic/item/0df431adcbef7609ece86edb25dda3cc7dd99e97.jpg'},
        ],
    // 记录 投注的金币数 ( 可能的金币 )
    allCoinObj:{
        // field_41_obj:{
        //     coin_left:[],
        //     coin_right:[],
        //     coin_left_local:{ x:null ,y:null },
        //     coin_right_local:{ x:null ,y:null }
        // }
    },
    // 收集金币的坐标集合 （分发金币的start）
    coin_local:{
        field41_l:{ x:214 ,y:128 },
        field41_r:{ x:458 ,y:128 },

        field42_l:{ x:214 ,y:328 },
        field42_r:{ x:458 ,y:328 },

        field43_l:{ x:214 ,y:528 },
        field43_r:{ x:458 ,y:528 },

        field44_l:{ x:214 ,y:728 },
        field44_r:{ x:458 ,y:728 },

        field21_l:{ x:214 ,y:192 },
        field21_r:{ x:458 ,y:192 },

        field22_l:{ x:214 ,y:566 },
        field22_r:{ x:458 ,y:566 },
  
        field1_l:{ x:214 ,y:330 },
        field1_r:{ x:458 ,y:330 }

    },
    userPositionObj:[
        //  位置坐标    
        {
            'x':null,
            'y':null
        },
        {
            'x':15,
            'y':80
        },
        {
            'x':15,
            'y':300
        },
        {
            'x':15,
            'y':520
        },
        {
            'x':15,
            'y':740
        },
        {
            'x':104,
            'y':80
        },
        {
            'x':104,
            'y':300
        },
        {
            'x':104,
            'y':520
        },
        {
            'x':104,
            'y':740
        }
    ], 
} 
