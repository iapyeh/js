function Dataset(key){
    // @key:(string) field name to get entry id
    //  if key is missing, this.entries will be empty
    this.key = key 
    this.reset()
}
Dataset.prototype = {
    reset:function(){
        this.rows = [] //sequencial access
        this.entries = {} //by id    
    }
    ,addEntry:function(id,entry){
        // allows user to call by
        // add_entry({object}) or add_entry('id',{object})
        // 如果沒有設定key field，但又用 addEntry(id,entry)的方式呼叫，
        // 則此entry不會被放入rows中，此時此dataset 像是一個dict
        // 如果沒有設定key field，但用 addEntry(entry)的方式呼叫，
        // 則此entry不會被放入entries中，此時此dataset 像是一個list
        // 如果有設定key field，不論是用哪一種方式呼叫 addEntry，row and entries都會有內容
        if (typeof(id) == 'object') {
            entry = id
            id = undefined
        }
        if ((typeof(id) != 'undefined') || this.key){
            var entry_id = (typeof(id) == 'undefined') ?  entry[this.key] : id
            if (typeof entry_id == 'undefined') console.warn('value of entry id is undefined for ', entry,'; key=', this.key)
            var existed = this.entries[entry_id]
            this.entries[entry_id] = entry
            if (existed){
                if (this.key){
                    var idx = -1
                    this.rows.some(function(_entry,i){
                        if (_entry[this.key] == entry_id){
                            idx = i
                            return true
                        }
                    })
                    if (idx >=0) this.rows[idx] = entry    
                }else{
                    //如果沒有設定key field，但又用 (id,entry)的方式呼叫，
                    //則此entry不會被放入rows中
                }
            } else{ 
                this.rows.push(entry)
            }    
        }
        else{
            this.rows.push(entry)            
        }
    }
    ,iter:function(callback,endcallback){
        if (this.rows.length) this.rows.forEach(callback)
        if (endcallback) endcallback(this.rows.length)
    }
    ,iterEntry:function(callback,endcallback){
        var idx = -1
        for(var key in this.entries){
            idx += 1
            callback(key,this.entries[key],idx)
        }
        if (endcallback) endcallback(idx+1)
    }
    ,keys:function(sortfunc,callback){
        var keys = []
        for(var key in this.entries){
            keys.push(key)
        }
        return keys
    }
    ,getEntry:function(id){
        return this.entries[id]
    }    
}
function LazyDataset(options){
    /*
     options:{
        name:
        promise:
        init:function(){}
        priority:0, //lower take more priority
        key:(string) field name to get entry id
     }
    */
    this.options = options
    this.proxy = options.proxy
    //this.name = options.name
    this.priority = options.priority || 0
    //this.promise = options.promise
    this.dataset = new Dataset(options.key)
    //onload 應被實作蓋掉，它是資料取回時被呼叫，用來建立應用程式的物件。
    this.onload = function(){}
    this.loaded = false
    //onchange是伺服器端有更新時會被呼叫。目前還沒有完整的實作。
    this.onchange = function(){}
}
LazyDataset.prototype = {
    load:function(){
        var self = this
        this.loading = new $.Deferred()
        $.getJSON(this.options.request.url, this.options.request.data,function(response){
            if (response.retcode != 0) {
                console.warn(response.stderr)
                self.loading.reject(stderr)
            }
            else {
                var onload = self.onload.bind(self)
                //onload() might or might not returns a Deferred
                var maybeDeferred = onload(response.stdout)
                var callback = function(){
                    self.loading.resolve()
                    delete self.loading
                    self.loaded = true
                    var onchange = self.onchange.bind(self)
                    onchange()
                }
                if (maybeDeferred && maybeDeferred.done){
                    maybeDeferred.done(callback)
                }else{
                    callback()
                }
            }
        })
        return this.loading
    }
    ,addEntry:function(id,entry){
        this.dataset.addEntry(id,entry)
    }
    ,iter:function(callback,endcallback){
        var self = this
        if (self.loaded){
            self.dataset.iter(callback,endcallback)
        }else if (self.loading){
            self.loading.done(function(){
                self.dataset.iter(callback,endcallback)
            })
        }else{
            self.load().done(function(){
                self.dataset.iter(callback,endcallback)
            })
        }
    }
    ,iterEntry:function(callback,endcallback){
        var self = this
        if (self.loaded){
            self.dataset.iterEntry(callback,endcallback)
        }else if (self.loading){
            self.loading.done(function(){
                self.dataset.iterEntry(callback,endcallback)
            })
        }else{
            self.load().done(function(){
                self.dataset.iterEntry(callback,endcallback)
            })
        }
    }
    ,keys:function(){
        return self.dataset.keys()
    }
    ,getEntry:function(id){
        return this.dataset.getEntry(id)
    }
}

function Table(options){
    /*
     options:{
        name:
        promise:
        init:function(){}
        priority:0, //lower take more priority
        key:(string) field name to get entry id
     }
    */
    this.options = options
    this.name = options.name
    this.priority = options.priority || 0
    this.promise = options.promise
    //set "this" to function init() in options
    this.run = this.options.run.bind(this)
    if (options.fetch_page){
        this.fetch_page = options.fetch_page.bind(this)
    }
    //
    this.proxy = null //DataProxy which contains this table

    this.dataset = new Dataset(options.key)

}
Table.prototype = {
    add_entry:function(entry){
        this.dataset.add_entry(entry)
    }
}

function DataProxy(){
    this.reset()
    this.start_count = 0
}
DataProxy.prototype = {
    reset:function(){
        this.tables = {}
        this.table_priorities = []
    }
    ,add_table:function(table){
        this.tables[table.name] = table
        table.proxy = this
        var found_idx = -1;
        this.table_priorities.forEach(function(p){
            if (p==table.priority){
                found_idx = 1
                return true
            }
        });
        if (found_idx == -1) {
            this.table_priorities.push(table.priority)
            this.table_priorities.sort()
        }
        console.log('add table')
    }
    ,schedule:function(table){
        this.add_table(table)
    }
    ,build_queue:function(){
        var self = this
        var get_tables_by_priority = function(priority,queue){
            for (var name in self.tables){
                console.log('check name=',name)
                if (self.tables[name].priority == priority) {
                    queue.push(self.tables[name])
                }
            }
        }
        // run table's init one by one
        var queue = []
        this.table_priorities.forEach(function(p){
            get_tables_by_priority(p,queue)
        })
        return queue
    }
    ,start:function(){
        this.start_count += 1
        var self = this
        var queue = this.build_queue()
        console.log('start ---- queue=',queue.length)
        this.reset()
        if (queue.length == 0){
            //run every 100ms in frist 5 seconds 50 = 5000/100
            setTimeout(function(){self.start()},(this.start_count < 50 ? 100 : 5000))
            return
        }
        //reset start_count to shorten running interval in next 5 seconds
        this.start_count = 0 
        // run table's init one by one
        var run_queue = function(idx){
            var table = queue[idx]
            table.run()
            table.promise.progress(function(){
                if (idx+1 >= queue.length){
                    //all completed
                    self.start()
                } 
                else run_queue(idx+1)
            })
        }
        run_queue(0)
    }
}