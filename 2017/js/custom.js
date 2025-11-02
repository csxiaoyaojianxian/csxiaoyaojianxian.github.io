/**
 * sunshine studio
 */

/*-------------------------------------------------------------------------------
PRE LOADER
-------------------------------------------------------------------------------*/
$(window).load(function(){
  $('.preloader').fadeOut(1000); // set duration in brackets    
});



/* HTML document is loaded. DOM is ready. 
-------------------------------------------*/

$(document).ready(function() {


/*-------------------------------------------------------------------------------
  Navigation - Hide mobile menu after clicking on a link
-------------------------------------------------------------------------------*/

  $('.navbar-collapse a').click(function(){
      $(".navbar-collapse").collapse('hide');
  });

  $(window).scroll(function() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
  });

/*-------------------------------------------------------------------------------
  jQuery Parallax
-------------------------------------------------------------------------------*/

  function initParallax() {
    $('#home').parallax("100%", 0.1);
    $('#about').parallax("100%", 0.3);
    $('#service').parallax("100%", 0.2);
    $('#experience').parallax("100%", 0.3);
    $('#education').parallax("100%", 0.1);
    $('#quotes').parallax("100%", 0.3);
    $('#contact').parallax("100%", 0.1);
    $('footer').parallax("100%", 0.2);
  }
  initParallax();

/*-------------------------------------------------------------------------------
  smoothScroll js
-------------------------------------------------------------------------------*/

  $(function() {
      $('.custom-navbar a, #home a, .about-thumb #about-contact').bind('click', function(event) {
          var $anchor = $(this);
          $('html, body').stop().animate({
              scrollTop: $($anchor.attr('href')).offset().top - 49
          }, 1000);
          event.preventDefault();
      });
  });

/*-------------------------------------------------------------------------------
  wow js - Animation js
-------------------------------------------------------------------------------*/

  new WOW({ mobile: false }).init();

/*-------------------------------------------------------------------------------
  email
-------------------------------------------------------------------------------*/
  $( "#submit" ).click(function() {
    // if($("form")[0].checkValidity()) {
      // console.log(validate());
      
      var email = $("#email").val();
      var content = $("#message").val();
      if( /^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$/.test(email) == false){
        swal("邮箱错误", "请输入正确的邮箱","error");
        return;
      }

      sendUrl = "//api.csxiaoyao.com/index.php/mail/send";
      $.ajax({
        type:"GET",
        url:sendUrl,
        data: {email: email, content: content},
        success:function(data){
          if (data.code === 0) {
            swal("发送成功", "我会尽快回复","success");
          } else if (data.code > 0) {
            swal("发送失败", data.msg || '',"error");
          }
        }
      });

    // }
  });
  function jsonpCallback(data){
  　　alert(data);
  }
    

});
