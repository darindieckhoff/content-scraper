
!function ($) {
  'use strict';
  
//call npms
  
  var request = require('request');
  var fs = require('fs');
  var cheerio = require('cheerio');
  var csv = require('fast-csv');
  
  var counter = 0;
  var dataArray = [];
  var contentWebsite = 'http://www.shirts4mike.com/shirts.php';
  
//Checks directory for data folder. If not found folder is created.  
  function checkDirectory(directory) {  
    fs.stat(directory, function(err, stats) {
      //Check if error defined and the error code is "not exists"
      if (err && err.code === 'ENOENT') {
        //Create the directory, call the callback.
        fs.mkdir(directory);
      } 
    });
  }
  
  checkDirectory("./data/"); 

/********************
-Gets website HTML using request for HTTP call and cheerio to load HTML. jQuery to get HTML elements.
-Iterates through all t-shirt li and gets title, url, image url, and time from site and stores in array.
-Logs error to console.
*******************/ 
  request(contentWebsite, function(error, response, HTML) {
    if (!error && response.statusCode === 200) {
      var $ = cheerio.load(HTML);
      $('img', '.products').each(function() {
        var title = $(this).attr('alt');
        var url = $(this).parent().attr('href');
        var fullURL = contentWebsite + url;
        var imageURL = contentWebsite + $(this).attr('src');
        var time = new Date().toLocaleTimeString();
        var csvArray = [];
        csvArray.push(title, imageURL, fullURL, time); 
        shirtInfo(url, csvArray);
      });
    } else {
      console.log('There’s been a ' + response.statusCode + ' ' + response.statusMessage + ' error. Cannot connect to http://www.shirts4mike.com/');
      errorLog(response);
    }//error check end
  }); //end request
  
/********************
-Gets each t-shirt's website HTML using request for HTTP call and cheerio to load HTML. jQuery to get HTML elements.
-Gets t-shirt price and stores in array. Array pushed into another array to hold all t-shirt data.
-Logs error to console.
-Uses counter to determine when all data has been gathered before writing to csv.
*******************/ 
  function shirtInfo(url, array) {
    request('http://www.shirts4mike.com/' + url, function(error, response, data){
      if (!error && response.statusCode === 200){
        var $ = cheerio.load(data);
        var price = $('.price').text();
        array.splice(1, 0, price);
        counter += 1;
        dataArray.push(array);
      } else {
        console.log('There’s been an error. Cannot connect to http://www.shirts4mike.com/' + url);
      } //end error check
      if (counter === 8) {
        createCSV(dataArray);
      } // end counter if
    }); //end request
  } //end shirtInfo function
   
/********************
-Gets date and uses it as file name.
-Header array added to begining of containing all t-shirt data.
-csv file created in data folder using fast-csv. 
*******************/
  function createCSV (dataArray) {
    var dateString = new Date().toISOString().slice(0, 10);
    var fileName = "./data/" + dateString + ".csv";
    var stream = fs.createWriteStream(fileName);
    stream.on('error', function (err) {
      console.log(err);
    }); //end write stream error
    var csvHeaders = ['Title' ,'Price', 'ImageURL' , 'URL' , 'Time'];
    dataArray.unshift(csvHeaders);
    csv.writeToPath(fileName, dataArray, {headers: true})
       .on("finish", function(){
           console.log("Data successfully compiled to " + fileName);
       }); //end .on
  } // end createCSV function
  

//Logs errors to .log file with time stamp and error message.
  function errorLog (response) {
    var errorLog = new Date().toString();
    errorLog += ' <' + response.statusCode + ' ' + response.statusMessage + ' error.>\r\n'; 
    fs.appendFile('scraper-error.log', errorLog, (err) => {
      if (err) throw err;
      console.log('The error log was appended to file!');
  }); // end append file
  } // end error log function
    
}();