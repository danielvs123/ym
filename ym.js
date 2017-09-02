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

                var type = (_setting.hasOwnProperty('type'))?_setting.type: "normal";
                _width = (_width<100)?100:_width;
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
                        "month":_month,
                        "type":type
                    },
                    success: function(data){
                        data = JSON.parse(data);
                        if (checkStatus(data)){
                            var totalLength = data["data"].length;
                            eachWidth = _width/(totalLength-1)
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
            //echo("add to waitlist");
        }
    }

    ym.getSYPrice = function(_div,_width,_code,_year,_setting){
        if (isInit){
            var div = document.querySelector("#"+_div);
            if (div){
                var _canvas = document.createElement("canvas"),
                    _div = document.createElement("div"),
                    _ctx = _canvas.getContext("2d");
                var type = (_setting.hasOwnProperty('type'))?_setting.type: "normal";
                _width = (_width<150)?150:_width;
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
                        "year":_year,
                        "type":type
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
            //echo("add to waitlist");
        }
    }

    ym.getSMTable = function(_div,_code,_year,_month,_setting){
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
                params:[_div,_code,_year,_month,_setting]
            })
            //echo("add to waitlist");
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
            //echo("add to waitlist");
        }
    }

    ym.setEChartMonth = function(_div,_code,_year,_month,_setting){
        if (isInit){
            var type = "normal";
            var dom = document.getElementById(_div),
                domWidth = dom.clientWidth;
            dom.style.width = domWidth + "px";
            dom.style.height = domWidth*0.7 + "px";
            ajax({
                type: 'POST',
                url: host,
                data: {
                    "appId":appId,
                    "appToken":appToken,
                    "api":"SingleMonthPrice",
                    "code":_code,
                    "year":_year,
                    "month":_month,
                    "type":type
                },
                success: function(data){
                    setKEcharts(_div,JSON.parse(data))
                }
            })
        }else{
            addToCart({
                fun:"setEChartMonth",
                params:[_div,_code,_year,month,_setting]
            })
        }
    }

    ym.setEChartYear = function(_div,_code,_year,_setting){
        if (isInit){
            var dom = document.getElementById(_div),
                domWidth = dom.clientWidth;
            dom.style.width = domWidth + "px";
            dom.style.height = domWidth*0.7 + "px";
            var type = "normal";
            ajax({
                type: 'POST',
                url: host,
                data: {
                    "appId":appId,
                    "appToken":appToken,
                    "api":"SingleYearPrice",
                    "code":_code,
                    "year":_year,
                    "type":type
                },
                success: function(data){
                    setKEcharts(_div,JSON.parse(data))
                }
            })
        }else{
            addToCart({
                fun:"setEChartYear",
                params:[_div,_code,_year,_setting]
            })
        }
    }

    ym.setEChartGetTotal = function(_div,_code,_setting){
        if (isInit){
            var dom = document.getElementById(_div),
                domWidth = dom.clientWidth;
            dom.style.width = domWidth + "px";
            dom.style.height = domWidth*0.7 + "px";
            var type = "normal";
            ajax({
                type: 'POST',
                url: host,
                data: {
                    "appId":appId,
                    "appToken":appToken,
                    "api":"SingleYearPrice",
                    "year":2015,
                    "code":_code,
                    "type":type
                },
                success: function(data){
                    setTotalEcharts(_div,JSON.parse(data))
                }
            })
        }else{
            addToCart({
                fun:"setEChartGetTotal",
                params:[_div,_code,_setting]
            })
        }
    }


    function setKEcharts(domName,_data){
        var myChart = echarts.init(document.getElementById(domName));
        var upColor = '#ec0000';
        var upBorderColor = '#8A0000';
        var downColor = '#00da3c';
        var downBorderColor = '#008F28';
        var rawData = [];
        _data = _data.data;
        for (var i = 0;i<_data.length;i++){
            var timeFormat = _data[i].year + "/" + _data[i].month + "/" + _data[i].day;
            var _open =_data[i]["open"],
                _close = _data[i]["close"],
                _lowest = _data[i]["low"],
                _highest = _data[i]["high"],
                gap = _open-_close,
                percent = (gap/_open)+"%";
            rawData.push([timeFormat,_open,_close,gap,percent,_lowest,_highest]);
        }

        var dates = rawData.map(function (item) {
            return item[0];
        });

        var data = rawData.map(function (item) {
            return [+item[1], +item[2], +item[5], +item[6]];
        });

        function calculateMA(dayCount, data) {
            var result = [];
            for (var i = 0, len = data.length; i < len; i++) {
                if (i < dayCount) {
                    result.push('-');
                    continue;
                }
                var sum = 0;
                for (var j = 0; j < dayCount; j++) {
                    sum += data[i - j][1];
                }
                result.push((sum / dayCount).toFixed(2));
            }
            return result;
        }


        var option = {
            backgroundColor: '#21202D',
            legend: {
                data: ['日K', 'MA5', 'MA10', 'MA20', 'MA30'],
                inactiveColor: '#777',
                textStyle: {
                    color: '#fff'
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    animation: false,
                    type: 'cross',
                    lineStyle: {
                        color: '#376df4',
                        width: 2,
                        opacity: 1
                    }
                }
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLine: { lineStyle: { color: '#8392A5' } }
            },
            yAxis: {
                scale: true,
                axisLine: { lineStyle: { color: '#8392A5' } },
                splitLine: { show: false }
            },
            grid: {
                bottom: 80
            },
            dataZoom: [{
                textStyle: {
                    color: '#8392A5'
                },
                handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
                handleSize: '80%',
                dataBackground: {
                    areaStyle: {
                        color: '#8392A5'
                    },
                    lineStyle: {
                        opacity: 0.8,
                        color: '#8392A5'
                    }
                },
                handleStyle: {
                    color: '#fff',
                    shadowBlur: 3,
                    shadowColor: 'rgba(0, 0, 0, 0.6)',
                    shadowOffsetX: 2,
                    shadowOffsetY: 2
                }
            }, {
                type: 'inside'
            }],
            animation: false,
            series: [
                {
                    type: 'candlestick',
                    name: '日K',
                    data: data,
                    itemStyle: {
                        normal: {
                            color: '#FD1050',
                            color0: '#0CF49B',
                            borderColor: '#FD1050',
                            borderColor0: '#0CF49B'
                        }
                    }
                },
                {
                    name: 'MA5',
                    type: 'line',
                    data: calculateMA(5, data),
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        normal: {
                            width: 1
                        }
                    }
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: calculateMA(10, data),
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        normal: {
                            width: 1
                        }
                    }
                },
                {
                    name: 'MA20',
                    type: 'line',
                    data: calculateMA(20, data),
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        normal: {
                            width: 1
                        }
                    }
                },
                {
                    name: 'MA30',
                    type: 'line',
                    data: calculateMA(30, data),
                    smooth: true,
                    showSymbol: false,
                    lineStyle: {
                        normal: {
                            width: 1
                        }
                    }
                }
            ]
        };

        myChart.setOption(option);
    }

    function setTotalEcharts(domName,_data){
        var upColor = '#00da3c';
        var downColor = '#ec0000';

        var rawData =[];
        _data = _data.data;
        for (var i = 0;i<_data.length;i++){
            var timeFormat = _data[i].year + "/" + _data[i].month + "/" + _data[i].day;
            var _open =parseFloat(_data[i]["open"]),
                _close = parseFloat(_data[i]["close"]),
                _lowest = parseFloat(_data[i]["low"]),
                _highest = parseFloat(_data[i]["high"]),
                _volume = Math.abs(parseInt(_data[i]["volume"]));
            rawData.push([timeFormat,_open,_close,_lowest,_highest,_volume]);
        }
        function splitData(rawData) {
            var categoryData = [];
            var values = [];
            var volumes = [];
            for (var i = 0; i < rawData.length; i++) {
                categoryData.push(rawData[i].splice(0, 1)[0]);
                values.push(rawData[i]);
                volumes.push([i, rawData[i][4], rawData[i][0] > rawData[i][1] ? 1 : -1]);
            }

            return {
                categoryData: categoryData,
                values: values,
                volumes: volumes
            };
        }

        function calculateMA(dayCount, data) {
            var result = [];
            for (var i = 0, len = data.values.length; i < len; i++) {
                if (i < dayCount) {
                    result.push('-');
                    continue;
                }
                var sum = 0;
                for (var j = 0; j < dayCount; j++) {
                    sum += data.values[i - j][1];
                }
                result.push(+(sum / dayCount).toFixed(3));
            }
            return result;
        }

        var myChart = echarts.init(document.getElementById(domName));

        var data = splitData(rawData);

        myChart.setOption(option = {
            backgroundColor: '#fff',
            animation: false,
            legend: {
                bottom: 10,
                left: 'center',
                data: ['Dow-Jones index', 'MA5', 'MA10', 'MA20', 'MA30']
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                backgroundColor: 'rgba(245, 245, 245, 0.8)',
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
                textStyle: {
                    color: '#000'
                },
                position: function (pos, params, el, elRect, size) {
                    var obj = {top: 10};
                    obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30;
                    return obj;
                },
                extraCssText: 'width: 170px'
            },
            axisPointer: {
                link: {xAxisIndex: 'all'},
                label: {
                    backgroundColor: '#777'
                }
            },
            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: false
                    },
                    brush: {
                        type: ['lineX', 'clear']
                    }
                }
            },
            brush: {
                xAxisIndex: 'all',
                brushLink: 'all',
                outOfBrush: {
                    colorAlpha: 0.1
                }
            },
            visualMap: {
                show: false,
                seriesIndex: 5,
                dimension: 2,
                pieces: [{
                    value: 1,
                    color: downColor
                }, {
                    value: -1,
                    color: upColor
                }]
            },
            grid: [
                {
                    left: '10%',
                    right: '8%',
                    height: '50%'
                },
                {
                    left: '10%',
                    right: '8%',
                    top: '63%',
                    height: '16%'
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: data.categoryData,
                    scale: true,
                    boundaryGap : false,
                    axisLine: {onZero: false},
                    splitLine: {show: false},
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax',
                    axisPointer: {
                        z: 100
                    }
                },
                {
                    type: 'category',
                    gridIndex: 1,
                    data: data.categoryData,
                    scale: true,
                    boundaryGap : false,
                    axisLine: {onZero: false},
                    axisTick: {show: false},
                    splitLine: {show: false},
                    axisLabel: {show: false},
                    splitNumber: 20,
                    min: 'dataMin',
                    max: 'dataMax',
                    axisPointer: {
                        label: {
                            formatter: function (params) {
                                var seriesValue = (params.seriesData[0] || {}).value;
                                return params.value
                                    + (seriesValue != null
                                            ? '\n' + echarts.format.addCommas(seriesValue)
                                            : ''
                                    );
                            }
                        }
                    }
                }
            ],
            yAxis: [
                {
                    scale: true,
                    splitArea: {
                        show: true
                    }
                },
                {
                    scale: true,
                    gridIndex: 1,
                    splitNumber: 2,
                    axisLabel: {show: false},
                    axisLine: {show: false},
                    axisTick: {show: false},
                    splitLine: {show: false}
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1],
                    start: 98,
                    end: 100
                },
                {
                    show: true,
                    xAxisIndex: [0, 1],
                    type: 'slider',
                    top: '85%',
                    start: 98,
                    end: 100
                }
            ],
            series: [
                {
                    name: 'index',
                    type: 'candlestick',
                    data: data.values,
                    itemStyle: {
                        normal: {
                            color: upColor,
                            color0: downColor,
                            borderColor: null,
                            borderColor0: null
                        }
                    },
                    tooltip: {
                        formatter: function (param) {
                            param = param[0];
                            return [
                                'Date: ' + param.name + '<hr size=1 style="margin: 3px 0">',
                                'Open: ' + param.data[0] + '<br/>',
                                'Close: ' + param.data[1] + '<br/>',
                                'Lowest: ' + param.data[2] + '<br/>',
                                'Highest: ' + param.data[3] + '<br/>'
                            ].join('');
                        }
                    }
                },
                {
                    name: 'MA5',
                    type: 'line',
                    data: calculateMA(5, data),
                    smooth: true,
                    lineStyle: {
                        normal: {opacity: 0.5}
                    }
                },
                {
                    name: 'MA10',
                    type: 'line',
                    data: calculateMA(10, data),
                    smooth: true,
                    lineStyle: {
                        normal: {opacity: 0.5}
                    }
                },
                {
                    name: 'MA20',
                    type: 'line',
                    data: calculateMA(20, data),
                    smooth: true,
                    lineStyle: {
                        normal: {opacity: 0.5}
                    }
                },
                {
                    name: 'MA30',
                    type: 'line',
                    data: calculateMA(30, data),
                    smooth: true,
                    lineStyle: {
                        normal: {opacity: 0.5}
                    }
                },
                {
                    name: 'Volume',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: data.volumes
                }
            ]
        }, true);

        myChart.dispatchAction({
            type: 'brush',
            areas: [
                {
                    brushType: 'lineX',
                    coordRange: ['2016-06-02', '2016-06-20'],
                    xAxisIndex: 0
                }
            ]
        });
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