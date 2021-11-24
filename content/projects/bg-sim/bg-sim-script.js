// This function will run to enhance the user experience by
// putting the function out put to the current window instead of redirecting

$(function() {
    // bind this function to all input elements of type 'submit'
    // (every element in the html that calls this script)
    // could be 'button' elements instead of 'input' as done here
    $('input[type="submit"]').click(function(event) {
        // capture the object that triggered the event, in this case the form
        var $form = $(this).parent();
        $.ajax({
            url: $form.attr('action'),  // get the url endpoint from the form
                                        // attribute 'action'
            data: $form.serialize(), // data to send to endpoint (entire form)
            type: 'POST',  // send as a post request
            success: function(response) {
                $form.find('.similar_games').text(JSON.stringify(JSON.parse(response), null, 2))
                console.log(response);
            },
            error: function(error) {
                $form.find('.similar_games').text(error.responseText)
                console.log(error);
            }
        });
        event.preventDefault() // this prevents the browser from going to the
                               // result page
    });
});

// event.preventDefault() is an enhancement which fails gracefully if the user
// has JS disabled or is unsupported.
