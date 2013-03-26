var ms = 0;
var state = -1;
var time = 0;
var highestId = 0;
var highestTimestamp;
var currentEntry = null;
var captured = null;
var db = null;

function leadingzeros(o){
if (o.toString().length == 1) return '0' + o; else return o;
}

function ms_to_true_hours(ms){
	return Math.floor(ms_to_true_minutes(ms)/60);
}
function ms_to_true_minutes(ms){
	return Math.floor(ms/60000);
}
function ms_to_true_seconds(ms){
	return Math.floor(ms/1000);
}

function ms_to_minutes(ms){
	return Math.ceil(ms/60000);
}
function to_15_minutes(ms){
	var minutes = ms_to_minutes(ms);
	minutes = Math.ceil(minutes/15);
	minutes = minutes * 15;
	return minutes;
}

function startstop() {
	if (state == -1){
		state = 0;
		if(!currentEntry){
			newEntry();
		}
	}
	
	if (state == 0) {
		state = 1;
		then = new Date();
		then.setTime(then.getTime() - ms);
		document.getElementById('start-stop').className = "stop";
		document.getElementById('start-stop').value = "stop";
		document.getElementById('save').disabled = false;
		
		
	} else {
		document.getElementById('start-stop').className = "start";
		document.getElementById('start-stop').value = "start";
		document.getElementById('save').disabled = false;
		
		state = 0;
		now = new Date();
		ms = now.getTime() - then.getTime();
	}
}

function swreset() {
	state = -1;
	ms = 0;
	document.getElementById('tmp-time').value = '';
	document.getElementById('start-stop').className = "start";
	document.getElementById('start-stop').value = "start";
	document.getElementById('save').disabled = true;
}

function display() {
	setTimeout("display();", 50);
	if (state == 1)  {
		now = new Date();
		ms = now.getTime() - then.getTime();
		time_date = new Date(ms);
		var hours = leadingzeros(ms_to_true_hours(ms));
		var minutes = leadingzeros(ms_to_true_minutes(ms));
		var seconds = leadingzeros(ms_to_true_seconds(ms));
		time = hours+':'+minutes+':'+seconds;
		document.getElementById('tmp-time').value = time;
		if(currentEntry != null){
			if(currentEntry.timelogged != to_15_minutes(ms)){
				currentEntry.timelogged = to_15_minutes(ms);
				currentEntry.saveSoon();
			}
		}
	}
}

function save(){
	now = new Date();
	ms = now.getTime() - then.getTime();
	if(currentEntry != null){
		currentEntry.timelogged = to_15_minutes(ms);
		currentEntry.editField.focus();
	    getSelection().collapseToEnd();
	}
	swreset();
	currentEntry = null;
}

window.onload=display



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


try {
    if (window.openDatabase) {
        db = openDatabase("TimeTracker", "1.0", "WUI Time Tracker Data", 200000);
        if (!db)
            alert("Failed to open the database on disk.  This is probably because the version was bad or there is not enough space left in this domain's quota");
    } else
        alert("Couldn't open the database.  Please try with a WebKit enabled browser (like Chrome).");
} catch(err) { }

function loaded()
{
    db.transaction(function(tx) {
        tx.executeSql("SELECT COUNT(*) FROM WUITimeEntries", [], function(tx, result) {
            loadEntries();
        }, function(tx, error) {
            tx.executeSql("CREATE TABLE WUITimeEntries (id REAL UNIQUE, note TEXT, timelogged REAL, created REAL, modified REAL)", [], function(result) { 
				loadEntries();
            });
        });
    });
}

function loadEntries()
{
	var d = new Date();
	d.setDate(d.getDate() - 1);
	var yesterday = d.getTime();
    db.transaction(function(tx) {
        tx.executeSql("SELECT * FROM WUITimeEntries WHERE created > ?", [yesterday], function(tx, result) {
            for (var i = 0; i < result.rows.length; ++i) {
                var row = result.rows.item(i);
                var entry = new Entry();
                entry.id = row['id'];
                entry.text = row['note'];
                entry.timestamp = row['modified'];
                entry.timelogged = row['timelogged'];
                if (row['id'] > highestId)
                    highestId = row['id'];
                if (row['created'] > highestTimestamp)
                    highestTimestamp = row['created'];
            }
 
            if (!result.rows.length)
                newEntry();
        }, function(tx, error) {
            alert('Failed to retrieve notes from database - ' + error.message);
            return;
        });
    });
}
 
function modifiedString(date)
{
    return 'Modified: Today at ' + leadingzeros(date.getHours()) + ':' + leadingzeros(date.getMinutes()) + ':' + leadingzeros(date.getSeconds());
}
 
function newEntry()
{
    var entry = new Entry();
    entry.id = ++highestId;
	entry.text = '&nbsp;&nbsp;&nbsp;[ click to add a note ]';
    entry.timestamp = new Date().getTime();
    entry.timelogged = 0;
    entry.saveAsNew();
	currentEntry = entry;
}
 
if (db != null)
    addEventListener('load', loaded, false);