// A reference to Stripe.js initialized with your real test publishable API key.
var stripe = Stripe("pk_test_51H9xJgAj37g0TijsRy7qbJaEfQrDDq6R6xwGlFB7xgvczSQzOKQjnGtJ7zaLugSGOA69MKEAHElifhiWkKrZXy4500rPj1w2PZ");

const elements = stripe.elements();

// Create our card inputs
var style = {
  base: {
    color: "#101010"
  }
};



const card = elements.create('card', { style });
card.mount('#card-element');

const form = document.querySelector('form');
const errorEl = document.querySelector('#card-errors');
const cardButton = document.getElementById('pay-now');

var oneTime = true;

$("#pay-now").click(function(e) {
  var isEmpty = false;
  $('.required').each(function(){
     if($(this).val()==""){
        isEmpty = true;
      }
   });
   if (!isEmpty) {
     $(this).closest("form").attr("action", "/create-payment-intent");
     // Give our token to our form
     const stripeTokenHandler = token => {
       const hiddenInput = document.createElement('input');
       hiddenInput.setAttribute('type', 'hidden');
       hiddenInput.setAttribute('name', 'stripeToken');
       hiddenInput.setAttribute('value', token.id);
       form.appendChild(hiddenInput);
       form.submit();
     }
     // Create token from card data
       stripe.confirmCardPayment($( "#secret" ).val(), {
           payment_method: {
             card: card
           }
         });
         e.preventDefault();
       stripe.createToken(card).then(res => {
         if (res.error){
           errorEl.textContent = res.error.message;
         } else{
           stripeTokenHandler(res.token);
           var empty = false;
              if (oneTime) {
                $("#pay-now").prepend("<i class='loading-icon fa fa-spinner fa-spin hide'></i>");
                oneTime = false;

              }
         }
       })
   }
});


// $(".loading-icon").remove();
$("#paypal-btn").click(function(e) {
  var empty = false;
  $('.required').each(function(){
     if($(this).val()==""){
        empty =true;
      }
   });
   if (!empty) {
     if (oneTime) {
       $("#paypal-btn").prepend("<i class='loading-icon fa fa-spinner fa-spin hide'></i>");
       oneTime = false;
     }
   }
    $( "card" ).prop( "disabled", true );
    $(this).closest("form").attr("action", "/pay");
});
