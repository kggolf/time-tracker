
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