$(function(){
    document.getElementById("courseDataPanel").style.display = "none";
    document.getElementById("courseplanner-timetable").style.display = "none";

    userAuth.onAuthStateChanged(function(user) {
        var db = firestoreDB;
  
      if (user) {
       // User is signed in.
        if(user!=null){
            deleteAllFiles();//delete any previous data
            var userData = docRef.collection("student").doc('post-secondary').collection(uid).doc('userData'); //Sets the doc reference
                
            userData.get().then(function(doc) { //Gets the document reference and checks for the document
                    
                if (doc.exists){
                    document.getElementById("courseTable-content").innerHTML = '<tr id=temp disabled>'
                    +'<td>~~~~~END OF LIST~~~~~</td><td>~~~~~END OF LIST~~~~~</td><td>~~~~~END OF LIST~~~~~</td>'
                    +'<td>~~~~~END OF LIST~~~~~</td><td>~~~~~END OF LIST~~~~~</td><td>~~~~~END OF LIST~~~~~</td></tr>';
                    $("#temp").hide();
                    var school = doc.data().school;
                    getAllCourses(school);
                }
                else
                    console.log("eorror");

                }).catch(function(error) { //Catch any retrieval error
                    console.log("Error in $function in searchCourses.js");
                    console.log("Error getting document:", error);
                });
            }
        }
    });
});
function appendHeaderFooter(body){
    
    var html = '<th scope="col" class="text-center">Course Code</th>'
        +'<th scope="col" class="text-center">Course Name</th>'
        +'<th scope="col" class="text-center">Difficulty</th>'
        +'<th scope="col" class="text-center">Workload</th>'
        +'<th scope="col" class="text-center">Scheduled Time & Day</th>'
        +'<th scope="col" class="text-center">Instructor</th>';
    //APPEND THE TABLE FOR EACH COURSE
    $("#courseTable-header").append(html);
    $("#courseTable-footer").append(html);
    
    $("#courseTable-content").append(body);
    //document.getElementById("courseTable-content").innerHTML = body;
    $('#multi-filter-select').DataTable( {
        "pageLength": 10,
        initComplete: function () {
            this.api().columns().every( function () {
                var column = this;
                var select = $('<select class="form-control"><option value=""></option></select>')
                .appendTo( $(column.footer()).empty() )
                .on( 'change', function () {
                    var val = $.fn.dataTable.util.escapeRegex(
                        $(this).val()
                        );

                    column
                    .search( val ? '^'+val+'$' : '', true, false )
                    .draw();
                } );

                column.data().unique().sort().each( function ( d, j ) {
                    select.append( '<option value="'+d+'">'+d+'</option>' )
                } );
            } );
        }
    });
}

//THIS IS FOR WHEN THE USER INPUTS THE WORD "ALL" TO GET ALL THE OFFERED COURSES
function getAllCourses(schoolDatabase){
    var htmlArray = [];
    var totalResults = 0;
    
    var refPath = realtimeDB.ref('/'+schoolDatabase);
    refPath.once('value').then(function(snapshot) {
        if (snapshot.exists()){

           snapshot.forEach(function(childSnapshot) {

                childSnapshot.forEach(function(childSnapshot2){
                    var coursename = childSnapshot2.val().coursename;
                    var workload = childSnapshot2.val().workload;
                    var difficulty = childSnapshot2.val().difficulty;
                    var learning_style = childSnapshot2.val().learning_style;
                    var day = childSnapshot2.val().days;
                    var instructor = childSnapshot2.val().instructor;
                    
                    var days = day.replace(", ", '+');

                    if(days != 'Online'){
                                
                        if(childSnapshot2.val().starttime != undefined && childSnapshot2.val().endtime != undefined){
                            var startTime = childSnapshot2.val().starttime;
                            var endTime = childSnapshot2.val().endtime; 
                            var timeStr = startTime+'-'+endTime+' on ';
                        }
                    }
                    else{
                        var startTime = 'N/A';
                        var endTime = 'N/A';
                        var timeStr = '';
                    }
                    
                    var html = '<tr class="text-center" id="'+childSnapshot.val()+'">'
                            +'<td>'+childSnapshot.key+"-"+childSnapshot2.key+'</td>'
                            +'<td>'+coursename+'</td>'
                            +'<td>'+workload+'</td>'
                            +'<td>'+difficulty+'</td>'
                            +'<td>'+timeStr+day.toString()+'</td>'
                            +'<td>'+instructor+'</td>'
                            +'<td><a id=addBtn href="#mycourse-planner-section" onclick=addToCoursePlan(this.name)  name="'
                            +childSnapshot.key+"-"+childSnapshot2.key+','
                            +coursename+','
                            +workload+','
                            +difficulty+','
                            +learning_style+','
                            +startTime+','
                            +endTime+','
                            +days+'" > ADD </a></td></tr>';
                    //APPEND THE TABLE FOR EACH COURSE
                    htmlArray.push(html);
                    totalResults++;
                })
               
            })
            appendHeaderFooter(htmlArray);
        }
        else{
        }                  
    })  
 }

 /**
  * THIS IS TO ADD COURSES TO THE PLANNER
  */
 function addToCoursePlan(input){
    
    if(!input.includes(undefined)){

       // document.getElementById("resultTable2").innerHTML = "";
        //document.getElementById("plannerBtn").style.visibility = "visible";
        //document.getElementById("coursePlanner").style.display = "block"; 
        var user = userAuth.currentUser;
        var userEmail = user.uid;
        var courseInfo = input.split(",");
        

        var docRef = firestoreDB.collection("myacadvisor-db").doc("mycourseplanner-db").collection("temp-"+userEmail).doc(courseInfo[0]);

        var docData = {
            code: courseInfo[0], coursename: courseInfo[1],
            workload: courseInfo[2], difficulty: courseInfo[3],
            learning_style: courseInfo[4], starttime: courseInfo[5], endtime: courseInfo[6], days: courseInfo[7]
        }

        docRef.set(docData).then(function() {
            console.log("Temp-courseplanner has been successfully created!");
        })
        
        notify("add", courseInfo[0]);

        updateCoursePlanner();
    }
    else{
        //document.getElementById("coursePlanner").style.display = "none";
        window.location.href = "#section-3%4";
        notify("error","error");
        
    }
    
}

 /**
  * THIS IS TO RELOAD THE TABLE AND UPDATE THE COURSE PLANNER
  */
