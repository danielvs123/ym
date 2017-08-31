;(function ( ym, undefined ) {
    var version = "1.0.0",
        host = "//www.zsy-xsy.com/Share/web/index.php?r=share/api",
        check = "//www.zsy-xsy.com/Share/web/index.php?r=share/check",
        appId = "",
        appToken = "",
        isInit = false;

    //初始化
    ym.init = function(_id,_token){
        appId = _id;
        appToken = _token;
        ajax({
            type:"POST",
            url:check,
            data:{
                appId:_id,
                appToken:_token
            },
            success:function(data){
                data = JSON.parse(data);
                if (data["status"]==0){
                    isInit = true;
                    echo("version "+version + " init");
                    for (var num = 0;num<funArr.length;num++){
                        var functionName = funArr[num]["fun"];
                        var params = "";
                        if (typeof funArr[num]["params"][0] == "string"){
                            params += ("'"+funArr[num]["params"][0]+"'")
                        }else{
                            params += (funArr[num]["params"][0])
                        }
                        for (var j = 1;j<funArr[num]["params"].length;j++){
                            if (typeof funArr[num]["params"][j] == "object"){
                                params += ",{"
                                for (var par in funArr[num]["params"][j]){
                                    params += (par+":"+"'"+funArr[num]["params"][j][par]+"',");
                                }
                                params = params.substring(0,params.length-1);
                                params += "}"
                            }else{
                                if (typeof funArr[num]["params"][j] == "string"){
                                    params += (",'"+funArr[num]["params"][j]+"'")
                                }else{
                                    params += (","+funArr[num]["params"][j])
                                }
                            }
                        }
                        var funcStr = "ym."+functionName+"("+params+")";
                        eval(funcStr);
                    }
                }else{
                    echo("invalid appId or appToken");
                }
            }
        })
    }

    var funArr = [];

    //购物车机制，刚开始没登录成功时候的函数自动加入进来。成功后自动调用
    function addToCart(fun){
        funArr.push(fun);
    }

    ym.getSDPrice = function(_code,_year,_month,_day){
        if (isInit){
            ajax({
                type: 'POST',
                url: host,
                data: {
                    "appId":appId,
                    "appToken":appToken,
                    "api":"SingleDayPrice",
                    "code":code,
                    "year":year,
                    "month":month,
                    "day":day
                },
                success: function(data){
                    echo(data)
                }
            })
        }else{
            addToCart({
                fun:"getSDPrice",
                params:[_code,_year,_month,_day]
            })
            echo("this function has already been moved to the cart");
        }
    }

    ym.getSMPrice = function(_div,_width,_code,_year,_month,_setting){
        if (isInit){
            var div = document.querySelector("#"+_div);
            if (div){
                var _canvas = document.createElement("canvas"),
                    _div = document.createElement("div"),
                    _ctx = _canvas.getContext("2d");
                _width = (_width<300)?300:_width;
                _canvas.width = _width;
                var _height = _width*0.75;
                _canvas.height = _height;
                _setting = _setting||{};
                _ctx.font ="20px Georgia";
                _ctx.fillStyle = "black";
                _ctx.fillText(code + "的" + month+"月数据",0, _height*0.15);
                _ctx.fillStyle = (_setting.hasOwnProperty('bgColor'))?_setting.bgColor: "#E6E6FA";
                _ctx.fillRect(0,_height*0.2,_width,_height*0.8);
                _ctx.strokeStyle = (_setting.hasOwnProperty('lineColor'))?_setting.lineColor : "#FF0000";

                var eachWidth,dayArr = [],priceData = [];
                ajax({
                    type: 'POST',
                    url: host,
                    data: {
                        "appId":appId,
                        "appToken":appToken,
                        "api":"SingleMonthPrice",
                        "code":_code,
                        "year":_year,
                        "month":_month
                    },
                    success: function(data){
                        data = JSON.parse(data);
                        if (checkStatus(data)){
                            var totalLength = data["data"].length;
                            eachWidth = _width/(totalLength-1)
                            for (var i = 0;i <totalLength;i++){
                                priceData.push(data["data"][i].close);
                                var dayFormat = parseInt(data["data"][i].year)*10000+parseInt(data["data"][i].month)*100+parseInt(data["data"][i].day)
                                dayArr.push(dayFormat);
                            }
                            var biggest = findBiggest(priceData),
                                smallest = findSmallest(priceData),
                                eachHeight = (_height*0.8)/(biggest-smallest);
                            _ctx.moveTo(0,_height-eachHeight*(priceData[0]-smallest));
                            for (var i = 1;i <totalLength;i++){
                                _ctx.lineTo(i*eachWidth,_height-eachHeight*(priceData[i]-smallest));
                            }
                            _ctx.stroke();
                            _ctx.beginPath();
                        }
                    }
                })

                _div.style.position = "relative";
                div.appendChild(_div);
                _div.appendChild(_canvas);
                var _touchCanvas = document.createElement("canvas"),
                    _touchCtx = _touchCanvas.getContext("2d");
                _touchCanvas.width = _width;
                _touchCanvas.height = _height;
                _touchCanvas.style.position = "absolute";
                _touchCanvas.style.top = "0px";
                _touchCanvas.style.left = "0px";
                _div.appendChild(_touchCanvas);
                var span = document.createElement("span");
                span.innerText = "滑动来读取数据";
                var br = document.createElement("br");
                var _span = document.createElement("span");
                var _eptDiv = document.createElement("div");
                _eptDiv.style.width = "100%";
                _div.appendChild(_eptDiv);
                _span.innerText = "";
                _div.style.userSelect = "none";
                _div.appendChild(br);
                _div.appendChild(br);
                _div.appendChild(span);
                _div.appendChild(br);
                _div.appendChild(_span);
                _touchCanvas.addEventListener('mousemove', function(e){
                    var currentSelect = Math.floor((e.offsetX)/eachWidth);
                    span.innerText = "日期:"+dayArr[currentSelect];
                    _span.innerText = "收盘价:"+priceData[currentSelect]
                    _touchCtx.clearRect(0,0,_width,_height);
                    _touchCtx.beginPath();
                    _touchCtx.strokeStyle = "black";
                    _touchCtx.moveTo(e.offsetX,0.2*_height);
                    _touchCtx.lineTo(e.offsetX,_height);
                    _touchCtx.stroke();
                }, false);
                _touchCanvas.addEventListener('touchmove', function(e){
                    var touches = e.changedTouches;
                    var currentSelect = Math.floor((touches[0].pageX-30)/eachWidth);
                    if (currentSelect>=0&&currentSelect<dayArr.length){
                        span.innerText = "日期:"+dayArr[currentSelect];
                        _span.innerText = "收盘价:"+priceData[currentSelect]
                    }
                    _touchCtx.clearRect(0,0,_width,_height);
                    _touchCtx.beginPath();
                    _touchCtx.strokeStyle = "black";
                    _touchCtx.moveTo(touches[0].pageX-30,0.2*_height);
                    _touchCtx.lineTo(touches[0].pageX-30,_height);
                    _touchCtx.stroke();
                }, false);
            }else{
                echo("div not found");
            }
        }else{
            addToCart({
                fun:"getSMPrice",
                params:[_div,_width,_code,_year,_month,_setting]
            })
            echo("add to waitlist");
        }
    }

    ym.getSYPrice = function(_div,_width,_code,_year,_setting){
        if (isInit){
            var div = document.querySelector("#"+_div);
            if (div){
                var _canvas = document.createElement("canvas"),
                    _div = document.createElement("div"),
                    _ctx = _canvas.getContext("2d");
                _width = (_width<450)?450:_width;
                _canvas.width = _width;
                var _height = _width*0.55;
                _canvas.height = _height;
                _setting = _setting||{};
                _ctx.font ="20px Georgia";
                _ctx.fillStyle = "black";
                _ctx.fillText(code + "的" + year+"的数据",0, _height*0.15);
                _ctx.fillStyle = (_setting.hasOwnProperty('bgColor'))?_setting.bgColor: "#E6E6FA";
                _ctx.fillRect(0,_height*0.2,_width,_height*0.8);
                _ctx.strokeStyle = (_setting.hasOwnProperty('lineColor'))?_setting.lineColor : "#FF0000";
                var eachWidth,dayArr = [],priceData = [];
                ajax({
                    type: 'POST',
                    url: host,
                    data: {
                        "appId":appId,
                        "appToken":appToken,
                        "api":"SingleYearPrice",
                        "code":_code,
                        "year":_year
                    },
                    success: function(data){
                        data = JSON.parse(data);
                        if (checkStatus(data)){
                            var totalLength = data["data"].length;
                                eachWidth = _width/(totalLength-1);
                            for (var i = 0;i <totalLength;i++){
                                priceData.push(parseFloat(data["data"][i].close));
                                var dayFormat = parseInt(data["data"][i].year)*10000+parseInt(data["data"][i].month)*100+parseInt(data["data"][i].day)
                                dayArr.push(dayFormat);
                            }
                            var biggest = findBiggest(priceData),
                                smallest = findSmallest(priceData),
                                eachHeight = (_height*0.8)/(biggest-smallest);
                            _ctx.moveTo(0,_height-eachHeight*(priceData[0]-smallest));
                            for (var i = 1;i <totalLength;i++){
                                _ctx.lineTo(i*eachWidth,_height-(eachHeight*(priceData[i]-smallest)));
                            }
                            _ctx.stroke();
                            _ctx.beginPath();
                        }
                    }
                })
                _div.style.userSelect = "none";
                _div.style.position = "relative";
                div.appendChild(_div);
                _div.appendChild(_canvas);
                var _touchCanvas = document.createElement("canvas"),
                    _touchCtx = _touchCanvas.getContext("2d");
                _touchCanvas.width = _width;
                _touchCanvas.height = _height;
                _touchCanvas.style.position = "absolute";
                _touchCanvas.style.top = "0px";
                _touchCanvas.style.left = "0px";
                _div.appendChild(_touchCanvas);
                var span = document.createElement("span");
                span.innerText = "滑动来读取数据";
                var br = document.createElement("br");
                var _span = document.createElement("span");
                _span.innerText = "";
                var _eptDiv = document.createElement("div");
                _eptDiv.style.width = "100%";
                _div.appendChild(_eptDiv);
                _div.appendChild(br);
                _div.appendChild(br);
                _div.appendChild(span);
                _div.appendChild(br);
                _div.appendChild(_span);
                _touchCanvas.addEventListener('mousemove', function(e){
                    var currentSelect = Math.floor((e.offsetX)/eachWidth);
                    span.innerText = "日期:"+dayArr[currentSelect];
                    _span.innerText = "收盘价:"+priceData[currentSelect]
                    _touchCtx.clearRect(0,0,_width,_height);
                    _touchCtx.beginPath();
                    _touchCtx.strokeStyle = "black";
                    _touchCtx.moveTo(e.offsetX,0.2*_height);
                    _touchCtx.lineTo(e.offsetX,_height);
                    _touchCtx.stroke();
                }, false);
                _touchCanvas.addEventListener('touchmove', function(e){
                    var touches = e.changedTouches;
                    var currentSelect = Math.floor((touches[0].pageX-30)/eachWidth);
                    if (currentSelect>=0&&currentSelect<dayArr.length){
                        span.innerText = "日期:"+dayArr[currentSelect];
                        _span.innerText = "收盘价:"+priceData[currentSelect]
                    }
                    _touchCtx.clearRect(0,0,_width,_height);
                    _touchCtx.beginPath();
                    _touchCtx.strokeStyle = "black";
                    _touchCtx.moveTo(touches[0].pageX-30,0.2*_height);
                    _touchCtx.lineTo(touches[0].pageX-30,_height);
                    _touchCtx.stroke();
                }, false);
            }else{
                echo("div not found");
            }
        }else{
            addToCart({
                fun:"getSYPrice",
                params:[_div,_width,_code,_year,_setting]
            })
            echo("add to waitlist");
        }
    }

    ym.getSMTable = function(_div,_width,_code,_year,_month,_setting){
        if (isInit){
            var div = document.querySelector("#"+_div);
            if (div){
                ajax({
                    type: 'POST',
                    url: host,
                    data: {
                        "appId":appId,
                        "appToken":appToken,
                        "api":"SingleMonthPrice",
                        "code":_code,
                        "year":_year,
                        "month":_month
                    },
                    success: function(data){
                        data = JSON.parse(data);
                        if (checkStatus(data)){
                            var table = document.createElement("table");
                            table.className = "bordered";
                            div.appendChild(table);
                            var thead = document.createElement("thead");
                            table.appendChild(thead);
                            var nameList = ["日期","开盘价","休盘价","最高价","最低价","成交量","成交额"];
                            var titleTr = document.createElement("tr");
                            table.appendChild(titleTr);
                            for (var name in nameList){
                                var th = document.createElement("th");
                                th.innerText = nameList[name];
                                titleTr.appendChild(th);
                            }
                            var tbody = document.createElement("tbody");
                            table.appendChild(tbody);
                            for (var info in data["data"]){
                                var ele = data["data"][info],
                                    day = parseInt(ele["year"])*10000+parseInt(ele["month"])*100+parseInt(ele["day"]),
                                    open = ele["open"],
                                    close = ele["close"],
                                    high = ele["high"],
                                    low = ele["low"],
                                    volume = ele["volume"],
                                    amount = ele["amount"],
                                    infoArr = [day,open,close,high,low,volume,amount],
                                    tr = document.createElement("tr");
                                tbody.appendChild(tr);
                                for (var i = 0;i<infoArr.length;i++){
                                    var td = document.createElement("td");
                                    td.innerText = infoArr[i];
                                    tr.appendChild(td);
                                }
                            }
                        }
                    }
                })
            }else{
                echo("div not found");
            }
        }else{
            addToCart({
                fun:"getSMTable",
                params:[_div,_width,_code,_year,_month,_setting]
            })
            echo("add to waitlist");
        }
    }

    ym.getSYTable = function(_div,_width,_code,_year,_setting){
        if (isInit){
            var div = document.querySelector("#"+_div);
            if (div){
                ajax({
                    type: 'POST',
                    url: host,
                    data: {
                        "appId":appId,
                        "appToken":appToken,
                        "api":"SingleYearPrice",
                        "code":_code,
                        "year":_year
                    },
                    success: function(data){
                        //data = JSON.parse(data);
                        //if (checkStatus(data)){
                        //    var table = document.createElement("table");
                        //    table.className = "bordered";
                        //    div.body.appendChild(table);
                        //    var thead = document.createElement("thead");
                        //    table.appendChild(thead);
                        //    var nameList = ["日期","开盘价","休盘价","最高价","最低价","成交量","成交额"];
                        //    var titleTr = document.createElement("tr");
                        //    table.appendChild(titleTr);
                        //    for (var name in nameList){
                        //        var th = document.createElement("th");
                        //        th.innerText = nameList[name];
                        //        titleTr.appendChild(th);
                        //    }
                        //    //for (var info in data)
                        //    console.log(data[1]);
                        //}
                    }
                })
            }else{
                echo("div not found");
            }
        }else{
            addToCart({
                fun:"getSYTable",
                params:[_div,_width,_code,_year,_setting]
            })
            echo("add to waitlist");
        }
    }

    //内部ajax方法
    function ajax(arguments){
        var ajaxData = {
            type:arguments.type || "GET",
            url:arguments.url || "",
            async:arguments.async || "true",
            data:arguments.data || null,
            dataType:arguments.dataType || "text",
            contentType:arguments.contentType || "application/x-www-form-urlencoded",
            beforeSend:arguments.beforeSend || function(){},
            success:arguments.success || function(){},
            error:arguments.error || function(){}
        }
        ajaxData.beforeSend()
        var xhr = createxmlHttpRequest();
        xhr.responseType=ajaxData.dataType;
        xhr.open(ajaxData.type,ajaxData.url,ajaxData.async);
        xhr.setRequestHeader("Content-Type",ajaxData.contentType);
        xhr.send(convertData(ajaxData.data));
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if(xhr.status == 200){
                    ajaxData.success(xhr.response)
                }else{
                    ajaxData.error()
                }
            }
        }
    }

    function checkStatus(data){
        if (data["status"]==0){
            return true;
        }else{
            echo(data['status']);
            return false;
        }
    }

    ym.createShareCanvas = function(outerDom,data){

    }

    //似有方法
    function createxmlHttpRequest() {
        if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        } else if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        }
    }

    function findBiggest(arr){
        var num = 0;
        for (var i = 0;i<arr.length;i++){
            if (arr[i]>num){
                num = arr[i];
            }
        }
        return num;
    }

    function findSmallest(arr){
        var num = 99999;
        for (var i = 0;i<arr.length;i++){
            if (arr[i]<num){
                num = arr[i];
            }
        }
        return num;
    }

    function echo(sth){
        console.log(sth);
    }

    function convertData(data){
        if( typeof data === 'object' ){
            var convertResult = "" ;
            for(var c in data){
                convertResult+= c + "=" + data[c] + "&";
            }
            convertResult=convertResult.substring(0,convertResult.length-1)
            return convertResult;
        }else{
            return data;
        }
    }
}( window.ym = window.ym || {} ));