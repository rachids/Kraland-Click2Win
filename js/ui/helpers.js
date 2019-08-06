function moneyIncrementAnimation(e, amount) {
	var moneyFlowing = $("<div class='money-flowing'></div>")
					.html(amount + "<img src='http://img.kraland.org/2/money.gif' width='16' height='16' alt='argent'>");
	
	console.log(e.clientX, e.clientY);

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

/*window.onmousemove = function (e, elem) {
    var x = e.clientX,
        y = e.clientY;
    elem.style.top = (y + 20) + 'px';
    elem.style.left = (x + 20) + 'px';
};*/
