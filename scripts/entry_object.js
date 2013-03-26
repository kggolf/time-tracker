function Entry()
{
    var self = this;

    var entry = document.createElement('div');
    entry.className = 'entry';
    this.entry = entry;


    var close = document.createElement('div');
    close.className = 'closebutton';
    close.addEventListener('click', function(event) { return self.close(event) }, false);
    entry.appendChild(close);

    var time = document.createElement('div');
    time.className = 'time';
    time.setAttribute('contentEditable', true);
    time.addEventListener('click', function() { return self.focus() }, false);
    time.addEventListener('keyup', function() { return self.onKeyUpTimeEdit() }, false);
    time.addEventListener('focus', function() { return self.onTimeFocus() }, false);
    entry.appendChild(time);
    this.timeField = time;

    var edit = document.createElement('div');
    edit.className = 'edit';
    edit.setAttribute('contentEditable', true);
	edit.addEventListener('keyup', function() { return self.onKeyUp() }, false);
    edit.addEventListener('focus', function() { return self.onEditFocus() }, false);
    entry.appendChild(edit);
    this.editField = edit;

    var ts = document.createElement('div');
    ts.className = 'timestamp';
    entry.appendChild(ts);
    this.lastModified = ts;

    document.getElementById("entries").appendChild(entry);

    return this;
}





Entry.prototype = {
	get id()
    {
        if (!("_id" in this))
            this._id = 0;
        return this._id;
    },

    set id(x)
    {
        this._id = x;
    },

    get text()
    {
        return this.editField.innerHTML;
    },

    set text(x)
    {
        this.editField.innerHTML = x;
    },

    get timestamp()
    {
        if (!("_timestamp" in this))
            this._timestamp = 0;
        return this._timestamp;
    },

    set timestamp(x)
    {
        if (this._timestamp == x)
            return;

        this._timestamp = x;
        var date = new Date();
        date.setTime(parseFloat(x));
        this.lastModified.textContent = modifiedString(date);
    },

	get timelogged()
	{
		return this.timeField.innerHTML;
	},
	
	set timelogged(x)
	{
		this.timeField.innerHTML = x;
		return;
    },

    onEntryClick: function(e)
    {
        this.editField.focus();
        getSelection().collapseToEnd();
    },

    onEditFocus: function(event)
    {
		if (this.text == '&nbsp;&nbsp;&nbsp;[ click to add a note ]'){
			this.text = '';
		}
    },

    onTimeFocus: function()
    {
        getSelection().collapseToEnd();
    },

    onKeyUp: function()
    {
        this.dirty = true;
        this.saveSoon();
		return true;
    },

	onKeyUpTimeEdit: function()
	{
		this.dirty = true;
		this.saveSoon();
	},

	close: function(event)
	{
		this.cancelPendingSave();

		var entry = this;
		db.transaction(function(tx)
		{
			tx.executeSql("DELETE FROM WUITimeEntries WHERE id = ?", [entry.id]);
		});

		var duration = event.shiftKey ? 2 : .5;
		this.entry.style.webkitTransition = '-webkit-transform ' + duration + 's ease-in, opacity ' + duration + 's ease-in';
		this.entry.offsetTop; // Force style recalc
		this.entry.style.webkitTransformOrigin = "0 0";
		this.entry.style.webkitTransform = 'skew(30deg, 0deg) scale(0)';
		this.entry.style.opacity = '0';

		var self = this;

		if (self === currentEntry){
			currentEntry = null;
			if (state == 1){
				now = new Date();
				ms = now.getTime() - then.getTime(); 
				alert("Your timer has been stopped at "+ms_to_minutes(ms)+" minutes becuase you have removed the current entry");
				swreset();
			}
		}
		setTimeout(function() { document.getElementById("entries").removeChild(self.entry) }, duration * 1000);
	},

    saveSoon: function()
    {
        this.cancelPendingSave();
        var self = this;
        this._saveTimer = setTimeout(function() { self.save() }, 200);
    },

    cancelPendingSave: function()
    {
        if (!("_saveTimer" in this))
            return;
        clearTimeout(this._saveTimer);
        delete this._saveTimer;
    },

    save: function()
    {
        this.cancelPendingSave();

        if ("dirty" in this) {
            this.timestamp = new Date().getTime();
            delete this.dirty;
        }

        var entry = this;
		var now = new Date().getTime();
		if(db){
	        db.transaction(function (tx)
	        {
	            tx.executeSql("UPDATE WUITimeEntries SET note = ?, timelogged = ?, modified = ? WHERE id = ?", [entry.text, entry.timelogged, now, entry.id]);
			
			}, 
			function(tx, error) {
	            alert('Failed to Save existing entry in database - ' + error.message);
	            return;
	        }
			);
		}
    },

	saveAsNew: function()
    {
        this.timestamp = new Date().getTime();

        var entry = this;
		var now = new Date().getTime();
		if(db){
	        db.transaction(function (tx) 
	        {
	            tx.executeSql("INSERT INTO WUITimeEntries (id, note, timelogged, modified, created) VALUES (?, ?, ?, ?, ?)", [entry.id, entry.text, entry.timelogged, now, now]);
	        }, 
			function(tx, error) {
	            alert('Failed to Create new entry in database - ' + error.message);
	            return;
	        }
			); 
		}
    },
}