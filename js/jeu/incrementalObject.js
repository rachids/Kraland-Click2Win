var ERR_DOES_NOT_EXIST_CODE="errdne-999";
var ERR_INVALID_PARAMS_CODE="errinvalid-989";
var SUCC_CODE="success10101010";

//incremental stuff
		function Game(a_fps) {
			
			if (typeof a_fps === 'undefined')
				 a_fps=30;//default fps
			
			//PRIVATE variables
			var score=0;
			var pointsPerSecond=0;
			var pointsPerClick=0;
			var fps=a_fps;
			var pp=0;
			var ppPerSecond=0;
			var fonction='Prolo';
			var pdv=25;
			var pdvMax=25;
			var pdvPerSecond=0.1;
			var facteurChance=0;
			
			//PRIVILEGED PUBLIC -> If you want to add your own variables, here is where you would do it : this.<variable_name>=0; accessed by game.<variable_name>
			this.sets=[];//Holds multiple ENTITY SETS -> eg. this can hold UPGRADES, ACHIEVEMENTS, INVENTORY..etc
						//accessed by game.entities.<entity set name>  -> eg. game.sets.UPGRADES
							
			this.attributes=[];//holds additional attributes/variables
			
			
			//adds a set to sets
			this.addSet=function(n_name) {
				if (!(n_name instanceof EntitySet)) //if the passed parameter is not an entity set itself
					//create a new empty entity set with the name given
					
					this.sets[n_name]=new EntitySet(n_name);
				else
				{	//store the entity set
					this.sets[n_name.getName()]=n_name;
				}
				
				
			};		
			
			//gets the size of the sets variable or attributes
			this.size=function(thing) {
				//use this to count sets or attributes as they're associative object arrays and therefore .length cannot be used on them
				var size=0;
				var keys=Object.keys(thing);
				for (i in keys)
				size++;
				return size;
					
			};
					

			//ACCESSOR METHODS
			this.getFPS=function() { return fps; }; //get fps of game
			
			this.getScore = function() { return Math.ceil(score); }; //get score
			
			this.getPP = function() { return pp; }; //get score
			this.getPPperSecond = function() { return ppPerSecond; }; //get score
			
			this.getPdv = function() { return pdv; }; //get score
			this.getPdvMax = function() { return pdvMax; }; //get score
			this.getPdvPerSecond = function() { return pdvPerSecond; }; //get score
			
			this.getFacteurChance = function() { return facteurChance; }; //get score
			this.setFonctionCourante=function(poste) { fonction=poste; }
			
			this.getFonction = function() { return fonction; }; //get score
			
			this.getPointsPerSecond=function() { return pointsPerSecond; }; //return the main pointsPerSecond that affects the score
			
			this.getPointsPerClick=function() { return pointsPerClick; }; //return the main pointsPerClick that affects the score


			
			//MUTATOR METHODS
			this.increasePointsPerSecond=function() {
				//increment the pointsPerSecond
				pointsPerSecond+=0.5;
			
			};
			
			this.increaseScorePerSecond=function() {
				//increment the score per second
				score+=pointsPerSecond/fps;
			
			};
			
			this.increasePPperSecond=function() {
				//increment the score per second
				pp+=ppPerSecond/fps;
			
			};

			this.increasePdvPerSecond=function() {
				//increment the pdv tavu
				if(pdv<pdvMax){
					pdv+=pdvPerSecond/fps;
				}else if(pdv+pdvPerSecond/fps>=pdvMax){
					pdv+=(pdvMax-pdv);
				}
			}
			
			this.increaseScorePerClick=function(e) {
				//increment the score per click
				score+=pointsPerClick;
				moneyIncrementAnimation(e, pointsPerClick);
			};
			
			this.addToScore=function(value) {
				//adds 'value' to score
				score+=value;			
			};

			this.addToPDV=function(value){
				if(pdv+value<pdvMax){
					pdv+=value;
				} else if(pdv+value >= pdvMax){
					pdv+=(pdvMax-pdv);
				}
			};

			this.addToPDVMax=function(value){
				pdvMax+=value;
			}

			this.addToPP=function(value){
				pp+=value;
			};

			this.addToPPperSecond=function(value){
				ppPerSecond+=(value/100);
			};

			this.addToFacteurChance=function(value){
				facteurChance+=value;
			};
			
			this.addToPointsPerSecond=function(value) {
				//adds 'value' to pointsPerSecond
				pointsPerSecond+=value;
			};
			
			this.addToPdvPerSecond=function(value) {
				//adds 'value' to pointsPerSecond
				pdvPerSecond+=value;
			};
			
			this.addToPointsPerClick=function(value) {
				//adds 'value' to pointsPerClick
				pointsPerClick+=value;
		
			};
		};
		
		Game.prototype.init=function() {
		
			
				//add binders
				$("#clicker").on("click", this.increaseScorePerClick);
		
		};
		
		
		
		
		
		
//upgrades/Entitys system

		function EntitySet(n_name) {
		
			var name=n_name;//name of set
			var entities=[];//array of Entity objects -> entities.first_upgrade
			
			//public variables
			this.length=0;
			
			//functions
			
			this.size=function() { return this.length;}
			
			this.getName=function() {
			
				return name;
			
			};
			
			this.getSet=function() {
				//returns Entity set
				return entities;
			
			};
			
			
			this.addEntity=function(EntityT,attr) {
				//this function adds an Entity and returns 1 if successful - 0 if not
				
				if (EntityT instanceof Entity && !(EntityT.getName() in entities) && typeof attr === 'undefined') //make sure you're adding an Entity that doesn't already exist - UNIQUE NAMES
				{
					//receiving an entity object
					entities[EntityT.getName()]=EntityT; 
					this.length++;
					return 1;
				}
				else if (typeof attr !== 'undefined')
				{
					//this means that the user has passed a name and attributes, instead of an entity itself
					var en=new Entity(EntityT,attr);
					entities[en.getName()]=en;
					this.length++;
					return 1;
				}
				else
					return -999;//either it' snot an entity type, or it is but the name already exists	
			};

			this.removeEntity=function(n_name) {
				
					if (typeof n_name !== 'undefined' && (n_name in entities))
					{
						delete entities[n_name];
						this.length-=1;
						return SUCC_CODE;
					
					}
					else
						return ERR_DOES_NOT_EXIST_CODE;
				
				};
			
		
		};
		
		function Entity(n_name,n_attributes) {
		
			var name=n_name;//name of Entity -- must be unique				
			this.attributes=n_attributes;
			
			
			//accessor/mutators
			this.getName=function() {
			
				return name;
			
			};
			
			this.getAttributes=function() {
			
				return this.attributes;
			};
			
			this.getAttribute=function(attr) {
				if (attr in this.attributes)
					return this.attributes[attr];
				else
					return -999;
				
			};
			
			this.setAttribute=function(attr,value) {
				
				if (attr in this.attributes)
					this.attributes[attr]=value;
			
			};
		
		};


//===
