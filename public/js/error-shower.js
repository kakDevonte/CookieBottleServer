(function(){
  var $tooltip = $('#tip-error');

  setTimeout(function(){
    $tooltip.css({'bottom': '15px'});
  }, 250);

  $tooltip.find('.close-button').bind('click', function(){
    $tooltip.css({'bottom': '-200px'});
  });
})();