function updateCoursePlanner(){
    var totalCourses = 0;
    var difficultyScore = 0;
    var workloadScore = 0;

    var codeArray = [];
    var coursenameArray = [];
    var startTimeArr = [];
    var endTimeArr = [];
    var daysArr = [];

    //document.getElementById("resultTable2").innerHTML = "";
    var user = userAuth.currentUser;
    var userEmail = user.uid;

    var tempPath = firestoreDB.collection("myacadvisor-db").doc("mycourseplanner-db").collection("temp-"+userEmail);
    tempPath.get().then(sub => {
        /**
         * CHECK IF THE CURRENT PROF HAS ANY COURSES REGISTERED UNDER THEIR NAME
         */
          if (sub.docs.length > 0) {
          
            tempPath.get().then(querySnapshot => {
                querySnapshot.forEach(doc => {  //PUSH THE COURSES INTO AN ARRAY
                    var coursePath = tempPath.doc((doc.id).toString());  //doc.id = "comp-1000"
                    codeArray.push(doc.id);
                    coursePath.get().then(function(doc) { //Gets the document reference and checks for the document
                
                        if (doc.exists){ //if the document exists then output the fullname
                            
                            var courseCode = doc.data().code;   //split the course code to use and find in the course database
                            var coursename = doc.data().coursename;
                            var workload = doc.data().workload;
                            var difficulty = doc.data().difficulty;
                            var learning_style = doc.data().learning_style;
                            var days = doc.data().days;
                            if(days != 'Online'){
                                
                                if(doc.data().starttime != undefined && doc.data().endtime != undefined){
                                    var startTime = doc.data().starttime;
                                    var endTime = doc.data().endtime;
                                }
                            }
                            else{
                                var startTime = 'N/A';
                                var endTime = 'N/A';
                            }
                            
                            

                            coursenameArray.push(coursename);
                            startTimeArr.push(startTime);
                            endTimeArr.push(endTime);
                            daysArr.push(days);
                            totalCourses++;
                            
                            document.getElementById("courseDataCode").textContent = (codeArray).toString();
                            document.getElementById("courseDataName").textContent = (coursenameArray).toString();
                            document.getElementById("courseDataStart").textContent = (startTimeArr).toString();
                            document.getElementById("courseDataEnd").textContent = (endTimeArr).toString();
                            document.getElementById("courseDataDays").textContent = (daysArr).toString();
                            
                            //console.log(document.getElementById("courseDataCode").innerText);
                            //console.log(document.getElementById("courseDataName").innerText);
                            //console.log(document.getElementById("courseDataStart").innerText);
                            //console.log(document.getElementById("courseDataEnd").innerText);
                            
                            //TO DETERMINE DIFFUCILTY LEVEL
                            switch(difficulty){
                                case "low":
                                    difficultyScore+=1; break;
                                case "med":
                                    difficultyScore+=2; break;
                                case "high":
                                    difficultyScore+=3; break;
                                default:
                                    break;
                            }
                            //TO DETERMINE WORKLOAD LEVEL
                            switch(workload){
                                case "low":
                                    workloadScore+=1; break;
                                case "med":
                                    workloadScore+=2; break;
                                case "high":
                                    workloadScore+=3; break;
                                default:
                                    break;
                            }

                            //CALCULATE THE SCORES
                            calculate(difficultyScore, workloadScore, sub.docs.length, totalCourses);

                            $("#includecontent").load("timetable.html");
                            window.location.href = "#courseplanner-timetable";
                            document.getElementById("courseplanner-timetable").style.display = "block";
                            

                            
                        }
                        else{
                            document.getElementById("courseplanner-timetable").style.display = "none";
                        }
                    }).catch(function(error) { //Catch any retrieval error
                        console.log("ERROR IN GETCOURSES() IN COURSE MANAGER"+error);
                        document.getElementById("courseplanner-timetable").style.display = "none"; //HIDE THE SCHEDULER
                    })
                })
            })
        }
        else{
            document.getElementById("courseplanner-timetable").style.display = "none"; //HIDE THE SCHEDULER
            deleteAllFiles();
            window.location.href = "#mycourse-planner-section"; //GO TO THE COURSE PLANNER SEARCH
        }
    })
}

