/* utitlies */
window.utility = {
    //generat fake data
    gen_number : function(max,zfill_size){
        var n = Math.floor(Math.random() * max)
        if (zfill_size) return utility.zfill(n,zfill_size)
        else return n
    }
    ,zfill:function(x,size){
        var s = x+"";
        while (s.length < size) s = "0" + s;
        return s;
    }    
    ,format_phone:function(phone){
        var parts = []
        parts = [
            phone.substr(0,4)
            ,phone.substr(4,3)
            ,phone.substring(7)
        ]
        return parts.join('-')
    }
    ,get_date_string(dt){
        var m = dt.getMonth() + 1
        var d = dt.getDate()
        return dt.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d
    }
    ,get_time_string(dt){
        var h = dt.getHours()
        var m = dt.getMinutes()
        var s = dt.getSeconds()
        //console.log('===>',h,m,s)
        return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s
    }
    ,gen_content:function(){
        var rows = []
        var last_time_shift = 0
        //對話則數
        var length = 10 + Math.random() * 100
        while (length >= 0){
            var content = []
            //每次發言的句子數
            var n = 1 + Math.random() * 20
            for (var i=0; i< n;i++){
                var chars = []
                //每個字的字母數量
                var m = Math.random() * 20
                for (var j=0;j<m;j++){
                    chars.push(String.fromCharCode(65+Math.floor(Math.random()*25)))
                }
                content.push(chars.join('') + ' ')
            }
            rows.push({
                speaker: Math.random() >= 0.5 ? 'A' : 'B'
                ,time_shift: last_time_shift
                ,content: content.join('. ')
            })
            length -= 1
            last_time_shift +=  Math.ceil(Math.random() * 5)
        }
        return rows
    }
    ,open_map:function(lat,lon){
        // If it's an iPhone..
        var scheme
        if( (navigator.platform.indexOf("iPhone") != -1)
            || (navigator.platform.indexOf("iPod") != -1)
            || (navigator.platform.indexOf("iPad") != -1)){
            scheme = 'https'
        }else{
            scheme = 'https'
        }
        //開啟地圖及標示
        var url =  scheme + '://www.google.com/maps?q=loc:'+lat+','+lon
        window.open(url);
    }
    ,loading:function(yes){
        if (!yes){
            $.mobile.loading("hide")
            return
        }
        var $this = $( this ),
            theme = $this.jqmData( "theme" ) || $.mobile.loader.prototype.options.theme,
            msgText = $this.jqmData( "msgtext" ) || $.mobile.loader.prototype.options.text,
            textVisible = $this.jqmData( "textvisible" ) || $.mobile.loader.prototype.options.textVisible,
            textonly = !!$this.jqmData( "textonly" );
        var html = $this.jqmData( "html" ) || "";
        $.mobile.loading( "show", {
                text: msgText,
                textVisible: textVisible,
                theme: theme,
                textonly: textonly,
                html: html
        });        
    }
    ,calculate_duration : function(entry){
        var sdate = entry.DATE
        var stime = entry.TIME
        var edate = entry.EDATE || entry.DATE
        var etime = entry.ETIME
        var ymd = sdate.split('-')
        var hms = [parseInt(stime.substr(0,2)), parseInt(stime.substr(2,2)) ,parseInt(stime.substr(4,2))]
        var eymd = edate.split('-')
        var ehms = [parseInt(etime.substr(0,2)), parseInt(etime.substr(2,2)) ,parseInt(etime.substr(4,2))]
        var s = new Date(parseInt( ymd[0]),parseInt( ymd[1])-1,parseInt( ymd[2]),  hms[0], hms[1], hms[2])
        var e = new Date(parseInt(eymd[0]),parseInt(eymd[1])-1,parseInt(eymd[2]), ehms[0],ehms[1],ehms[2])
        var duration = Math.round((e.getTime() - s.getTime())/1000)
        return utility.readable_duration(duration)
    }
    ,readable_duration(d){
        //convert a integer duration(seconds) to minutes+seconds
        var min = Math.floor(d/60)
        var sec = d - min * 60
        return min+'分'+sec+'秒'
    }
}