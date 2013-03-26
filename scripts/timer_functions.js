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
	return Math.floor(ms/60000)%60;
}
function ms_to_true_seconds(ms){
	return Math.floor(ms/1000)%60;
}

function ms_to_minutes(ms){
	return Math.ceil(ms/60000)%60;
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
