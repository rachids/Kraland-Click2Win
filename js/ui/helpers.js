function moneyIncrementAnimation(e, amount) {
    amount = prettify(Math.round(10*amount,1)/10);
	var moneyFlowing = $("<div class='money-flowing'></div>")
					.html(amount + "<img src='http://img.kraland.org/2/money.gif' width='16' height='16' alt='argent'>");

	//Positionnement par rapport à la souris
	var x = e.clientX,
		y = e.clientY;

	moneyFlowing.css('top', (y - 20) + "px");
	moneyFlowing.css('left', (x + 20) + "px");

	$("#clicker").append(moneyFlowing);
	
	moneyFlowing.animate({
      "top":"-=30px",
      "opacity": 0
    }, { 
    	duration: 750, 
    	complete: function() {
    		$(this).remove();
    	}
    });
}