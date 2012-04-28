window.onload = function() {
  function Connection() {
    var serverUri = "ws://" + document.location.host.replace(/:3000/, ':3001') + '/';

    this.onOpen = (function(event) {
      console.log("connection opened");
    });

    this.onClose = (function(event) {
      console.log("connection closed");
    });

    this.onMessage = (function(event) {
      console.log("message received:");
      console.log(event.data);

      var d = JSON.parse(event.data);
      // console.log(d);

      for (var i = 0; i < d.length; i++) {
        // console.log(d[i]);

        if (d[i].type == "position" && d[i].object_type == "player") {
          // create our player entity with some premade components
          if (players["" + d[i].id] == undefined) {
            players["" + d[i].id] = Crafty.e("2D, Canvas, player, RightControls, Hero, Animate, Collision, KeyBoard")
              .attr({x: 0, y: 0, z: 10})
              .rightControls(playerSpeed)
              .bind('KeyDown', function(e) {
                // place bomb
                if (e.key == Crafty.keys['SPACE']) {
                  conn.sendMessage({type: "place_bomb" });
                }
              });
          }

          players["" + d[i].id].attr({x: d[i].coordinates[0] * spriteSize, y: d[i].coordinates[1] * spriteSize});
          pendingMovement = false;

        } else if (d[i].type == "position" && d[i].object_type == "block") {
          gameobjects["" + d[i].id] = Crafty.e("2D, DOM, bush1").attr({x: d[i].coordinates[0] * spriteSize, y: d[i].coordinates[1] * spriteSize});

        } else if (d[i].type == "position" && d[i].object_type == "bomb") {
          console.log("bomb placed....");

          gameobjects["" + d[i].id] = Crafty.e("2D, DOM, flower").attr({x: d[i].coordinates[0] * spriteSize, y: d[i].coordinates[1] * spriteSize});

        } else if (d[i].type == "delete" && d[i].object_type == "bomb") {
          console.log("BOOOOOOM!!!!!");

          gameobjects["" + d[i].id].destroy();

          // for (var key in gameobjects) {
          //   var o = gameobjects[key];
          // }

        } else if (d[i].type == "delete" && d[i].object_type == "player") {
          gameobjects["" + d[i].id].destroy();

        } else if (d[i].type == "my_player_id" && d[i].object_type == "player_id") {
          myPlayerID = d[i].player_id;

        }

      }

    });

    this.onError = (function(event) {
      console.log("connection error:");
      console.log(event);
    });

    this.sendMessage = (function(msg) {
      msg = JSON.stringify(new Array(msg));
      console.log("message sent: ");
      console.log(msg);
      ws.send(msg);
    });

    this.init = (function() {
      console.log("init server: " + serverUri);
      // connect socket
      ws = new WebSocket(serverUri);
      ws.onopen = this.onOpen;
      ws.onclose = this.onClose;
      ws.onmessage = this.onMessage;
      ws.onerror = this.onError;
    });

  }

  var spriteSize = 48;
  var playerSpeed = 3;
  var canvasSizeX = spriteSize * 15;
  var canvasSizeY = spriteSize * 11;
  var lastms = 0;
  var gameobjects = new Object();
  var players = new Object();
  var pendingMovement = false;
  var myPlayerID = null;

  // connect server
  var conn = new Connection;
  conn.init();

	//start crafty
	Crafty.init(canvasSizeX, canvasSizeY);
	Crafty.canvas.init();
	
	//turn the sprite map into usable components
	Crafty.sprite(spriteSize, "images/sprite.png", {
		grass1: [0,0],
		grass2: [1,0],
		grass3: [2,0],
		grass4: [3,0],
		flower: [0,1],
		bush1: [0,2],
		bush2: [1,2],
		player: [0,3]
	});
	
	//method to randomy generate the map
	function generateWorld() {
		//generate the grass along the x-axis
		for(var i = 0; i < 25; i++) {
			//generate the grass along the y-axis
			for(var j = 0; j < 20; j++) {
				grassType = Crafty.math.randomInt(1, 4);
				Crafty.e("2D, Canvas, grass"+grassType)
					.attr({x: i * spriteSize, y: j * spriteSize});
				
				//1/50 chance of drawing a flower and only within the bushes
				/*if(i > 0 && i < 24 && j > 0 && j < 19 && Crafty.math.randomInt(0, 50) > 49) {
					Crafty.e("2D, DOM, flower, solid, SpriteAnimation")
						.attr({x: i * spriteSize, y: j * spriteSize})
						.animate("wind", 0, 1, 3)
						.bind("EnterFrame", function() {
							if(!this.isPlaying())
								this.animate("wind", 80);
						});
				}*/
			}
		}
		
		//create the bushes along the x-axis which will form the boundaries
		/*for(var i = 0; i < 25; i++) {
			Crafty.e("2D, Canvas, wall_top, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: i * spriteSize, y: 0, z: 2});
			Crafty.e("2D, DOM, wall_bottom, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: i * spriteSize, y: 304, z: 2});
		}
		
		//create the bushes along the y-axis
		//we need to start one more and one less to not overlap the previous bushes
		for(var i = 1; i < 19; i++) {
			Crafty.e("2D, DOM, wall_left, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: 0, y: i * spriteSize, z: 2});
			Crafty.e("2D, Canvas, wall_right, solid, bush"+Crafty.math.randomInt(1,2))
				.attr({x: 384, y: i * spriteSize, z: 2});
		}*/
	}
	
	//the loading screen that will display while our assets load
	Crafty.scene("loading", function() {
		//load takes an array of assets and a callback when complete
		Crafty.load(["images/sprite.png"], function () {
			Crafty.scene("main"); //when everything is loaded, run the main scene
		});
		
		//black background with some loading text
		Crafty.background("#000");
		Crafty.e("2D, DOM, Text").attr({w: 100, h: 20, x: 150, y: 120})
			.text("Loading")
			.css({"text-align": "center"});
	});
	
	//automatically play the loading scene
	Crafty.scene("loading");
	
	Crafty.scene("main", function() {
		generateWorld();
		
		Crafty.c('Hero', {
			init: function() {
					//setup animations
					this.requires("SpriteAnimation, Collision")
					.animate("walk_left", 6, 3, 8)
					.animate("walk_right", 9, 3, 11)
					.animate("walk_up", 3, 3, 5)
					.animate("walk_down", 0, 3, 2)
					//change direction when a direction change event is received
					.bind("NewDirection",
						function (direction) {
							if (direction.x < 0) {
								if (!this.isPlaying("walk_left"))
									this.stop().animate("walk_left", 10, -1);
							}
							if (direction.x > 0) {
								if (!this.isPlaying("walk_right"))
									this.stop().animate("walk_right", 10, -1);
							}
							if (direction.y < 0) {
								if (!this.isPlaying("walk_up"))
									this.stop().animate("walk_up", 10, -1);
							}
							if (direction.y > 0) {
								if (!this.isPlaying("walk_down"))
									this.stop().animate("walk_down", 10, -1);
							}
							if(!direction.x && !direction.y) {
								this.stop();
							}
					})
					// A rudimentary way to prevent the user from passing solid areas
          // or out of boundary
					.bind('Moved', function(from) {
						if(this.hit('solid') ||
               this._x < 0 || this._x > (canvasSizeX - spriteSize) ||
               this._y < 0 || this._y > (canvasSizeY - spriteSize) ){
							this.attr({x: from.x, y:from.y});
						} else {
              var dir;
              // left
              if (this._x < from.x) {
                dir = "left"
              } else if (this._x > from.x) {
                dir = "right"
              } else if (this._y < from.y) {
                dir = "up"
              } else if (this._y > from.y) {
                dir = "down"
              }

              var time = new Date();
              var ms = time.getTime();

              // console.log(ms);

              // if ((ms - lastms) > 50) {
              //   // console.log("direction: " + dir);
              //   lastms = ms;

              if (! pendingMovement) {
                var pendingMovement = true;

                // send to server
                conn.sendMessage({
                  type: "move",
                  direction: dir
                });

              }
              // }
            }
					});
				return this;
			}
		});

		Crafty.c("RightControls", {
			init: function() {
				this.requires('Fourway');
			},

			rightControls: function(speed) {
				//this.multiway(speed, {UP_ARROW: -90, DOWN_ARROW: 90, RIGHT_ARROW: 0, LEFT_ARROW: 180})
				this.fourway(speed)
				return this;
			}

		});

    conn.sendMessage({type: "load_map"});

	}); // end scene
};