/**
 * DELETE FROM THE COURSEPLANNER
 */
function deleteCourse(code){
    var user = userAuth.currentUser;
    var userEmail = user.uid;
    var db = firestoreDB.collection("myacadvisor-db").doc("mycourseplanner-db").collection("temp-"+userEmail);

    db.doc(code).delete().then(function() {
        updateCoursePlanner();
        console.log("Document successfully deleted!");
    }).catch(function(error) {
        console.error("Error removing document: ", error);
    });
 }

 /**
  * THIS IS TO CALCULATE THE SCORES
  */
function calculate(difficultyScore, workloadScore, totalLength, totalCourses){

    var denominator = totalCourses * 3;
    var diff_score = (difficultyScore/denominator)*100;
    var work_score = (workloadScore/denominator)*100;
    /**
     * USING THE SCORES ABOVE, WE CALCULATE THE LEVEL SCORES
     * 
     * SO DENOMINATOR IS MAX LEVEL SCORE POSSIBLE USING THE TOTAL NUMBER OF COURSES MULTIPLIED BY 3
     * THEN WE USE THIS TO DIVIDE THE CURRENT LEVEL SCORE OF DIFFICULTY OR WORKLOAD
     * 
     * SO,
     * LEVEL OF DIFFICULTY = 5 AND TOTAL NUMBER OF COURSES IS 2
     * WE DO,
     * 5 / (2*3) => 3.3333 
     */


     /**THIS ONE IS TO SEE IF DIFFICULTY IS ABOVE 67%, IN BETWEEN OR BELOW
      * 
      */
    if(diff_score>(100*(2/3))){
        var difficulty = "High Difficulty!";
    }
    else if((100*(1/3))<diff_score && diff_score<=(100*(2/3))){
        var difficulty = "Medium Difficulty";
    }
    else
        var difficulty = "Low Difficulty";

    /**
    * FOR WORKLOAD SCORE
    */
    if(work_score>(100*(2/3))){
        var workload = "High Workload!";
    }
    else if((100*(1/3))<work_score && work_score<=(100*(2/3))){
        var workload = "Medium Workload";
    }
    else
        var workload = "Low Workload";

    //ONE ALL COURSES HAVE BEEN APPENEDED TO THE COURSE PLANNER TABLE
    //THEN OUTPUT THE RESULTS OF THE CALCULATOR
     if(totalCourses==totalLength){
        document.getElementById('difficulty-title').innerText = difficulty;
       levelCalculator(diff_score, 'difficulty');
       document.getElementById('workload-title').innerText = workload;
       levelCalculator(work_score, 'workload');
     }
}

//RESET THE TABLE AND DELETE ALL THE FILES IN THE DATABASE
 function deleteAllFiles(){
    var user = userAuth.currentUser;
    var userEmail = user.uid;

    var tempPath = firestoreDB.collection("myacadvisor-db").doc("mycourseplanner-db").collection("temp-"+userEmail);
    tempPath.get().then(sub => {
        /**
         * CHECK IF THE CURRENT PROF HAS ANY COURSES REGISTERED UNDER THEIR NAME
         */
        if (sub.docs.length > 0) {
          
            tempPath.get().then(querySnapshot => {
                querySnapshot.forEach(doc => {  //PUSH THE COURSES INTO AN ARRAY
                    var coursePath = tempPath.doc((doc.id).toString());  //doc.id = "comp-1000"
                            
                            coursePath.delete().then(function() {
                                console.log("Document successfully deleted!");
                            })
                    }).catch(function(error) { //Catch any retrieval error
                    console.log("ERROR IN LINE 416 OF SEARCH COURSES"+error);
                });
            })
        }
    })
}

