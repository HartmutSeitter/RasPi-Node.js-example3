/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix now copied to local side
//  here it is currently running on apple pc
//  final version runs on raspberry pi
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// Obtain the pouchdb interface from VCAP_SERVICES
var pouchdb = require('pouchdb');
var http = require('http');
var fs = require('fs');
// hs start --- you have to get your values from your environment
/* this stuff is copied form environment variables from Bluemix

{
   "cloudantNoSQLDB": [
      {
         "name": "HS-Test1CloudantDB",
         "label": "cloudantNoSQLDB",
         "plan": "Shared",
         "credentials": {
            "username": "ee65a962-aac1-4302-9163-44621f5a1693-bluemix",
            "password": "f0c3df90d9ceaa4b6d441c54bc4cd7fa30e43b2745c4397fcebcdafedfbcfea3",
            "host": "ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com",
            "port": 443,
            "url": "https://ee65a962-aac1-4302-9163-44621f5a1693-bluemix:f0c3df90d9ceaa4b6d441c54bc4cd7fa30e43b2745c4397fcebcdafedfbcfea3@ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com"
         }
      }
   ]
}

*/

//*************************************************************
// Take a picture
//   by using the raspberry pi camera
//***********************************************************

takePicture = function (callback) {
  console.log("in take picture");
  var now = new Date(),
  // put this in when running on RaspberryPi
  //    fileName = '/home/pi/images/' + now.getTime() + '.jpg';
      fileName = 'AngelaMerkel.jpg';
     
     // if you are running on raspi then remove this stuff
     //exec('raspistill -o ' + fileName + ' -w 1920 -h 1080 -q 15', function (err, stdin, stdout) {
     //  if (!err) {
        uploadPicture(fileName);
     //  }
     //});
};

/*************************************************************/
//  Read image file and pipe it as stream
//*************************************************************
uploadPicture = function (fileName, callback) {
  console.log("start upload picture");
  //check if file exist
  
  var fs = require('fs');
  fs.exists(fileName, function (exists) {
    if (!exists) {
      return false;
    }
   
    // here put the credentials from the cloudantDB in Bluemix
  
    var host = 'ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com';
    var port = 443;
     // new db object with remote db
    var db = new pouchdb('books'),remote ='https://ee65a962-aac1-4302-9163-44621f5a1693-bluemix:f0c3df90d9ceaa4b6d441c54bc4cd7fa30e43b2745c4397fcebcdafedfbcfea3@ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com' + '/books';
	
    console.log("before fs.readFile");
    // read the file which was put on the filesystem in takePicture = data object 
    fs.readFile(fileName, function(err, data) { 
      if (!err) {
        console.log("before put image as attachment to db");
      
        // use date and time for the document id in cloudantDB
        // generate a unique id for cloudant using HS- and time
        var now = new Date(),
        cloudantDocID = 'HS-' + now.getTime();
         
        //create the doc to put into the db as an inline attachment
        var doc = {
           "_id": cloudantDocID,
          "ImageID": cloudantDocID,
          "Title": "AngelaMerkel",
          "celebrity":"",
          "age":"",
          "gender":"",
          "_attachments": {
          cloudandtDocID: {
              "content_type": "image/jpeg",
              data
            }
          }
        };
        db.put(doc).then(function (result) {
          console.log("put picture in db result", result);
        }).catch(function (err) {
          console.log(err);
        });
      }
    });
  });
};


/*************************************************************/

// create a new express server
var app = express();
// serve the files out of ./public as our main files

//hs I don't want to serve teh files out of ./public on each get command
//therefore I use the app.get() below
//app.use(express.static(__dirname + '/public'));


// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

//hs start
if (process.env.VCAP_SERVICES) {
   // Running on Bluemix. Parse for  the port and host that we've been assigned.
   //var env = JSON.parse(process.env.VCAP_SERVICES);
   var host = 'ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com';
   var port = 443;
   // Also parse out Cloudant settings.
   var cloudant = env['cloudantNoSQLDB'][0]['credentials'];
}

var list_records = function(req, res) {
  console.log("list records started");
	//if (process.env.VCAP_SERVICES) {
		  // Running on Bluemix. Parse out the port and host that we've been assigned.
		  //var env = JSON.parse(process.env.VCAP_SERVICES);
		  var host = 'ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com';
          var port = 443;
		  //console.log('VCAP_SERVICES: %s', process.env.VCAP_SERVICES);
		  // Also parse out Cloudant settings.
		  //var cloudant = env['cloudantNoSQLDB'][0]['credentials'];
          
          //console.log("env = ", env);
          console.log("host =", host);
          console.log("port =", port);
          //console.log("cloudant =", cloudant)
          
	//} // end if

	var db = new pouchdb('books'),remote =remote ='https://ee65a962-aac1-4302-9163-44621f5a1693-bluemix:f0c3df90d9ceaa4b6d441c54bc4cd7fa30e43b2745c4397fcebcdafedfbcfea3@ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com' + '/books';
	opts = {continuous: true};

  //Create a collection 
	db.replicate.to(remote, opts);
	db.replicate.from(remote, opts);

	var docs = db.allDocs(function(err, response) {
		val = response.total_rows;
        console.log("val response total rows", val);

		var details = "";
        var cloudantDocId=[];
		j=0;
		for(i=0; i < val; i++) {
			db.get(response.rows[i].id, function (err,doc){
				 j++;
                
                
                details= details + JSON.stringify(doc.ImageID) + " -- " +  JSON.stringify(doc.Title) + "\n";
			    // Kludge because of Node.js asynchronous handling. To be fixed - T V Ganesh
			    if(j == val) {
			    	res.writeHead(200, {'Content-Type': 'text/plain'});
						res.write("The content of the cloudant DB - is displayed \n");
			    	res.write(details);
			    	res.end();
			    	console.log("details=",details);
                   
			    }
		   }); // End db.get
            
		} //End for
  }); // End db.allDocs
  console.log("end of list function");
// hs
  console.log("get Attachement of one document which is known");
  db.getAttachment('HS-1457037200746.jpg', 'cloudandtDocID').then(function (blobOrBuffer) {
    // handle result
    console.log("get Attachemnt ok---doc id=HS-1457037200746.jpg");

    fs.writeFile("hs-bild.jpg", blobOrBuffer, function (err,data) {
      if (err) {
        return console.log(err);
      }
      console.log(data);
    });
                  
    }).catch(function (err) {
         console.log("get Attachemnt error possible no attachment found in doc=",err);
    });




}; // end var list_records

var db = new pouchdb('books'), remote ='https://ee65a962-aac1-4302-9163-44621f5a1693-bluemix:f0c3df90d9ceaa4b6d441c54bc4cd7fa30e43b2745c4397fcebcdafedfbcfea3@ee65a962-aac1-4302-9163-44621f5a1693-bluemix.cloudant.com' + '/books';
opts = { continuous: true };
console.log("cloudant url=",remote);
db.replicate.to(remote, opts);
db.replicate.from(remote, opts);
console.log("we started the server and waiting for the get request");
// hs we reach this point
var port = (process.env.VCAP_APP_PORT || 1337);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');
/* get request */
app.get('/',function(req,res) {
	//res.send("Halloooooo Hartmut GET");
  	list_records(req,res);
    takePicture();
});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
	// print a message when the server starts listening
  console.log("hs server starting on " + appEnv.url);
});
