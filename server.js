var ngio = new Newgrounds.io.core("a", "b");
var scoreboards,medals
var upload_queue = []
var upload_status = "waiting"
ngio.getValidSession(function() {
  if (ngio.user) {
    //console.info("Logged in: "+ ngio.user.name)
    ngio.callComponent("ScoreBoard.getBoards", {}, function (result) {
        if (result.success) {
          scoreboards = result.scoreboards
          ngio.callComponent("Medal.getList", {}, function (result) {
              if (result.success) {
                medals = result.medals
              } else {
                console.error("Medal retrieval error: " + result.error.message)
                upload_status = "error"
              }
              upload_status = "ready"
              process_queue()
          })
        } else {
          console.error("Scoreboard retrieval error: " + result.error.message)
          upload_status = "error"
        }
    })
  } else {
  	if(ngio.login_error) {
    	console.warn("Login error: " + ngio.login_error.message + ", no scores will be sent.")
    } else {
    	console.warn("Unknown user, no scores will be sent.")
    }
    upload_status = "error"
  }
})

function process_queue() {
  //console.debug("upload_queue length: ", upload_queue.length)
  const iterations = upload_queue.length
  for (var i = 0; i < iterations; i++) {
    const item = upload_queue.shift()
    //console.info("attempting upload for: " + item.name)
    if (item.is_medal) {
      for (var m = 0; m < medals.length; m++) {
        const medal = medals[m]
        if (item.name == medal.name) {
          if (!medal.unlocked) {
            //console.debug("calling Medal.unlock...")
            ngio.callComponent('Medal.unlock', {id:medal.id},function(result){
              if (result.success) {
                console.log("unlocked medal "+ medal.name)
                medal.unlocked = true
              } else {
                console.warn("medal error: " + result.error.message + ", will retry later")
                upload_queue.push(item)
              }
            })
          } else {
            //console.info(medal.name + " is already unlocked")
          }
        } else {
          //console.debug(item.name + " != " + medal.name)
        }
      }
    } else {
      //console.debug("not a medal")
    }
    if (item.is_score) {
      for (var s = 0; s < scoreboards.length; s++) {
        const score = scoreboards[s]
        if (item.name == score.name) {
          if (
            typeof score.value === 'undefined'
            || (item.score_type == "max" && item.score > score.value)
            || (item.score_type == "min" && item.score < score.value)
          ) {
            //console.debug("calling ScoreBoard.postScore...")
            ngio.callComponent('ScoreBoard.postScore', {id:score.id, value:item.score},function(result){
              //console.debug("postScore result: ", result)
              if (result.success) {
                console.log("new score posted for " + item.name + ": " + item.score)
                score.value = item.score
              } else {
                console.warn("score error: " + result.error.message + ", will retry later")
                upload_queue.push(item)
              }
            })
          } else {
            //console.info("existing " + score.name + " score is better")
          }
        } else {
          //console.debug(item.name + " != " + score.name)
        }
      }
    } else {
      //console.debug("not a score")
    }
  }
}

export function upload_stat(board_name, score_value) {
  //console.info("Request to update score: " + board_name)
  if (
    [	
    	"Destroy Everything","Rebuild Everything","Straight Path","Hard Path",
    	"Leaders","Luddite","Story Complete","Child of the World"
    ]
    .includes(board_name)
    && score_value >= 1
  ){
    upload_queue.push({
      name: board_name,
      is_medal: true,
      is_score: true,
      score_type: "max",
      score: score_value
  })
  } else {
    var type;
    if (
      []
      .includes(board_name)
    ) { type = "min"} else {type = "max"}
      
    upload_queue.push({
      name: board_name,
      is_medal: false,
      is_score: true,
      score_type: type,
      score: score_value
    })
  }
  if(upload_status == "error") { upload_queue.length = 0 }
  if(upload_status == "ready") { process_queue() }
}