/**
 * CLOSE AND RESET THE SCHEDULE MAKER
 */
$('#closeSchedBtn').click(function(e){
    swal({
        title: 'Reset the Schedule Maker?',
        text: "Resetting means all the changes you have done will be deleted permanently.",
        icon: 'warning',

        buttons:{
            confirm: {
                value: true,
                text : 'Yes',
                className : 'btn-danger'
            },
            cancel: {
                visible: true,
            }
        }
    }).then((Proceed) => {
        if (Proceed) {
            swal({
                title: 'Resetted!',
                text: 'Your schedule table has been resetted.',
                type: 'success',
                buttons : {
                    Close: true
                }
            })
            deleteAllFiles();
            updateCoursePlanner();
            notify("schedReset", "none");
        } else {
            swal.close();
        }
    });
});

/**
 * FOR NOTIFICATIONS
 * @param {Type of notification} type 
 * @param {Course is used only for notifying after course addition} coursecode 
 */
function notify(type, coursecode){
	var placementFrom = "top";
	var placementAlign = "center";
	var state = "success";
	var style = "withicon";
	var content = {};

    /**
     * FOR COURSE ADDITIONS
     */
    if(type=="add"){
		content.message = 'You have selected '+coursecode+' to be added to your course planner.';
		content.title = 'Notification from MyCoursePlanner: ';
		if (style == "withicon") {
			content.icon = 'fa icon-calendar';
		} else {
			content.icon = 'none';
		}
		content.target = '_blank';

		$.notify(content,{
		    type: state,
			placement: {
				from: placementFrom,
				align: placementAlign
			},
			time: 1000, //opens after 1 second
            delay: 1500 //closes after 2 seconds
        });
    }
    /**
     * FOR RESETTING THE SCHEDULER MAKER
     */
    else if(type=="schedReset"){
        content.message = 'You have successfully resetted your schedule maker.';
        content.title = 'MySchedule Maker: ';
        if (style == "withicon") {
            content.icon = 'fa icon-calendar';
        } else {
            content.icon = 'none';
        }
        content.target = '_blank';

        $.notify(content,{
            type: state,
            placement: {
                from: placementFrom,
                align: placementAlign
            },
            time: 1000, //opens after 1 second
            delay: 4000 //closes after 2 seconds
        });
    }
    /**FOR DATALOADER.JS */
    else if(type=='dataloader.js'){
        var placementFrom = "top";
        var placementAlign = "center";
        var state = "success";
        var content = {};
    
            content.message = 'You have successfully uploaded your transcript.';
            content.title = 'Notification from MyTranscript Parser: ';
            content.icon = 'fa fa-file-pdf';
            content.target = '_blank';
    
            $.notify(content,{
                type: state,
                placement: {
                    from: placementFrom,
                    align: placementAlign
                },
                time: 2000, //opens after 1 second
                delay: 10000 //closes after 2 seconds
        });
    }
    /**
     * FOR COURSE SELECTION ERROR
     */
    else{
        swal("ERROR", "Course you have clicked cannot be added", {
            icon : "error",
            buttons: {        			
                confirm: {
                    className : 'btn-danger'
                }
            },
        });
    }
}

function levelCalculator(score, type){
    if(score > (100*(2/3)) ){
        Circles.create({
            id:type,
            radius:40,
            value: score,
            maxValue:100,
            width:5,
            text: score.toFixed()+" %",
            colors: ['#f1f1f1', '#ff2a00'],
            duration:400,
            wrpClass:'circles-wrp',
            textClass:'circles-text',
            styleWrapper:true,
            styleText:true
        })
    }
    else if((100*(1/3))<score && score<=(100*(2/3))){
        Circles.create({
            id:type,
            radius:40,
            value: score,
            maxValue:100,
            width:5,
            text: score.toFixed()+" %",
            colors: ['#f1f1f1', '#ff8c00'],
            duration:400,
            wrpClass:'circles-wrp',
            textClass:'circles-text',
            styleWrapper:true,
            styleText:true
        })
    }
    else{
        Circles.create({
            id:type,
            radius:40,
            value: score,
            maxValue:100,
            width:5,
            text: score.toFixed()+" %",
            colors: ['#f1f1f1', '#2BB930'],
            duration:400,
            wrpClass:'circles-wrp',
            textClass:'circles-text',
            styleWrapper:true,
            styleText:true
        })
    }
}